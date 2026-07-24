# optimize.md

> **Purpose**
>
> Improve performance, efficiency, and maintainability without changing application behavior.

## Objective

Optimize only where measurable benefits exist.

Avoid premature optimization.

---

## Focus Areas

Consider:

* Performance
* Memory usage
* Database queries
* API latency
* AI token usage
* OCR processing time
* Code duplication

---

## Rules

* Measure before optimizing.
* Preserve existing behavior.
* Optimize the bottleneck, not everything.
* Prefer simple solutions.
* Avoid unnecessary complexity.
* Keep readability high.

---

## AI Optimization

Prioritize:

```text
Database

↓

Rule Engine

↓

Cache

↓

AI
```

Reduce:

* API calls
* Token usage
* Duplicate prompts
* Unnecessary context loading

---

## Deliver

Report:

* Bottleneck identified
* Optimization applied
* Expected improvement
* Trade-offs (if any)

---

## Success Criteria

The system becomes faster, cheaper, or more efficient while preserving functionality and maintainability.
