# Design proposals and decisions

**Responsibility:** Keep engineering suggestions distinct from confirmed product behavior.
**Status:** All entries below are proposals; none adds an acceptance requirement.

## How to use this register

Codex can choose normal technical details to implement the confirmed outcome.
A proposed language, file layout, or callable identifier is an optional reference design.
Selecting such an implementation does not authorize changing the user's product behavior.
Acceptance remains defined by C and D requirements and applicable external contracts.

Do not turn an optional proposal into a required field, runtime gate, or completion condition.
Proposals left unselected do not block the core workflow.

## P01 — Shared skill plus local MCP runtime

**Suggestion:** Use a shared skill and a local stdio MCP evaluator implemented with the
TypeSafe JavaScript/TypeScript SDK, with thin native host packaging.

**Problem addressed:** Both hosts need callable access to Jev and guidance on using its answers.
A shared implementation avoids duplicating API behavior.

**Effect on ordinary use:** Users configure a TypeSafe credential and the selected runtime.
Evaluation is invoked from the host; a separate hosted application is unnecessary.

**Decision:** Codex may choose this as an implementation detail or use a simpler conforming route.
A remote service, account system, or new user workflow would be a separate product decision.

## P02 — Working names and one evaluation entry point

**Suggestion:** Use “Ask Jev” / `ask-jev` as working names and `jev_evaluate` as the callable name.
One evaluator can accept all native question types through the same input contract.

**Problem addressed:** Gives the initial package a clear discovery label and a small interface.

**Effect on ordinary use:** The agent can use the same capability for checks, choices, and scores.
This is not a cap on questions or consultations.

**Decision:** Codex can choose consistent technical identifiers and document them.
Final branding can change without changing the acceptance behavior.
Multiple entry points are not required, nor prohibited if a concrete host need emerges.

## P03 — Public marketplace distribution

**Suggestion:** Consider public publication after a working local package exists.

**Problem addressed:** Makes installation discoverable beyond a shared repository or local package.

**Effect on ordinary use:** Could simplify discovery, but the selected public directory may impose
additional submission, hosting, or account requirements. Verify those at publication time.
OpenAI's current public MCP submission guidance calls for a remote HTTPS endpoint. [S11]

**Decision needed from the user:** Whether public publication is wanted, in which directory,
and whether any resulting hosting work is approved.

**Current implementation consequence:** None. Deliver the checked local installation workflow.
Do not build hosting or submission infrastructure as an assumed prerequisite.

## Proposed restrictions

**None are proposed in this PRD.**
The requested file-size limits and documented provider shapes are already identified separately.

If implementation reveals a concrete problem that appears to need a new restriction,
add a record containing all of the following before asking for a decision:

| Field | Required content |
| --- | --- |
| Problem | The actual failure and supporting evidence. |
| Proposed restriction | Exactly what behavior it would reject, interrupt, or change. |
| Ordinary-use effect | What a normal user/agent would now experience. |
| Simpler alternative | Whether correcting the integration or instructions solves the problem. |
| User decision | The specific change the user is being asked to approve. |
| Status | Proposed or explicitly approved, with the recorded decision. |

Until approved, leave that restriction out of implementation requirements and tests.
Do not treat this record format as an approval step for normal Jev consultations.

## Ideas intentionally left outside the build

Persistent decision histories, dashboards, mandatory evaluation rounds, automatic confidence gates,
custom quota management, and hosted operations have no confirmed need in the current workflow.
They are not required work, implicit future milestones, or prebuilt extension frameworks.
The agent can still ask follow-up questions and use the host's existing conversation history.

Source IDs refer to [the source notes](06-source-notes.md).
