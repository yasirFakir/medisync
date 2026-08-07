# MediSync Project Rules
Version: 1.0

---

# Purpose

This document defines the global engineering rules for the MediSync project.

Every developer (human or AI) MUST follow these rules before implementing, modifying, or reviewing any part of the codebase.

These rules take precedence over individual coding preferences.

---

# Core Philosophy

MediSync is a knowledge-assisted medical application.

Artificial Intelligence is used only where deterministic software solutions are insufficient.

The system prioritizes:

1. Correctness
2. Maintainability
3. Security
4. Simplicity
5. Cost Efficiency
6. Performance

Never sacrifice correctness for convenience.

---

# Engineering Principles

The project follows these principles.

- KISS (Keep It Simple, Stupid)
- SOLID
- DRY
- Separation of Concerns
- Single Responsibility Principle
- Explicit over Implicit
- Composition over Inheritance
- Fail Fast
- Secure by Default

---

# General Rules

Every change MUST satisfy the following requirements.

- Keep implementations simple.
- Prefer readability over cleverness.
- Reuse existing code whenever possible.
- Avoid unnecessary abstractions.
- Avoid unnecessary dependencies.
- Never duplicate business logic.
- Never introduce dead code.
- Remove obsolete code when appropriate.

---

# AI Usage Policy

Artificial Intelligence is an assistive component.

It is NOT the default solution.

Before introducing AI, determine whether the task can be solved using:

1. Rule Engine
2. Database Query
3. Existing Business Logic
4. AI

If deterministic logic can solve the problem, AI MUST NOT be used.

---

# Medical Safety Policy

MediSync is NOT a diagnostic system.

The application MUST NOT:

- Diagnose diseases
- Replace physicians
- Recommend stopping medication
- Recommend changing dosage
- Present AI responses as medical facts

AI responses must remain educational and assistive.

---

# Architecture Rules

Every implementation MUST respect the project architecture.

Developers MUST NOT:

- Bypass service layers.
- Couple unrelated modules.
- Access the database directly from presentation layers.
- Place business logic inside controllers.
- Call AI providers directly from frontend applications.

All AI communication shall occur through the Medical Intelligence Service.

---

# Documentation Rules

Documentation is part of the project.

Whenever a significant architectural or behavioral change is introduced:

- Update relevant documentation.
- Update API documentation if endpoints change.
- Update database documentation if schema changes.
- Update Architecture Decision Records (ADR) when architectural decisions change.

Code and documentation must remain synchronized.

---

# Security Rules

Developers MUST NOT:

- Commit secrets.
- Commit API keys.
- Commit passwords.
- Commit private credentials.
- Disable authentication without approval.
- Disable authorization without approval.
- Disable input validation.

Security is mandatory.

---

# Dependency Rules

Before adding a dependency, verify:

- Is it actively maintained?
- Is it necessary?
- Can existing libraries solve the problem?
- Does it increase project complexity?

Avoid dependency bloat.

---

# Database Rules

Database schema changes require:

- Migration
- Documentation update
- Review

Never modify production schemas without migrations.

Never hardcode IDs.

Never rely on implicit ordering.

**Database Testing Rollback Policy:**
- All automated test scripts or database verification executed by AI agents MUST run inside explicit SQL transactions (`BEGIN; ... ROLLBACK;`) or execute cleanup routines to completely roll back and restore the previous state of the database after testing.
- AI agents MUST NOT leave temporary test records, modified production entries, or polluted test rows in the database upon test completion.

---

# API Rules

All public APIs should:

- Validate inputs.
- Return meaningful errors.
- Use consistent naming.
- Follow REST conventions.
- Avoid breaking existing clients.

Breaking API changes require team discussion.

---

# Error Handling

Errors must never be silently ignored.

Every recoverable failure should:

- Return useful information.
- Be logged appropriately.
- Preserve system stability.

Never expose internal implementation details to users.

---

# Logging Rules

Log information that assists debugging.

Do NOT log:

- Passwords
- Tokens
- Authentication secrets
- Medical images
- Sensitive personal information

Logs should be useful without violating privacy.

---

# Performance Rules

Do not optimize prematurely.

However, avoid:

- N+1 queries
- Duplicate API calls
- Duplicate AI requests
- Unnecessary database access
- Blocking operations where asynchronous execution is appropriate

Measure before optimizing.

---

# Cost Awareness

Operational cost is a design requirement.

Prefer:

- Rule-based processing
- Database retrieval
- Caching
- Local inference
- Background processing

Minimize paid AI requests.

---

# Code Ownership

Every developer is responsible for:

- Their code
- Their documentation
- Their tests

Ownership does not prevent collaborative improvements.

---

# Pull Requests

Every Pull Request should:

- Solve one problem.
- Remain reasonably small.
- Include relevant tests.
- Update documentation if necessary.

Large unrelated changes should be split into separate Pull Requests.

---

# Before Writing Code

Ask the following questions:

1. Does this already exist?
2. Can it be simplified?
3. Can deterministic logic solve it?
4. Does it follow the architecture?
5. Is it secure?
6. Is it testable?
7. Is documentation affected?

If any answer is uncertain, investigate before implementation.

---

# Before Merging

Every implementation should satisfy:

✓ Builds successfully

✓ Tests pass

✓ Documentation updated

✓ Naming consistent

✓ No duplicated logic

✓ No unnecessary AI usage

✓ Security preserved

✓ Code reviewed

---

# Rule Priority

When multiple documents provide guidance, follow them in this order:

1. PROJECT_RULES.md
2. Architecture Documentation
3. Development Guide
4. Security Guide
5. Code Style Guide
6. Module-specific documentation

If conflicts exist, the higher-priority document takes precedence.

---

# Final Principle

Every contribution should leave the project in a better state than it was found.

Write code that your teammates—and your future self—can understand, maintain, and safely extend.
