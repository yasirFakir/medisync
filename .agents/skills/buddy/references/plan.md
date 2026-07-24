# plan.md

> **Purpose**
>
> This command guides an AI coding agent to analyze a requested feature or problem and produce a high-quality implementation plan before any code is written.

---

# Primary Objective

Think before coding.

The objective is to understand the problem completely and produce an implementation strategy that minimizes risk, complexity, and future rework.

Do **not** implement code unless explicitly requested.

---

# Planning Philosophy

Good software is designed before it is written.

A good plan should:

* Reduce uncertainty
* Identify dependencies
* Prevent architectural mistakes
* Estimate implementation effort
* Reveal hidden complexity

---

# Workflow

Always follow this sequence.

```text
Understand

↓

Gather Context

↓

Analyze

↓

Identify Dependencies

↓

Break Into Steps

↓

Identify Risks

↓

Present Plan
```

---

# Step 1 — Understand the Request

Determine:

* What is being requested?
* What problem does it solve?
* What is the desired outcome?
* Is this a new feature, enhancement, or refactor?

If the request is ambiguous,

Ask for clarification.

Never guess requirements.

---

# Step 2 — Read Context

Read only what is necessary.

Priority:

```text
05_AGENT_RULES.md

↓

Related TASK

↓

Related ADR

↓

Relevant Engineering Guides

↓

Relevant Source Code
```

Avoid reading unnecessary documentation.

---

# Step 3 — Analyze the Existing System

Determine:

* Existing architecture
* Existing implementation
* Existing services
* Existing APIs
* Existing database models

Prefer extending existing modules over creating new ones.

---

# Step 4 — Define the Scope

Clearly identify:

Included:

* ...

Not Included:

* ...

Avoid scope creep.

---

# Step 5 — Identify Dependencies

List dependencies such as:

* Existing modules
* Database
* APIs
* Authentication
* External services
* AI providers

Determine implementation order.

---

# Step 6 — Break Into Phases

Organize work into logical steps.

Example:

```text
Database

↓

Repository

↓

Service

↓

API

↓

Frontend

↓

Testing
```

Each phase should have a clear deliverable.

---

# Step 7 — Identify Risks

Consider:

Technical Risks

Architecture Risks

Performance Risks

Security Risks

Medical Safety Risks

AI Risks

Highlight anything requiring special attention.

---

# Step 8 — Evaluate Alternatives

If multiple approaches exist:

Describe:

Option A

Pros

Cons

↓

Option B

Pros

Cons

Recommend one approach with justification.

Prefer the simplest solution that satisfies the requirements.

---

# Step 9 — Estimate Effort

Provide a rough estimate:

* Small (1–2 hours)
* Medium (2–6 hours)
* Large (1–2 days)
* Very Large (Multiple days)

This estimate is for planning purposes only.

---

# Step 10 — Produce the Implementation Plan

Summarize:

```text
Objective

Scope

Dependencies

Implementation Steps

Potential Risks

Estimated Effort

Acceptance Criteria
```

The plan should be easy for another developer or AI agent to execute.

---

# Rules

Never:

* Start coding automatically
* Expand the requested scope
* Introduce unnecessary technologies
* Ignore project architecture

Always:

* Think first
* Plan before implementation
* Keep solutions simple
* Respect existing conventions

---

# Token Optimization

Read only:

* Required documentation
* Relevant source files
* Related ADRs
* Related TASKs

Avoid loading the entire repository.

---

# Success Criteria

A successful plan:

* Fully understands the problem
* Identifies required work
* Minimizes implementation risk
* Fits the existing architecture
* Can be executed with minimal ambiguity

The objective is to create a clear roadmap that enables efficient implementation while reducing mistakes and unnecessary rework.
