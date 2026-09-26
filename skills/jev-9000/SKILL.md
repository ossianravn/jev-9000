---
name: jev-9000
description: Consult Jev to check propositions, compare alternatives, and assess trade-offs during the current task. Use when the user asks for Jev or JEV 9000, defines areas for consultation, or gives standing instructions to seek Jev's judgment when useful.
---

# JEV 9000

Consult TypeSafe's Jev through `jev_evaluate`, then use its typed judgment to
continue the user's task. Follow the user's current scope and later changes.
Direct requests and standing instructions both authorize consultation within
that scope; use the host's normal permissions.

## Frame and evaluate

1. Start from the user's goal, priorities, and relevant context already available.
   Gather missing evidence with your usual tools when needed. Send the actual
   relevant content: Jev cannot read a repository path or URL by itself.
2. Supply `state` as text or structured JSON. Describe material assumptions as
   assumptions and alternatives comparably. A simple question needs no formal
   brief, mandatory evidence form, or score matrix.
3. Put complete question meaning in `instructions`; IDs only match answers to
   questions. Structured instructions and criteria are supported. Reference
   relevant state fields explicitly when several subjects are present.
4. Call `jev_evaluate` with `state`, a `questions` map, and optionally `model`.
   Use the configured model unless the task requires an override.

| Need | Question shape | Meaning |
| --- | --- | --- |
| Check a proposition | `type: "noul"`, instructions, optional true/false criteria | Probability of yes; no separate confidence |
| Select an alternative | `type: "choice"`, instructions, option-to-description criteria map | Relative distribution and chosen option |
| Assess degree | `type: "score"`, instructions, ordered criteria array | Expected rubric index on 0 through n−1 |

Use concrete Score levels with clear direction. Reuse the same rubric when
comparing candidates on one dimension. Include a no-match option only when it
belongs to the actual answer space. Keep the caller's valid options intact.

Batch independent questions over shared state when useful, including mixed
types. They cannot see each other's answers. A dependent follow-up needs a new
evaluation containing the earlier answer or updated evidence. Consult again
when the context, priorities, or question changes; no fixed call budget applies.
Avoid rephrasing an unchanged question repeatedly to obtain a preferred answer.

## Interpret and continue

Explain the relevant result and next action at the detail the user needs.
Attribute typed judgments to Jev and explanatory synthesis to yourself: Jev
does not return generated reasons to quote. For pros and cons, use the supplied
context and optionally assess independently useful claims or dimensions.

Keep proposition probability, relative choice probability, and rubric score
distinct. Choice/Score confidence measures distribution concentration, not
project success or permission to act. Preserve access to raw results without
forcing every value into the reply. Use weights only when the user supplies
them; otherwise reason from their stated priorities.

Treat disagreement or ambiguity as information. Choose, investigate, or ask
according to the task and user instructions, without a fixed confidence gate.
Continue the task after explaining what the consultation changes or supports.

If the tool fails, say Jev was unavailable and report the actionable error.
Correct setup/input or continue according to the user's instructions. Never
substitute a simulated answer or present your own judgment as Jev's result.
