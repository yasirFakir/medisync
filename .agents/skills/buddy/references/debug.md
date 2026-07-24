# debug.md

> **Purpose**
>
> This command guides an AI coding agent to systematically investigate, isolate, and resolve software defects while minimizing unnecessary code changes.

---

# Primary Objective

Fix the root cause.

Do not patch symptoms.

Do not rewrite working code.

Do not introduce unrelated improvements.

---

# Debugging Philosophy

Every bug has a cause.

Find the cause before proposing a solution.

Never guess.

Never "try random fixes."

Evidence first.

---

# Workflow

Always follow this sequence.

```text
Reproduce

↓

Observe

↓

Analyze

↓

Hypothesize

↓

Verify

↓

Fix

↓

Test

↓

Review
```

Never skip steps.

---

# Step 1 — Understand the Problem

Identify:

* Expected behavior
* Actual behavior
* Error messages
* Reproduction steps
* Scope of the bug

If reproduction steps are missing,

Ask for them.

---

# Step 2 — Reproduce the Issue

Before modifying code:

Attempt to reproduce the issue consistently.

Determine:

* Always reproducible
* Intermittent
* Environment-specific
* Data-specific

Never fix a bug that cannot be understood.

---

# Step 3 — Gather Evidence

Collect:

* Logs
* Stack traces
* API responses
* Database state
* Console output
* Network requests

Do not ignore warnings.

Do not suppress errors.

---

# Step 4 — Analyze

Determine which layer is responsible.

Possible layers:

```text
Frontend

↓

API

↓

Business Logic

↓

Database

↓

External Service

↓

Infrastructure
```

Find the first layer where behavior deviates from expectations.

---

# Step 5 — Inspect Related Code

Read only the files necessary.

Understand:

* Data flow
* Dependencies
* Existing assumptions
* Recent changes

Do not scan unrelated modules.

---

# Step 6 — Form a Hypothesis

Before changing code,

State the most likely root cause.

Example:

```text
OCR parser trims dosage units before validation,
causing medicine matching to fail.
```

A fix should address the hypothesis—not the symptom.

---

# Step 7 — Verify the Hypothesis

Confirm that the identified cause actually explains the observed behavior.

If evidence contradicts the hypothesis,

Discard it and investigate further.

---

# Step 8 — Implement the Fix

Modify the smallest amount of code possible.

Avoid:

* Broad refactoring
* Unrelated optimizations
* Style-only changes

Keep the fix focused.

---

# Step 9 — Regression Testing

After fixing:

Verify:

* Original bug is resolved
* Related features still work
* No new errors appear

Regression testing is mandatory.

---

# Step 10 — Root Cause Summary

Document:

Issue

Cause

Solution

Verification

Future prevention

---

# Logging

When debugging:

Prefer additional logging over guessing.

Temporary debug logs should be removed before completion unless they provide long-term value.

---

# AI Usage

Never ask AI to invent a solution.

Use AI to:

* Explain logs
* Interpret stack traces
* Suggest debugging strategies

Validate every suggestion before implementation.

---

# Database Bugs

Before modifying schema:

Verify:

* Query correctness
* Constraints
* Transactions
* Seed data
* Migrations

Avoid schema changes unless necessary.

---

# API Bugs

Verify:

* Request payload
* Response payload
* Validation
* Authentication
* Authorization
* Status codes

Do not assume frontend issues are backend issues.

---

# Frontend Bugs

Check:

* State management
* Component lifecycle
* Network requests
* Rendering logic
* Form validation

Avoid cosmetic fixes that hide deeper issues.

---

# OCR & AI Bugs

When debugging OCR:

Inspect:

* Raw image
* Raw OCR output
* Cleaned text
* Parsed fields
* Confidence scores

When debugging AI:

Inspect:

* Prompt
* Context
* Provider response
* Moderation output

Never blame AI before verifying the input.

---

# Medical Safety

For medical-related bugs:

Never introduce behavior that could produce unsafe or misleading medical information.

If uncertain,

Fail safely.

---

# Security

Never disable:

* Authentication
* Authorization
* Validation
* Rate limiting
* Security checks

to "make debugging easier."

---

# Completion Report

Summarize:

Bug:

Root Cause:

Files Modified:

Fix Applied:

Tests Performed:

Regression Risk:

---

# Rules

Never:

* Guess
* Silence errors
* Ignore logs
* Introduce unrelated refactors
* Fix symptoms only

Always:

* Reproduce first
* Collect evidence
* Find the root cause
* Verify the fix
* Test for regressions

---

# Token Optimization

Read only:

* Relevant task
* Relevant ADRs
* Relevant modules

Avoid loading unrelated project documentation.

---

# Success Criteria

A successful debugging session:

* Identifies the true root cause
* Produces the smallest effective fix
* Preserves existing functionality
* Prevents recurrence where practical
* Leaves the codebase easier to understand

The objective is not merely to eliminate an error—it is to improve the reliability and maintainability of the system without introducing unnecessary complexity.
