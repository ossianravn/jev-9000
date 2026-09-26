# Implementation instructions — Ask Jev

These instructions govern work on this repository.
Read [the product brief](prd/00-product.md) and its linked responsibility documents before coding.

## Deliver the outcome

Build the workflow in which a coding agent consults Jev about its current task,
receives typed judgments, explains the relevant result, and continues its work.
Support both direct requests and agent use under the user's standing instructions.
Keep the Codex and Claude Code targets in view while implementing the shared behavior.

## Requirements and decisions

Use the C / D / F / P status definitions in [START_HERE.md](START_HERE.md).
Treat C and D as the acceptance contract and F as sourced integration facts.
P entries are optional engineering suggestions, not additional acceptance conditions.
Choose ordinary technical details without asking the user to approve each one.
Record a selected approach briefly in existing implementation documentation.
Changing a user-facing requirement or adding a restriction requires a user decision.

For every proposed restriction, record:
- The concrete, observed problem and its evidence.
- The effect on ordinary use, including calls it would reject or interrupt.
- The exact decision needed from the user and its current approval status.

Keep unapproved restrictions out of runtime checks, prompts, defaults, and tests.
A source-backed API validation rule is an integration fact, not a new product policy.
A source recommendation is not automatically a product requirement.

## Keep files modular

Keep every PRD file at or below **220 lines**.
Keep every authored code file at or below **300 LoC**, including tests and scripts.
Continue applying these limits throughout implementation and subsequent changes.
Split by a coherent responsibility when a file grows; update imports and tests together.
Use normal readable formatting. Do not compress code to evade the size requirement.
Third-party dependencies and lockfiles are not authored implementation code.
Generated application code must not become a hiding place for an authored monolith.

Prefer direct modules with clear inputs and outputs.
Useful boundaries are question schemas, service calls, host adapters, and agent instructions.
Keep functions together when they share a responsibility; avoid one-file-per-function fragmentation.
Add an abstraction when the existing implementation has a concrete need for it.
Respect an existing repository's stack and conventions when they fit the task.

## Keep the workflow small

Use the existing agent for task understanding, evidence gathering, and explanation.
Use Jev for its native typed evaluations.
A simple question can remain a simple question.
Use ordinary host installation and credential configuration.
Do not create product-specific approval flows, quotas, confidence gates, or domain allowlists.
Do not add a database, queue, daemon manager, dashboard, telemetry service, or policy engine
unless an approved requirement actually needs it.
These omissions keep the implementation small; they do not limit the user's consultations.

## Integrate with evidence

Read the current TypeSafe skill and relevant API / SDK sources before implementing the boundary.
Read the host plugin and tool standards for the actual target versions.
Use [source notes](prd/06-source-notes.md) to locate the relevant references.
Preserve structured instructions, criteria, native answer fields, and model metadata.
Keep API credentials in the runtime's normal configuration rather than evaluation arguments.
Use the selected SDK's existing transport behavior instead of a second retry subsystem.
Handle a failed evaluation as a failed evaluation; keep simulated answers in tests.

## Verify and finish

Implement a working vertical slice before broadening the question coverage.
Use [verification and delivery](prd/04-verification-and-delivery.md) as the completion checklist.
Test each native question type, mixed batches, host wiring, and ordinary failures.
Exercise the actual installed plugin location, not just a development function call.
Check PRD lengths and code LoC; state the counting method in the completion report.
Do not exclude authored tests or scripts from the code-size check.
A physical-line count below the limit is a sufficient conservative check;
otherwise use a language-aware LoC count with normal formatting.

Record which tests ran, which were simulated, and which used Jev and the actual hosts.
If a key or host is unavailable, finish the testable work and identify that specific verification gap.
Do not claim the plugin is live-tested when only a mock or schema check ran.
Keep the final handoff focused on installation, use, test results, and remaining concrete gaps.
