# Agent behavior

**Responsibility:** Define the consultation workflow taught to the host agent.
**Status:** Derived behavior for D01, D02, D03, and D05.
**References:** [S01, S03–S07, S14, S16](06-source-notes.md).

## Invocation

Support these user-described interactions through the host's normal skill/tool mechanisms:

**Direct:** “Ask Jev which of A, B, and C fits this feature.”

**Scoped:** “Use Jev for database and API design decisions in this project.”

**Discretionary:** “You have Jev available for probability checks and decision hints.
Use it when a second opinion would help.”

The agent follows the user's current instruction, including later changes to the scope.
Standing instructions use the host's existing conversation or project-instruction facilities.
The plugin does not need its own preferences store to support them.

Make the capability discoverable to both the user and the agent.
Describe the actual uses early in the skill description: checks, choices, and trade-offs.
Implicit skill selection remains the host's behavior; test it with representative prompts.
Keep direct invocation available as a reliable way to request consultation.

## Frame a useful question

Start with the user's task and use relevant context already available to the agent.
Gather additional information through the agent's usual tools when the question needs it.
Give alternatives comparable descriptions and preserve the user's priorities.
Describe assumptions as assumptions when they materially affect the judgment.

State may be a simple passage or a structured object.
Useful object fields can include goal, alternatives, requirements, observations, and unknowns.
These fields are examples, not a mandatory decision-brief schema.
An ordinary consultation does not require citations, weights, or a completed evidence checklist.

Put the full question meaning in instructions; question IDs only identify returned answers.
Reference the relevant state fields explicitly when the state contains several subjects.
Structured instructions and criteria can carry definitions, examples, and option descriptions.
Supply the needed content, rather than assuming a path or URL alone gives Jev access to it.

Prefer the smallest useful formulation.
A clear A/B/C decision can be a single Choice.
Separate dimensions when the user needs their individual judgments or the overall question
would otherwise depend on several unrelated judgments.
This is question-writing guidance, not a runtime eligibility test.

## Choose the primitive

| Need | Use | Interpretation |
| --- | --- | --- |
| Check whether a proposition holds | Noul | Estimated probability of yes for that proposition. |
| Choose among described alternatives | Choice | Relative distribution and selected alternative. |
| Assess degree under an ordered rubric | Score | Position on the supplied levels and their distribution. |

Noul has no separate confidence field.
Choice and Score confidence describe distribution concentration.
Score uses the level indices; retain the rubric so the number remains interpretable.
See [the evaluation contract](02-evaluation-contract.md) for the exact fields.

Describe meaningful Score levels and keep their direction clear.
For comparisons, use the same rubric across candidates on the same dimension.
A score for operational burden and a score for suitability remain separate quantities.

Include a no-match or uncertain alternative when it is part of the question's real answer space.
Do not inject such an option into every Choice or force a separate suitability check every time.
A caller's valid options remain intact through the runtime.

## Batch and follow up

Ask independent questions about the same state together when useful.
Questions in that batch cannot see each other's answers.
If a later question actually depends on an earlier answer, use a subsequent evaluation
with that answer or the newly gathered information in its state.

The agent may consult again when the task, evidence, priorities, or question changes.
There is no plugin-imposed call count, decision budget, or mandatory second round.
Use the host's normal task flow to determine the next useful step.

## Interpret and continue

Use Jev's returned answer as an input to the current task.
Explain the relevant result, the considerations that matter, and the chosen next step.
The amount of explanation should match the user's request.
A short question may receive a short answer; a comparison may use a small table.
Raw distributions remain available to the agent without forcing every value into the reply.

For “for and against,” the agent identifies relevant considerations from the supplied context.
It may ask Jev to assess individual claims or dimensions, then synthesizes the explanation.
Attribute the typed judgments to Jev and the explanatory synthesis to the agent.
Jev's output does not contain a generated explanation to quote.

Keep probability, relative preference, and rubric score distinct in the explanation.
Do not turn a Choice probability or an aggregate score into a chance of project success.
When the user supplies weights, the agent can use ordinary calculation tools to combine scores.
Otherwise, explain the trade-off using the stated priorities; no hidden default weights are needed.
The integration does not need a general-purpose ranking or weighting subsystem.

Material disagreement is useful information to explain, not a reason for a fixed approval gate.
Consider whether it changes the approach or points to a useful test or missing fact.
Do not repeatedly rephrase an unchanged question merely to obtain a preferred answer.

If a successful response leaves the decision ambiguous, explain that in context.
Choose, investigate, or ask the user according to the actual task and their instructions.
No fixed confidence cutoff determines whether the agent may continue.

## Ordinary failure

When evaluation fails, state that Jev was unavailable and give the actionable error.
Use the user's task instructions to decide how to continue; do not substitute a fabricated Jev result.
Missing setup should produce a clear setup instruction rather than a long troubleshooting ritual.

## Illustrative skill description

> Consult Jev during your current task to check propositions, compare alternatives,
> and assess trade-offs. Use when the user asks for Jev or instructs you to seek
> another judgment in relevant areas. Frame the question from available context,
> call the evaluation capability, and use the typed answer to continue the work.

Adapt wording to the chosen host skill format; preserve the behavior above.
