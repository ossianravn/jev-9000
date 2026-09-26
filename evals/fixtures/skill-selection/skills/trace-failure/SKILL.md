---
name: trace-failure
description: Diagnose asynchronous failures by following stored state across a failed call and the next attempt.
---

Inspect the implementation. Trace what is stored before a fetch, after its
rejection, and when the caller tries again. Identify whether the fetcher runs
again. Ground the diagnosis in those transitions and suggest the smallest fix
that preserves unrelated in-flight work. Distinguish inspection from execution.
