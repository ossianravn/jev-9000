# Host integration and implementation boundaries

**Responsibility:** Deliver a usable plugin in Codex and Claude Code.
**Status:** D01, D07; reference architecture is P01, not an additional product requirement.
**Sources:** [S08, S11–S18](06-source-notes.md).

## Required integration outcome

Each host can discover the consultation instructions and invoke the evaluator.
The invocation reaches Jev with the agent's request and returns the answer to the same task.
Users can configure the required credential using the host/runtime's ordinary setup.
Installation instructions describe a path that was actually checked.

Share the evaluation behavior and consultation instructions across hosts wherever practical.
Keep host-specific syntax in the packaging/adapter responsibility.
A full plugin path is required; copying an isolated skill while omitting its runnable
integration does not establish D07.

## Reference architecture — P01

A small implementation can use:

- A shared `SKILL.md` containing the behavior in [agent behavior](01-agent-behavior.md).
- A local stdio MCP server exposing an evaluation capability.
- The official TypeSafe JavaScript/TypeScript SDK behind that capability.
- Host-specific manifests/configuration pointing to the shared skill and runtime.

This is a suggested engineering route. Follow an existing suitable stack or choose a simpler
conforming route without turning the suggestion into a new acceptance requirement.
The host agent performs question framing and explanation.

## Responsibility boundaries for code

| Boundary | Owns | Does not need to own |
| --- | --- | --- |
| Question contract | Tool schemas and supported native shapes. | Task policy or a universal decision rubric. |
| TypeSafe adapter | Client configuration, API invocation, ordinary errors. | Repository crawling or preference storage. |
| Host/tool adapter | Discovery, registration, result envelopes, lifecycle. | Decision-making logic or extra inference. |
| Agent skill | Framing and interpretation in the ongoing task. | Duplicated transport code. |

These are logical boundaries; a small function may suffice for a boundary.
Use separate files when responsibility or size makes that useful.
Keep code files within C06 as tests and implementation grow.

## Current Codex packaging — F

OpenAI documents portable root `plugin.json`, `skills/`, and `mcp.json`.
Its older `.codex-plugin/plugin.json` remains a compatibility fallback. [S11]

For the portable route, declare the Agent Plugins schemas and use its MCP field shapes.
A local stdio entry can use `command: "node"` with an argument such as
`${PLUGIN_ROOT}/dist/server.js`, provided that file and its dependencies exist when installed.
Portable MCP configurations declare the transport `type` explicitly. [S12]

`PLUGIN_ROOT` is expanded in supported fields such as args, not inside the executable token.
Use a bare executable or documented plugin-relative executable path for `command`. [S12]
Match the actual host version being tested; do not invent installation commands from memory.

## Current Claude Code packaging — F

Claude Code documents `.claude-plugin/plugin.json` and root `skills/`.
A native `.mcp.json` can connect the MCP runtime using `${CLAUDE_PLUGIN_ROOT}` in args. [S13]
Use Claude's field schema rather than assuming the portable MCP JSON is interchangeable.
The shared skill can remain in the root `skills/` tree.

Both explicit and model-initiated skill invocation are supported by the host.
Choose metadata that preserves both for this product. [S14]
Avoid copying a template flag that would make the skill manual-only.
Keep the host's own permission settings intact; add no plugin-specific confirmation step.

## Illustrative repository arrangement

The names and language here illustrate P01/P02 rather than defining a required layout.

```text
plugin.json
mcp.json
.claude-plugin/plugin.json
.mcp.json
skills/ask-jev/SKILL.md
src/
  server.ts
  question-schema.ts
  evaluate.ts
  tool-result.ts
tests/
  evaluation.test.ts
  tool.test.ts
  packaging.test.ts
prd/
AGENTS.md
README.md
```

A build may emit corresponding runtime modules under `dist/`.
A manifest must reference runnable output, not assume TypeScript runs directly in Node.
A few static host descriptors are sufficient; use generation only if it solves actual drift.
The shared runtime must not require a separate hosted deployment for a local installation.

## Installation completeness

Document runtime prerequisites, dependency installation/build where needed, and credential setup.
The selected TypeSafe JavaScript SDK documentation currently requires Node.js 20+. [S08]
Use the installed packages' requirements when choosing and recording a supported runtime.

Test from the location the host actually loads, including a copied/cached plugin where applicable.
Required assets and dependencies must resolve there without relying on a developer's working directory.
Use the host's documented local development/install path and record the tested host version.
Describe how the user discovers and explicitly invokes the skill after installation.
Test natural-language standing instructions in the same installed environment.

Public directory publication is a separate distribution decision.
Local installability satisfies the current handoff; adding hosted infrastructure for public
submission is an optional expansion, described in [proposals](05-design-proposals.md).
Document that the evaluator sends the supplied state/questions to TypeSafe as ordinary API use.
This requires a clear setup description, not a new consent or privacy-management workflow.

## Setup errors

A missing runtime dependency should identify the setup step that resolves it.
A missing key should identify the credential and where to configure it.
Treat a host invocation problem separately from a TypeSafe evaluation error.
No setup wizard, remote health service, or background supervisor is needed for this workflow.
