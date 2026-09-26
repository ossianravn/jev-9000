# JEV 9000 implementation

## Selected design

The user confirmed JEV 9000 as the product name on 2026-09-26 and authorized
implementation and live TypeSafe calls. The original PRD retains its historical
Ask Jev working name. The root AGENTS.md makes proportional testing explicit.

Selected P01: shared skill, local stdio MCP server, official TypeSafe SDK,
portable Codex packaging, and native Claude Code packaging. `jev_evaluate`
accepts native request concepts. The runtime contains no decision policy.

The TypeScript source is split into contract validation, tool discovery schema,
runtime configuration, evaluation/error translation, and server registration. esbuild creates one
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

## Verification

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
- Installed version: `0.1.0+codex.20260926031113` under
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
