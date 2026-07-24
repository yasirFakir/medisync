# ADR-001: Adopt a Hybrid AI + Rule-Based + Database Architecture

**Status:** Accepted

**Date:** 2026-07-24

**Decision Makers:**
- Project Lead
- Backend Team
- AI Team

---

# Context

MediSync is being developed as a student project with the long-term goal of becoming a production-ready medical assistant platform.

One of the core features of the application is AI-assisted prescription analysis. However, relying entirely on Large Language Models (LLMs) introduces several problems:

- API costs increase rapidly as the user base grows.
- AI responses are non-deterministic.
- Medical hallucinations can be dangerous.
- AI providers may become unavailable or change pricing.
- Most medical information already exists in structured form and does not require AI reasoning.

The team also has a limited budget and cannot afford commercial AI APIs during development.

Therefore, the architecture must minimize AI usage while still benefiting from AI where traditional programming is insufficient.

---

# Decision

MediSync will adopt a **Hybrid Decision Architecture**.

The system will always attempt deterministic solutions before invoking an AI model.

Decision order:

```
User Request

↓

Business Rules

↓

Database Lookup

↓

RAG (Future)

↓

Medical AI

↓

Moderation

↓

Response
```

AI will only be used when:

- Natural language understanding is required.
- Medical explanation is required.
- OCR output is ambiguous.
- The request cannot be answered using deterministic logic.

---

# Examples

## Example 1

User asks:

> "Is Paracetamol available?"

Implementation:

```
Database

↓

Inventory

↓

Return Result
```

AI is NOT used.

---

## Example 2

User asks:

> "Explain what Metformin does."

Implementation:

```
Database

↓

Medicine Information

↓

AI generates an easy-to-understand explanation

↓

Moderation

↓

Response
```

AI is used only for explanation.

---

## Example 3

User uploads a prescription.

Implementation:

```
Image

↓

OCR

↓

Medicine Parsing

↓

Medicine Database

↓

Missing Context?

↓

YES

↓

Medical AI

↓

Moderation

↓

Response
```

---

## Example 4

User requests reminder generation.

Implementation:

```
Prescription

↓

Extract Dosage

↓

Rule Engine

↓

Reminder Schedule

↓

Store Reminder
```

No AI required.

---

# Alternatives Considered

## Option A — AI for Everything

```
User

↓

LLM

↓

Response
```

### Advantages

- Extremely simple architecture.
- Fast initial development.

### Disadvantages

- High operational cost.
- High hallucination risk.
- Difficult to verify correctness.
- Vendor lock-in.
- Poor scalability.

**Rejected**

---

## Option B — Rule-Based Only

```
Rules

↓

Response
```

### Advantages

- Very low cost.
- Highly deterministic.

### Disadvantages

- Cannot explain medical concepts naturally.
- Poor handling of ambiguous prescriptions.
- Limited user experience.

**Rejected**

---

## Option C — Hybrid Architecture

```
Rules

↓

Database

↓

AI

↓

Moderation
```

### Advantages

- Low operational cost.
- Better reliability.
- Easier maintenance.
- Future-proof.
- Safer medical responses.

### Disadvantages

- Slightly higher implementation complexity.

**Accepted**

---

# Consequences

## Positive

- AI usage reduced significantly.
- Lower API costs.
- Easier migration between AI providers.
- Better system reliability.
- Faster responses for deterministic operations.
- Clear separation between business logic and AI reasoning.

## Negative

- Requires a structured medicine database.
- Additional backend logic is required.
- More engineering effort during initial development.

---

# Implementation Rules

The following rules are mandatory.

## Rule 1

Never call an AI model directly from a controller.

---

## Rule 2

All AI communication must pass through the Medical Intelligence Service.

---

## Rule 3

Always query the database before invoking AI.

---

## Rule 4

Rule-based solutions always take precedence over AI.

---

## Rule 5

AI responses must pass through the moderation layer before being returned to users.

---

## Rule 6

The backend should be capable of replacing one AI provider with another without changing application logic.

---

# Impacted Components

- Medical Intelligence Service
- OCR Pipeline
- Medicine Database
- Reminder Engine
- Pharmacy Inventory
- AI Prompt System
- Backend API
- Moderation Layer

---

# Future Evolution

This decision is intentionally designed to support future enhancements without requiring architectural changes.

Future upgrades may include:

- Local MedGemma deployment
- Vector Database
- Retrieval-Augmented Generation (RAG)
- AI response caching
- Multi-model routing
- Medical knowledge graph
- Offline AI inference

These features should integrate into the existing architecture without altering the established decision flow.

---

# Success Criteria

This ADR is considered successful if:

- More than 70% of user requests are answered without invoking AI.
- AI is only used for reasoning and explanation tasks.
- AI providers can be replaced with minimal code changes.
- Medical responses remain moderated and deterministic wherever possible.
- API costs remain sustainable as the application scales.

---

# Related Documents

- SRS.md
- 06_AI_DEVELOPMENT.md
- 10_DATABASE_GUIDE.md
- 11_API_GUIDE.md
- 12_AI_PROMPT_GUIDE.md
- 13_DECISION_POLICY.md

---

# Rationale

MediSync is a medical application where correctness, safety, and affordability are more important than maximizing AI usage.

Artificial Intelligence should enhance the system—not become the system.

The database stores medical facts.

The rule engine enforces business logic.

AI provides reasoning, explanation, and natural language interaction.

This separation results in a safer, cheaper, and more maintainable architecture.
