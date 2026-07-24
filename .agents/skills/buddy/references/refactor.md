# refactor.md

> **Purpose**
>
> Improve existing code without changing external behavior.

## Objective

Make the code simpler, cleaner, and easier to maintain.

Do **not** add features.

Do **not** change application behavior.

---

## Workflow

```text
Understand

↓

Analyze

↓

Refactor

↓

Verify

↓

Review
```

---

## Rules

* Preserve behavior.
* Keep changes minimal.
* Follow existing architecture.
* Remove duplication.
* Improve naming.
* Reduce complexity.
* Avoid premature abstraction.
* Don't rewrite working modules.
* Refactor only within the requested scope.

---

## Verify

Ensure:

* Existing behavior is unchanged.
* Tests continue to pass.
* No new warnings or errors are introduced.

---

## Deliver

Summarize:

* What was improved
* Files modified
* Remaining technical debt (if any)

---

## Success Criteria

The code is easier to read, easier to maintain, and functionally identical to before the refactor.
