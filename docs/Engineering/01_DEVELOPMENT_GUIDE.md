# Development Guide
Version: 1.0

---

# Purpose

This document defines the software engineering practices, development workflow, and coding philosophy used throughout the MediSync project.

It applies to all contributors, including AI coding agents.

This guide complements `PROJECT_RULES.md`.

---

# Development Philosophy

The primary objective is to produce software that is:

- Correct
- Readable
- Maintainable
- Modular
- Secure
- Easy to extend

The project values long-term maintainability over short-term convenience.

---

# Core Principles

Every implementation should follow these principles.

## KISS

Keep solutions as simple as possible.

Avoid unnecessary abstractions.

Avoid clever implementations that reduce readability.

Simple code is easier to maintain and debug.

---

## DRY

Do not duplicate business logic.

If similar logic appears more than twice, consider extracting it into a reusable component.

Duplicate code should only exist when justified by performance or architectural constraints.

---

## YAGNI

Do not implement features that are not currently required.

Future requirements should not influence today's implementation unless explicitly planned.

---

## SOLID

Apply SOLID principles whenever practical.

In particular:

- Small focused classes
- Small focused services
- Low coupling
- High cohesion
- Dependency inversion
- Interface-based design when beneficial

Avoid overengineering.

---

# Project Architecture Philosophy

Every feature should be implemented using layered architecture.

```
Client

↓

Controller / Route

↓

Service Layer

↓

Repository

↓

Database
```

Business logic belongs inside services.

Controllers should remain thin.

Repositories should contain persistence logic only.

---

# Medical Intelligence Service

All AI functionality must pass through the Medical Intelligence Service.

Never call AI providers directly from:

- Controllers
- Frontend
- Database Layer

The Medical Intelligence Service is responsible for:

- Intent detection
- Knowledge retrieval
- Prompt construction
- AI provider communication
- Moderation
- Response formatting

---

# Feature Development Workflow

Every new feature should follow this sequence.

1. Understand the requirement.
2. Review existing architecture.
3. Reuse existing modules if possible.
4. Design before coding.
5. Implement.
6. Test.
7. Document.
8. Submit for review.

Do not skip steps.

---

# Before Writing Code

Always ask:

- Does this functionality already exist?
- Can existing code be extended?
- Is AI actually required?
- Does this violate architecture?
- Can this be implemented more simply?

If uncertain, investigate first.

---

# Folder Responsibilities

Each folder should have a single responsibility.

Example:

```
controllers/

services/

repositories/

middlewares/

models/

routes/

utils/

workers/
```

Avoid mixing unrelated responsibilities.

---

# File Responsibilities

Each file should have a clear purpose.

Large files should be split before they become difficult to maintain.

Recommended limits:

- Functions: < 50 lines
- Files: < 500 lines
- Classes: One primary responsibility

These are guidelines rather than strict limits.

---

# Naming Conventions

Names should clearly communicate intent.

Prefer:

```
MedicineService

ReminderScheduler

OCRProcessor
```

Avoid:

```
Helper

Manager

Utils

DataHandler
```

Generic names should be avoided unless the purpose is genuinely generic.

---

# Function Design

Functions should:

- Perform one task.
- Have descriptive names.
- Minimize side effects.
- Return predictable outputs.
- Be easy to test.

Prefer multiple small functions over one large function.

---

# Service Design

Services encapsulate business logic.

Services should not:

- Render UI
- Access HTTP request objects directly
- Contain presentation logic

Services should remain framework-independent whenever practical.

---

# Repository Design

Repositories manage persistence.

Repositories should:

- Read data
- Write data
- Hide database implementation details

Repositories should not contain business rules.

---

# Error Handling

Handle errors close to their source.

Do not suppress exceptions silently.

Provide meaningful error messages.

Convert internal exceptions into user-friendly responses.

---

# Configuration

Configuration should never be hardcoded.

Use environment variables for:

- Database connections
- API keys
- Secrets
- AI providers
- Feature flags

---

# Dependency Management

Before adding any dependency:

Ask:

- Is it necessary?
- Is it maintained?
- Can current dependencies solve this?
- Does it increase complexity?

Minimize dependency count.

---

# Performance Philosophy

Measure before optimizing.

Optimize:

- Expensive queries
- Duplicate requests
- AI usage
- Memory-intensive operations

Do not optimize speculative bottlenecks.

---

# AI Development Philosophy

Artificial Intelligence is not the primary decision-maker.

Always prefer:

1. Rule Engine
2. Database Retrieval
3. Existing Business Logic
4. AI

AI should explain information rather than invent information.

---

# Documentation Policy

New features should update documentation when they affect:

- APIs
- Database schema
- Architecture
- Configuration
- User workflows

Documentation should evolve alongside the codebase.

---

# Refactoring Policy

Refactor when:

- Readability improves.
- Duplication is removed.
- Complexity decreases.
- Architecture improves.

Do not refactor unrelated code during feature implementation unless necessary.

---

# Development Checklist

Before considering a feature complete:

✓ Requirement satisfied

✓ Architecture respected

✓ Business logic in services

✓ Repository used correctly

✓ Validation implemented

✓ Error handling added

✓ Tests written

✓ Documentation updated

✓ No unnecessary AI usage

✓ No duplicated logic

---

# Final Principle

Develop software that is easy for another engineer—or another AI agent—to understand without additional explanation.

If future contributors cannot understand the implementation quickly, the implementation is too complex.
