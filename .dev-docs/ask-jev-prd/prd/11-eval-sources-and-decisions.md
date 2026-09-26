# Appendix D — Research, decisions, and scope

**Responsibility:** Preserve the evidence behind the appendix and separate choices.
**Checked:** September 26, 2026. Primary sources only.
**Status:** F entries are external facts; P entries are optional engineering proposals.

## Research findings used

### F-LE1 — Evaluate skills through observable host behavior

OpenAI's skill-evaluation guide demonstrates capturing `codex exec --json`,
checking actual tool/command behavior, and combining deterministic checks with
rubric-based grading. It includes explicit, implicit, contextual, and negative
invocation examples. We use that pattern for Jev's consultation opportunities.

Source: [Testing Agent Skills Systematically with Evals](https://developers.openai.com/blog/eval-skills).

### F-LE2 — Separate the transcript from the resulting work

Anthropic distinguishes a trial's transcript from its final environment outcome.
It recommends task-specific graders, clean trial environments, checking both
triggering directions, inspecting traces, and accounting for repeated-run variation.
Our matched-task design applies those principles to the installed plugin.

Source: [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), published January 9, 2026.

### F-LE3 — Validate qualitative judges

OpenAI recommends specific criteria and human calibration of automated graders.
Its guide identifies position and verbosity biases in model judging and discusses
pairwise comparisons. Our quality rubric retains evidence and permits ties or an
unjudgeable result rather than forcing a winner.

Source: [Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices).

### F-LE4 — A Jev hint can repair and spoil agent decisions

TypeSafe's skill-suggestion cookbook compares baseline, suggestion, and oracle
conditions. It reports both repaired and spoiled decisions in its own experiment.
This supports reporting regressions alongside improvements; its thresholds and
results are not requirements or measured results for JEV 9000.

Source: [Skill suggestion](https://docs.typesafe.ai/cookbooks/skill_suggestion).

### F-LE5 — Host capture is available, with version-specific details

Codex documents JSONL events containing messages, file changes, MCP calls, and
usage. Claude Code documents streaming JSON, session metadata, and cost/usage
outputs. Resumed-session totals can be cumulative; preserve their semantics.
Verify available fields on the installed versions instead of guessing identifiers.

Sources: [Codex non-interactive mode](https://developers.openai.com/codex/noninteractive),
[Claude Code programmatic use](https://code.claude.com/docs/en/headless).

### F-LE6 — Preserve the protocol and native probabilities

MCP's stdio transport reserves stdout for protocol messages and permits logging
to stderr. TypeSafe documents primitive-specific uncertainty semantics; its
confidence field is not the overall task-success probability.

Sources: [MCP stdio transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports),
[TypeSafe confidence](https://docs.typesafe.ai/confidence),
[TypeSafe JavaScript SDK](https://docs.typesafe.ai/sdk/javascript).

## Review basis

Repository: [ossianravn/jev-9000](https://github.com/ossianravn/jev-9000).
Reviewed commit: `d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a`.
See [the implementation review](../../REVIEW-logs-evals.md) for file-level findings.
This appendix is a design deliverable; no new agent-quality experiment was run.
The existing implementation report's live checks remain attributed to that report.

## Optional engineering proposals

### P-LE1 — Local JSONL and ordinary artifact files

**Problem solved:** Reconstruct actual calls and join evaluated tasks without
introducing hosted infrastructure. **Ordinary-use effect:** Local disk writes
containing supplied task context; no change to valid consultations or API semantics.
A suggested default is a user-owned `.jev-9000/logs` directory under the home
folder, with an ordinary directory override and per-process files.
**Decision:** Codex may select this implementation detail or a simpler equivalent
and document it. No restriction is proposed and no additional user approval is needed.
Field names in Appendix A are illustrative; the evidence requirements are binding.

### P-LE2 — Framing-only diagnostic arm

**Problem solved:** Distinguish better decision framing from the contribution of
Jev access when the main experiment does not explain an observed difference.
**Ordinary-use effect:** None; additional evaluation runs only.
**Decision:** Optional diagnostic, selected when it answers a concrete question.
It is not required for the initial runnable baseline/treatment workflow.

### P-LE3 — Starter cases and lightweight runners

**Problem solved:** Start evaluating from the current user outcomes and actual
host tooling. **Ordinary-use effect:** None; fixtures and scripts are development artifacts.
**Decision:** Codex chooses representative cases and a small implementation.
Names, case count, file layout, repetition count, and grader backend are not fixed.

## Restriction register

**No new product restriction is proposed by this appendix.**
The user's existing file-length rules and actual provider contracts remain in force.
Evaluation labels describe what a particular task instructed; they do not become
runtime allowlists, thresholds, or mandatory consultation rules.

If later proposing a restriction, record its observed problem and evidence,
its effect on ordinary use, and the exact user decision/approval status.
An unapproved proposal stays outside runtime behavior, defaults, prompts, and tests.
Source examples containing numeric limits do not authorize copying those limits.

## Scope of this addition

C11–C13 authorize usage recording and a runnable evaluation/reporting loop.
They supersede the original handoff's statement that these capabilities were not
required, while preserving its instruction to avoid unnecessary subsystems.

This slice requires neither a dashboard nor an external telemetry/eval service.
It does not require a database, background worker, feedback conversation after
every call, new host hooks, automatic data upload, or a new privacy approval workflow.
Select additional infrastructure only when a concrete requirement needs it.

Keep valid Noul, Choice, Score, batching, follow-up, and current configuration
behavior intact. Ordinary users continue using JEV 9000 in the same way.
