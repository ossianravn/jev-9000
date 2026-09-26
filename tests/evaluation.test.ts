import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { TestContext } from 'node:test';
import { TypeSafeClient } from '@typesafe-ai/sdk';
import type { Fetch } from '@typesafe-ai/sdk';
import { evaluationInput } from '../src/contract.ts';
import { toolInput } from '../src/tool-schema.ts';
import { evaluate } from '../src/evaluate.ts';
import { createClient } from '../src/config.ts';

// Simulated provider data: checks transport fidelity, not Jev's judgment quality.
const request = {
  state: { goal: 'Keep imports running', observations: ['A persistent runner exists'], unknown: null },
  model: 'simulated-override',
  questions: {
    'check::continues': { type: 'noul', instructions: null, criteria: null },
    approach: {
      type: 'choice', instructions: { task: 'Choose an approach', nested: [true, 1] },
      criteria: { existing: { deployment: ['already present'] }, new: null },
    },
    burden: { type: 'score', criteria: [{ work: 'none' }, null, ['new deployment']] },
  },
};
const response = {
  model: 'simulated-resolved',
  answers: {
    'check::continues': { type: 'noul', noul: 0.8123456789012345 },
    approach: {
      type: 'choice', choice: 'existing', confidence: 0.7,
      probabilities: { existing: 0.9, new: 0.1 },
    },
    burden: {
      type: 'score', score: 0.8, confidence: 0.4,
      probabilities: { 0: 0.4, 1: 0.4, 2: 0.2 },
      legend: { 0: { work: 'none' }, 1: null, 2: ['new deployment'] },
    },
  },
  usage: { input_tokens: 123, output_tokens: 20 },
};
const input = evaluationInput.parse(request);
const clientWith = (fetch: Fetch) => new TypeSafeClient({
  apiKey: 'simulated-key', defaultModel: 'jev-latest', fetch,
  retry: { maxRetries: 0 }, logLevel: 'off',
});

function setEnvironment(t: TestContext, values: Record<string, string>): void {
  for (const [key, value] of Object.entries(values)) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
  }
}

test('mixed structured request and native result survive real SDK serialization', async () => {
  let sent: unknown;
  const events: Record<string, unknown>[] = [];
  const client = clientWith(async (url, init) => {
    assert.equal(new URL(url).pathname, '/v1/systemone');
    sent = JSON.parse(String(init?.body));
    return Response.json(response);
  });
  const result = await evaluate(toolInput.parse(request), () => client, undefined,
    async event => { events.push(event); });
  assert.deepEqual(events[0]?.input, request);
  assert.deepEqual(events[1]?.result, response);
  assert.equal(events[0]?.call_id, events[1]?.call_id);
  assert.equal(events[1]?.effective_model, 'simulated-override');
  assert.ok(Number(events[1]?.duration_ms) >= 0);
  assert.deepEqual(sent, request);
  assert.deepEqual(result.structuredContent, response);
  const text = result.content[0];
  assert.ok(text?.type === 'text');
  assert.deepEqual(JSON.parse(text.text), response);
});

test('SDK-accepted nullable state and omitted instructions are forwarded unchanged', async () => {
  const nullable = evaluationInput.parse({
    state: null, questions: { check: { type: 'noul' } },
  });
  const client = clientWith(async (_url, init) => {
    assert.deepEqual(JSON.parse(String(init?.body)), { ...nullable, model: 'jev-latest' });
    return Response.json({
      model: 'simulated', answers: { check: { type: 'noul', noul: 0.5 } },
      usage: { input_tokens: 1, output_tokens: 1 },
    });
  });
  const result = await evaluate(nullable, () => client);
  assert.notEqual(result.isError, true);
});

test('malformed question fields fail before transport with a correctable field path', async () => {
  const invalid = toolInput.parse({
    state: 'A simple state', questions: { burden: { type: 'score', criteria: ['one'] } },
  });
  let clientRequested = false;
  const events: Record<string, unknown>[] = [];
  const result = await evaluate(invalid, () => {
    clientRequested = true;
    throw new Error('Transport must not be reached for invalid input.');
  }, undefined, async event => { events.push(event); });
  assert.equal(events.length, 2);
  assert.equal((events[1]?.failure as { stage: string }).stage, 'input');
  assert.equal(clientRequested, false);
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result.content), /questions\.burden\.criteria/);
});

test('missing, mismatched, and incomplete provider answers remain failures', async () => {
  const brokenAnswers = [
    {},
    { ...response.answers, approach: { type: 'noul', noul: 0.7 } },
    { ...response.answers, approach: { ...response.answers.approach, probabilities: {} } },
  ];
  for (const answers of brokenAnswers) {
    const result = await evaluate(input, () => clientWith(async () => Response.json({ ...response, answers })));
    assert.equal(result.isError, true);
    assert.equal(result.structuredContent, undefined);
    assert.match(JSON.stringify(result.content), /response.*(answers|approach|probabilities)/);
  }
});

test('auth, service, and transport failures retain useful context without credentials', async t => {
  setEnvironment(t, { TYPESAFE_API_KEY: 'simulated-secret' });
  const failures: Array<[Fetch, RegExp]> = [
    [async () => Response.json({ error: 'Invalid simulated-secret' }, {
      status: 401, headers: { 'x-typesafe-request-id': 'request-example' },
    }), /401.*redacted.*request-example.*TYPESAFE_API_KEY/],
    [async () => Response.json({ error: 'Unavailable' }, { status: 503 }), /503.*try again/],
    [async () => { throw new Error('Network unavailable'); }, /network access/],
  ];
  for (const [fetch, expected] of failures) {
    const events: Record<string, unknown>[] = [];
    const result = await evaluate(input, () => clientWith(fetch), undefined,
      async event => { events.push(event); });
    assert.equal(events[1]?.status, 'failure');
    assert.doesNotMatch(JSON.stringify(events), /simulated-secret/);
    assert.equal(result.isError, true);
    assert.equal(result.structuredContent, undefined);
    assert.match(JSON.stringify(result.content), expected);
    assert.doesNotMatch(JSON.stringify(result), /simulated-secret/);
  }
});

test('host cancellation reaches the SDK transport', async () => {
  const controller = new AbortController();
  const events: Record<string, unknown>[] = [];
  const client = clientWith(async (_url, init) => {
    assert.ok(init?.signal);
    controller.abort();
    assert.equal(init.signal.aborted, true);
    throw init.signal.reason;
  });
  const result = await evaluate(input, () => client, controller.signal,
    async event => { events.push(event); });
  assert.equal((events[1]?.failure as { category: string }).category, 'cancelled');
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result.content), /host cancelled/);
});

test('missing credential remains a discoverable tool error with setup instructions', async t => {
  setEnvironment(t, { TYPESAFE_API_KEY: ' ', JEV_9000_ENV_FILE: '.env.example' });
  const result = await evaluate(input, createClient);
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result.content), /Set TYPESAFE_API_KEY.*JEV_9000_ENV_FILE/);
});

test('configured alias works and standard SDK model setting takes precedence', t => {
  setEnvironment(t, {
    TYPESAFE_API_KEY: 'simulated-key', TYPESAFE_MODEL: 'simulated-alias',
    TYPESAFE_DEFAULT_MODEL: '', JEV_9000_ENV_FILE: '.env.example',
  });
  assert.equal(createClient().defaultModel, 'simulated-alias');
  process.env.TYPESAFE_DEFAULT_MODEL = 'simulated-standard';
  assert.equal(createClient().defaultModel, 'simulated-standard');
});
