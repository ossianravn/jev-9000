# Appendix A — Logs and usage evidence

**Responsibility:** Capture evidence for usage analysis and evaluation.
**Applies to:** JEV 9000; reviewed base `d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a`.
**Status:** C/D requirements below; storage and field names are a reference design.
**Next:** [Evaluation design](09-evaluation-design.md).

## Confirmed additions

| ID | Requirement from the latest user request |
| --- | --- |
| C11 | Obtain usable insights into actual plugin usage through logs. |
| C12 | Run evaluations to determine whether the plugin improves the agent's output. |
| C13 | Determine whether the agent uses the plugin as intended. |

C05–C10 still apply: PRDs at most 220 lines; authored code at most 300 physical
lines; modular, proportional implementation; proposals remain distinct.
The original core PRD did not require this work. C11–C13 now add it explicitly.

## Derived acceptance behavior

| ID | Required capability | Basis |
| --- | --- | --- |
| D08 | Inspect an evaluation's input, result/error, timing, and implementation/model identity. | C11, C12 |
| D09 | Relate consultations to captured host tasks, including tasks with no consultation. | C11, C13 |
| D10 | Re-run representative tasks under comparable plugin-enabled and baseline conditions. | C12 |
| D11 | Grade intended use and output quality separately, with evidence references. | C12, C13 |
| D12 | Produce a readable report with denominators, overhead, and missing-evidence coverage. | C11–C13 |

## Smallest complete evidence loop

Capture consultations during use. Capture host traces for evaluated or imported
sessions. Select representative tasks, compare matched runs, grade the resulting
work, and inspect the report and linked evidence before changing the skill.

| Owner | Evidence it can establish |
| --- | --- |
| Evaluator/runtime | Arguments received, API outcome, duration, native usage and model. |
| Host capture/runner | User task and instructions, tool availability/calls, continuation, final artifacts. |
| Grader/reviewer | Whether use was appropriate and whether the resulting work met the task. |
| Report | Reproducible summaries and comparisons of those observations. |

A call log alone cannot establish missed consultations, later agent behavior,
or final task quality. Ordinary call-only usage remains useful but is explicitly
reported as call-only coverage. Intended-use rates use captured, assessable tasks.

## Runtime capture requirements — D08

Record each logical `jev_evaluate` invocation that reaches the handler, including
failed validation, setup failures, provider errors, cancellation, and success.
Pair a start record with a completion record using a generated call identifier.
A start without completion is an observed incomplete call, with unknown outcome.
MCP/schema rejections before the handler belong in the host trace when exposed;
report this coverage boundary rather than claiming the evaluator saw them.

Retain the actual supplied state and questions, with structured values intact.
Record the effective requested model when known and the resolved model returned
by TypeSafe. Preserve native answers, distributions, legends, and usage.
Identify the installed runtime/build and skill version/hash; the checkout may
differ from the cached plugin actually used. Missing identities remain unknown.

Measure elapsed duration with a monotonic clock; record timestamps for joining
records. The measured call includes SDK retries. Count that as one consultation;
record retry attempts only when actually observed through the existing SDK.

Retain structured failure information before creating the existing user-facing
error text: stage/category, available HTTP status and provider request ID,
and the credential-scrubbed message. Missing values remain null/absent.
A malformed provider answer can be retained as diagnostic data marked invalid;
it must not be counted as a successful or usable Jev answer.

Keep credentials, authorization headers, and environment dumps out of records.
Preserve the existing credential scrubbing for errors. Document that recorded
state/questions can contain project content. Logs are evidence, not plugin input.
Any payload omission or transformation must be recorded; transformed records are
not represented as exact replay inputs. No new content-classification workflow is required.

## Suggested record shape — P-LE1

Field names are an implementation suggestion. Equivalent simpler shapes are valid.
These illustrative records are synthetic; their values are not measurements.

```json
{
  "schema_version": 1,
  "event": "consultation.started",
  "call_id": "example-call",
  "process_instance_id": "example-process",
  "trial_id": null,
  "timestamp": "2026-09-26T12:00:00Z",
  "source": "simulated",
  "runtime": {"plugin_version": "0.1.0", "build_id": "example-build", "skill_hash": "example-hash"},
  "input": {
    "state": "The selected design uses the already deployed worker.",
    "questions": {"new_service": {"type": "noul", "instructions": "Does this design add a new service?"}}
  }
}
```

```json
{
  "schema_version": 1,
  "event": "consultation.completed",
  "call_id": "example-call",
  "status": "success",
  "duration_ms": 240,
  "effective_model": "example-requested-model",
  "result": {
    "model": "example-resolved-model",
    "answers": {"new_service": {"type": "noul", "noul": 0.1}},
    "usage": {"input_tokens": 80, "output_tokens": 8}
  }
}
```

Keep logging metadata outside TypeSafe `state`, questions, and native results.
Agents continue calling the existing tool without mandatory analytics arguments.
Store trials/grades separately so later grading never rewrites original evidence.

## Captured task evidence — D09

Each tracked task/trial needs its own record even if it makes no Jev call.
Retain task/case identity, complete supplied instructions including scope changes,
starting repository/fixture identity, host/model/settings, installed plugin and
skill identities, enabled tool configuration, and captured session identifier.
Retain host trace, final response, changed artifacts/diff, and outcome-test output.
Record task completion/interruption and trace availability explicitly.

Assign trial identity in the runner/configuration, outside the model's arguments.
Use actual host tool-call IDs and runtime IDs when the host preserves them.
Verify joining on both installed hosts; an MCP request ID, host item ID, and
runtime call ID are different identifiers unless a mapping is demonstrated.
A dedicated per-trial log destination also establishes trial membership.
If a call-to-turn match is ambiguous, mark it unjoined rather than guessing.

Record skill loading separately from tool use when the host exposes both.
Do not infer a loaded skill from a call or a consultation from text mentioning Jev.
Infer invocation context from user instructions and visible trace evidence,
labeling it explicit, scoped, discretionary, or unknown. Agent self-reports may
supplement the trace but are not independent evidence that a call was useful.
No private reasoning access or extra self-report turn is needed.

## Storage and ordinary operation

P-LE1 recommends local append-only JSONL and plain artifact files. Use a stable
user-owned destination independent of the project cwd and installed plugin cache.
An optional log-directory setting and per-process files are sufficient to support
copied installations and concurrent hosts without a shared database.
Ship a documented working default; ordinary consultations need no extra ceremony.
The exact path/configuration names are engineering choices, not user-facing restrictions.

Logging must preserve the existing call/result behavior and MCP stdout protocol.
Write diagnostics to stderr. A local logging failure leaves the consultation
usable and makes the recording failure visible; reports expose missing evidence.
Do not create background uploads, retention quotas, or dashboards for this slice.
Preserve current SDK transport behavior rather than adding retries around logging/API calls.

## First useful usage report — D12

Show calls and question-type mix, success/failure/incomplete counts, elapsed time,
and native token usage, sliced by available host/model/plugin identities.
Show captured-task count, no-call tasks, joined/unjoined calls, ungraded tasks,
and missing traces/outcomes so the reader knows the measured population.
Provide references back to records; counts alone are insufficient for diagnosing use.
Usage volume, agreement, and confidence are descriptive signals, not quality scores.
