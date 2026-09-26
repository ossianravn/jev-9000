# Verification and delivery

**Responsibility:** Establish that the smallest complete workflow actually works.
**Status:** Acceptance for C01–C10 and D01–D07.
**Related:** [Product](00-product.md), [contract](02-evaluation-contract.md), [hosts](03-host-integration.md).

## Acceptance scenarios

### A01 — Direct choice consultation

Given an installed, configured plugin and a task describing alternatives A, B, and C,
when the user asks the agent to consult Jev,
the agent sends a meaningful Choice, receives a real answer, and uses it in the task.
A simple case succeeds without a forced score matrix, suitability gate, or approval ritual.
**Trace:** C01, C02, D01–D05, D07.

### A02 — Scoped and discretionary consultation

Given a standing instruction to use Jev for a named area,
when the agent encounters a relevant choice in that area, it can discover and invoke the capability.
Changing the user's scope changes the agent's behavior through ordinary instructions.
Also exercise “use Jev when another judgment would help” on a relevant example.
**Trace:** C02, D01, D02, D05.

### A03 — Probability check

Given a proposition and its context, a Noul request returns the native probability of yes.
The agent interprets it as that proposition's probability, with no invented confidence field.
**Trace:** C04, D03–D05.

### A04 — Trade-off assessment

Given alternatives and meaningful dimensions, the agent can ask comparable Score questions.
The result preserves score, rubric legend, distributions, and confidence.
The agent explains the for/against considerations using those results and the supplied context.
No fixed weights or synthetic success probability are introduced.
**Trace:** C01, C04, D02–D05.

### A05 — Structured inputs and mixed batch

A request containing independent Noul, Choice, and Score questions is sent as one evaluation.
Nested instructions and criteria survive serialization; question and option keys remain intact.
Results return under the original question IDs.
**Trace:** C04, D03, D04.

### A06 — Changed context and follow-up

When new evidence or a changed priority makes another consultation useful,
the agent can send it with the relevant updated context.
No product-imposed call count or fixed decision budget rejects it.
**Trace:** C02, C08, D02, D05.

### A07 — Ordinary setup and service failures

A missing/invalid credential, malformed question, or unavailable service produces a useful error.
The response clearly distinguishes failure from a successful Jev evaluation.
The agent can correct the request/setup or continue according to the user's instruction.
**Trace:** C07, D06.

### A08 — Both installed host paths

The delivered plugin is discoverable and callable in Codex and Claude Code.
The runtime and dependencies resolve in the installed location.
Record a complete consultation in each host, including an explicit invocation and a
representative standing-instruction prompt; these may share the same live API scenario.
**Trace:** C03, D01, D07.

### A09 — Requirements and file discipline

Every PRD file remains at or below 220 lines and every authored code file at or below 300 LoC.
Tests and scripts are included, and module boundaries remain coherent.
Every extra user-facing restriction has its required proposal record and user decision.
Unapproved proposals appear in neither mandatory behavior nor acceptance expectations.
**Trace:** C05–C10.

## Practical test strategy

Use focused automated tests for the integration and a small host-level smoke exercise.
Mock TypeSafe responses when testing deterministic request/response behavior.
Label fixtures as simulated; never use them as evidence of Jev's judgment quality.

Cover:
- Each question type and a mixed request with structured fields.
- Preservation of IDs, options, rubric order, answer fields, model, and usage.
- The selected SDK's nullable/optional shapes described in the contract note.
- Ordinary input, credential, service, and malformed-success-response failures.
- Host packaging references and a tool discovery/call round trip for the chosen adapter.

For the documentation mismatch, a fake transport proves faithful forwarding only.
A live response is needed before claiming the service accepts the disputed shape.
Keep it a focused compatibility check, not a broad edge-case exploration program.

Live smoke checks validate connectivity and answer shape, not a particular stochastic winner.
Record the model and dependency versions returned/used by the test.
Assess the agent's explanation against the actual result and supplied context.
The core smoke checks establish integration behavior. The later [logs/evals addition](08-logs-and-usage.md)
requires usage evidence and outcome evaluation, without a hosted platform or numeric release gate.

## Implementation sequence

**Establish the integration facts.** Inspect the repository and relevant current references.
Choose an ordinary implementation route and note it briefly.
Confirm schemas and packaging for the versions actually used.

**Build the vertical slice.** Make a direct Choice consultation reach TypeSafe through a host
and return the native answer to the agent. Use a simulated transport first where helpful,
then exercise the real path when credentials and a host are available.

**Complete the native behavior.** Add Noul, Score, structured questions, and mixed batches.
Add the interpretation and standing-instruction guidance to the shared skill.

**Finish both host packages.** Check runtime paths, dependencies, installation, and invocation.
Keep host differences at the adapter/manifest boundary.

**Verify and hand off.** Run the acceptance checks and file-size checks.
Write the actual setup/use instructions and a factual completion report.
Do not stop at an API wrapper whose skill or installed host path is unwired.

## Completion report

Use a simple Markdown table with scenario, status, evidence, and any concrete gap.
Statuses should distinguish passed, failed, and not run.
Identify whether evidence is automated/mock, real API, or actual host execution.
Record package/runtime/host versions and the resolved Jev model where available.
Include the file-size check method and its results.

If credentials or a host are unavailable, deliver the completed testable implementation
and explicitly mark the live/host scenario unverified.
That gap must not be reported as a completed end-to-end acceptance pass.

## Review for accidental expansion

Before completion, inspect schemas, skill instructions, defaults, and tests for extra policy.
Remove unsupported confidence thresholds, caps, forced confirmations, mandatory evidence forms,
and automatic extra evaluations that slipped in from templates or examples.
Keep source-backed provider validation and the user's own instructions intact.

## Additional logs/evals acceptance

The current user request adds [LE-A01–LE-A06](10-eval-cases-and-acceptance.md).
Apply those scenarios for the recording and evaluation work. Keep integration
passes, observed agent behavior, and evidence of output improvement separate.
