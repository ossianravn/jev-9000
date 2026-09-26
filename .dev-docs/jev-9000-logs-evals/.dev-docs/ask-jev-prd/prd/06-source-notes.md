# Source notes and verification status

**Responsibility:** Make the integration facts inspectable without repeating entire vendor docs.
**Checked:** September 26, 2026.
**Method:** Live documentation review and direct reads of official GitHub source files.
**Execution status:** No TypeSafe API call or Codex/Claude Code installation was performed here.

Use these as starting references. Recheck the relevant contracts when implementing.
Version-dependent discrepancies should be resolved with the selected SDK/types and focused tests.
Do not convert example thresholds or vendor recommendations into unrequested product policy.

## TypeSafe

### S01 — Official agent skill

[TypeSafe SKILL.md](https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md)

Read in full. Covers state preparation, focused judgments, structured criteria, batched independent
questions, and composition. The source permits meaningful bounded choices without requiring a
fixed decomposition template. Its usage advice is not a requirement to copy every example policy.
Reviewed blob SHA: `0109513f9656917dc93cbc5ecddfca465a53ce66`.

### S02 — HTTP API

[API reference](https://docs.typesafe.ai/api)

Endpoint, authentication, request/answer fields, metadata, and error statuses.
The HTTP page and linked SDK differ on some optional/null shapes; see the note below.

### S03 — Noul

[Noul reference](https://docs.typesafe.ai/primitives/noul)

A yes/no proposition returns the probability of yes, without a separate confidence value.

### S04 — Choice

[Choice reference](https://docs.typesafe.ai/primitives/choice)

Named alternatives, option descriptions, selected option, distribution, and confidence.

### S05 — Score

[Score reference](https://docs.typesafe.ai/primitives/score)

Ordered descriptive levels, expected level index, legend, probabilities, and confidence.

### S06 — Confidence

[Confidence](https://docs.typesafe.ai/confidence)

Choice/Score confidence summarizes concentration of the returned distribution.
It does not supply a universal threshold for the plugin to enforce.

### S07 — State, structure, and independence

[State](https://docs.typesafe.ai/concepts/state)

[Structured questions](https://docs.typesafe.ai/primitives/advanced)

[Primitives](https://docs.typesafe.ai/primitives)

State is supplied evaluation context; questions over a shared state are independent.
Structured instructions and criteria retain meaningful contextual definitions.

### S08 — JavaScript/TypeScript SDK

[SDK quickstart](https://docs.typesafe.ai/sdk/javascript)

Documents `@typesafe-ai/sdk`, the client, question helpers, credential environment variable,
and the runtime prerequisite. It links the v0.6.0 implementation references below.

### S09 — SDK v0.6.0 types

[types.ts](https://github.com/typesafe-ai/typesafe-sdk-js/blob/v0.6.0/src/types.ts)

Read in full. Includes nullable EntryType, optional instructions, structured Score legends,
model/configuration precedence, transport options, and native result types.
Reviewed blob SHA: `cd0a72d5a2c0492ea309f6aebf8c92f13892b2dc`.

### S10 — Models and aliases

[Models](https://docs.typesafe.ai/models)

Documents `jev-latest`, model overrides, and reporting the resolved model in the response.
No price, context budget, rate limit, or model version is frozen as a product restriction here.

## Host and tool standards

### S11 — OpenAI plugin packaging

[Package your plugin](https://developers.openai.com/plugins/build/plugins)

Portable root manifest and MCP config, legacy compatibility, local authoring/install paths,
and the separate public submission route. The former Codex build URL redirects to this page.

### S12 — Portable Agent Plugins MCP configuration

[MCP servers](https://agent-plugins.org/plugin-authors/mcp-servers)

`mcp.json` transport declarations, executable/argument handling, and `PLUGIN_ROOT` expansion.
Authentication remains host-managed rather than a portable credential field in this format.

### S13 — Claude Code plugin reference

[Plugin manifest reference](https://code.claude.com/docs/en/plugins-reference)

Native plugin layout, MCP configuration, and `CLAUDE_PLUGIN_ROOT` use in supported fields.

### S14 — Claude Code skills

[Skills](https://code.claude.com/docs/en/skills)

Skill discovery, explicit/model invocation, metadata, and how invocation settings change behavior.

### S15 — OpenAI plugin entry URL

[Codex plugin build entry](https://developers.openai.com/codex/plugins/build/)

Checked redirect to S11. Use the current destination for packaging details.

### S16 — Codex skill invocation

[Build skills](https://learn.chatgpt.com/docs/build-skills)

Describes explicit skill selection and implicit invocation based on the description.
The former Codex skills URL redirects here.

### S17 — MCP tool protocol

[MCP tools, current specification](https://modelcontextprotocol.io/specification/latest/server/tools)

Checked current redirect: `2026-07-28/server/tools`.
Use the protocol supported by the chosen SDK and target hosts for schemas and tool results.
The structured result and execution-error conventions should be verified against that SDK.

### S18 — MCP transports

[Transport overview](https://modelcontextprotocol.io/specification/latest/basic/transports)

[stdio binding](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)

Read the overview and stdio binding. The subprocess uses newline-delimited JSON-RPC;
stdout carries protocol messages and stderr can carry diagnostics.
Use the selected SDK's supported lifecycle/version behavior rather than hand-writing a protocol.

## Source difference requiring care

S02 describes required non-null instructions and narrower top-level shapes.
S09 allows nullable state/instructions/descriptions and optional instructions.
The SDK's Score legend type also preserves the supplied description type, including structure.

Do not silently rewrite valid SDK-shaped input to match a narrower local schema.
The skill should write explicit, useful instructions; the adapter should preserve supported data.
A passing mock proves forwarding. A successful real request proves the service accepts that shape.

### S19 — SDK forwarding and validation

[client.ts](https://github.com/typesafe-ai/typesafe-sdk-js/blob/v0.6.0/src/client.ts)

[questions.ts](https://github.com/typesafe-ai/typesafe-sdk-js/blob/v0.6.0/src/questions.ts)

Read the client's setup and `systemOne` path, and the complete question helpers/validation.
`systemOne` forwards request fields and resolves model defaults before dispatching.
The question validator checks for nonempty questions and the basic Score array shape.
