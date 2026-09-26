# Ask Jev — PRD for Codex

A build handoff for a plugin that lets an agent consult Jev while doing the user's work.

**Prepared:** September 26, 2026.
**Audience:** Codex implementing the product.
**Product targets:** Codex and Claude Code, continuing the platforms discussed.
**Deliverable here:** Requirements and implementation guidance; application code is not included.

## Start

Place this package in the implementation repository.
Merge `AGENTS.md` into an existing root `AGENTS.md` rather than replacing unrelated instructions.
Keep the responsibility-specific documents in `prd/`.

Give Codex this instruction:

> Implement Ask Jev using `AGENTS.md` and the documents in `prd/`.
> Read the product, behavior, evaluation contract, integration, and verification documents first.
> Read the proposal register to distinguish recommendations from requirements.
> Verify the live integration references relevant to the implementation you choose.
> Build the smallest complete workflow: invoke, frame, evaluate with Jev, interpret, continue.
> Support the Codex and Claude Code plugin targets described in the PRD.
> Choose ordinary implementation details yourself; proposals are optional reference designs.
> Preserve all confirmed requirements and the derived acceptance behavior.
> Keep each PRD file at or below 220 lines and each code file at or below 300 LoC.
> Continue working modularly as the implementation grows, including tests and scripts.
> Do not add product restrictions, approval steps, quotas, or subsystems from speculation.
> Keep unapproved proposals out of mandatory behavior and acceptance tests.
> Test the working path, report what actually ran, and identify any unverified host or live API step.

## Document map

| File | Responsibility |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Instructions governing Codex's implementation work. |
| [00-product.md](prd/00-product.md) | Confirmed requirements, user outcome, and completion boundary. |
| [01-agent-behavior.md](prd/01-agent-behavior.md) | Invocation, question framing, interpretation, and continuation. |
| [02-evaluation-contract.md](prd/02-evaluation-contract.md) | TypeSafe inputs, outputs, configuration, and ordinary failures. |
| [03-host-integration.md](prd/03-host-integration.md) | Plugin packaging and responsibility boundaries. |
| [04-verification-and-delivery.md](prd/04-verification-and-delivery.md) | Acceptance scenarios, test evidence, and implementation sequence. |
| [05-design-proposals.md](prd/05-design-proposals.md) | Optional engineering approaches and proposal treatment. |
| [06-source-notes.md](prd/06-source-notes.md) | Primary sources, checked facts, and documentation differences. |
| [07-request-examples.md](prd/07-request-examples.md) | Illustrative native requests for the agent and test author. |

## Status vocabulary

- **C — Confirmed:** Requirements supplied by the user in this conversation.
- **D — Derived:** Behavior needed to make that outcome work; traceable to C requirements.
- **F — External fact:** An API, SDK, or host contract; cite and verify its source.
- **P — Proposal:** A suggested design, not a mandatory implementation requirement.

Examples illustrate behavior; their names, values, and subject matter are not product limits.
Acceptance tests check C and D behavior plus the actual external contracts in use.
They must not require an unselected proposal merely because it appears in this package.

## Implementation latitude

The PRD fixes the user outcome and integration semantics.
Codex can choose a suitable stack, function names, file names, and test runner.
The reference approach is a shared skill plus a small local MCP evaluator using the TypeSafe SDK.
A simpler conforming implementation is valid.
No unresolved proposal prevents work on the core workflow.
