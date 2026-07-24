# Pull Request Review Guide
Version: 1.0

---

# Purpose

This document defines the Pull Request (PR) review process for the MediSync project.

Every Pull Request must be reviewed for correctness, maintainability, security, and architectural consistency before merging.

This guide applies to both human reviewers and AI coding agents.

---

# Review Philosophy

A Pull Request review is not a search for mistakes.

Its purpose is to improve code quality, maintain consistency, reduce technical debt, and prevent regressions.

Review the implementation, not the developer.

---

# Review Workflow

Every Pull Request should follow this sequence.

```
Understand Feature

↓

Review Requirements

↓

Review Architecture

↓

Review Code

↓

Review Tests

↓

Review Documentation

↓

Approve or Request Changes
```

Never skip steps.

---

# General Review Checklist

Verify:

✓ Feature satisfies requirements

✓ Architecture respected

✓ Business logic correctly placed

✓ No duplicated logic

✓ Code readability

✓ Consistent naming

✓ Error handling

✓ Input validation

✓ Security maintained

✓ Tests included

✓ Documentation updated

---

# Architecture Review

Verify:

- Layered architecture maintained.
- Controllers remain thin.
- Business logic exists only in services.
- Database access occurs only through repositories.
- Medical Intelligence Service is used for AI interactions.
- No unnecessary coupling introduced.

Reject implementations that violate project architecture.

---

# Code Quality Review

Verify:

- Clear variable names.
- Small functions.
- Single responsibility.
- Minimal nesting.
- Consistent formatting.
- No dead code.
- No commented-out production code.
- No unnecessary abstractions.

Prefer readability over cleverness.

---

# Logic Review

Review business logic carefully.

Verify:

- Correct conditions.
- Edge cases handled.
- Error cases handled.
- Null handling.
- Boundary values.
- Correct data flow.

Do not approve code that appears to "work" without understanding why.

---

# Database Review

Verify:

- Queries are efficient.
- Relationships respected.
- Migrations included.
- Transactions used where necessary.
- No unnecessary database calls.
- No hardcoded IDs.

Never approve schema changes without migrations.

---

# API Review

Verify:

- REST conventions followed.
- Correct HTTP status codes.
- Request validation.
- Response consistency.
- Proper error responses.
- Authentication respected.

Breaking API changes require discussion.

---

# AI Feature Review

Verify:

- AI usage is necessary.
- Deterministic logic was considered first.
- Prompt construction is appropriate.
- Moderation included.
- Responses remain educational.
- No medical claims presented as facts.

Reject unnecessary AI usage.

---

# Security Review

Verify:

- Authentication preserved.
- Authorization preserved.
- Input validation exists.
- Secrets not exposed.
- Sensitive data not logged.
- SQL injection prevented.
- XSS prevention maintained.

Security issues block approval.

---

# Performance Review

Verify:

- No unnecessary loops.
- No duplicate API calls.
- No duplicate database queries.
- No duplicate AI requests.
- Efficient algorithms.
- Caching considered where appropriate.

Avoid premature optimization.

---

# Testing Review

Verify:

- Unit tests included where appropriate.
- Existing tests still pass.
- New functionality tested.
- Edge cases covered.
- Regression risks considered.

Reject features that cannot be reasonably tested.

---

# Documentation Review

Verify updates if applicable:

- API documentation
- Database documentation
- Configuration
- Architecture
- ADR
- Comments where necessary

Code and documentation should remain synchronized.

---

# Merge Conflict Resolution

When conflicts occur:

1. Understand both implementations.
2. Preserve correct behavior.
3. Remove duplicated code.
4. Retest affected functionality.
5. Verify build success.

Never resolve conflicts by accepting changes blindly.

---

# Common Reasons to Request Changes

Request changes if:

- Architecture violated.
- Business logic misplaced.
- Missing validation.
- Missing tests.
- Poor naming.
- Duplicate logic.
- Security concerns.
- Excessive complexity.
- Incomplete documentation.

---

# Approval Criteria

Approve only when:

✓ Requirements satisfied

✓ Architecture respected

✓ Tests pass

✓ Documentation updated

✓ No known regressions

✓ Code quality acceptable

✓ Security maintained

✓ Review comments addressed

---

# Before Merging

Confirm:

✓ Branch is up to date

✓ CI passes

✓ No unresolved review comments

✓ Merge conflicts resolved

✓ Documentation synchronized

✓ Feature verified

---

# Final Principle

Merge only code that you would be comfortable maintaining six months from now.

Every merged Pull Request becomes part of the project's long-term foundation.
