# Debugging Guide
Version: 1.0

---

# Purpose

This document defines the standard debugging workflow for the MediSync project.

The objective is to identify and resolve root causes efficiently while minimizing regressions.

This guide applies to all contributors, including AI coding agents.

---

# Debugging Philosophy

Debugging is an engineering process.

Never guess.

Never apply random fixes.

Never introduce code changes without understanding the root cause.

Always investigate before modifying code.

---

# Core Principles

- Reproduce before fixing.
- Isolate the failing component.
- Verify assumptions.
- Fix the root cause.
- Test the solution.
- Prevent regressions.
- Document significant findings.

---

# Standard Debugging Workflow

Follow this workflow for every bug.

```
Observe

↓

Reproduce

↓

Collect Evidence

↓

Identify Responsible Layer

↓

Determine Root Cause

↓

Implement Minimal Fix

↓

Verify Fix

↓

Regression Test

↓

Document
```

Never skip steps.

---

# Rule 1 — Reproduce First

Before writing any code:

- Reproduce the issue consistently.
- Record exact reproduction steps.
- Record expected behavior.
- Record actual behavior.

If a bug cannot be reproduced, do not attempt speculative fixes.

---

# Rule 2 — Identify the Layer

Determine where the problem exists.

Possible layers include:

- Frontend
- Backend
- API
- Database
- Authentication
- OCR
- Medical Intelligence Service
- Notification System
- Infrastructure
- Configuration

Only debug one layer at a time.

---

# Rule 3 — Gather Evidence

Collect relevant evidence before making changes.

Examples:

- Logs
- Stack traces
- API responses
- Database records
- Request payloads
- Browser console
- Network requests
- Screenshots

Never rely on assumptions.

---

# Rule 4 — Verify Inputs

Before debugging internal logic, verify:

- Request payload
- Query parameters
- Headers
- Authentication
- Environment variables
- Database state

Incorrect inputs often produce correct failures.

---

# Rule 5 — Isolate the Problem

Reduce the problem to the smallest failing unit.

Avoid debugging the entire application simultaneously.

Determine whether the failure occurs in:

- One function
- One service
- One endpoint
- One database query
- One external dependency

---

# Rule 6 — Fix the Root Cause

Never fix symptoms.

Ask:

Why did this happen?

Continue asking until the actual cause is identified.

Avoid temporary workarounds unless explicitly approved.

---

# Rule 7 — Minimal Changes

Fix only the necessary code.

Avoid unrelated refactoring during debugging.

Large changes increase regression risk.

---

# Rule 8 — Verify the Fix

After implementing a fix:

- Reproduce original scenario.
- Verify expected behavior.
- Verify no new issues were introduced.

A bug is not fixed until it can no longer be reproduced.

---

# Rule 9 — Regression Testing

Always test nearby functionality.

Examples:

If authentication changes:

- Login
- Logout
- Token refresh
- Protected endpoints

If OCR changes:

- Upload
- Extraction
- Parsing
- Medicine matching

Never assume unrelated features remain functional.

---

# Layer-Specific Debugging

## Frontend

Verify:

- State
- Props
- API requests
- Rendering
- User interactions
- Browser console

Avoid blaming backend before verifying requests.

---

## Backend

Verify:

- Request validation
- Business logic
- Service execution
- Exception handling
- Response generation

Controllers should remain thin.

---

## Database

Verify:

- Query correctness
- Relationships
- Constraints
- Migrations
- Seed data

Never assume database state.

Inspect it.

---

## API

Verify:

- Status codes
- Request body
- Response body
- Validation
- Authentication
- Authorization

Use API testing tools when appropriate.

---

## OCR

Verify:

- Uploaded image
- OCR output
- Confidence
- Parsing
- Medicine extraction

Separate OCR failures from parsing failures.

---

## Medical Intelligence Service

Verify each stage independently.

- Intent detection
- Knowledge retrieval
- Prompt generation
- AI provider response
- Moderation
- Final formatting

Never treat the AI as a black box.

---

## Reminder System

Verify:

- Scheduler
- Time calculation
- User timezone
- Notification generation
- Delivery status

---

# Logging Strategy

Logs should answer:

- What happened?
- Where did it happen?
- Why did it happen?
- Which request caused it?

Logs should never expose:

- Passwords
- Tokens
- Secrets
- Personal medical data
- API keys

---

# Common Debugging Mistakes

Avoid:

- Guessing
- Random code changes
- Disabling validation
- Commenting out production code
- Ignoring logs
- Blaming external services without evidence
- Fixing symptoms only

---

# AI-Assisted Debugging

When using AI:

Provide:

- Error message
- Stack trace
- Relevant code
- Expected behavior
- Actual behavior
- Steps to reproduce

Never ask AI to fix an issue without context.

Review every AI-generated fix before applying it.

---

# Before Closing a Bug

Verify:

✓ Root cause identified

✓ Minimal fix implemented

✓ Bug no longer reproducible

✓ Regression tests passed

✓ Documentation updated if required

✓ Related issues checked

---

# Final Principle

Every bug should increase understanding of the system.

Do not merely eliminate failures—improve the reliability of the codebase.
