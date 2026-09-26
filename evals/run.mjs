import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { loadEnvironment } from '../src/config.ts';
import { scrub } from '../src/recording.ts';
import { command, digest, readJson, treeIdentity, writeJson } from './io.mjs';
import { invoke, prepareHost, taskArgs } from './hosts.mjs';
import { readTrace } from './trace.mjs';
import { captureContext } from './context.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const { values } = parseArgs({ options: {
  case: { type: 'string', default: 'cache-recovery' },
  host: { type: 'string', default: 'codex' },
  arm: { type: 'string', default: 'pair' },
  model: { type: 'string' }, effort: { type: 'string' },
  repeats: { type: 'string', default: '1' },
  out: { type: 'string' }, env: { type: 'string', default: resolve(root, '../.env') },
} });
if (!['codex', 'claude'].includes(values.host)) throw new Error('Use --host codex or claude.');
if (!['pair', 'baseline', 'treatment'].includes(values.arm)) throw new Error('Use --arm pair, baseline, or treatment.');
const repeats = Number(values.repeats);
if (!Number.isInteger(repeats) || repeats < 1) throw new Error('--repeats must be a positive integer.');
// Credentials are available for scrubbing, never saved in trial configuration.
process.env.JEV_9000_ENV_FILE = resolve(values.env);
loadEnvironment();
let model = values.model, effort = values.effort;
if (values.host === 'codex' && (!model || !effort)) {
  const text = await readFile(join(process.env.CODEX_HOME ?? join(homedir(), '.codex'), 'config.toml'), 'utf8');
  model ??= text.match(/^model\s*=\s*"([^"]+)"/m)?.[1];
  effort ??= text.match(/^model_reasoning_effort\s*=\s*"([^"]+)"/m)?.[1];
}
if (!model || !effort) throw new Error('Specify --model and --effort to record the comparison settings.');
const casePath = resolve(root, 'cases', `${values.case}.json`);
const definition = await readJson(casePath);
if (definition.kind === 'invocation' && values.arm !== 'treatment') {
  throw new Error('Invocation cases use --arm treatment; quality cases support paired comparisons.');
}
const runId = `${new Date().toISOString().replaceAll(':', '-')}-${randomUUID().slice(0, 8)}`;
const directory = resolve(values.out ?? join(homedir(), '.jev-9000/evals', runId));
await mkdir(directory, { recursive: true });
const fixture = join(directory, 'fixture');
await cp(join(root, 'fixtures', definition.fixture), fixture, { recursive: true });
const fixtureIdentity = await treeIdentity(fixture);
const graderSource = await readFile(join(root, 'grade-artifact.mjs'));
const graderPath = join(directory, 'grader.mjs');
await writeFile(graderPath, graderSource, { flag: 'wx' });
const experiment = {
  schema_version: 1, id: runId, created_at: new Date().toISOString(),
  case: definition, case_hash: digest(JSON.stringify(definition)), fixture: fixtureIdentity,
  host: values.host, model, effort, repeats,
  grader_sha256: digest(graderSource),
  design: 'Pilot; counterbalanced order, all attempts retained; no population efficacy claim.',
};
await writeJson(join(directory, 'experiment.json'), experiment);
console.log(`Evidence: ${directory}`);

async function trial(arm, pairId) {
  const id = `${pairId}-${arm}`, destination = join(directory, id);
  const workspace = join(destination, 'workspace');
  await mkdir(destination, { recursive: true });
  await cp(fixture, workspace, { recursive: true });
  const prompt = definition.task_prompt + (arm === 'treatment' ? `\n\n${definition.plugin_instruction}` : '');
  const started = { schema_version: 1, id, pair_id: pairId, arm, host: values.host,
    expected_use: arm === 'treatment' ? definition.expected_use : 'out_of_scope',
    started_at: new Date().toISOString(), prompt, followups: definition.followups ?? [],
    starting_fixture: await treeIdentity(workspace), experiment: '../experiment.json' };
  await writeJson(join(destination, 'trial.started.json'), started);
  let prepared, status = 'environment_failed', failure = null, elapsed = null;
  const turns = [];
  try {
    prepared = await prepareHost({ host: values.host, arm, directory: destination,
      trialId: id, model, effort, envFile: resolve(values.env) });
    await writeJson(join(destination, 'host-config.json'), prepared.config);
    const clock = performance.now();
    for (const [index, task] of [prompt, ...(definition.followups ?? [])].entries()) {
      const resume = index ? turns.at(-1).trace.session_id : null;
      if (index && !resume) throw new Error('Host did not expose a session ID for continuation.');
      const args = taskArgs(values.host, prepared, { workspace, resume });
      const path = join(destination, `turn-${index + 1}`);
      await writeJson(`${path}.invocation.json`, { args, cwd: workspace, prompt: task });
      const result = await invoke(values.host, args, { cwd: workspace, env: prepared.env, input: task, save: path });
      const trace = await readTrace(`${path}.jsonl`, values.host);
      const environmentFailure = /rejected: blocked by policy/.test(result.stderr) ||
        (values.host === 'claude' && prepared.config.authentication?.loggedIn === false && result.code !== 0);
      turns.push({ index: index + 1, exit_code: result.code, trace,
        recording_errors: (result.stderr.match(/JEV_9000_RECORDING_ERROR/g) ?? []).length });
      status = environmentFailure ? 'environment_failed' : trace.complete && result.code === 0 ? 'completed' : 'host_failed';
      if (environmentFailure) failure = 'Host authentication or execution policy prevented the task; inspect captured output.';
      if (status !== 'completed') break;
    }
    elapsed = performance.now() - clock;
  } catch (error) {
    failure = scrub(String(error));
    status = turns.length ? 'host_failed' : 'environment_failed';
  }
  // Save artifacts before grading; the grader runs independently of the host.
  await cp(workspace, join(destination, 'artifacts'), { recursive: true, filter: path => !path.endsWith('.git') });
  const completed = { id, status, failure, duration_ms: elapsed, turns,
    context: await captureContext(destination, values.host, turns.map(turn => turn.trace.session_id).filter(Boolean)),
    final_artifacts: await treeIdentity(join(destination, 'artifacts')), finished_at: new Date().toISOString() };
  await writeJson(join(destination, 'trial.completed.json'), completed);
  if (status === 'completed') {
    const grade = await command(process.execPath,
      [graderPath, definition.grader, join(destination, 'artifacts'), fixture]);
    const path = join(destination, `grade-artifact-${randomUUID()}.json`);
    let result;
    try { result = JSON.parse(grade.stdout); }
    catch { result = { passed: null, error: grade.stderr || grade.stdout }; }
    await writeJson(path, { kind: 'artifact', trial_id: id, created_at: new Date().toISOString(),
      grader_sha256: digest(graderSource),
      artifacts_sha256: completed.final_artifacts.sha256, exit_code: grade.code, result });
  }
  await writeFile(join(destination, 'final-response.txt'), turns.flatMap(turn => turn.trace.messages.map(item => item.text)).join('\n\n'));
  console.log(`${id}: ${status}${failure ? ` — ${failure}` : ''}`);
}

for (let index = 0; index < repeats; index++) {
  const arms = values.arm === 'pair'
    ? (index % 2 ? ['treatment', 'baseline'] : ['baseline', 'treatment']) : [values.arm];
  for (const arm of arms) await trial(arm, `${runId}-${index + 1}`);
}
