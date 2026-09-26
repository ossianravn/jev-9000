# JEV 9000 evaluations

The runner captures actual host tasks. Artifact grading runs separately from the
agent and Jev. Reports use saved evidence and make no model calls.

## Run

Build the plugin first: `npm run build`. Configure the usual TypeSafe `.env`.
Evaluations run only when invoked. `JEV_9000_LOGGING=false` disables consultation
records, including during trials; manual trials still save host traces and task
artifacts. Leave logging enabled for consultation evidence and usage metrics.

```sh
npm run eval:run -- --case cache-recovery --repeats 2
npm run eval:run -- --case cache-discretionary --repeats 2
npm run eval:run -- --case excluded-edit --arm treatment
npm run eval:run -- --case discretionary-edit --arm treatment
npm run eval:run -- --case changed-scope --arm treatment
npm run eval:run -- --case native-followup --arm treatment
npm run eval:run -- --case skill-selection --arm treatment
```

Select cases for the question under investigation; this list is not a required
suite. `cache-recovery` and `cache-discretionary` share one task family and must
not be represented as unrelated confirmation cases. They are synthetic fixtures.
Direct requests and scope-change cases assess invocation, not baseline efficacy.
`skill-selection` uses a small synthetic skill catalogue to check consultation,
loading and applying selected instructions, and preserving a user-required skill.

`--host` selects `codex` (default) or `claude`. Codex reads model/effort from the
current user config unless supplied. Claude requires explicit `--model` and
`--effort`, plus a working login. The runner uses each installed CLI; on Windows
it resolves the npm Codex launcher and Claude executable without shell interpolation.

`--out` chooses a new evidence directory. Reusing an existing experiment path
does not overwrite original evidence. `--env` selects the TypeSafe environment file.
Each repeat has one baseline and one treatment with alternating execution order.

## Conditions and evidence

Codex trials have separate CODEX_HOME directories, credentials linked locally
from the existing login, and a real marketplace installation in the treatment.
The baseline has no JEV plugin installation. The user's everyday installation
is unchanged. Windows can still expose global skills; retained injected context
shows what the agent actually received. Skills listing, skill reads, and calls
are separate observations. Baseline/treatment share all ordinary task requirements.

The current local Codex runner uses `danger-full-access`, matching the authorized
build environment, with approvals disabled and fresh fixture directories. It is
not a security sandbox. Run only fixtures and code you trust. Both arms use the
same permissions. The initial Windows workspace-write pilot became read-only;
its failed attempts remain documented instead of being used as quality results.

Claude uses session-local plugin loading and structured output. Its stream
retains tool/plugin initialization metadata. Strict MCP mode is not used because
it suppressed the native plugin server on the tested version. Claude's full
injected system context is not exposed; record that coverage limitation.

Each experiment saves its case, fixture hashes, settings, and a frozen grader.
Each task saves instructions and follow-ups, host configuration/discovery,
incremental JSONL/stdout and stderr, completion state, final artifacts, and grades.
Codex's host-provided system/developer/user context is retained separately;
private reasoning is not required or extracted. Live call logs have a trial ID
and dedicated directory. Call-to-turn identity remains unjoined unless demonstrated.

API keys are not included in prompts or records. Local authentication links and
task content stay in the user's evidence directory. Do not commit that directory.
Copied artifacts and imported traces may contain project content; scrubbed payloads
are marked and must not be described as exact replay inputs.

## Grade and report

```sh
npm run eval:report -- --root /path/to/evidence --out /path/to/report
npm run eval:regrade -- --root /path/to/evidence
npm run eval:review -- --trial /path/to/trial --file /path/to/review.json
```

Report output is Markdown plus JSON. Regeneration needs no new API calls.
Regrading appends a new grader result against saved artifacts; prior grades remain.
The report uses the latest applicable grade and requires matching fixture and
grader identities for paired outcomes. Host failures and missing grades stay visible.

Behavior review JSON contains `reviewer`, `method`, `verdict`, `rationale`, and an
`evidence` array of trial-relative files, optionally with `#L` line references.
Record substantive judgments against the case rubric. A call's presence alone
does not establish relevance. Label agent-assisted reviews as such; they are not
human-calibrated automatic judges. A later review becomes a new record.

Reports keep live, simulated, and replay call counts separate. Outcome tables
show both-pass, baseline-only (regression), treatment-only (repair), and both-fail
pairs. Repeats are averaged within task/settings groups before task weighting.
The initial small pilot uses descriptive results without inferential claims.
Host usage keeps native fields; resumed Claude usage is cumulative, so use the
last result per session. Latency includes task work, not just the Jev request.

## Import a selected host trace

```sh
npm run eval:import -- --file /path/to/import.json --out /path/to/new-evidence
```

The manifest supplies `host`, complete `prompt`/instructions, and `traces` (paths
relative to the manifest). Optional fields are `followups`, `case_id`, `source`,
`model`, `expected_use`, `configuration`, `starting_fixture`, `artifacts`, `calls`,
and `duration_ms`. Configuration is declared evidence until independently checked.
Imported tasks are usage observations, not randomized paired experiments. Missing
context/outcomes stay unknown; call records retain their original identities.

## Acceptance

LE-A01/02: mixed native call recording and faithful failures; recording failure
leaves the tool usable. LE-A03: assessable required, excluded, and discretionary
tasks, including non-use. LE-A04: actual-host matched artifacts and independent
grades. LE-A05: regenerate reports from saved evidence. LE-A06: focused tests,
existing dependencies, and authored files no longer than 300 physical lines.
