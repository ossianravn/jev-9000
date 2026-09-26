# Logs and evaluations implementation plan

Approved by the user on 2026-09-26 after the complete handoff review.
Requirements: PRD appendices 08–11; acceptance LE-A01–LE-A06.

## Intended outcome

Capture real consultations and full host tasks, including non-use. Compare
matched tasks with and without the installed plugin. Grade final work separately
from intended use, and regenerate reports from saved evidence without model calls.

## Sequence and completion evidence

1. [x] Integrate the supplied documentation patch and preserve existing instructions.
2. [x] Record consultation lifecycle, native payloads, structured failures, timing,
   effective/resolved model, and installed build/skill identity. Demonstrate a
   real installed call and a usage report with evidence links.
3. [x] Capture complete Codex tasks in isolated trial workspaces/configuration,
   including required, excluded, and discretionary use. Save instructions, tool
   availability, traces, artifacts, and completion/failure state.
4. [x] Run a matched baseline/treatment coding task; independently check saved
   artifacts. Produce a reproducible pilot report with separate behavior grades.
5. [x] Exercise representative invocation/changed-context cases and selected
   repeated trials. Preserve every attempt; report variability and evidence gaps.
6. [x] Run the same capture contract in Claude Code when authenticated; record
   actual host results or the concrete remaining authentication gap.
7. [x] Complete focused validation, file-size review, usage documentation, and
   an acceptance report in IMPLEMENTATION.md with commands and evidence paths.

## Selected implementation details

- Retain the native evaluator/discovery contracts and existing SDK transport.
- Local append-only JSONL under the user's `.jev-9000/logs`, with a directory
  override and per-process files. Supplied project content is recorded; secrets
  are scrubbed and transformations identified. Logging failure is diagnostic,
  while the consultation remains usable.
- Keep call records, immutable task evidence, and subsequent grades separate.
- Use existing Node/TypeScript tooling; small modules under `src/` and `evals/`.
- Use actual installed host plugins. Trial configuration must establish skill
  and tool absence in baseline and presence in treatment without changing the
  everyday installation. Verify this before interpreting paired results.
- Start with executable artifact checks and evidence-backed manual behavior
  review. Automated subjective judging is a later option requiring calibration.
- A pilot establishes the workflow; repeated representative outcomes support
  only claims justified by their scope. Report regressions and repairs equally.
- Reuse existing tests. Add cases only for recording failure, evidence integrity,
  task capture, and report semantics that existing coverage cannot protect.

## Known uncertainties and progress

- Codex configuration isolation and actual trace fields require live verification.
- Earlier Claude inference was blocked by expired OAuth; recheck current access.
- No efficacy finding exists yet. Skill changes follow observed failures.
- 2026-09-26: read all 19 handoff files; patch checksum and apply check passed.
- Recording and reporting are implemented; native contract and discovery schema
  are unchanged. Version 0.2.0 is installed in the ordinary Codex cache.
- Required, excluded, discretionary no-call, changed-scope, and native mixed/
  dependent-follow-up Codex cases are captured. Two required-use coding pairs
  passed both arms; independent checks establish no improvement on those pairs.
- An initial Windows permission configuration failed. Its evidence is retained
  as environment failure, with the corrected permissions verified in host context.
- The runner now freezes graders and fixtures. Earlier pilot artifacts were
  regraded against a common saved grader; no extra host/model calls were needed.
- Claude trace capture exposed an error flag alongside a success subtype; the
  parser now respects the error flag. Full inference remains blocked by expired
  authentication. The user chose to finish Codex and document that gap.
- Completed the additional discretionary coding comparison: both arms passed;
  the treatment used Jev and performed additional verification after mixed judgments.
- Final report is reproducible byte-for-byte. Three assessable pairs all passed
  both arms; no output improvement is demonstrated. See IMPLEMENTATION.md for
  exact checks, versions, local evidence paths, overhead and limitations.
