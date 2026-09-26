import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TypeSafeClient } from '@typesafe-ai/sdk';
import { createRecorder } from '../src/recording.ts';
import { evaluate } from '../src/evaluate.ts';

const originalLogging = process.env.JEV_9000_LOGGING;
beforeEach(() => {
  delete process.env.JEV_9000_LOGGING;
});
afterEach(() => {
  if (originalLogging === undefined) delete process.env.JEV_9000_LOGGING;
  else process.env.JEV_9000_LOGGING = originalLogging;
});

test('concurrent records preserve lifecycle and disclose credential transformations', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'jev-records-'));
  const record = createRecorder({ directory, source: 'simulated', trialId: 'example' });
  await Promise.all([
    record({ event: 'consultation.started', call_id: 'a', input: { authorization: 'secret', state: ['Bearer secret'] } }),
    record({ event: 'consultation.started', call_id: 'b', input: { state: { nested: [1, null] } } }),
    record({ event: 'consultation.completed', call_id: 'b', status: 'success' }),
  ]);
  const [file] = await readdir(directory);
  const text = await readFile(join(directory, file!), 'utf8');
  const records = text.trim().split('\n').map(line => JSON.parse(line));
  assert.equal(records.length, 3);
  assert.doesNotMatch(text, /secret/);
  assert.equal(records[0].payload_transformed, true);
  assert.equal(records[1].payload_transformed, false);
  assert.deepEqual(records[1].input.state, { nested: [1, null] });
  assert.equal(records[2].source, 'simulated');
  assert.equal(records[2].trial_id, 'example');
});

test('unwritable recording reports diagnostics while preserving a successful native result', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'jev-recording-failure-'));
  const blocked = join(directory, 'file');
  await writeFile(blocked, 'This is a file, not a directory.');
  const diagnostics: string[] = [];
  const record = createRecorder({ directory: blocked, diagnose: message => diagnostics.push(message) });
  const response = { model: 'simulated', answers: { check: { type: 'noul', noul: 0.4 } },
    usage: { input_tokens: 1, output_tokens: 1 } };
  const client = new TypeSafeClient({ apiKey: 'simulated', logLevel: 'off',
    fetch: async () => Response.json(response) });
  const result = await evaluate({ state: 'Example', questions: { check: { type: 'noul' } } }, () => client, undefined, record);
  assert.deepEqual(result.structuredContent, response);
  assert.equal(result.isError, undefined);
  assert.equal(diagnostics.length, 2);
  assert.ok(diagnostics.every(message => message.startsWith('JEV_9000_RECORDING_ERROR:')));
});

test('disabled recording leaves no files while preserving a successful native result', async () => {
  process.env.JEV_9000_LOGGING = ' false ';
  const directory = await mkdtemp(join(tmpdir(), 'jev-recording-disabled-'));
  const diagnostics: string[] = [];
  const record = createRecorder({ directory: join(directory, 'logs'), diagnose: message => diagnostics.push(message) });
  const response = { model: 'simulated', answers: { check: { type: 'noul', noul: 0.4 } },
    usage: { input_tokens: 1, output_tokens: 1 } };
  const client = new TypeSafeClient({ apiKey: 'simulated', logLevel: 'off',
    fetch: async () => Response.json(response) });
  const result = await evaluate({ state: 'Example', questions: { check: { type: 'noul' } } }, () => client, undefined, record);
  assert.deepEqual(result.structuredContent, response);
  assert.equal(result.isError, undefined);
  assert.deepEqual(await readdir(directory), []);
  assert.deepEqual(diagnostics, []);
});
