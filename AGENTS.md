# JEV 9000

JEV 9000 (named after HAL 9000) lets a coding agent consult TypeSafe's Jev,
interpret its typed judgment, and continue the user's task. “Ask Jev” in the
original handoff is an earlier working name.

## Before changing behavior

Read `.dev-docs/ask-jev-prd/START_HERE.md` and the responsibility documents
relevant to the change. For initial implementation, read all eight PRD files.
Confirmed (C) and derived (D) requirements define acceptance; external facts
(F) need verification against the versions used; proposals (P) remain optional.
Inspect the current code, callers, contracts, and repository state before editing.

Support Codex and Claude Code, including direct, scoped, and discretionary
consultation under the user's instructions. The agent owns context gathering,
question framing, explanation, and continuation. The evaluator owns faithful
TypeSafe calls and useful errors; host packages own discovery and installation.

Choose ordinary implementation details and record material choices in existing
implementation documentation. Ask before changing user-facing requirements or
introducing a restriction. Record its observed problem, ordinary-use effect,
and requested decision; keep it out of runtime behavior and tests until approved.
Use the hosts' normal permissions and configuration. Keep the workflow small.

## Implementation

- Preserve native Noul, Choice, Score, structured inputs, mixed independent
  questions, IDs, option keys, rubric order, answers, model metadata, and usage.
- Read current TypeSafe sources and host standards at the integration boundary.
  Preserve the selected SDK's supported shapes and use its transport behavior.
- Return genuine evaluation failures as failures. Attribute typed judgments to
  Jev and explanatory synthesis to the agent; fixtures are never live results.
- Keep credentials in runtime configuration. Never print or commit `.env`, keys,
  or credential-bearing errors. Live TypeSafe calls are authorized for this build.
- Keep each new or enlarged hand-maintained code file at or below **300 physical
  lines**, including comments, blanks, tests, and scripts. Existing larger files
  may receive focused changes only if they do not grow. Exceptions need explicit
  user authorization. Split by responsibility, not arbitrary line ranges.
- Keep each PRD file at or below **220 lines**. Generated/vendor files and
  lockfiles are outside the authored-code limit.

## Tests: only what earns its cost

Use the **fewest tests that protect meaningful behavior and consequential risks**.
Reuse existing coverage first. Before adding a test, identify the distinct
contract, failure, or regression it protects. If no durable risk warrants a new
test, add none. Do not spend tokens on tests that merely mirror implementation,
trivial wiring, framework types, exact wording, or coverage quotas.

For this integration, focus on native request/result fidelity, meaningful
validation and service failures, and the installed host/tool path. Prefer a
small mixed-request contract test over repetitive tests of every field. Live
checks establish connectivity and answer shape, not a predetermined winner.
Avoid testing the same contract at several layers without a distinct risk.

Run focused checks plus applicable acceptance checks. Stop once they pass and
the final review finds no unresolved concern. Broaden or repeat checks only for
relevant changes, failures, or concrete new risks. Report unrelated failures
separately rather than changing unrelated behavior or weakening assertions.

## Completion

Build a working vertical slice before broadening coverage. Verify from the
location each host actually loads, including cached/copied installations.
Use `prd/04-verification-and-delivery.md` under the handoff as the acceptance map.
Review the diff, affected production path, credential handling, and physical
line counts. Report exact checks and distinguish simulated transport, live API,
and actual host execution. Identify concrete unverified gaps honestly.
