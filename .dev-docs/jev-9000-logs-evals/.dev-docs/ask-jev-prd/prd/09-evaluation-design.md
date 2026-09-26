# Appendix B — Evaluation design and interpretation

**Responsibility:** Determine intended use and improvement in the resulting work.
**Status:** D10–D12; optional diagnostics are explicitly identified.
**Related:** [Evidence](08-logs-and-usage.md), [cases/acceptance](10-eval-cases-and-acceptance.md).

## Evaluate separate questions

| Question | Evidence and grading |
| --- | --- |
| Did the agent consult when intended? | Instructions, tool availability, and actual call trace. |
| Was the consultation well formed and used correctly? | State/questions, answer, and subsequent visible behavior. |
| Did the plugin improve the work? | Matched task outcomes/artifacts with and without the plugin. |
| What overhead accompanied it? | Whole-task duration, host usage, Jev usage, failures, and calls. |

Integration tests remain the evidence for wire correctness. A successful API
response or an agent saying the advice helped does not establish output improvement.

## Primary comparison — D10

Compare the same representative task under:

**Baseline:** the usual host agent, with JEV 9000's skill and evaluator absent.
**Treatment:** the same host/model/environment, with the installed JEV 9000
plugin and the scoped/discretionary instructions being evaluated.

The business task and evidence remain the same. Record the exact differing
plugin-related instruction/configuration as the intervention. Verify the actual
loaded configuration: telling an agent to ignore an installed plugin is a weaker control.

Use neutral task prompts for this quality comparison. Direct “Ask Jev” prompts
belong in invocation tests; a tool-less baseline cannot satisfy that instruction.
If deriving a quality case from such a request, save the prespecified neutral task
and the separate plugin instruction. Preserve every substantive task requirement.

Run the actual installed skill/tool through each host. A replacement API-only
agent loop measures that replacement rather than the Codex/Claude plugin.
Start each trial from the same fixture/repository snapshot and a fresh session.
Keep prior outputs, grades, and other arms' transcripts outside the task workspace.
Match other tools, permissions, and model/effort settings across the pair.
Record unavoidable differences and distinguish hosts in the results.

Keep model, runtime, skill, fixture, and grader identities with each run. Resolve
moving model aliases in the evidence. For a comparison, use fixed available versions
where possible; this is experimental control, not a change to the product's defaults.

Counterbalance or randomize arm order. Repeat whole trials to observe variability
when assessing improvement; choose repetition based on the decision and observed
variation, with no fixed trial count or success target imposed by this PRD.
Store every attempt and its pair/task identity; never select only the best run.
An initial wiring demonstration is identified as a pilot, not a performance claim.

Include all treatment tasks in the primary result, including those that never
call Jev. Comparing only called tasks selects a different population and can
make the plugin appear more useful or less useful than it is.

## Optional framing comparison — P-LE2

When the primary comparison leaves attribution unclear, add a diagnostic arm:
the agent gets the equivalent question-framing guidance but no Jev tool/results.
Preserve the actual prompt as its own versioned intervention.

Baseline versus full plugin measures the deployed package's effect. Framing-only
versus full plugin estimates the additional benefit of access to Jev under those
instructions. This is a diagnostic extension, not a prerequisite for initial delivery.

## Intended-use labels — D11

Define expected behavior from the actual user instruction before inspecting results.

| Label | Grading meaning |
| --- | --- |
| Required | A direct request or applicable mandatory standing instruction calls for consultation. |
| Permitted | Discretion is granted; either using or skipping can be reasonable. |
| Out of scope | The current user instruction excludes consultation for this task. |
| Unknown | Instructions, availability, or trace evidence do not support a verdict. |

“Use Jev when helpful” is permitted use, not an instruction to call on every task.
A no-call discretionary task is not automatically a miss. A routine task is not
a prohibited consultation unless the user instruction establishes that boundary.
An invocation counts only if it addresses the relevant task at the relevant time;
a token or irrelevant call does not fulfill an explicit consultation request.

Report required-call fulfillment over assessable required-use opportunities,
and out-of-scope calling over assessable excluded opportunities. State numerators
and denominators. Separate setup/availability failures from agent omission.
For discretionary tasks, review appropriateness with reasons and evidence rather
than inventing a target invocation rate or a binary ground truth after the fact.

Assess question/result use through a small rubric tied to the existing skill:
- State and alternatives represent the task fairly, with material facts present.
- The primitive and criteria match the question; batched questions are independent.
- The explanation preserves the meaning of probabilities/scores and uses the evidence.
- The agent follows through on the task in a way consistent with the user's priorities.

These checks judge observable behavior, not an exact wording or tool-call sequence.
A simple Choice can satisfy the task. Extra questions are not inherently better.
Following Jev is not automatically correct; disagreement is not automatically failure.
Only describe a changed decision when a preceding disposition is actually visible.
Otherwise record observed alignment, disagreement, or unknown influence.

## Final-outcome grading — D11

Prefer executable checks of the resulting artifact where the task permits them:
required behavior, preserved existing behavior, and the task's explicit constraints.
Keep grader tests outside agent-editable outputs and save their results.
Do not accept “tests passed” in the agent response in place of running the checks.

For design choices or explanations, use task-specific human review or a separate
rubric-based judge. Grade goal/constraint fit, evidence-supported trade-offs, and
whether the proposed next step or delivered work solves the task.
Accept multiple valid approaches. Avoid rewarding length, confident language,
more Jev calls, or agreement with Jev as proxies for quality.

For pairwise judging, hide treatment labels, randomize answer order, and allow
A-better, B-better, tie, and unjudgeable. Include artifacts and relevant evidence,
not just polished final prose. Record the rubric, judge identity, evidence, and result.
Validate automated judgments against human labels on relevant examples and
inspect disagreements. Human review can serve as the initial grader.
Use independent task criteria; Jev's own recommendation is not the ground-truth label.

## Report the effect — D12

For binary task outcomes, show the paired table: both pass, baseline-only pass
(regression), treatment-only pass (repair), and both fail. Include counts.
With one observation per matched task, the outcome-rate difference is:
`(repairs - regressions) / matched_tasks`.
With repeated trials, first summarize within task; keep tasks equally weighted
unless a different weighting was specified before running the experiment.

Report task counts, attempts, task families, versions, and the evaluated scope.
Show wins/losses/ties/unjudgeable for qualitative paired judgments separately.
When presenting an inferential estimate, include uncertainty using a method that
keeps repeated observations grouped by task, such as paired task-level resampling.
For an exploratory small set, report descriptive findings and their uncertainty
without asserting a population-wide improvement or inventing a release threshold.

Retain incomplete and failed trials. Distinguish agent/task failure, Jev availability
failure, and an experiment that never ran because its environment/authentication failed.
Report whole-workflow reliability alongside results for completed, assessable pairs;
explain exclusions and unpaired runs. A service failure during a task is part of
observed plugin behavior, not a reason to silently discard the task.

## Overhead and diagnostic interpretation

Report whole-task elapsed time and host/provider usage separately. Call latency
alone omits framing and follow-up work. Keep cached/uncached usage semantics intact;
avoid double-counting cumulative usage when sessions are resumed.
If prices are supplied, save their source/date and identify costs as estimates.
Without prices or complete host usage, report the available quantities and gaps.

Production logs supply representative examples and debugging evidence. Called
sessions alone do not establish a causal benefit: agents select when to consult.
For an individual failure, inspect whether the source was framing/missing context,
a Jev judgment, interpretation, execution, or unavailable service/evidence.
These are diagnoses with trace references, not permanent domain restrictions.

Optional calibration diagnostics apply only when independent labels exist.
For binary Noul judgments, Brier error is the mean of `(probability - label)^2`.
Choice accuracy needs a defensible acceptable-option label; subjective alternatives
may have several valid answers. Score evaluation needs the original rubric.
Never treat concentration-based confidence as an observed task-success probability.
Component calibration does not replace the end-to-end comparison.
