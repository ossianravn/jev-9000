# Evaluation boundary

**Responsibility:** Preserve TypeSafe's evaluation semantics across the callable integration.
**Status:** D03, D04, D06; external contract facts are identified below.
**Sources:** [S02–S09, S17–S19](06-source-notes.md).

## Native request

**F:** TypeSafe's evaluation endpoint is `POST https://api.typesafe.ai/v1/systemone`.
It uses bearer authentication and JSON. The payload carries `state`, `questions`, and `model`.
The SDK can resolve an omitted model before sending the HTTP request. [S02, S08, S09]

Expose these concepts through the chosen callable interface:

| Field | Meaning |
| --- | --- |
| `state` | The context for this evaluation, preserving its supported text/JSON shape. |
| `questions` | A nonempty map of caller-selected IDs to native typed questions. |
| `model` | An optional override at the integration boundary; otherwise use configured SDK behavior. |

Retain user-supplied question IDs, option keys, criteria ordering, and structured values.
Question IDs connect requests and answers; their wording is not part of Jev's inference. [S02]
The runtime supplies no hidden options, weights, instructions, or extra evaluation questions.

The suggested MCP tool name `jev_evaluate` is P02, not a required public identifier.
Input field names matching the native API are the simplest reference design.
An equivalent interface must preserve these capabilities and meanings.

## Question and answer mapping

| Type | Question | Successful answer |
| --- | --- | --- |
| Noul | `type: "noul"`, instructions, optional true/false criteria. | `type`, `noul`. |
| Choice | `type: "choice"`, instructions, an option-to-description criteria map. | `type`, `choice`, `probabilities`, `confidence`. |
| Score | `type: "score"`, instructions, an ordered criteria array. | `type`, `score`, `legend`, `probabilities`, `confidence`. |

**F:** Noul's numeric result expresses probability of yes.
Choice supplies an alternative distribution; Score supplies a distribution over rubric levels.
With n Score levels, the score is the probability-weighted level index on 0 through n−1.
Confidence on Choice/Score summarizes distribution concentration. [S03–S06]

**F:** Instructions and criterion descriptions can contain structure, including nested JSON.
Do not flatten them to strings or narrow them to labels for the convenience of the adapter.
Preserve structured Score legends as returned rather than forcing every value to be text. [S07, S09]

## A documented SDK/API difference

The HTTP reference describes required, non-null instructions and text/object/array state.
The linked SDK v0.6.0 types allow nullable state, optional/nullable instructions,
and nullable criterion descriptions; its request method forwards these values. [S02, S09, S19]

Write explicit instructions in normal agent-generated requests.
At the boundary, mirror the selected SDK's supported shapes rather than silently tightening them.
For an SDK-accepted shape whose service acceptance is uncertain, preserve it and return the
service's validation response if rejected; do not invent a plugin-specific rejection rule.
Document the installed SDK version and cover the difference with a focused transport test.
A live check is evidence of service acceptance; a type or mock test is evidence of forwarding only.

## Validation

Validate the chosen tool's input shape and use the SDK's question validation where available.
Reject malformed data with a field-specific message that the agent can correct.
Reuse schema/type definitions where practical, instead of creating competing validation layers.

**F:** The current API documents up to 255 Choice options and 2–10 Score levels.
These are provider constraints, not new product limits. [S02–S05]
Keep provider validation current; no smaller plugin limits are required.
Do not add question-count caps, context-length caps, minimum evidence fields, or domain filters.
A simple state string and a single meaningful question are legitimate ordinary inputs.

## Result

Return the native `model`, `answers`, and `usage` fields without changing their meanings.
Preserve all answer fields and numeric precision at the integration boundary.
Let the agent format values for the user; formatting must not alter the underlying result.
Do not add a synthetic overall confidence, eligibility verdict, or approval status.

Check that a successful response has the expected envelope and matching typed answers.
Handle a missing or mismatched answer as an integration error rather than reporting success.
Keep this check focused on data the agent needs; no separate auditing subsystem is necessary.

For an MCP implementation, use the protocol's normal tool-result envelope.
Return the evaluation in `structuredContent` and a serialized JSON text content block
for hosts that consume tool text. Follow the installed MCP SDK's protocol conventions. [S17]
This is packaging of the same result, not a second evaluation.

## Credentials and model configuration

Use the SDK's normal runtime credential setup; its JavaScript SDK reads `TYPESAFE_API_KEY`.
Credentials belong in host/runtime configuration, not question state or committed manifests.
Document which process needs the environment variable and how the tested host passes it.
Do not claim that setting it in an unrelated shell configures a running desktop host. [S08, S09]

**F:** The JavaScript SDK uses `TYPESAFE_DEFAULT_MODEL` and otherwise `jev-latest`.
An explicit per-call model overrides the default; responses identify the resolved model. [S09, S10]
Reuse that behavior rather than inventing a model-selection subsystem or mandatory pinning rule.

## Ordinary failures and transport

Cover missing/invalid credentials, invalid input, service failure, and transport failure.
Return a concise error identifying the source and corrective action when known.
Preserve an upstream status or request identifier when available and useful.
Keep the credential value out of error text.

For MCP, execution failures use `isError: true`; protocol validation follows the MCP SDK. [S17]
A failed call has no fabricated answers or usage values.
For an SDK-backed implementation, use its existing retry and timeout behavior.
Keep transport recovery in the selected library; avoid an additional retry or operations subsystem.
Pass host cancellation through where the selected SDKs already support it. [S09, S19]
For stdio, keep diagnostic output off stdout so it does not corrupt protocol messages. [S18]

See [request examples](07-request-examples.md) and [verification](04-verification-and-delivery.md).
