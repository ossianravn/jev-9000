import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { compareTrials, intendedUse, loadEvidence, summarizeCalls } from './evidence.mjs';

const { values } = parseArgs({ options: { root: { type: 'string', default: join(homedir(), '.jev-9000/logs') }, out: { type: 'string' } } });
const root = resolve(values.root);
const evidence = await loadEvidence(root);
const sources = {};
for (const source of new Set(evidence.calls.map(call => (call.start ?? call.finish).source))) {
  sources[source] = summarizeCalls(evidence.calls.filter(call => (call.start ?? call.finish).source === source));
}
const trialIds = new Set(evidence.trials.map(trial => trial.start.id));
const joined = evidence.calls.filter(call => trialIds.has((call.start ?? call.finish).trial_id));
const tasks = evidence.trials.map(trial => ({
  id: trial.start.id, case: trial.experiment.case.id, host: trial.start.host, arm: trial.start.arm,
  status: trial.status, outcome: trial.artifactGrade?.result?.passed ?? null,
  behavior: intendedUse(trial), review: trial.behaviorGrade, duration_ms: trial.finish?.duration_ms ?? null,
  host_usage: trial.finish?.turns.map(turn => ({ turn: turn.index, usage: turn.trace.usage, semantics: turn.trace.usage_semantics })) ?? [],
  evidence: trial.directory, grade_evidence: trial.artifactGrade?.record_path ?? null,
  context: trial.context,
  recording_errors: trial.finish?.turns.reduce((sum, turn) => sum + (turn.recording_errors ?? 0), 0) ?? 0,
}));
const comparisons = compareTrials(evidence.trials);
const opportunities = evidence.trials.flatMap(trial => (trial.finish?.turns ?? []).map((turn, index) => {
  const expected = trial.start.arm === 'baseline' ? 'out_of_scope'
    : trial.experiment.case.expected_use_by_turn?.[index] ??
      trial.behaviorGrade?.opportunities?.find(item => item.turn === turn.index)?.expected ??
      (index === 0 ? trial.start.expected_use : 'unknown');
  return { trial_id: trial.start.id, turn: turn.index, expected,
    assessable: trial.status === 'completed' && turn.trace.complete && trial.configuration !== null,
    tool_configured: trial.configuration?.plugin_enabled ?? null,
    calls: turn.trace.calls.length, evidence: turn.trace.calls.map(call => call.evidence) };
}));
const required = opportunities.filter(item => item.expected === 'required' && item.assessable && item.tool_configured);
const excluded = opportunities.filter(item => item.expected === 'out_of_scope' && item.assessable && item.tool_configured);
const behavior = {
  required_call_presence: { numerator: required.filter(item => item.calls > 0).length, denominator: required.length,
    meaning: 'Call presence only; relevant fulfillment requires the saved review.' },
  excluded_calls: { numerator: excluded.filter(item => item.calls > 0).length, denominator: excluded.length },
  permitted_opportunities: opportunities.filter(item => item.expected === 'permitted' && item.assessable).length,
  unknown_or_unassessable: opportunities.filter(item => !item.assessable || item.expected === 'unknown').length,
  opportunities,
};
const result = {
  schema_version: 1, source_root: root, sources,
  coverage: { captured_tasks: tasks.length, completed_tasks: tasks.filter(task => task.status === 'completed').length,
    complete_no_call_tasks: tasks.filter(task => task.status === 'completed' && task.behavior.calls === 0).length,
    ungraded_outcomes: tasks.filter(task => task.outcome === null).length,
    ungraded_behavior: tasks.filter(task => task.review === null).length,
    joined_calls: joined.length, unjoined_calls: evidence.calls.length - joined.length },
  comparisons, behavior, tasks, issues: evidence.issues,
  calls: evidence.calls.map(call => ({ id: call.id, trial_id: (call.start ?? call.finish).trial_id,
    status: call.finish?.status ?? 'incomplete', evidence: call.evidence })),
};
const link = (label, path) => `[${label}](<${path.replaceAll('\\', '/')}>)`;
const lines = [
  '# JEV 9000 evidence report', '',
  'Descriptive pilot evidence. Invocation behavior and artifact outcomes are separate; this report does not establish population-wide efficacy.', '',
  '| Source | Calls | Success | Failure | Incomplete | Seconds | Input tokens | Output tokens |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...Object.entries(sources).map(([source, s]) => `| ${source} | ${s.calls} | ${s.success} | ${s.failure} | ${s.incomplete} | ${(s.duration_ms / 1000).toFixed(2)} | ${s.input_tokens} | ${s.output_tokens} |`), '',
  ...Object.entries(sources).map(([source, s]) => `- ${source} question mix: ${JSON.stringify(s.question_types)}`), '',
  '## Coverage', '', ...Object.entries(result.coverage).map(([key, value]) => `- ${key}: ${value}`), '',
  '## Paired artifact outcomes', '',
  ...Object.entries(comparisons.table).map(([key, value]) => `- ${key}: ${value}`),
  `- Equally weighted task difference: ${comparisons.equal_task_weight_difference ?? 'unavailable'}`,
  `- Assessed distinct task/settings groups: ${comparisons.task_count}`, '',
  'Failures and unpaired attempts remain listed. Repeated attempts share task weight.', '',
  '## Intended-use opportunities', '',
  `- Required-use opportunities with a call: ${behavior.required_call_presence.numerator}/${required.length}; relevance graded separately.`,
  `- Calls during explicit exclusions: ${behavior.excluded_calls.numerator}/${excluded.length}.`,
  `- Assessable discretionary opportunities: ${behavior.permitted_opportunities}; no target call rate.`,
  `- Unknown/unassessable opportunities: ${behavior.unknown_or_unassessable}.`, '',
  '## Tasks', '', '| Case / arm / host | Status | Artifact passes | Use observation | Seconds | Evidence |',
  '| --- | --- | --- | --- | ---: | --- |',
  ...tasks.map(task => `| ${task.case} / ${task.arm} / ${task.host} | ${task.status} | ${task.outcome ?? 'ungraded'} | ${task.behavior.verdict} | ${task.duration_ms === null ? 'unknown' : (task.duration_ms / 1000).toFixed(1)} | ${link('task', task.evidence)} |`), '',
  '## Saved behavior reviews', '',
  ...tasks.filter(task => task.review).map(task => `- ${task.case}: ${task.review.verdict} — ${task.review.rationale} (${link(task.review.reviewer, task.review.record_path)})`), '',
  '## Call evidence', '', ...result.calls.map(call => `- ${call.status}: ${call.evidence.map(path => link(call.id, path)).join(', ')}`), '',
  '## Evidence gaps', '',
  '- Automatic use observations establish calls, not their relevance or quality; consult saved behavior reviews.',
  '- Host usage retains native fields and per-turn/cumulative semantics in the JSON report; no prices are assumed.',
  '- Call-to-task membership uses trial directories/IDs. Call-to-turn identity is unjoined unless independently reviewed.',
  '- Call-only logs cannot count invocations for which every record write failed; stderr or captured host evidence is needed.',
  ...tasks.filter(task => task.recording_errors).map(task => `- ${task.id}: ${task.recording_errors} recording diagnostics; inspect captured stderr.`),
  ...evidence.issues.map(issue => `- ${issue}`), '',
];
const output = resolve(values.out ?? join(root, 'report'));
await writeFile(`${output}.json`, JSON.stringify(result, null, 2) + '\n');
await writeFile(`${output}.md`, lines.join('\n'));
console.log(`${output}.md`);
