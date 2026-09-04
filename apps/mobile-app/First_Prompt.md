You are setting up an autonomous development workflow for this project.

IMPORTANT CONTEXT:

This workspace: /data/rspace/codespace/projects/medisync contains an existing WEB APPLICATION.

I am now building an ANDROID APPLICATION that should provide the same core product functionality as the existing web application.

The web application is the existing source of truth for:

* product behavior
* features
* business rules
* user flows
* API usage
* validation
* permissions
* error handling
* data behavior

The Android app should NOT invent a different product. It should provide equivalent functionality through an appropriate native Android UX.

Your task in this phase is NOT to build the Android application.

Your task is to:

1. Understand the existing web application deeply.
2. Extract its actual product behavior into documentation.
3. Understand the existing technical architecture/API.
4. Design an autonomous multi-agent development workflow for building the Android application.
5. Create the required Antigravity agent definitions, rules, skills, and workflows.
6. Do not modify production application behavior during this setup.

---

# PHASE 1 — FULL REPOSITORY DISCOVERY

First inspect the entire workspace.

Determine:

* where the web application lives
* frontend framework
* backend/API architecture
* database/data layer
* authentication
* authorization
* routing/navigation
* state management
* API endpoints
* data models
* validation
* error handling
* existing tests
* existing documentation
* build/run commands
* environment configuration
* existing agent configuration
* existing `.agents` directory if present
* any existing MCP/tools/scripts relevant to development

Do not assume anything about the architecture.

Do not start implementing Android code.

Do not make broad refactors.

Do not modify production source code unless absolutely necessary to create the documentation/configuration requested in this task.

---

# PHASE 2 — UNDERSTAND THE WEB APPLICATION AS A PRODUCT

Treat the existing web application as the behavioral source of truth.

Inspect the actual implementation, not just README files.

Identify:

## Features

Create an inventory of the application's currently implemented features.

For every feature determine:

* purpose
* entry point
* user flow
* inputs
* outputs
* validation
* success behavior
* failure behavior
* loading states
* empty states
* permission requirements
* relevant API calls
* relevant data models

## User Flows

Document important end-to-end flows.

For example:

Login
→ Dashboard
→ Create item
→ Save
→ Item appears
→ Edit
→ Delete

Use the actual application's behavior rather than hypothetical behavior.

## Business Rules

Identify rules that must remain consistent across web and Android.

Examples:

* validation rules
* calculations
* permissions
* state transitions
* limits
* required fields
* error conditions

## API Contract

Document the APIs used by the web application where they are discoverable.

Include:

* endpoint
* HTTP method
* request structure
* response structure
* authentication
* errors
* important fields

Do NOT expose secrets, tokens, API keys, passwords, or private credentials in generated documentation.

---

# PHASE 3 — CREATE THE PRODUCT SPECIFICATION

Create a documentation structure appropriate for this repository.

Prefer existing documentation conventions if they already exist.

Otherwise create something similar to:

docs/
product/
FEATURES.md
USER_FLOWS.md
BUSINESS_RULES.md
API_CONTRACT.md
ACCEPTANCE_CRITERIA.md
PLATFORM_PARITY.md

The documentation must distinguish between:

IMPLEMENTED
PARTIALLY IMPLEMENTED
PLANNED
UNKNOWN

Do not present assumptions as implemented functionality.

The purpose of this documentation is to allow an Android developer agent to understand what the product actually does without repeatedly reverse-engineering the web application.

---

# PHASE 4 — DEFINE PLATFORM PARITY

Create a PLATFORM_PARITY.md document.

This is extremely important.

The Android application should provide equivalent product functionality to the web application.

Define parity at the behavioral level, not necessarily at the UI level.

For example:

WEB:
Sidebar → Dashboard → Modal

ANDROID:
Navigation → Dashboard → Bottom Sheet

This is acceptable if the user can perform the same operation and the resulting behavior is equivalent.

Document:

* features that Android must support
* features that may use Android-specific UX
* features that are intentionally platform-specific
* features that are not yet implemented on Android

Do not force the Android application to visually copy the web application.

The goal is functional/product parity with appropriate native Android UX.

---

# PHASE 5 — DESIGN THE AGENT SYSTEM

Create a small, specialized agent system.

Do NOT create dozens of agents.

Use these core roles:

## 1. Web Analyst / Product Agent

Responsibilities:

* inspect the web application
* maintain product documentation
* identify existing behavior
* identify changes to the web product
* maintain parity documentation

It must NOT casually modify production code.

---

## 2. Android Architect

Responsibilities:

* translate web product behavior into Android architecture
* determine appropriate Android UX
* identify affected Android modules
* create implementation plans
* identify dependencies
* identify tests
* preserve existing Android architecture

It should not redesign the entire Android application for every feature.

---

## 3. Android Builder

Responsibilities:

* implement Android features
* Kotlin
* Jetpack Compose where applicable
* networking
* persistence
* state management
* navigation
* tests

The Builder must follow the Architect's plan and existing project conventions.

---

## 4. Android Tester

Responsibilities:

* unit tests
* integration tests
* instrumentation tests
* Compose UI tests where applicable
* regression tests
* Gradle build/test/lint verification

It must report actual results.

It must not claim success based only on source-code inspection.

---

## 5. Android UI / Emulator QA

Responsibilities:

* build APK
* install APK
* launch application
* interact with emulator
* execute acceptance criteria
* test important user flows
* verify navigation
* verify loading/error/empty states
* inspect Logcat
* detect crashes
* capture screenshots when useful

This agent represents actual user-level verification.

---

## 6. Cross-Platform Reviewer

Responsibilities:

Compare:

WEB PRODUCT BEHAVIOR
against
ANDROID IMPLEMENTATION

Verify:

* feature parity
* business-rule parity
* API behavior
* validation
* error handling
* permissions
* important edge cases

The reviewer must identify missing Android functionality.

The Android implementation must not be considered complete simply because its own tests pass.

---

# PHASE 6 — SHARED RULES

Create shared rules that apply to all relevant agents.

At minimum define:

## Source of Truth

The existing web application is the primary source of truth for product behavior.

Documentation is the extracted representation of that behavior.

Android implementation must follow the documented product behavior unless a deliberate platform-specific decision is documented.

## No Invented Functionality

Agents must not invent product requirements.

If behavior cannot be determined:

MARK AS UNKNOWN

and request clarification rather than guessing.

## Definition of Done

A feature is complete only when:

* requirements are satisfied
* implementation is complete
* relevant automated tests pass
* build succeeds
* lint/static checks pass
* Android UI verification passes where applicable
* emulator verification passes where applicable
* important acceptance criteria are verified
* platform parity is verified
* documentation is updated where necessary

## Evidence-Based Completion

Agents must never say:

"Looks good."

or:

"Should work."

as the final verification.

They must provide evidence:

* test results
* build results
* emulator results
* screenshots/logs where useful
* comparison against acceptance criteria

## Safe Changes

Agents must:

* avoid unrelated modifications
* preserve working functionality
* not weaken or delete tests merely to make them pass
* not hide errors
* not modify secrets
* not introduce unnecessary dependencies
* not refactor unrelated areas without justification

---

# PHASE 7 — CREATE REUSABLE SKILLS

Create only useful skills.

At minimum evaluate whether the project needs:

* web application analysis
* Android development
* Jetpack Compose
* Android testing
* Android emulator QA
* cross-platform parity verification

Before creating anything, inspect whether equivalent skills already exist.

Skills should contain project-specific knowledge and procedures rather than generic textbook information.

---

# PHASE 8 — CREATE WORKFLOWS

Create reusable workflows for:

## Feature Development

Web/Product Analysis
→ Requirements
→ Android Architecture
→ Implementation
→ Automated Tests
→ Emulator/UI QA
→ Cross-Platform Review
→ Complete

If verification fails:

→ Android Builder
→ Tests
→ QA
→ Review

---

## Bug Fix

Reproduce
→ Diagnose
→ Fix
→ Regression Test
→ Emulator Verification
→ Cross-Platform Verification
→ Review

---

## Web Feature Synchronization

When a feature changes in the web application:

Web Analysis
→ Update Product Documentation
→ Identify Android Impact
→ Create Android Tasks
→ Implement
→ Test
→ Verify Parity

---

## Sprint

Review outstanding Android work
→ identify independent tasks
→ plan
→ implement
→ verify
→ review
→ produce sprint report

---

# PHASE 9 — ANTIGRAVITY-NATIVE DESIGN

Use the native Antigravity mechanisms available in this environment.

Do not create a custom Python/Node multi-agent framework unless there is a demonstrated need.

Prefer:

* native agents/subagents
* native workflows
* native skills
* native rules
* terminal tools
* browser capabilities
* Android emulator tooling
* existing project scripts

The goal is to configure Antigravity as an autonomous development environment, not to build another agent framework inside the repository.

---

# PHASE 10 — DO NOT BUILD THE ANDROID APP YET

This task is ONLY the bootstrap/configuration phase.

Do not:

* implement Android features
* redesign the web app
* refactor the backend
* change APIs
* change database schemas
* add unnecessary dependencies
* rewrite existing application code

Only create/update the documentation and agent/workflow configuration necessary for this autonomous development system.

---

# PHASE 11 — SELF-AUDIT

Before finishing:

Check that:

1. The web application's actual behavior is documented.
2. Important features are identified.
3. Important user flows are identified.
4. Business rules are identified.
5. API behavior is documented where discoverable.
6. Android parity requirements are defined.
7. Agent responsibilities are clearly separated.
8. No agent has unnecessarily overlapping authority.
9. Workflows have explicit verification stages.
10. Failed work has a path back to implementation/fixing.
11. The definition of done is objective.
12. No production functionality was accidentally changed.
13. No secrets were written into documentation.
14. The resulting system is maintainable rather than over-engineered.

---

# FINAL REPORT

When finished, give me:

1. What you discovered about the web application.
2. What documentation you created.
3. What agents you created.
4. What skills you created.
5. What rules you created.
6. What workflows you created.
7. What existing Antigravity capabilities you are relying on.
8. Any limitations that still require manual setup.
9. The exact first test I should run to verify that the autonomous workflow is working.

Do not claim full autonomy unless it is actually configured and verified.

The goal is:

I define a feature or sprint.

Antigravity analyzes the existing web product, plans the Android implementation, builds it, tests it, runs it on the emulator, verifies the UI, checks parity with the web application, fixes failures, and presents me with an auditable result.

I should NOT have to babysit individual implementation steps.
