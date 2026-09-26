import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { files, readJson, readJsonl, treeIdentity } from './io.mjs';

export async function loadEvidence(root) {
  const paths = await files(root, ['host-home', 'marketplace', 'package', 'profile', 'workspace', 'artifacts', 'fixture']);
  const issues = [], calls = new Map(), trials = [];
  for (const path of paths.filter(path => path.endsWith('.jsonl'))) {
    const parsed = await readJsonl(path);
    issues.push(...parsed.issues);
    for (const { value, evidence } of parsed.records) {
      if (!['consultation.started', 'consultation.completed'].includes(value.event)) continue;
      if (value.schema_version !== 1 || typeof value.call_id !== 'string') {
        issues.push(`${evidence}: unsupported consultation record`); continue;
      }
      const key = `${value.process_instance_id}:${value.call_id}`;
      const call = calls.get(key) ?? { id: key, start: null, finish: null, evidence: [] };
      const field = value.event === 'consultation.started' ? 'start' : 'finish';
      if (call[field]) issues.push(`${evidence}: duplicate ${value.event}`);
      else call[field] = value;
      call.evidence.push(evidence);
      calls.set(key, call);
    }
  }
  for (const path of paths.filter(path => path.endsWith('trial.started.json'))) {
    const directory = path.slice(0, -'trial.started.json'.length);
    const start = await readJson(path);
    const completedPath = join(directory, 'trial.completed.json');
    const finish = existsSync(completedPath) ? await readJson(completedPath) : null;
    const experiment = await readJson(join(directory, start.experiment));
    const grades = [];
    for (const candidate of paths.filter(candidate => candidate.startsWith(directory) && /grade-[^\\/]+\.json$/.test(candidate))) {
      grades.push({ ...await readJson(candidate), record_path: candidate });
    }
    grades.sort((a, b) => a.created_at.localeCompare(b.created_at));
    const configPath = join(directory, 'host-config.json');
    const configuration = existsSync(configPath) ? await readJson(configPath) : null;
    const contextPath = join(directory, 'context-evidence.json');
    const context = existsSync(contextPath) ? await readJson(contextPath) : finish?.context ?? null;
    const artifactsPath = join(directory, 'artifacts');
    const artifacts = existsSync(artifactsPath) ? await treeIdentity(artifactsPath) : null;
    const artifactsMatch = artifacts !== null && finish?.final_artifacts &&
      artifacts.sha256 === finish.final_artifacts.sha256;
    if (finish?.final_artifacts && !artifactsMatch) issues.push(`${directory}: saved artifacts are missing or changed`);
    const artifactGrade = artifactsMatch ? grades.filter(grade => grade.kind === 'artifact' &&
      grade.artifacts_sha256 === artifacts?.sha256).at(-1) ?? null : null;
    const behaviorGrade = grades.filter(grade => grade.kind === 'behavior').at(-1) ?? null;
    const environmentGrade = grades.filter(grade => grade.kind === 'environment').at(-1) ?? null;
    const status = environmentGrade?.status ?? finish?.status ?? 'incomplete';
    trials.push({ start, finish, experiment, configuration, artifactGrade, behaviorGrade,
      environmentGrade, status, context, grades, directory, evidence: path });
  }
  return { calls: [...calls.values()], trials, issues };
}

export function summarizeCalls(calls) {
  const summary = { calls: calls.length, success: 0, failure: 0, incomplete: 0,
    orphan_completions: 0, transformed: 0, duration_ms: 0, input_tokens: 0, output_tokens: 0,
    question_types: {}, groups: {} };
  for (const call of calls) {
    const record = call.start ?? call.finish;
    if (!call.start) summary.orphan_completions++;
    if (!call.finish) summary.incomplete++;
    else if (call.finish.status === 'success') summary.success++;
    else summary.failure++;
    if (call.start?.payload_transformed || call.finish?.payload_transformed) summary.transformed++;
    summary.duration_ms += call.finish?.duration_ms ?? 0;
    summary.input_tokens += call.finish?.result?.usage?.input_tokens ?? 0;
    summary.output_tokens += call.finish?.result?.usage?.output_tokens ?? 0;
    const questions = call.start?.input?.questions;
    if (questions && typeof questions === 'object') {
      for (const question of Object.values(questions)) {
        const type = question?.type ?? 'unknown';
        summary.question_types[type] = (summary.question_types[type] ?? 0) + 1;
      }
    }
    const key = [record.source, record.host ?? 'unknown', call.finish?.result?.model ?? 'unknown',
      record.runtime?.build_id ?? 'unknown'].join(' / ');
    summary.groups[key] = (summary.groups[key] ?? 0) + 1;
  }
  return summary;
}

export function intendedUse(trial) {
  const turns = trial.finish?.turns ?? [];
  const observed = turns.flatMap(turn => turn.trace.calls);
  const complete = trial.status === 'completed' && turns.length > 0 && turns.every(turn => turn.trace.complete);
  const expected = trial.start.expected_use;
  if (expected === 'unknown') return { verdict: 'unknown', calls: observed.length };
  if (!complete || !trial.configuration) return { verdict: 'unknown', calls: observed.length };
  if (expected === 'permitted') return { verdict: 'discretionary; review appropriateness', calls: observed.length };
  if (expected === 'out_of_scope') return { verdict: observed.length ? 'excluded call observed' : 'exclusion followed', calls: observed.length };
  if (!trial.configuration.plugin_enabled) return { verdict: 'tool unavailable', calls: observed.length };
  return { verdict: observed.length ? 'call observed; relevance needs review' : 'required call missing', calls: observed.length };
}

export function compareTrials(trials) {
  const pairs = new Map(), tasks = new Map();
  for (const trial of trials.filter(trial => trial.experiment.case.kind === 'quality')) {
    const group = pairs.get(trial.start.pair_id) ?? {};
    group[trial.start.arm] = trial;
    pairs.set(trial.start.pair_id, group);
  }
  const table = { both_pass: 0, baseline_only: 0, treatment_only: 0, both_fail: 0, unassessable: 0 };
  const details = [];
  for (const [id, pair] of pairs) {
    const baseline = pair.baseline?.status === 'completed' ? pair.baseline.artifactGrade?.result?.passed : null;
    const treatment = pair.treatment?.status === 'completed' ? pair.treatment.artifactGrade?.result?.passed : null;
    let result = 'unassessable';
    const comparable = pair.baseline && pair.treatment &&
      pair.baseline.start.starting_fixture.sha256 === pair.treatment.start.starting_fixture.sha256 &&
      pair.baseline.artifactGrade?.grader_sha256 === pair.treatment.artifactGrade?.grader_sha256 &&
      ['case_hash', 'host', 'model', 'effort'].every(key => pair.baseline.experiment[key] === pair.treatment.experiment[key]);
    if (comparable && typeof baseline === 'boolean' && typeof treatment === 'boolean') {
      result = baseline ? (treatment ? 'both_pass' : 'baseline_only') : (treatment ? 'treatment_only' : 'both_fail');
      const experiment = pair.baseline.experiment;
      const key = [experiment.case_hash, experiment.host, experiment.model, experiment.effort].join(':');
      const task = tasks.get(key) ?? [];
      task.push(Number(treatment) - Number(baseline));
      tasks.set(key, task);
    }
    table[result]++;
    details.push({ id, result, baseline: pair.baseline?.directory ?? null, treatment: pair.treatment?.directory ?? null });
  }
  const means = [...tasks.values()].map(values => values.reduce((a, b) => a + b, 0) / values.length);
  return { table, details, task_count: tasks.size,
    equal_task_weight_difference: means.length ? means.reduce((a, b) => a + b, 0) / means.length : null };
}
