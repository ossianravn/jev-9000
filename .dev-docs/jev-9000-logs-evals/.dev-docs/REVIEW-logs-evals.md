# JEV 9000 — Implementation review and logs/evals handoff

**Reviewed:** September 26, 2026.
**Repository:** `ossianravn/jev-9000`.
**Commit:** `d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a`.
**Method:** Source/documentation review. No implementation changes or new live evals.

## Assessment

The implementation follows the intended small workflow: shared skill, one MCP
tool, the TypeSafe SDK, native typed results, and host-specific packaging.
The separation between contract validation, discovery schema, configuration,
evaluation, and registration is appropriate for the current scope.
The new logging/evaluation work can extend this structure without a redesign.

The reviewed evidence supports a functioning consultation integration and some
recorded host smoke checks. It does not yet establish an improvement in final
agent output or reliable adherence across the different invocation situations.
That is the measurement gap addressed by the appendix, not a failure to implement
an original telemetry requirement: the original PRD did not require one.

## Findings

### R1 — Preserve evidence at the evaluator boundary

**Observed:** `src/evaluate.ts::evaluate` validates inputs, calls `systemOne`,
validates results, and returns the native result or a human-readable tool error.
It records neither call lifecycle nor input/result history. `src/config.ts`
routes SDK diagnostics to stderr; those diagnostics are not a task-linked dataset.

**Consequence:** A later analysis cannot reliably reconstruct what was evaluated,
which calls failed, how long they took, or which runtime/skill produced them.

**Action in appendix:** Add call lifecycle recording and structured failure
fields while retaining the native tool result. Identify the installed build and
skill, not only the literal `0.1.0` server version.

Sources: [evaluate.ts][evaluate], [config.ts][config], [server.ts][server].

### R2 — Call logs need host context to assess intended use

**Observed:** The tool input contains `state`, `questions`, and optional `model`.
The evaluator does not receive the complete user instruction history, final
artifact, or tasks where the agent never calls it.

**Consequence:** Counting successful calls cannot reveal missed required use,
excluded-area use, later misinterpretation, or whether the work improved.

**Action in appendix:** Retain complete traces for evaluated/imported tasks,
including no-call runs, alongside final artifacts. Grade explicit requirements
separately from discretionary use. Keep analytics context out of Jev's input.

Sources: [tool-schema.ts][schema], [SKILL.md][skill], [contract.ts][contract].

### R3 — Current tests establish integration behavior, not efficacy

**Observed:** `tests/evaluation.test.ts` contains eight deterministic tests using
the real SDK and simulated HTTP. They cover serialization, nullable inputs,
validation, malformed answers, errors, cancellation, and configuration.
`scripts/smoke.mjs` launches an MCP client, calls the tool, and checks the result.
It does not run a coding agent or independently grade a resulting task artifact.

**Consequence:** Green integration/smoke tests cannot answer the user's new
questions about output improvement or consultation appropriateness.

**Action in appendix:** Keep those tests and add a small actual-host comparison
loop with independent task grades. Report repaired and spoiled task outcomes,
not just whether Jev returned an answer or the agent agreed with it.

Sources: [evaluation.test.ts][tests], [smoke.mjs][smoke], [package.json][package].

### R4 — Host verification is uneven and should remain explicit

**Reported in the repository:** Installed Codex explicit and scoped consultations
completed. Discretionary use, later scope changes, and dependent follow-up were
not each exercised as actual host conversations. Claude's manifest/discovery/MCP
checks passed, while its complete agent consultation was blocked by expired OAuth.

**Consequence:** Code/design review of those paths is different evidence from a
successful host trial. Neither the Claude gap nor the additional behavior cases
should be silently reported as verified in the next delivery.

**Action in appendix:** Reuse these scenarios as focused host eval cases, preserve
the gap until the relevant host runs, and report Codex and Claude results separately.

Source: [IMPLEMENTATION.md, Verification][implementation]. These are its reported
results, not new runs independently reproduced during this review.

## Design choices worth preserving

`contract.ts` retains structured values and checks answer types/keys against
requests. `tool-schema.ts` deliberately simplifies discovery for the observed
Codex schema compatibility issue. Add recording around these boundaries rather
than replacing them with a larger schema or orchestration framework.

The skill correctly teaches focused questions, independent batches, probability
semantics, attribution of explanations, and task continuation. Change that
behavior in response to observed eval failures rather than speculative limits.

Both MCP descriptors reference the bundled `dist/server.mjs`; the build script
bundles dependencies. Recording paths should be stable across installed copies,
and evals should record the bundle actually loaded, as the implementation notes
already demonstrate a cached installation differing from the source location.

Sources: [contract][contract], [schema][schema], [skill][skill], [build][build],
[Codex MCP descriptor][codexmcp], [Claude MCP descriptor][claudemcp].

## Review boundaries

Read the five runtime source files, the full skill, full test file, build/smoke
scripts, package metadata, plugin/MCP descriptors, README, repository AGENTS.md,
and implementation notes. Compared the original PRD files with the supplied
handoff; their Git blob hashes match the reviewed repository snapshot.

The original test suite, build, and host sessions were not rerun in this review.
No new Jev calls or baseline/treatment trials were executed. The ignored local
`.verification/` artifacts mentioned in the repository are not in this snapshot.
There is no measured JEV 9000 efficacy result to report yet.

## Appendix handoff

[Appendix A](ask-jev-prd/prd/08-logs-and-usage.md) specifies evidence requirements.
[Appendix B](ask-jev-prd/prd/09-evaluation-design.md) specifies the comparisons and grading.
[Appendix C](ask-jev-prd/prd/10-eval-cases-and-acceptance.md) gives cases and acceptance.
[Appendix D](ask-jev-prd/prd/11-eval-sources-and-decisions.md) records research and proposals.

The first useful implementation is local records plus captured host trials,
a task grader, and a textual report. A framing-only arm is a later diagnostic
when it helps attribution. No dashboard, policy engine, quota, confidence gate,
or new approval step is part of this addition.

[evaluate]: https://github.com/ossianravn/jev-9000/blob/d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a/src/evaluate.ts
[config]: https://github.com/ossianravn/jev-9000/blob/d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a/src/config.ts
[server]: https://github.com/ossianravn/jev-9000/blob/d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a/src/server.ts
[schema]: https://github.com/ossianravn/jev-9000/blob/d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a/src/tool-schema.ts
[contract]: https://github.com/ossianravn/jev-9000/blob/d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a/src/contract.ts
[skill]: https://github.com/ossianravn/jev-9000/blob/d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a/skills/jev-9000/SKILL.md
[tests]: https://github.com/ossianravn/jev-9000/blob/d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a/tests/evaluation.test.ts
[smoke]: https://github.com/ossianravn/jev-9000/blob/d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a/scripts/smoke.mjs
[package]: https://github.com/ossianravn/jev-9000/blob/d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a/package.json
[implementation]: https://github.com/ossianravn/jev-9000/blob/d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a/.dev-docs/IMPLEMENTATION.md
[build]: https://github.com/ossianravn/jev-9000/blob/d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a/scripts/build.mjs
[codexmcp]: https://github.com/ossianravn/jev-9000/blob/d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a/mcp.json
[claudemcp]: https://github.com/ossianravn/jev-9000/blob/d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a/.mcp.json
