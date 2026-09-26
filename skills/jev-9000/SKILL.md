---
name: jev-9000
description: Consult Jev for proposition checks, choices, trade-offs, and skill selection during the current task. Use when the user requests Jev or JEV 9000, scopes consultation, or gives standing instructions to seek its judgment when useful.
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

## Select relevant skills

When the user asks Jev to help choose skills, or skill selection falls within
their consultation scope:

1. Gather the task, intended outcome, current stage, and constraints. Identify
   available candidates from the host's skill catalogue, preserving their names
   and descriptions. Include known prerequisites or exclusions that affect fit.
   Treat skills explicitly requested or required by applicable instructions as
   fixed context; their use does not depend on Jev's relevance judgment.
2. Batch one Noul per candidate whose relevance needs assessment. In each
   question's instructions, identify the candidate and ask whether using its
   described workflow would materially help with this task at the current stage.
   Supply its actual description in state or instructions; a name/path alone
   does not establish what the skill does.
3. Use these probabilities with the task context to select useful skills;
   several or no optional skills may fit. Apply no fixed probability cutoff.
   Use Choice only when the decision calls for one among competing alternatives.
4. Read the selected SKILL.md files through the host's normal loading mechanism,
   follow their applicable instructions, and continue the task. Resolve an
   unclear or misleading catalogue description against the actual skill before
   applying it. Briefly explain a material selection; selection alone is not
   completion of the user's task.

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
