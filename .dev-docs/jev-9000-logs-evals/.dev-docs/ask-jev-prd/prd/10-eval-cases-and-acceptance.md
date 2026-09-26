# Appendix C — Cases, implementation, and acceptance

**Responsibility:** Turn logs and evals into a small runnable workflow.
**Status:** Acceptance for C11–C13 and D08–D12; example cases are proposals.
**Related:** [Logs](08-logs-and-usage.md), [design](09-evaluation-design.md), [sources](11-eval-sources-and-decisions.md).

## Case definition

A case needs a stable ID/version, task prompt, user instruction context, fixture
or repository starting point, expected-use label, outcome checks/rubric, and origin.
Origin can be an observed usage example or an explicitly synthetic fixture.
Keep outcome labels and grader-only material outside the agent's task context.
Record intended-use expectations before running; preserve edits as new versions.

Illustrative case format; paths and content are proposed, not existing files:

```json
{
  "id": "worker-restart",
  "version": "example-v1",
  "origin": "synthetic",
  "task_prompt": "Implement imports that survive a worker restart. Use the existing project unless a requirement needs another component.",
  "plugin_instruction": "Use Jev for the architecture choice before implementing it.",
  "expected_use": "required",
  "fixture": "fixtures/worker-restart",
  "outcome_checks": ["Restart recovery preserves pending work", "Existing import behavior still passes"],
  "review_rubric": ["The approach fits the supplied infrastructure and constraints"]
}
```

The runner supplies the task to both arms and the plugin instruction only to the
treatment. The resulting prompt difference is part of the saved experiment definition.
A developer must implement and verify the fixture/checks before using this example
as an executed case. An obvious toy decision is useful for wiring, not broad efficacy.

## Starter situations — P-LE3

Use these to cover distinct existing behaviors; reuse fixtures where practical.
They are a starting point, not a required benchmark size or a permitted-use list.

| Situation | What to inspect | Outcome evidence |
| --- | --- | --- |
| Direct A/B/C request | A real, relevant Choice and interpretation. | Invocation test; assess choice against stated requirements. |
| Scoped design plus implementation | Consultation occurs before the relevant commitment. | Tests on the delivered code and constraint review. |
| Explicitly excluded routine edit | No consultation for the excluded step. | Requested edit is correct; full trace establishes absence. |
| Discretionary second opinion | Use or non-use has a task-grounded basis. | Completed task quality, with appropriateness review. |
| Probability/trade-off task | Noul/Score meanings, comparable criteria, supported explanation. | Independent proposition label or task-specific rubric. |
| Changed requirement in a later turn | Updated instructions/context inform continuation. | Final artifact satisfies the revised requirement. |
| Ordinary service failure | Genuine error and sensible continuation under the user's instruction. | Trace/result fidelity; final outcome recorded separately. |

Add observed misses, regressions, and useful consultations from local usage.
Also retain ordinary successes and no-call cases; a collection consisting only
of known failures or called tasks cannot represent the usual workload.
Keep development cases distinct from held-out confirmation cases. Closely related
variants belong to the same task family when splitting or summarizing results.
Do not tune a skill on every case and describe that same set as unseen evaluation.

## Implement in the current repository

Preserve the existing five-module runtime and native `jev_evaluate` contract.
Add recording around the evaluator boundary and a small record writer.
Keep human-readable error translation; retain a structured category for reporting.
Obtain installed build/skill identities at build/startup rather than assuming the
working checkout equals the bundled plugin. Configuration belongs with current setup.

Suggested responsibility boundaries, with exact file names left to Codex:

| Responsibility | Likely location |
| --- | --- |
| Call lifecycle capture | Small additions around `src/evaluate.ts` / registration. |
| Local record writes and recording diagnostics | One focused module under `src/`. |
| Run/capture installed host trials | Small script(s) under `evals/`. |
| Read traces, apply checks, and create reports | Cohesive grading/report modules under `evals/`. |
| Versioned case inputs and rubrics | Data files under `evals/`. |

Reuse Node and the current testing conventions. An external eval/telemetry
framework is optional; none is necessary for this deliverable.
Preserve the simple Codex-compatible discovery schema in `src/tool-schema.ts`.
Do not add logging fields inside TypeSafe questions or require an agent feedback tool.

## Host capture

Use the installed hosts' structured outputs; verify exact flags/events against
the versions available during implementation. Current documentation supports:

```sh
codex exec --json "TASK PROMPT" > host-events.jsonl
claude -p "TASK PROMPT" --output-format stream-json --verbose > host-events.jsonl
```

These demonstrate capture only. The actual runner must also establish the intended
plugin configuration, starting fixture, current user instructions, final artifacts,
and ordinary permissions appropriate to the task. Preserve stderr separately.
Do not disable normal plugin loading in the treatment merely to obtain a clean run.
Do not mutate the user's everyday installation to alternate baseline and treatment.

Capture a fresh host stream with its task record even when no Jev call occurs.
Import an existing user-selected host trace when available; raw call logs alone
remain valid usage evidence with explicitly limited task/behavior coverage.
Support Codex first as the current demonstrated host, then the same contract in
Claude Code. An unavailable host is a named verification gap, not a simulated pass.

## Acceptance

### LE-A01 — Calls become usable evidence

Exercise the existing mixed-request path with recording enabled. Inspect actual
state/questions, native result/model/usage, call identity, elapsed time, and build
identity in the records. Include a real installed-host/API example when available.
Simulated fixtures remain clearly labeled. Existing caller-visible values are unchanged.
**Trace:** D08.

### LE-A02 — Failure and recording boundaries stay honest

Reuse meaningful existing failure tests to verify structured failure recording,
including input failure and cancellation. A start without a finish remains incomplete.
Demonstrate that an unwritable log destination reports a recording problem without
corrupting MCP stdout or converting a successful evaluation into a failed one.
Pre-handler rejections, unavailable IDs, or missing traces stay explicit gaps.
**Trace:** D08, D12.

### LE-A03 — Intended use includes non-use

Capture both a required-consultation task and an explicitly excluded task under
known available plugin configuration. The former has a relevant call; the latter
can be graded from a complete no-call trace. Also show that an assessable discretionary
no-call trial is not automatically graded as a failure. Report unavailable tools
separately from agent omission. These are case-specific expectations, not new policy.
**Trace:** D09, D11.

### LE-A04 — Comparable trials produce an outcome report

Run a baseline/treatment pair from a verified starting fixture in an actual host.
Save exact prompts/configurations, traces, resulting artifacts, and independent grades.
The report shows the observed outcome comparison, overhead, and evidence links.
A first pair proves the workflow; repeated representative trials are needed for
any claim of a reliable benefit. Keep failures, missing results, and no-call runs visible.
**Trace:** D10–D12.

### LE-A05 — Reports can be reproduced from saved evidence

Recreate usage and outcome summaries without new model calls. Identify the saved
records, case versions, and grader versions used. For subjective grading, import
recorded human judgments or retain the judge's structured outputs and provenance.
Regrading is a new grading record, distinct from rerunning the agent or Jev.
Replay of saved calls is labeled replay and is not counted as fresh production usage.
**Trace:** D08–D12.

### LE-A06 — Delivery remains modular and proportionate

Check every PRD at most 220 lines and each authored source/test/script at most
300 physical lines. Test coherent contracts, not every schema field at every layer.
Do not impose arbitrary evaluation-score gates, confidence cutoffs, consultation
budgets, or new approval steps. Retain unselected proposals as proposals.
**Trace:** C05–C10, C11–C13.

## Delivery sequence

First, add call recording and demonstrate a readable usage summary.
Then, capture one full task and one no-call task through the actual host.
Next, complete the baseline/treatment loop with independent outcome grading.
Finally, exercise the relevant starter situations and report observed variability.
Keep the initial report textual: a Markdown summary plus machine-readable results
and references to evidence are enough to make the workflow useful.

Update `.dev-docs/IMPLEMENTATION.md` with what actually ran, versions, recording
location, repeat/report commands, results, and remaining host gaps.
Distinguish ordinary unit tests, simulated behavioral tests, live host trials,
and evidence of improved outcomes. A passing test suite is not an efficacy result.
