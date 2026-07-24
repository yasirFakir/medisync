---
name: buddy
description: Route user requests to the appropriate AI command while minimizing context loading and token usage.
---

# router.md

> **Purpose**
>
> Route user requests to the appropriate AI command while minimizing context loading and token usage.

---

# Workflow

```text
User Request

↓

Identify Intent

↓

Select Command

↓

Load Required Context

↓

Execute

↓

Return Result
```

---

# Command Routing

| Intent                                        | Command        |
| --------------------------------------------- | -------------- |
| Build a feature                               | `implement.md` |
| Fix a bug                                     | `debug.md`     |
| Review code / PR                              | `review.md`    |
| Design before coding                          | `plan.md`      |
| Improve existing code                         | `refactor.md`  |
| Create or improve tests                       | `test.md`      |
| Update documentation                          | `document.md`  |
| Improve performance or reduce AI/API cost     | `optimize.md`  |
| Compare technologies or investigate solutions | `research.md`  |
| Bootstrap a new project or environment        | `setup.md`     |
| Commit changes / Version bump & commit        | `commit.md`    |

---

# Context Loading Rules

Always load:

```text
05_AGENT_RULES.md
```

Then load only what is required.

Examples:

### Implement

```text
implement.md

↓

TASK

↓

Referenced ADRs

↓

Required Engineering Guides

↓

Relevant Source Code
```

---

### Debug

```text
debug.md

↓

Relevant Source Code

↓

Error Logs

↓

Related TASK (if applicable)
```

---

### Review

```text
review.md

↓

Changed Files

↓

Related TASK

↓

Referenced ADRs
```

---

### Plan

```text
plan.md

↓

Relevant TASK or Requirements

↓

Architecture

↓

Referenced ADRs
```

---

### Documentation

```text
document.md

↓

Affected Documentation

↓

Relevant Source Code
```

---

# Context Priority

When conflicts occur, follow this order:

```text
User Request

↓

TASK

↓

ADR

↓

Engineering Guides

↓

Architecture

↓

Source Code Style
```

---

# Token Optimization Rules

* Never load the entire documentation.
* Read only documents required for the current task.
* Reuse already loaded context when possible.
* Prefer deterministic documentation over inference.
* Stop loading once sufficient context has been obtained.

---

# Default Behavior

If the request is ambiguous:

1. Do not implement.
2. Ask for clarification.
3. Do not assume requirements.

---

# Success Criteria

A successful routing decision:

* Selects the correct command.
* Loads the minimum necessary context.
* Preserves project standards.
* Minimizes token usage.
* Produces consistent, maintainable results.
