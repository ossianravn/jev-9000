# JEV 9000

Consult TypeSafe's Jev from Codex or Claude Code while working on a task.
The coding agent supplies context and questions, receives typed judgments,
explains what matters, and continues the work.

## Build and configure

Use Node.js 22.18 or newer.

```sh
npm ci
npm run build
```

Copy `.env.example` to `.env` and set `TYPESAFE_API_KEY` and `TYPESAFE_MODEL`.
An existing `.env` can be used directly. Keep it out of version control.

The runtime reads `.env` relative to the plugin root, independent of the working
directory. Existing process environment variables take precedence. For an
installed or cached copy, configure `JEV_9000_ENV_FILE` with an absolute path to
your original `.env`, or provide the TypeSafe variables in the MCP process's
environment. The native MCP server configuration's `env` map can hold that path:

```json
"env": { "JEV_9000_ENV_FILE": "C:/path/to/jev-9000/.env" }
```

Set it on the `jev-9000` server in `mcp.json` for Codex, or `.mcp.json` for Claude
Code, in your local install source. This stores a path, not a credential. Restart
the host after changing process environment or configuration. Setting a variable
in an unrelated terminal does not configure an already-running desktop app.

Model precedence: per-call `model`, `TYPESAFE_DEFAULT_MODEL`, `TYPESAFE_MODEL`,
then the SDK default `jev-latest`. Results include the resolved model.
The supplied state and questions are sent to TypeSafe's API.

## Codex

The package includes a portable `plugin.json` and `mcp.json`, plus a Codex
compatibility manifest. Build before copying or installing. The installed
package needs the root manifests, `.codex-plugin/`, `skills/`, and `dist/`.
The bundled `dist/server.mjs` includes its dependencies; installed copies need
Node.js but do not need their own `node_modules` or a hosted service.

Add the package to a normal local/personal Codex marketplace and install it:

```sh
codex plugin add jev-9000@YOUR_MARKETPLACE
```

Start a new chat to pick up the skill and MCP tool. Invoke `$jev-9000`, select
JEV 9000 from the skills/plugins UI, or say “Ask Jev which approach fits best.”
This build's local installation is recorded in `.dev-docs/IMPLEMENTATION.md`.
On this machine it is already installed as `jev-9000@local-personal` and
configured to read the workspace's existing `.env`.

## Claude Code

Load the complete built plugin through Claude Code's local development path:

```sh
claude --plugin-dir /absolute/path/to/jev-9000
```

The package's `.claude-plugin/plugin.json`, `.mcp.json`, `skills/`, and `dist/`
must remain together. Use `/jev-9000:jev-9000` for explicit invocation, or ask
for Jev in ordinary language. Both explicit and model-initiated use are enabled.
`--plugin-dir` loads the plugin for that session; it is not a persistent
marketplace installation.

The checked local copy is `C:/Users/Ossian/plugins/jev-9000`. Claude can connect
to its MCP server. Its OAuth session needs `claude auth login` before a complete
agent conversation can be verified.

## Use

- “Ask Jev whether this proposal meets the requirement.”
- “Ask Jev which of A, B, and C fits the existing system.”
- “Use Jev for database and API design decisions in this project.”
- “Use Jev when another judgment would help.”

The `jev_evaluate` tool accepts `state`, a nonempty map of `questions`, and an
optional `model`. It supports Noul, Choice, Score, structured descriptions,
and mixed independent questions. A dependent follow-up includes the earlier
result in a subsequent request. No plugin-specific consultation budget applies.

Jev supplies judgments, not generated explanations. The agent owns explanatory
synthesis. Choice probabilities compare the supplied alternatives; Score values
use the supplied rubric. Neither is a project-success probability.

## Verification

```sh
npm run check
npm test
npm run build
npm run smoke
npm run smoke -- --mode mixed
```

The eight deterministic tests use the real SDK with a simulated HTTP transport;
they protect request/result fidelity, failures, cancellation, and configuration.
The smoke commands make real API calls. They check MCP discovery and evaluation
from an unrelated working directory, not actual Codex/Claude agent behavior.

Check a copied package with `--root /installed/plugin --env /source/.env`.
Add `--host claude` to use the native Claude MCP manifest.
`--mode compat` probes nullable state/instructions: on the checked service this
returns HTTP 422 and exits unsuccessfully. The adapter preserves SDK-supported
input; it does not replace the upstream validation response with a new policy.

See `.dev-docs/IMPLEMENTATION.md` for actual host runs, versions, and evidence.
