# Product outcome and scope

**Responsibility:** Define what the user is getting and which requirements are confirmed.
**Read next:** [Agent behavior](01-agent-behavior.md).

## Outcome

Ask Jev lets an agent obtain a useful additional judgment while working on a task.
The user can ask for a consultation directly, specify areas where the agent should consult,
or tell the agent to use Jev when another judgment would help.
The agent uses the answer to compare choices, check a proposition, or understand trade-offs,
and then continues the user's task.

The user should be able to say:

> I'm building this feature. Should I use A, B, or C? Ask Jev.

The completed workflow gives the agent usable results and the user a relevant explanation.
The user does not need to learn TypeSafe's API to get that outcome.

## Confirmed requirements

| ID | Requirement from the conversation |
| --- | --- |
| C01 | Use Jev from TypeSafe to help the agent make decisions and weigh considerations. |
| C02 | Support direct consultation and agent use guided by user instructions, including scoped areas. |
| C03 | Follow the plugin standards for Codex and Claude; this handoff targets Claude Code as discussed. |
| C04 | Understand and correctly use the current request types, documentation, and official skill. |
| C05 | Split the PRD by responsibility; each PRD file is at most 220 lines. |
| C06 | Keep implementation modular throughout; each code file is at most 300 LoC. |
| C07 | Build the smallest complete, simple, functional workflow. |
| C08 | Add no speculative limits, approval steps, privacy workflows, quotas, or operational subsystems. |
| C09 | Separate confirmed requirements and proposals; unapproved proposals are not requirements. |
| C10 | Every proposed restriction must state its concrete problem, ordinary-use effect, and user decision. |

“For Codex” identifies the implementation audience, continuing the two product targets.
Public marketplace publication, hosted deployment, and other Claude surfaces were not requested.
The package does not assume them as dependencies of completion.

## Derived functional requirements

These make C01–C04 operational rather than adding a new product policy.

| ID | Required behavior | Basis |
| --- | --- | --- |
| D01 | Make consultation discoverable and usable explicitly or under standing instructions. | C01–C03 |
| D02 | Prepare useful state and questions from the agent's current task and context. | C01, C04 |
| D03 | Support Noul, Choice, Score, and mixed independent questions over shared state. | C01, C04 |
| D04 | Send a real TypeSafe evaluation and preserve its typed answers and returned metadata. | C01, C04 |
| D05 | Let the agent explain the relevant trade-offs and use the result in its ongoing work. | C01, C02 |
| D06 | Make normal setup and service failures understandable and recoverable. | C07 |
| D07 | Deliver runnable plugin integration for both target hosts with usable setup instructions. | C03, C07 |

## Smallest complete workflow

1. The agent recognizes a direct request or a relevant standing instruction.
2. It formulates the question and supplies the context needed for that question.
3. The integration sends the evaluation to TypeSafe and receives the native answer.
4. The agent interprets the result in relation to the user's task.
5. It explains what matters and continues, or asks for genuinely missing task information.

This describes the happy path, not a cap on questions, API calls, or follow-up consultations.
A simple choice may need only one Choice question.
A trade-off discussion may benefit from several independent judgments.

## Responsibility split

| Component | Owns |
| --- | --- |
| Agent instructions | When consultation helps; preparing questions; interpreting and explaining answers. |
| Evaluation integration | Accepting supported inputs; calling TypeSafe; returning answers or errors. |
| Host package | Discovery, invocation, runtime wiring, and installation instructions. |
| Verification | Evidence that the complete path works and stays within the requested file limits. |

## Completion boundary

A user can install/configure the plugin in a target host, request a consultation,
receive an answer from Jev, and see the agent use it in the task.
Both host targets have their installation and invocation path checked.
Acceptance scenarios in [verification](04-verification-and-delivery.md) cover the behavior.

Keep additional product ideas in [the proposal register](05-design-proposals.md).
Examples in this PRD are test and writing aids, not an exhaustive list of permitted uses.
