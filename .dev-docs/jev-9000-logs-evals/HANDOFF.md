# JEV 9000 — Review and logs/evals appendix

Prepared September 26, 2026 against commit
`d9d30868f3fc2c8cd352c6ab47deaf8e765b8d6a` of `ossianravn/jev-9000`.

## Contents

[Implementation review](.dev-docs/REVIEW-logs-evals.md) contains the file-level findings.
[Updated PRD entry point](.dev-docs/ask-jev-prd/START_HERE.md) links the original
requirements and the four new responsibility-specific appendices.
[Repository instructions](AGENTS.md) add the evaluation task to the current root guidance.

| Appendix | Responsibility |
| --- | --- |
| [A: logs and usage](.dev-docs/ask-jev-prd/prd/08-logs-and-usage.md) | Call evidence, host-task coverage, and useful usage summaries. |
| [B: evaluation design](.dev-docs/ask-jev-prd/prd/09-evaluation-design.md) | Comparable trials, intended-use grading, outcomes, and overhead. |
| [C: cases and acceptance](.dev-docs/ask-jev-prd/prd/10-eval-cases-and-acceptance.md) | Small runnable implementation and completion checks. |
| [D: sources and decisions](.dev-docs/ask-jev-prd/prd/11-eval-sources-and-decisions.md) | Research evidence and optional choices. |

## Apply to the implementation repository

The included `jev-9000-logs-evals.patch` updates documentation only. Run from the
repository root; use the patch so newer/unrelated instructions are not overwritten:

```sh
git apply --check /path/to/jev-9000-logs-evals.patch
git apply /path/to/jev-9000-logs-evals.patch
```

The patch is based on the reviewed commit. If the docs have since changed, merge
the matching sections instead of replacing newer instructions. The readable
files in this package show the complete updated PRD and root AGENTS.md.
No repository commit or application-code change was made by this review.

## Give Codex this task

> Continue the existing JEV 9000 implementation. Read root AGENTS.md, the review,
> and PRD appendices 08–11. Add the smallest complete logs/evals workflow:
> record consultations, capture real host tasks including no-call tasks, compare
> matched baseline/treatment outcomes, grade intended use separately, and produce
> a report linked to saved evidence. Preserve the native tool contract and
> ordinary user workflow. Follow existing test discipline. Keep every PRD at most
> 220 lines and every authored source/test/script at most 300 physical lines.
> Keep optional proposals distinct; introduce no unapproved restriction.
> Report actual runs and findings, with the remaining Claude host gap explicit
> until it has been exercised successfully.

## Verification of this documentation package

`VALIDATION.json` records file lengths, document checks, and patch validation.
The original PRD files and root AGENTS.md used as the patch base were verified
against their Git blob hashes in the reviewed repository.
The repository's application tests and host sessions were not rerun here.
No plugin-effectiveness results were manufactured or inferred from smoke tests.
