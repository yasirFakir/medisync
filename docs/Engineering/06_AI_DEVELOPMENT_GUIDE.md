# AI Development Guide
Version: 1.0

---

# Purpose

This document defines the standards for AI-assisted software development within the MediSync project.

It applies to all AI coding agents, including but not limited to:

- ChatGPT
- Claude Code
- Gemini CLI
- Cursor
- GitHub Copilot
- Codex
- Windsurf
- Continue

This guide supplements `PROJECT_RULES.md` and `DEVELOPMENT_GUIDE.md`.

---

# Primary Objective

AI is a development assistant.

AI does not make architectural decisions.

AI does not override project standards.

Every AI-generated contribution must follow the established architecture, coding standards, and engineering principles.

---

# Development Philosophy

AI should accelerate development while preserving:

- Correctness
- Readability
- Maintainability
- Security
- Consistency

Fast code is valuable only if it is also correct.

---

# Before Generating Code

Before writing any code:

1. Understand the task.
2. Identify affected modules.
3. Read only the relevant documentation.
4. Reuse existing implementations whenever possible.
5. Follow the existing architecture.

Never generate code blindly.

---

# Required Reading Order

Read documentation only when relevant.

Always:

```
PROJECT_RULES.md
```

Then determine required documentation.

Examples:

Backend Task

```
PROJECT_RULES

↓

DEVELOPMENT_GUIDE

↓

DATABASE_GUIDE

↓

API_GUIDE
```

AI Task

```
PROJECT_RULES

↓

DEVELOPMENT_GUIDE

↓

AI_PROMPT_GUIDE

↓

DECISION_POLICY
```

Frontend Task

```
PROJECT_RULES

↓

DEVELOPMENT_GUIDE

↓

CODE_STYLE
```

Never load unnecessary documentation.

---

# AI Responsibilities

AI may:

- Generate code
- Refactor code
- Generate tests
- Improve documentation
- Explain code
- Detect bugs
- Suggest optimizations

AI must not:

- Change project architecture
- Introduce breaking changes without request
- Remove security mechanisms
- Invent requirements
- Modify unrelated modules

---

# Existing Code First

Always search for an existing implementation before creating a new one.

Prefer:

```
Reuse

↓

Extend

↓

Refactor

↓

Create New
```

Never duplicate functionality.

---

# Architecture Rules

AI must never violate project architecture.

Do not:

- Skip service layers.
- Place business logic inside controllers.
- Access the database directly from presentation layers.
- Call AI providers directly from the frontend.

Respect existing module boundaries.

---

# AI Decision Rules

Before implementing AI functionality:

Ask:

Can deterministic logic solve this?

If YES:

Do not use AI.

If NO:

Determine whether structured retrieval can provide the answer.

Only use AI when deterministic solutions are insufficient.

---

# Medical Intelligence Service

All AI functionality must pass through the Medical Intelligence Service.

Responsibilities include:

- Intent detection
- Knowledge retrieval
- Prompt construction
- AI provider communication
- Moderation
- Response formatting

Do not bypass this service.

---

# Design System & UI Generation Policy

All AI-assisted UI implementations, components, and user-facing AI responses MUST strictly adhere to the official MediSync Design System (`temp/medisync stitch desktop/medisync/DESIGN.md`).

### 1. Brand Aesthetic & Philosophy
* **Narrative:** "Calm Professionalism" & "Radical Accessibility" — Human-Centric Medical aesthetic with Modern Corporate Minimalism.
* **Tone:** Reduces cognitive load and anxiety associated with medical data. Uses generous whitespace, soft organic color palette, and high legibility.

### 2. Design Tokens & Color Standards
* **Primary Teal (`#00685f` / `#0D9488`):** Main actions, brand presence, active navigation bars, primary buttons.
* **Secondary Sky Blue (`#006492` / `#2D9CDB`):** Extracted OCR data points, verified informational highlights.
* **Tertiary / Safety Amber (`#825100` / `#F59E0B`):** AI-assisted safety notices, dosage cautions, and alert warnings.
* **Neutrals:** Canvas background `#f9f9ff`, Cards/Modals `#ffffff`, Text `#111c2d` (Dark Charcoal) and `#3d4947` (Slate Variant).

### 3. Typography & Layout Rhythm
* **Typography:** `Plus Jakarta Sans` is the sole typeface for headlines (`700`/`600` weight) and body text (`400`/`500` weight).
* **8px Rhythm:** All padding, margins, and gaps must follow 8px grid multiples (`8px`, `16px`, `24px`, `32px`, `40px`).
* **Sidebar:** Fixed 280px sidebar navigation with left active indicator bar (`border-l-4 border-[#00685f]`).

### 4. Component Rules
* **Badges:**
  * *Verified:* Light Green background (`#10B981` 10% opacity) with check icon.
  * *Extracted OCR:* Light Blue background (`#E0F2FE` / `#cae6ff`) with dark blue text (`#004a6d`).
  * *AI-Assisted:* Soft Amber background (`#FEF3C7`) with Amber text (`#B45309`).
* **Cards:** Level 1 elevation cards (`#ffffff`) with subtle ambient shadow (`0px 4px 20px rgba(30, 41, 59, 0.05)`) and 1px border (`#bcc9c6`/30).
* **Forbidden UI Actions:** Never generate generic browser colors (raw red/green/blue), plain unstyled HTML tables, or ad-hoc Tailwind/CSS variables that break the established design system tokens.

---

# Prompt Generation

Prompts should:

- Be deterministic.
- Be concise.
- Include only required context.
- Avoid unnecessary instructions.
- Prefer structured information.

Never generate excessively long prompts.

---

# Context Usage

Minimize context usage.

Load only documentation relevant to the current task.

Avoid repeatedly loading:

- Entire SRS
- Entire Architecture
- Unrelated documentation

Context should remain focused.

---

# Dependency Rules

Before adding a dependency:

Ask:

- Is it required?
- Is an existing dependency sufficient?
- Does it simplify development?
- Does it increase maintenance cost?

Avoid unnecessary libraries.

---

# Code Generation Rules

Generated code should:

- Compile successfully.
- Follow project conventions.
- Use existing patterns.
- Be readable.
- Be modular.
- Be testable.

Avoid overly clever implementations.

---

# Refactoring Rules

Refactor only when:

- Readability improves.
- Complexity decreases.
- Duplication is removed.
- Maintainability increases.

Avoid unnecessary large-scale rewrites.

---

# Documentation Rules

Whenever AI modifies:

- API
- Database
- Configuration
- Architecture
- Workflow

Update the corresponding documentation.

Documentation is part of the implementation.

---

# Testing Requirements

Every generated feature should include:

- Appropriate validation
- Error handling
- Unit tests where applicable
- Regression consideration

Never generate production code without considering testing.

---

# Debugging Rules

When debugging:

Never guess.

Always:

- Reproduce
- Collect evidence
- Identify layer
- Determine root cause
- Verify fix

Avoid speculative code changes.

---

# Security Rules

Never generate code that:

- Exposes secrets
- Logs sensitive information
- Disables validation
- Disables authentication
- Stores credentials in source code

Security takes priority over convenience.

---

# Performance Rules

Prefer:

- Efficient algorithms
- Cached results
- Database retrieval
- Rule-based processing

Avoid:

- Duplicate queries
- Duplicate AI requests
- Unnecessary computation

Measure before optimizing.

---

# AI Output Quality

Generated code should be:

- Production-oriented
- Self-explanatory
- Consistent
- Minimal
- Modular

Avoid placeholder implementations unless explicitly requested.

---

# Forbidden Behaviors

AI must never:

- Invent database tables.
- Invent API endpoints.
- Rename public interfaces without request.
- Change architecture.
- Ignore project documentation.
- Introduce breaking changes silently.
- Remove existing functionality without justification.

---

# Human Review

Every AI-generated contribution requires human review before merging.

AI assists development.

Humans approve changes.

---

# Completion Checklist

Before considering a task complete:

✓ Architecture respected

✓ Existing code reused where appropriate

✓ No duplicated logic

✓ Documentation updated

✓ Validation implemented

✓ Error handling included

✓ Tests considered

✓ Security preserved

✓ Minimal context used

✓ No unnecessary AI usage introduced

---

# Final Principle

AI should produce code that integrates seamlessly with the existing codebase.

Every generated contribution should appear as though it was written by an experienced member of the MediSync engineering team.
