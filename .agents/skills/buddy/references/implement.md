# implement.md

> **Purpose**
>
> Implement a requested feature while following project standards and minimizing unnecessary changes.

---

## Objective

Implement the requested task correctly.

Keep changes focused, maintainable, and production-ready.

---

## Workflow

```text
Understand

↓

Load Context

↓

Plan

↓

Implement

↓

Verify

↓

Review

↓

Complete
```

---

## Load Context

Always read:

* `05_AGENT_RULES.md`

Then read only what is necessary:

* Related `TASK`
* Related `ADR`
* Relevant Engineering Guides
* Relevant source code

Avoid loading unnecessary documentation.

---

## Rules

* Implement only the requested scope.
* Follow the existing architecture.
* Reuse existing code before creating new modules.
* Prefer deterministic logic over AI.
* Keep changes minimal.
* Do not refactor unrelated code.
* Do not introduce unnecessary abstractions.
* Follow project coding standards.
* Protect security and sensitive data.

---

## Implementation Principles

* KISS
* DRY
* SOLID
* Single Responsibility
* Composition over inheritance

Prefer readable code over clever code.

---

## Before Finishing

Verify:

* Code compiles.
* Existing functionality is preserved.
* New functionality works.
* Errors are handled properly.
* Documentation is updated if necessary.

---

## Deliver

Summarize:

* Objective completed
* Files modified
* Files created
* Notes
* Known limitations (if any)

---

## Success Criteria

A successful implementation:

* Solves the requested problem.
* Follows project architecture.
* Keeps changes localized.
* Produces clean, maintainable, production-ready code.
* Leaves the codebase easier to extend than before.
