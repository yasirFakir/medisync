# Code Style Guide
Version: 1.0

---

# Purpose

This document defines the coding style and formatting standards used throughout the MediSync project.

The goal is to ensure that every file in the repository appears to have been written by the same engineering team, regardless of the contributor or AI coding agent.

This guide applies to all source code.

---

# Core Principles

Code should be:

- Readable
- Predictable
- Consistent
- Maintainable
- Self-explanatory

Humans read code far more often than they write it.

Optimize for readability.

---

# General Rules

Always:

- Prefer clarity over cleverness.
- Prefer explicit code over implicit behavior.
- Write code that is easy to debug.
- Keep implementations simple.
- Avoid unnecessary abstractions.

---

# Naming Conventions

Names should describe purpose, not implementation.

Good examples:

```
MedicineService

ReminderScheduler

OCRProcessor

UserRepository
```

Avoid:

```
Helper

Manager

Util

Handler

Temp

NewService

DataThing
```

Generic names should only be used when they are genuinely generic.

---

# Variables

Variable names should:

- Describe intent.
- Be concise.
- Avoid abbreviations.

Prefer:

```
medicineName

patientId

prescriptionImage

reminderTime
```

Avoid:

```
x

tmp

val

obj

data1
```

---

# Functions

Functions should:

- Perform one responsibility.
- Have descriptive names.
- Return predictable results.
- Minimize side effects.
- Remain short.

Recommended size:

```
Less than 50 lines
```

If a function becomes difficult to understand, split it.

---

# Parameters

Prefer a small number of parameters.

If many parameters are required:

- Use a configuration object.
- Use a request model.
- Group related values.

Avoid long parameter lists.

---

# Classes

Each class should have one primary responsibility.

Large classes should be divided into smaller components.

Avoid "God Classes."

---

# Files

Each file should focus on one module or responsibility.

Recommended maximum size:

```
500 lines
```

Split files before they become difficult to navigate.

---

# Comments

Write comments only when necessary.

Good comments explain:

- Why
- Intent
- Non-obvious decisions

Bad comments explain:

- What obvious code already says

Prefer:

```
// Retry because OCR providers occasionally timeout.
```

Avoid:

```
// Increment i.
i++;
```

---

# TODO Comments

Use TODO comments sparingly.

Include enough information to make them actionable.

Prefer:

```
// TODO: Replace mock pharmacy API after integration.
```

Avoid:

```
// TODO
```

---

# Formatting

Maintain consistent formatting throughout the project.

Use:

- Consistent indentation
- Consistent spacing
- Consistent line breaks

Do not manually align code for visual appearance.

Allow formatting tools to manage layout.

---

# Magic Values

Avoid hardcoded values.

Prefer:

- Constants
- Configuration
- Environment variables
- Enumerations

Bad:

```
if (status == 7)
```

Better:

```
if (status == COMPLETED_STATUS)
```

---

# Constants

Constants should have meaningful names.

Group related constants together.

Avoid scattering literals throughout the codebase.

---

# Boolean Variables

Boolean variables should read naturally.

Prefer:

```
isAuthenticated

hasReminder

canEdit

shouldNotify
```

Avoid:

```
flag

check

status
```

---

# Conditional Logic

Keep conditionals simple.

Avoid deep nesting.

Prefer early returns where appropriate.

Example:

```
Validate

↓

Return if invalid

↓

Continue
```

Instead of multiple nested blocks.

---

# Error Handling

Handle errors explicitly.

Never ignore exceptions.

Provide meaningful error messages.

Errors should help debugging without exposing internal implementation details.

---

# Logging

Log useful information.

Never log:

- Passwords
- API keys
- Tokens
- Sensitive medical information
- Personal identifiers unless required

Logs should support debugging while preserving privacy.

---

# Duplication

Avoid duplicated logic.

If similar logic appears repeatedly:

- Extract helper functions.
- Create reusable services.
- Share utilities where appropriate.

Do not duplicate business rules.

---

# Imports

Remove unused imports.

Group imports consistently.

Avoid circular dependencies.

---

# Dependencies

Before introducing a dependency:

Ask:

- Is it necessary?
- Can existing code solve this?
- Will it simplify maintenance?

Avoid dependency bloat.

---

# Defensive Programming

Validate:

- User input
- External API responses
- OCR output
- Database results

Never assume external systems behave correctly.

---

# Readability

Prioritize readable code over compact code.

Prefer:

```
Several clear steps
```

instead of

```
One complex expression
```

Future maintainers should understand code without extensive explanation.

---

# AI-Generated Code

AI-generated code must:

- Follow project conventions.
- Match surrounding style.
- Use existing patterns.
- Avoid introducing inconsistent formatting.
- Integrate naturally with existing modules.

Generated code should not be distinguishable from manually written code.

---

# Refactoring

Refactor when:

- Complexity decreases.
- Readability improves.
- Duplication is removed.
- Architecture improves.

Avoid unnecessary stylistic rewrites.

---

# Code Review Expectations

Reviewers should verify:

✓ Naming clarity

✓ Readability

✓ Consistent formatting

✓ No duplicated logic

✓ Small focused functions

✓ Proper error handling

✓ Logging appropriate

✓ Comments meaningful

✓ No dead code

---

# Final Principle

Every file should be understandable without requiring external explanation.

Good code explains itself through clear structure, meaningful names, and consistent design.
