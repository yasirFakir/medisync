# AGENT_RULES
Version: 1.0

---

# Purpose

This repository is designed to be developed with significant assistance from AI coding agents.

This document defines the rules every AI agent must follow before making any modification to the project.

These rules are mandatory.

Failure to follow them will lead to inconsistent architecture, duplicated logic, wasted tokens, and reduced code quality.

---

# Primary Objective

Your goal is **NOT** to generate code.

Your goal is to produce maintainable software that follows the MediSync engineering standards.

Always optimize for:

- Correctness
- Maintainability
- Simplicity
- Consistency
- Low Cost
- Reliability

---

# Mandatory Reading Order

Do **NOT** read every document.

Read only the documents required for the current task.

Always begin with:

```
00_PROJECT_RULES.md
```

Then determine which documents are required.

Examples:

### Backend Feature

```
00_PROJECT_RULES

↓

Relevant ADR(s) (if applicable)

↓

01_DEVELOPMENT_GUIDE

↓

10_DATABASE_GUIDE

↓

11_API_GUIDE
```

---

### AI Feature

```
00_PROJECT_RULES

↓

01_DEVELOPMENT_GUIDE

↓

06_AI_DEVELOPMENT

↓

12_AI_PROMPT_GUIDE

↓

13_DECISION_POLICY
```

---

### Bug Fix

```
00_PROJECT_RULES

↓

03_DEBUGGING_GUIDE
```

---

### Pull Request Review

```
00_PROJECT_RULES

↓

04_PR_REVIEW
```

---

### Database Task

```
00_PROJECT_RULES

↓

10_DATABASE_GUIDE
```

---

### API Task

```
00_PROJECT_RULES

↓

11_API_GUIDE
```

---

### Security Task

```
00_PROJECT_RULES

↓

08_TESTING_SECURITY_GUIDE
```

---

### Git Task

```
00_PROJECT_RULES

↓

05_GIT_WORKFLOW
```

---

### Code Formatting

```
00_PROJECT_RULES

↓

07_CODE_STYLE
```

---

# Minimize Token Usage

Project documentation exists to reduce mistakes—not increase token consumption.

Never repeatedly read every Markdown document.

Read only the files required for the current task.

Avoid loading:

- Complete SRS
- Entire Architecture
- Unrelated Guides

Load the smallest amount of context possible.

---

# Before Writing Code

Always ask:

1. What is the task?
2. Which module is affected?
3. Which guide applies?
4. Does similar code already exist?
5. Can existing code be reused?

Only after answering these questions should implementation begin.

---

# Existing Code First

Always follow this order.

```
Search Existing Code

↓

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

Never:

- Skip service layers
- Place business logic inside controllers
- Query the database from presentation layers
- Bypass repositories
- Call AI providers directly from frontend

Respect existing architecture.

---
# Architecture Decisions (ADR)

Architecture Decision Records (ADRs) document important engineering decisions made for the project.

ADRs explain **why** a decision was made, while the implementation guides explain **how** to implement it.

AI agents should **NOT** read every ADR.

Only consult an ADR when:

- Modifying an architectural component.
- Implementing a feature covered by an ADR.
- Changing an existing architectural decision.
- The task explicitly references an ADR.

Examples:

OCR Feature
→ Read ADR-004

AI Integration
→ Read ADR-002

Medical Knowledge Retrieval
→ Read ADR-003

Medical Response Generation
→ Read ADR-005

If no ADR is related to the task, do not load any ADRs.

This minimizes token usage while ensuring architectural consistency.

# AI Decision Policy

Before using AI ask:

Can deterministic logic solve this?

↓

YES

↓

Do NOT use AI.

↓

NO

↓

Can database retrieval solve it?

↓

YES

↓

Retrieve information.

↓

NO

↓

Use AI.

AI is always the final option.

---

# OCR Policy

OCR performs extraction only.

OCR should never:

- Diagnose
- Recommend
- Explain
- Infer missing information

OCR extracts.

Medical Intelligence reasons.

---

# Medical Intelligence Policy

AI should only perform:

- Medical explanation
- Natural language understanding
- Educational summaries
- Clarification

Never use AI for deterministic application logic.

---

# Coding Standards

Generated code must:

- Compile
- Follow existing architecture
- Match repository style
- Be modular
- Be testable
- Be readable

Avoid unnecessary abstraction.

---

# Design System & UI Generation Policy

All AI-generated code, UI components, and prompts MUST adhere to the MediSync Design System (`temp/medisync stitch desktop/medisync/DESIGN.md`):

- **Brand Aesthetic:** Calm Professionalism & Radical Accessibility (Human-Centric Medical Minimalism).
- **Typography:** `Plus Jakarta Sans` for all text & headlines.
- **Design Tokens:**
  - Primary Teal: `#00685f` / `#0D9488`
  - Secondary Sky Blue: `#006492` / `#2D9CDB` (OCR / Extracted data)
  - Safety Amber: `#825100` / `#F59E0B` (AI Notices & Cautions)
  - Canvas: `#f9f9ff`
- **Layout:** 8px rhythm grid multiples (`8px`, `16px`, `24px`), 280px fixed sidebar with left active border (`border-l-4 border-[#00685f]`).

---

# Documentation Rules

Whenever implementation changes:

Determine whether documentation should also change.

Update documentation if:

- API changes
- Database changes
- Architecture changes
- Configuration changes
- Workflow changes

Keep documentation synchronized.

---

# Debugging Rules

Never guess.

Always:

Reproduce

↓

Collect Evidence

↓

Identify Root Cause

↓

Fix

↓

Verify

↓

Regression Test

---

# Testing Rules

Every implementation should consider:

- Validation
- Error Handling
- Edge Cases
- Regression Risk

Do not consider a feature complete without verification.

---

# Security Rules

Never:

- Log sensitive information
- Commit secrets
- Disable validation
- Remove authentication
- Ignore authorization

Medical data requires strong privacy protection.

---

# Git Rules & AI Commit Policy

Never:

- Commit directly to main
- Force push protected branches
- Combine unrelated features
- Run `git commit` or `git push` automatically without explicit user authorization

**AI Commit Authorization Policy:**
- AI agents MUST NOT execute `git commit` or `git push` commands autonomously.
- AI agents must ONLY create git commits and push code when the user explicitly requests or commands a commit or push.

Use feature branches.

Follow Conventional Commits.

---

# Prompt Engineering

When interacting with AI models:

- Keep prompts concise.
- Provide structured context.
- Prefer retrieved knowledge.
- Avoid unnecessary tokens.
- Prevent hallucinations through context.

Never send unnecessary information to the model.

---

# Cost Awareness

Every API request has a cost.

Always minimize:

- Token usage
- Duplicate requests
- Duplicate retrieval
- Repeated reasoning

Prefer:

Rule Engine

↓

Database

↓

Cache

↓

AI

---

# Human Oversight

AI assists development.

Humans make final decisions.

Never assume generated code is correct.

Every significant change should be reviewed by a human.

---

# Forbidden Actions

Never:

- Invent project requirements.
- Ignore project documentation.
- Introduce breaking architecture.
- Rewrite large portions of code without request.
- Remove existing functionality without justification.
- Generate placeholder implementations for production code.
- Add dependencies without necessity.
- Duplicate existing business logic.

---

# Completion Checklist

Before completing any task verify:

✓ Correct guide(s) consulted

✓ Existing code reused where appropriate

✓ Architecture respected

✓ Documentation updated if necessary

✓ Security preserved

✓ Tests considered

✓ No duplicated logic

✓ Token usage minimized

✓ AI usage justified

✓ Code matches repository style

---

# Final Principle

Think before coding.

Understand before modifying.

Reuse before creating.

Retrieve before generating.

Keep the solution as simple as possible while fully satisfying the project requirements.

The best AI agent is not the one that writes the most code—it is the one that makes the fewest mistakes.
