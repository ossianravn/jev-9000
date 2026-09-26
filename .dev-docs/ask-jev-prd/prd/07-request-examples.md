# Request examples

**Responsibility:** Show useful question shapes without prescribing a universal template.
**Status:** Illustrations for D02–D04, not extra requirements or live Jev results.
**Sources:** [S02–S05, S07–S09](06-source-notes.md).

These examples use native evaluation payload fields.
A proposed SDK-backed tool may omit `model` and use the configured default.
Names, alternatives, rubrics, and numbers are example content, not plugin limits.

## A — Check a proposition with Noul

The agent already has a description of the feature requirement and a proposed approach.
It wants a focused check of how the described behavior fits the requirement.

```json
{
  "model": "jev-latest",
  "state": {
    "requirement": "Imports should continue when the browser tab closes.",
    "proposal": "Closing the tab cancels its HTTP request and stops the import."
  },
  "questions": {
    "continuation": {
      "type": "noul",
      "instructions": "Does `proposal` satisfy the continuation behavior in `requirement`?",
      "criteria": {
        "true": "Import processing continues after the tab closes.",
        "false": "Closing the tab can stop import processing."
      }
    }
  }
}
```

The answer is about the supplied descriptions. It is not evidence that code was executed.
This does not prevent the agent from also using a test when that would help the task.

## B — Choose among structured alternatives

The request contains enough context for a useful bounded choice.
There is no mandatory score matrix or secondary suitability question.

```json
{
  "model": "jev-latest",
  "state": {
    "goal": "Run imports after users leave the page.",
    "project": "The app already has a persistent job runner with retries.",
    "priority": "Reuse existing infrastructure when it meets the goal."
  },
  "questions": {
    "approach": {
      "type": "choice",
      "instructions": {
        "task": "Choose the approach that best fits `goal`, `project`, and `priority`.",
        "basis": "Assess the alternatives as described."
      },
      "criteria": {
        "A": {
          "approach": "Run imports in the browser tab.",
          "lifecycle": "Work stops when the tab closes."
        },
        "B": {
          "approach": "Add an import job to the existing persistent runner.",
          "lifecycle": "Server-side jobs continue independently of the tab."
        },
        "C": {
          "approach": "Introduce another persistent queue service for imports.",
          "lifecycle": "Server-side jobs continue independently of the tab."
        }
      }
    }
  }
}
```

The agent reports the returned choice and uses the task context to explain the recommendation.
A Choice distribution compares these supplied alternatives.

## C — Batch a degree assessment and a separate check

Both questions use the same state and are independent.
The second question cannot use the first question's result in this request.

```json
{
  "model": "jev-latest",
  "state": {
    "proposal": "Introduce a new queue service with a new deployment and alerting setup.",
    "existing_setup": "The team operates the app and its existing job runner."
  },
  "questions": {
    "operating_change": {
      "type": "score",
      "instructions": "Assess the additional operating work in `proposal` relative to `existing_setup`.",
      "criteria": [
        "Fits the existing operating setup without additional responsibilities.",
        "Adds configuration and monitoring within an existing component.",
        "Adds a service with its own deployment and monitoring responsibilities."
      ]
    },
    "new_service": {
      "type": "noul",
      "instructions": "Does `proposal` add a service beyond `existing_setup`?"
    }
  }
}
```

Here the Score uses level indices 0–2 because this example defines three levels.
That range belongs to this rubric; it is not a probability or a universal scoring range.
To compare another proposal on operating work, reuse this rubric with that proposal's context.
Add independent Choice questions to the same batch when the task also needs them.

## Response fixtures for tests

Create clearly labelled simulated fixtures in the implementation's tests.
Include the native answer fields, resolved model, and usage described in the contract.
Tests should assert faithful handling of the fixture rather than a live model's exact numbers.
Do not show fixture probabilities as measured performance or actual Jev responses.
