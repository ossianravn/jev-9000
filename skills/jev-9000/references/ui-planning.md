# UI planning and component selection

Use Jev to help decide what an interface should contain or how it should be
arranged. The agent supplies candidates and implements the resulting design;
Jev returns the native judgments described in the parent skill.

## Establish the experience

1. Identify the audience, their task, what they already know, and the information
   and actions they need next. Establish whether the user wants a plan, a working
   UI, or improvements to an existing screen. Preserve explicit requirements as
   fixed context rather than making them optional inclusion questions.
2. Inspect relevant screens, components, design conventions, data, and actions.
   For existing UI, describe the current experience and the proposed change.
   Distinguish observed capabilities from assumptions and proposed additions.
   When a missing capability affects the goal, surface it and resolve it within
   the user's scope; an existing catalogue is not the limit of possible designs.

## Prepare and evaluate candidates

3. Describe concrete candidates with stable identifiers and enough meaning for
   the decision: purpose, displayed content, interaction, relevant configuration,
   and data/action availability. Identify dependencies and mutually exclusive
   alternatives. Send the relevant facts, not just component names or file paths.
   Supply labels or content where their meaning affects the choice; Jev chooses
   among supplied possibilities and does not write missing copy or properties.
4. Ask only the judgments useful to this decision:
   - Noul for whether an optional candidate would materially help the audience
     accomplish the stated task. Batch independent inclusion questions.
   - Choice for competing patterns or complete arrangements, describing their
     content and trade-offs comparably.
   - Score when a defined dimension needs assessment, with concrete rubric levels.
   Include required content and relevant relationships in state. If a layout
   question depends on the selected content, frame it after selection using the
   updated plan; a batch's questions cannot use one another's answers.

## Compose and continue

5. Interpret the results in context using the parent skill's probability guidance.
   Assemble a coherent screen: reconcile duplication, dependencies, hierarchy,
   and available actions. Review the complete path from the audience's starting
   state to an observable outcome, including relevant empty, loading, error, and
   success states. Several positive inclusion judgments alone do not establish
   a complete design. Consult again only for a useful unresolved decision.
6. For a plan, deliver the proposed structure, components, interactions, and
   material open questions, explaining what Jev's judgments influenced. For a
   build or improvement, continue into ordinary project implementation and
   focused verification, including browser interaction where available and
   relevant. State what was actually verified; a selection result is not a
   rendered or tested interface. Follow the user's requested stopping point.

## Example: invoice follow-up

A freelancer needs to find overdue invoices and follow up with customers.
The project already has an invoice table and a single-invoice reminder action.
The table is required. Optional candidates include an overdue filter and a
monthly revenue chart; describe what each shows and how it supports the task.
Compare a compact summary row with summary cards only if that choice matters.

Give Jev those facts and concrete options. The agent then composes the screen,
connects the reminder action to the relevant invoice, and accounts for sending,
failure, and confirmation. A proposed bulk reminder needs its own supported
action; choosing a component does not create that capability. The final plan's
explanation belongs to the agent, with Jev's typed judgments attributed separately.
