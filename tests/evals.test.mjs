import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { compareTrials, intendedUse, loadEvidence, summarizeCalls } from '../evals/evidence.mjs';
import { readTrace } from '../evals/trace.mjs';
import { treeIdentity, writeJson } from '../evals/io.mjs';

test('incomplete and orphan call evidence stays visible, with sources separate', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'jev-evidence-'));
  const base = { schema_version: 1, process_instance_id: 'p', source: 'simulated' };
  await writeFile(join(directory, 'calls.jsonl'), [
    { ...base, event: 'consultation.started', call_id: 'a', input: { questions: { q: { type: 'noul' } } } },
    { ...base, event: 'consultation.completed', call_id: 'b', status: 'failure' },
    { ...base, source: 'replay', event: 'consultation.started', call_id: 'c' },
  ].map(value => JSON.stringify(value)).join('\n') + '\n{"partial":');
  const evidence = await loadEvidence(directory);
  const simulated = summarizeCalls(evidence.calls.filter(call => (call.start ?? call.finish).source === 'simulated'));
  assert.equal(simulated.calls, 2);
  assert.equal(simulated.incomplete, 1);
  assert.equal(simulated.orphan_completions, 1);
  assert.equal(simulated.failure, 1);
  assert.equal(evidence.issues.length, 1);
});

test('a complete discretionary no-call trace is not a missed requirement', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'jev-trace-'));
  const path = join(directory, 'turn.jsonl');
  await writeFile(path, '{"type":"turn.completed","usage":{"input_tokens":12,"output_tokens":3}}\n');
  const trace = await readTrace(path, 'codex');
  const trial = { status: 'completed', configuration: { plugin_enabled: true },
    start: { expected_use: 'permitted' }, finish: { turns: [{ trace }] } };
  assert.deepEqual(intendedUse(trial), { verdict: 'discretionary; review appropriateness', calls: 0 });
  trial.start.expected_use = 'required';
  assert.equal(intendedUse(trial).verdict, 'required call missing');
  trial.status = 'host_failed';
  assert.equal(intendedUse(trial).verdict, 'unknown');
});

test('paired summaries retain regressions, equal task weight, and unassessable attempts', () => {
  const trial = (task, pair, arm, passed) => ({
    start: { pair_id: pair, arm, starting_fixture: { sha256: 'fixture' } }, status: 'completed',
    experiment: { case: { kind: 'quality' }, case_hash: task, host: 'codex', model: 'example', effort: 'high' },
    artifactGrade: { grader_sha256: 'grader', result: { passed } }, directory: pair + arm,
  });
  const trials = [
    trial('a', '1', 'baseline', false), trial('a', '1', 'treatment', true),
    trial('a', '2', 'baseline', false), trial('a', '2', 'treatment', true),
    trial('b', '3', 'baseline', true), trial('b', '3', 'treatment', false),
    trial('c', '4', 'baseline', true),
  ];
  const report = compareTrials(trials);
  assert.deepEqual(report.table, { both_pass: 0, baseline_only: 1, treatment_only: 2, both_fail: 0, unassessable: 1 });
  assert.equal(report.equal_task_weight_difference, 0);
  trials[1].start.starting_fixture.sha256 = 'different';
  assert.equal(compareTrials(trials).table.unassessable, 2);
});

test('Claude error flag takes precedence over a success subtype observed on authentication failure', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'jev-claude-trace-'));
  const path = join(directory, 'turn.jsonl');
  await writeFile(path, JSON.stringify({ type: 'result', subtype: 'success', is_error: true,
    result: 'Failed to authenticate', usage: { input_tokens: 0, output_tokens: 0 } }) + '\n');
  const trace = await readTrace(path, 'claude');
  assert.equal(trace.complete, false);
  assert.equal(trace.failed, true);
});

test('changed saved artifacts cannot reuse a previously passing grade', async () => {
  const root = await mkdtemp(join(tmpdir(), 'jev-grade-integrity-'));
  const trial = join(root, 'trial');
  await mkdir(join(trial, 'artifacts'), { recursive: true });
  await writeFile(join(trial, 'artifacts/result.txt'), 'original');
  const identity = await treeIdentity(join(trial, 'artifacts'));
  await writeJson(join(root, 'experiment.json'), { case: { kind: 'quality' } });
  await writeJson(join(trial, 'trial.started.json'), { id: 'test', experiment: '../experiment.json' });
  await writeJson(join(trial, 'trial.completed.json'), { status: 'completed', final_artifacts: identity });
  await writeJson(join(trial, 'grade-artifact-test.json'), { kind: 'artifact', created_at: '2026-09-26',
    artifacts_sha256: identity.sha256, result: { passed: true } });
  assert.equal((await loadEvidence(root)).trials[0].artifactGrade.result.passed, true);
  await writeFile(join(trial, 'artifacts/result.txt'), 'changed');
  const evidence = await loadEvidence(root);
  assert.equal(evidence.trials[0].artifactGrade, null);
  assert.match(evidence.issues[0], /artifacts are missing or changed/);
});
