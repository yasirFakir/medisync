# TASK-006.md

**Task ID:** TASK-006

**Title:** AI Medical Assistant Integration

**Priority:** High

**Status:** Completed

**Estimated Time:** 10–14 Hours

**Owner:** Unassigned

---

# Objective

Integrate an AI-powered Medical Intelligence Service capable of explaining prescriptions, answering medicine-related questions, and assisting users while following MediSync's safety architecture.

The AI should augment the application—not replace deterministic systems.

---

# Background

By this stage, the application can:

* Authenticate users
* Read prescriptions
* Parse medicines
* Validate medicines using the database

Now the application should provide intelligent explanations while remaining safe and cost-effective.

Architecture:

```text
User Request

↓

Database

↓

Rule Engine

↓

Medical Intelligence Service

↓

Moderation

↓

User Response
```

AI should never be the first source of truth.

---

# Scope

Implement the Medical Intelligence Service.

---

## AI Provider Layer

Create a provider-independent interface.

The application should support future providers without changing business logic.

Possible providers:

* Ollama
* MedGemma
* Gemini
* OpenRouter
* OpenAI

Only one provider needs to be configured for development.

---

## Medical Explanation

Allow users to ask questions such as:

* What is this medicine?
* What is it used for?
* What are the common side effects?
* How should I understand this prescription?
* What precautions should I know?

Responses should be educational rather than diagnostic.

---

## Prescription Explanation

Generate patient-friendly summaries.

Example topics:

* Medicines detected
* Purpose of each medicine
* Daily schedule (summary only)
* Important precautions
* Potential warnings

The explanation should be concise and easy to understand.

---

## AI Service

Create a centralized Medical Intelligence Service.

Responsibilities:

* Prompt generation
* Provider selection
* Response parsing
* Error handling
* Usage tracking
* Moderation integration

Business modules should never communicate directly with AI providers.

---

## Prompt Management

Store prompts separately from application logic.

Prompts should be:

* Versioned
* Reusable
* Easy to modify
* Easy to test

Avoid embedding large prompts directly in source code.

---

## Cost Optimization

Before invoking AI:

```text
Database

↓

Rule Engine

↓

Cache (Future)

↓

AI
```

Avoid unnecessary AI requests.

---

## Usage Monitoring

Track:

* Number of requests
* Provider used
* Response latency
* Token usage (if available)
* Failed requests

This information should support future optimization.

---

## Error Handling

If AI is unavailable:

* Return deterministic database information.
* Explain that advanced AI assistance is temporarily unavailable.
* Never return raw provider errors.

The application should remain functional.

---

# API Endpoints

Suggested endpoints:

```text
POST /ai/explain

POST /ai/medicine

POST /ai/prescription
```

Endpoint naming may vary.

---

# Out of Scope

Do NOT implement:

* Automatic diagnosis
* Disease prediction
* Treatment recommendations
* Prescription generation
* Dosage modification
* Autonomous medical decisions
* RAG
* Vector databases

These belong to future iterations.

---

# Deliverables

Backend:

* Medical Intelligence Service
* AI provider abstraction
* Provider implementation
* Prompt management
* Usage logging
* AI endpoints

Frontend:

* AI assistant page
* Medicine explanation panel
* Prescription explanation view
* Loading and error states

---

# Acceptance Criteria

The task is complete when:

* AI provider is successfully integrated.
* Medicine explanations are generated.
* Prescription explanations are generated.
* AI provider can be replaced with minimal code changes.
* Failed AI requests are handled gracefully.
* AI responses pass through the moderation layer.
* Database information is used before AI whenever possible.

---

# Files Expected

Possible modules:

```text
backend/

ai/

service.py

providers/

base.py

gemini.py

ollama.py

prompts/

moderation.py

router.py

schemas.py

frontend/

assistant/

components/
```

Actual structure should follow project conventions.

---

# Dependencies

Requires:

* TASK-001 Project Bootstrap
* TASK-002 Authentication
* TASK-003 Medicine Database
* TASK-004 OCR Pipeline
* TASK-005 Medicine Recognition

---

# Related Documents

Read before implementation:

* docs/Engineering/AGENT_RULES.md
* docs/Engineering/06_AI_DEVELOPMENT.md
* docs/Engineering/07_AI_PROMPT_GUIDE.md
* docs/Engineering/10_DECISION_POLICY.md

Related ADRs:

* ADR-001 Hybrid AI Architecture
* ADR-002 AI Provider Strategy
* ADR-003 Medical Knowledge Retrieval Strategy
* ADR-005 AI Safety and Medical Moderation

---

# Notes

This task introduces AI into MediSync, but AI is not the application's primary source of knowledge.

Always prioritize:

1. Database
2. Rule Engine
3. AI
4. Moderation

The Medical Intelligence Service should remain modular, provider-independent, and cost-aware.

The implementation should make it easy to switch between local models (e.g., MedGemma via Ollama) and cloud providers without changing application business logic.
