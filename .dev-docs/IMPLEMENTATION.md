# JEV 9000 implementation

## Selected design

The user confirmed JEV 9000 as the product name on 2026-09-26 and authorized
implementation and live TypeSafe calls. The original PRD retains its historical
Ask Jev working name. The root AGENTS.md makes proportional testing explicit.

Selected P01: shared skill, local stdio MCP server, official TypeSafe SDK,
portable Codex packaging, and native Claude Code packaging. `jev_evaluate`
accepts native request concepts. The runtime contains no decision policy.

The TypeScript source is split into contract validation, tool discovery schema,
runtime configuration, evaluation, failure translation, recording, and registration. esbuild creates one
generated ESM runtime containing dependencies so a cached plugin can execute
without the development checkout or npm install. Node 22.18+ also runs the small
TypeScript test suite directly, without another test runner or TS loader.

Existing `.env` uses TYPESAFE_MODEL, supported as an alias below the SDK's
TYPESAFE_DEFAULT_MODEL. JEV_9000_ENV_FILE supports ordinary installed-runtime
configuration by referencing the original file. Credentials are excluded from
the package and version control. The runtime lazily creates the client so
missing configuration produces a useful tool error without preventing discovery.

## Sources checked

- [TypeSafe SDK](https://docs.typesafe.ai/sdk/javascript), installed 0.6.0 source
  and types: structured/nullable values, model defaults, errors, retries, abort.
- [API contract](https://docs.typesafe.ai/api): native answers, metadata,
  maximum 255 Choice options and 2–10 Score levels.
- [Structured questions](https://docs.typesafe.ai/primitives/advanced) and
  [agent skill selection cookbook](https://docs.typesafe.ai/cookbooks/skill_suggestion):
  context framing and independent questions; demo thresholds are not product policy.
- [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins)
  and [portable MCP schema](https://agent-plugins.org/schemas/1.0.0/mcp.schema.json).
- [Claude plugin reference](https://code.claude.com/docs/en/plugins-reference)
  plus installed CLI help for plugin validation and session-local loading.
- Installed MCP SDK registration, stdio client, input validation, and tool error
  handling. Cancellation passes through to the TypeSafe SDK; logs use stderr.

## Host compatibility

An actual Codex 0.153.2 run rejected the recursive Zod-generated tool schema
with `AdditionalProperties` deserialization errors. The discovery schema now
describes native shapes without recursive references or discriminated unions
inside map values. Full request validation remains at the evaluator boundary;
structured values and the native interface are preserved. The corrected cached
plugin completed both explicit and standing-instruction consultations.

The scaffold validator requires the compatibility overlay's MCP reference to
be `.mcp.json`; the portable root `mcp.json` remains canonical for current Codex.
When updating a portable install, synchronize the cachebuster generated in the
compatibility manifest into root `plugin.json` before reinstalling. Root version
takes precedence over the compatibility overlay's version.

## Initial 0.1.0 verification

Checked with Node 24.19.0, npm 11.17.0, TypeScript 7.0.2,
TypeSafe SDK 0.6.0, MCP SDK 1.30.1, Zod 4.6.5, and esbuild 0.25.12.
Hosts: Codex CLI 0.153.2 and Claude Code 2.1.226. Date: 2026-09-26.

| Scenario | Status | Evidence / gap |
| --- | --- | --- |
| A01 — Direct Choice | Passed | Installed Codex skill/tool consultation returned `existing_runner`, model jev-1.13.0, usage 544 input / 43 output tokens; agent explained and proposed its next implementation step. |
| A02 — Standing instructions | Passed for scoped use | A fresh Codex run used project instructions to consult Jev without a direct consultation request; usage 625 / 46. Discretionary use and later scope changes were reviewed in the skill, not separately live-tested. |
| A03–A05 — Native questions and mixed structured batch | Passed | Real MCP/API calls for Noul, Choice, and Score; structured legends and metadata preserved. Eight automated tests use real SDK serialization with simulated HTTP. |
| A06 — Follow-up capability | Passed by contract/design review | Stateless evaluator accepts updated state on each call; there is no consultation counter or cap. Dependent-round instructions are in the skill; no separate host conversation exercised them. |
| A07 — Ordinary failures | Passed | Simulated authentication, service, network, malformed input/answers, cancellation, and missing setup; live 422 handling below. |
| A08 — Codex installed path | Passed | Skill read and real `jev_evaluate` tool calls from cached plugin; runtime hash matches workspace bundle. |
| A08 — Claude local plugin path | Partial | Manifest validation, skill discovery, and actual host MCP connection passed. Native manifest also drove a real mixed MCP/API call. Full agent consultation failed before inference because Claude OAuth expired and could not refresh. |
| A09 — File limits / policy | Passed | Physical lines include blanks/comments/tests/scripts: largest code file is 161 lines; largest PRD is 165. Reviewed schemas, defaults, and skill for unapproved policy. |
| Type check / bundle | Passed | `npm run check`; `npm run build`; `npm test` (8/8). |
| SDK/API nullable discrepancy | Service rejected | `state: null` reached service and returned 422 `state: Field required`; no fabricated answer. |
| Plugin and skill validators | Passed | Plugin creator validator, skill quick validator, and `claude plugin validate .`. |

The live model's particular choices and numbers are observations, not fixed test
expectations or evidence of judgment quality. The nullable probe establishes
rejection of that request, not the acceptance/rejection of every optional shape.

The Python validator initially lacked PyYAML. A temporary copy under ignored
`.verification/python` enabled the checks without changing runtime dependencies.
Codex logged unrelated pre-existing skill/manifest warnings (last30days, nutmeg,
and icon paths); these did not prevent the final successful consultations.
No unrelated configuration was changed to hide those warnings.

## Local installation

- Source package: `C:/Users/Ossian/plugins/jev-9000`.
- Personal marketplace: `C:/Users/Ossian/.agents/plugins/marketplace.json`,
  named `local-personal`; installed with `codex plugin add jev-9000@local-personal`.
- Current installed version: `0.2.0` under
  `C:/Users/Ossian/.codex/plugins/cache/local-personal/jev-9000/`.
- Both local MCP descriptors reference `C:/CodexApp/jev-9000/.env` through
  `JEV_9000_ENV_FILE`. The key itself is not copied into the plugin or manifests.
- Start a new Codex chat and use `$jev-9000` or “Ask Jev”.
- Claude's tested session-local command is
  `claude --plugin-dir C:/Users/Ossian/plugins/jev-9000`.
  Run `claude auth login` to restore its login, then repeat direct and
  standing-instruction consultations. This is the remaining live host gap.

Local acceptance outputs are under ignored `.verification/`; this document
records the durable findings without committing session outputs or credentials.

## Logs/evals delivery — 0.2.0, September 26, 2026

The approved plan is [LOGS-EVALS-PLAN.md](LOGS-EVALS-PLAN.md); the canonical PRD
now includes appendices 08–11. Usage is documented in [../evals/README.md](../evals/README.md).
The native contract, discovery schema, SDK transport, and consultation skill are unchanged.

Call records default to `C:/Users/Ossian/.jev-9000/logs` on this machine. They
capture handler inputs, native results or structured failures, monotonic duration,
effective/resolved model, call/process/trial identity, bundle hash and skill hash.
Credential transformations are marked. Recording failures use stderr and leave
the native result usable. Pre-handler schema errors remain a host-trace boundary.

The runner installs a separate real Codex plugin per treatment; baselines have
no JEV installation. It saves actual injected host context to verify the skill
catalogue and effective model/permissions. Windows global skills may remain
available in both arms despite the profile-directory override. Full task traces,
fixtures, artifacts, frozen graders and separate later grades support reproduction.

| Acceptance | Result and evidence |
| --- | --- |
| LE-A01 | Passed: actual installed Codex mixed Noul/Choice/Score and follow-up calls; recorded structured inputs, native answers, usage and loaded build/skill hashes. |
| LE-A02 | Passed: existing simulated SDK failure/cancellation cases now inspect records; separate writer failure and incomplete-record checks. A real installed mixed call with a file as its log destination returned valid MCP/native output and two recording diagnostics. |
| LE-A03 | Passed in Codex: five assessable required-use turns had relevant calls; neither of two excluded opportunities called; discretionary edit skipped and discretionary cache work called. Saved agent-assisted reviews give trace references; they are not human-calibrated judgments. |
| LE-A04 | Passed as pilot: three assessable coding pairs, all both-pass; zero repairs/regressions. Two required-use repetitions and one discretionary comparison share one cache task family. No general efficacy claim. |
| LE-A05 | Passed: report JSON regenerated byte-identically without new model calls; saved artifacts independently regraded; selected trace import checked separately. |
| LE-A06 | Passed: no production dependencies added; source/script/test physical line maximum 178, PRD maximum 169. |
| Claude full host | Not verified: two captured attempts ended before inference with expired OAuth. Installed-descriptor MCP discovery passed. User explicitly chose to finish Codex and retain this gap. |

Evidence root: `C:/Users/Ossian/.jev-9000/evals/`.
The generated `report.md` / `report.json` retain 14 task attempts: 10 completed
Codex tasks, two initial Codex environment failures, and two Claude authentication
failures. Seven actual host consultations are recorded and joined to tasks.
The ordinary installed-runtime smoke record has its own usage report at
`C:/Users/Ossian/.jev-9000/usage-report.md` and is not counted as an agent task.

Required-use pair durations: baseline 139.37 / 123.63 seconds; treatment 168.65 /
171.60 seconds. Discretionary pair: baseline 125.90 seconds, treatment 195.31.
Other development trials overlapped; these are descriptive observations, not a
controlled latency benchmark. Host usage retains native cache/total fields.
Jev resolved to `jev-1.13.0`; host settings were `gpt-6-astra`, effort `xhigh`.
The discretionary trial got a low overall Noul but a favorable Choice; the agent
reported the disagreement and verified more race cases. Both artifacts passed.

Validation executed: `npm run check`, `npm run build`, `npm test` (14 tests at
that checkpoint), and final `node --test tests/evals.test.mjs` (5/5, including the
subsequently added saved-artifact integrity case). Fifteen distinct tests were
exercised across those runs. All authored MJS files passed `node --check`;
`git diff --check`, physical line counts, known-credential scan and reparsing all
16 actual host streams passed. No mock result is presented as a live judgment.

The cache grader was confirmed to fail on the original defective fixture.
During development its file changed while early trials ran. Saved artifacts
were regraded with one frozen version; original grades remain. The final runner
freezes the fixture and grader before beginning a comparison. Older fixture
snapshots were added only after matching their recorded initial hashes.

Initial Windows trials inherited read-only behavior despite configuration; the
runner now passes the same explicit full-access permissions as this authorized
build environment. Those attempts remain environment failures. Claude's result
contained `subtype: success` alongside `is_error: true`; the parser now respects
the error flag. Strict MCP configuration suppressed native plugin servers, so
the Claude adapter preserves native loading and captures initialization inventory.

Version 0.2.0 was copied to the local source and installed with
`codex plugin add jev-9000@local-personal --json`. Its cached bundle SHA-256 matches
the workspace bundle: `a67e4a4072295067a401bce9099f21c49df3ca60f594cc555e9463b62291dcc4`.
Start a new Codex chat to use it; existing MCP processes retain their loaded code.

Repeat a selected experiment with `npm run eval:run -- --case cache-recovery`.
Regenerate the report with `npm run eval:report -- --root C:/Users/Ossian/.jev-9000/evals`.
The next measurement expansion should use representative real tasks and separate
confirmation cases; this small synthetic pilot establishes the workflow and its
observed outcomes, not improvement across coding work generally.

### Logging switch follow-up

The user approved `JEV_9000_LOGGING=false` as an opt-out, with logging enabled by
default. The recorder reads the setting at creation after environment loading;
`false` (case-insensitive, surrounding whitespace ignored) returns a no-op sink.
It creates no log directory or files and leaves existing records untouched.
Set `true` or remove the setting and restart the host/plugin process to re-enable.
Manual evals still save host traces and artifacts; enable logging for call evidence.

Validation: `npm run check`, `npm run build`, and
`node --test tests/recording.test.ts` passed (3 tests, simulated SDK transport).
One live mixed request through the installed Codex MCP descriptor, with the flag
loaded from a temporary `.env`, returned `jev-1.13.0`, created no log directory,
and emitted no recording errors. Evidence: `.verification/logging-switch-CMcyKy/`.
This was an installed-runtime smoke check, not a new host-agent trial.

The local source and installed 0.2.0 bundle were refreshed. `codex plugin add`
failed while backing up the cache with Windows Access is denied; direct bundle
replacement succeeded. Workspace/source/cache SHA-256 matches:
`8ef0cb51ad52450f2a0463cd520f963c250ca0a95751e80fae012889d20e317d`.
Already running MCP processes need a restart to load this change.

## Skill-selection workflow — September 26, 2026

The user approved skill-selection consultation through the existing evaluator.
The agent supplies the task, stage, constraints, and actual candidate descriptions;
independent Noul questions allow several or no optional skills to fit. Required
skills remain fixed context. The agent reads selected instructions and continues
the task, without a fixed probability cutoff or a forced single winner.

Implementation and verification plan:

1. [x] Add the workflow and discovery wording to the shared JEV skill.
2. [x] Explain the user prompt, relevance judgments, and agent continuation in README.
3. [x] Run one installed Codex invocation case with a synthetic three-skill catalogue:
   diagnostic, user-required reporting, and unrelated visual work. Review the
   actual call, skill reads, task outcome, and unchanged fixture files separately.
4. [x] Refresh the normal installed skill, confirm its hash, and record the evidence.

Reference: TypeSafe's [Noul documentation](https://docs.typesafe.ai/primitives/noul)
and [skill-suggestion cookbook](https://docs.typesafe.ai/cookbooks/skill_suggestion)
were consulted. The cookbook's one-winner restriction and numeric thresholds are
example policies; this workflow follows the user's approved multi-skill design.
Runtime/API contracts and dependencies are unchanged. No new unit tests were added.

`npm run eval:run -- --case skill-selection --arm treatment` completed in Codex.
One live `jev-1.13.0` call returned Noul 0.70 for `trace-failure` and 0.03 for
`visual-polish`; it used 731 input and 39 output tokens. The user-required
`plain-report` skill was fixed context, rather than subject to a relevance gate.
The agent read the selected skill files, reproduced the failure, and verified a
suggested fix in memory. The existing unchanged-artifact grader passed, and the
complete fixture's initial/final hashes matched. Agent-assisted trace review
passed; this one synthetic case does not establish general selection quality.

Evidence and report:
`C:/Users/Ossian/.jev-9000/evals/2026-09-26T13-36-07.064Z-382af6f3/`.
`turn-1.jsonl` lines 9/12/20 show skill reads, line 18 the actual consultation,
and lines 25/28 the reproduction and in-memory verification. The known defective
fixture is intentional; the failed reproduction assertion is expected evidence.

Workspace, local source, ordinary installed cache, and trial-recorded skill hash
match `ac613ee8af5640293e43b67762d62ce8cc2cb3a745b1ba3d5bc5b61cfa489580`.
The existing 0.2.0 runtime bundle is unchanged. Start a new host session to load
the updated skill. Claude's previously recorded authentication gap remains.
Case JSON, catalogue descriptions/paths, `git diff --check`, and the new code
file's physical line count (13) passed. Existing runtime test results remain
applicable; no application suite or extra model trial was needed.

## UI planning and building — September 26, 2026

The user approved a UI consultation workflow through the existing evaluator:
the agent supplies the audience's task and concrete component candidates, Jev
evaluates inclusion or competing arrangements, and the agent delivers the
requested plan, implementation, or improvement. Requirements remain fixed
context. The agent owns composition, code, and verification. Runtime UI
generation and a json-render dependency are outside this increment.

Implementation and verification plan:

1. [x] Add discoverable UI guidance to the shared skill, with a linked reference
   loaded only for UI consultation. Cover candidate meaning, dependencies,
   whole-screen coherence, and plan versus build continuation.
2. [x] Document an outside-in invoice-screen example in README.
3. [x] Add one synthetic planning invocation case to the existing runner, using
   a component catalogue and actual installed Codex/TypeSafe calls. Review the
   resulting plan against the task independently of Jev's preferences.
4. [x] Refresh the ordinary installed skill/reference, verify matching hashes,
   review the diff and line counts, and record evidence and remaining gaps.

Validation is one host planning trial plus direct artifact checks; no new
application tests or runtime changes are needed. Generalize the existing
unchanged-fixture grader beyond cache-specific filenames for the new fixture.
Check that comparison directly with an unchanged and a modified fixture.

Sources: the user-supplied `.dev-docs/jev-ui.md`,
[json-render's Jev guide](https://json-render.dev/docs/jev), and TypeSafe's
[Noul](https://docs.typesafe.ai/primitives/noul),
[Choice](https://docs.typesafe.ai/primitives/choice), and
[skill-suggestion cookbook](https://docs.typesafe.ai/cookbooks/skill_suggestion).
These support the selection pattern; the workflow retains native primitives
without importing demo thresholds, layout budgets, or runtime composition APIs.

Validation completed:

- `npm run eval:run -- --case ui-planning --arm treatment`: actual installed
  Codex trial completed in 139.17 seconds. Six independent Nouls were followed
  by a Choice supplied with the selected plan and prior answers. Both calls
  returned `jev-1.13.0`; combined usage was 3,255 input and 147 output tokens.
- Jev returned 0.82 for the overdue filter, 0.75 for customer search, 0.06 for
  revenue chart, 0.93 for per-row reminders, 0.17 for bulk reminders, and 0.66
  for summary inclusion. The layout Choice selected the compact row (0.86
  relative probability, 0.72 confidence). These are observations, not thresholds.
- Agent-assisted review passed: actual candidate descriptions and capabilities
  were supplied, required content retained, and the agent delivered a coherent
  plan covering reminder interactions and relevant states. Explanatory synthesis
  was attributed to the agent. No fixture edits or UI implementation were claimed.
- The independent unchanged-fixture grader passed. Direct checks confirmed it
  accepts unchanged fixtures and rejects an altered catalogue; existing invocation
  fixtures also passed. The changed grader is 90 physical lines. Case JSON,
  reference paths, installed content identity, and `git diff --check` passed.
- `eval:review` saved the review and `eval:report` regenerated this run's report
  from saved evidence. No new unit tests, runtime build, or broad suite was needed.

Evidence: `C:/Users/Ossian/.jev-9000/evals/2026-09-26T14-34-08.613Z-6338c142/`.
In its treatment trial, `turn-1.jsonl` lines 5/11/13 show skill, UI reference,
and fixture reads; lines 15/18 contain the actual calls. The final plan is in
`final-response.txt`. One synthetic planning task does not establish improved
design quality. Build continuation and rendered interactions were not exercised;
Claude's previously accepted authentication gap remains.

Workspace, local source, ordinary installed cache, and trial-installed skill and
UI reference contents match. Skill SHA-256:
`e2e2a8ca1e894fb4d8182db729e1c31a4cfa29c231fa785c425ab123ba245b92`.
UI reference SHA-256:
`d5cad027345c4c60e13ac56570b825d5334a7b874092801200d60db5efc01979`.
The ordinary installed README was refreshed too. Start a new host session to
load the updated instructions; the 0.2.0 runtime remains unchanged.

## GitHub distribution — September 26, 2026

The user approved a ready-to-run GitHub marketplace for external testers and
will perform WSL verification personally. Do not run WSL trials in this pass.

Plan:

1. [x] Add the `jev-9000` repo marketplace and a generated, committed plugin
   under `plugins/jev-9000`, including the bundled runtime and shared skills.
   Publish this distribution increment as 0.3.0; retain editable sources at root.
2. [x] Add one packaging command and document the release/update procedure.
   Configuration stays outside the package via the existing JEV_9000_ENV_FILE
   setting; no runtime behavior or new dependencies are required.
3. [x] Replace developer-oriented onboarding with external tester instructions:
   GitHub install, personal configuration, fresh session, smoke prompt, updates.
4. [x] Validate the package, install from a clean Git snapshot using an isolated
   Codex configuration on Windows, and exercise the installed MCP path.
5. [x] Publish to GitHub and verify the documented remote install/update commands
   against it. Record results, with WSL explicitly left to the user.

Validation is packaging/installation focused. Reuse the existing mixed MCP smoke
and inspect generated assets, credentials, manifest versions, and source fidelity.
No new application tests or unrelated suite is selected.

Pre-publication checks passed: `npm run package`, the plugin-creator validator,
marketplace identifier validation, staged secret/machine-path scan, and
`git diff --cached --check`. The packaging script has 30 physical lines; the
37,400-line bundled runtime is generated, with its source and dependencies
maintained separately. The validator required PyYAML in an external verification
directory; no project dependency was added.

An archived Git index snapshot (no local `.env`, `node_modules`, or untracked
build inputs) installed as `jev-9000@jev-9000` version 0.3.0 in a fresh Windows
CODEX_HOME. A standalone MCP client then exercised that installed copy using
only the external environment-file setting and returned live `jev-1.13.0`
Choice/Noul/Score answers (508 input, 73 output tokens). This is installed
transport validation, not a new host-agent trial or WSL result.

Evidence: `C:/Users/Ossian/.jev-9000/verification/github-distribution-20260926/`.
`local-install-0.json`, `local-install-1.json`, and `local-smoke.json` retain the
installation and call results; runtime records are under `local-calls/`.

Published distribution commit `d4e3d14` to `origin/main`. In a second fresh
Windows CODEX_HOME, the documented `codex plugin marketplace add
ossianravn/jev-9000` and `codex plugin add jev-9000@jev-9000` commands installed
version 0.3.0 directly from GitHub. `marketplace upgrade jev-9000`, reinstall,
and `plugin list --marketplace jev-9000 --json` also passed; the listing reports
enabled=true and the GitHub Git source. This checks a refresh of the current
version, not a transition to a future release.

All ten distributed files match byte-for-byte between the generated package,
the clean-snapshot installation used for the live smoke, and the GitHub
installation. No second identical API call was needed. Evidence is in
`github-step-0.json` through `github-step-4.json` and `package-identity.json`.
The user's ordinary Windows installation was not changed by these isolated
checks. WSL execution is explicitly left to the user as requested; Claude's
previously recorded host-authentication gap is unchanged.

## Claude GitHub installation verification — September 29, 2026

Plan: validate the existing Claude manifests, install the public GitHub package
into a fresh Claude configuration, and run a real Claude consultation from
outside the developer checkout using the installed skill and MCP server.
Reuse local authentication without recording credential contents. Exercise the
marketplace refresh and plugin update commands, then document the verified
setup and remaining limits in README. No new application tests are needed for
this installation/documentation task; WSL verification remains with the user.

Results: passed with Claude Code 2.1.283, Node 24.19.0, plugin 0.3.0 on Windows.
Both `claude plugin validate .claude-plugin/marketplace.json` and
`claude plugin validate plugins/jev-9000` passed. The public GitHub marketplace
already existed in commit 499fe0a; no manifest or runtime change was necessary.

In a fresh CLAUDE_CONFIG_DIR, from an empty directory outside this checkout:

- `claude plugin marketplace add ossianravn/jev-9000` downloaded GitHub via HTTPS.
- `claude plugin install jev-9000@jev-9000` installed an enabled user-scope copy.
- `claude plugin marketplace update jev-9000` and
  `claude plugin update jev-9000@jev-9000` passed. This verifies current-version
  refresh (already latest 0.3.0), not a transition to a future release.
- `claude plugin list --json` identified the independent cached package.
- A standalone client used its native .mcp.json and returned live Choice, Noul,
  and Score answers from jev-1.13.0 (508 input / 73 output tokens).

The initial actual-agent request exposed expired OAuth credentials even though
`claude auth status` reported logged in. The ordinary profile failed identically.
After the user ran `claude auth login`, the actual installed-host trial passed:
Claude loaded `jev-9000:jev-9000` through Skill, discovered the connected native
plugin server, and called `mcp__plugin_jev-9000_jev-9000__jev_evaluate` once with
all three independent question types. Jev returned jev-1.13.0, selecting the
existing runner, Noul 0.95, Score 3.02 on the agent's 0–4 rubric, and usage of
1,046 input / 83 output tokens. Claude then delivered its recommendation and
implementation plan. Exit 0; completed; no permission denials or file changes.
The authenticated run took about 31 seconds using the host's default model.

The host ran in print mode with the Skill and Jev tool explicitly allowed for
this test. No --plugin-dir, developer runtime path, or custom MCP override was
used. Authentication was reused via a local hard link without reading secrets
into the prompt/evidence. Jev read the existing external config.env. The user's
ordinary plugin configuration was not changed by the isolated checks.

Evidence lives under
`C:/Users/Ossian/.jev-9000/verification/claude-github-20260929/`:
install-0.json through install-4.json, installed-smoke.json, the authenticated
host trace/summary, calls/, and package-identity.json. All nine non-README
package assets match the tested GitHub-installed copy byte-for-byte; only the
README changed. Its generated copy matches the source. `npm run package`,
native Claude validation, and `git diff --check` passed. No authored code changed
and no new application tests were added.

README now presents both hosts at installation, shares external configuration
and the test prompt, documents Claude's actual manifest names, distinguishes
catalogue refresh from installed-plugin update, and explains the separate host
login and TypeSafe credential. Runtime/version remain 0.3.0 for this docs-only
change. WSL execution remains with the user.

Scope of evidence: this closes the Claude installed-host authentication and
consultation gap. It is a planning smoke, not a paired outcome evaluation or
coverage of standing-scope changes, skill selection, and UI planning in Claude.
The final prose also inferred a reason for Jev's 0.95 without evidence and
proposed extra limits; successful transport does not certify every explanation
or plan detail. No quality-improvement claim is made.

Cleanup limitation: automatic approval review blocked removal of the temporary
host-home/.credentials.json authentication hard link with only "blocked by
policy". The link remains in the external test profile; no credential contents
were printed or committed. Independent final checks confirmed the trial
workspace has zero files, the host completed with one Jev call and no permission
denials, and the generated README equals its source.
