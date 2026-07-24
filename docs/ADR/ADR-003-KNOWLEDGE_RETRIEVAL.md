# ADR-003 — Medical Knowledge Retrieval Strategy

**Status:** Accepted

**Date:** 2026-07-24

**Decision Makers:**
- Project Lead
- Backend Team
- AI Team

---

# Problem

A medical assistant requires access to reliable medical information such as:

- Medicine names
- Generic names
- Uses
- Side effects
- Drug interactions
- Contraindications
- Dosage forms
- Manufacturers

LLMs already possess general medical knowledge, but:

- Responses are non-deterministic.
- Information may be outdated.
- Hallucinations are possible.
- Answers cannot always be traced to a verified source.

Using AI as the primary knowledge source is inappropriate for a medical application.

---

# Decision

MediSync will use the database as its primary medical knowledge source.

AI will be used only to interpret, summarize, or explain retrieved information.

Decision flow:

```
User Query

↓

Medicine Database

↓

Knowledge Retrieved

↓

AI Explanation (if required)

↓

Moderation

↓

Response
```

The application retrieves facts.

The AI explains facts.

---

# Why

This architecture provides:

- Deterministic medical data
- Lower hallucination risk
- Faster responses
- Lower AI cost
- Easier verification
- Better maintainability

---

# Rules

### Rule 1

Medicine information must be retrieved from the database whenever available.

---

### Rule 2

AI must never invent medicine information that already exists in the database.

---

### Rule 3

Structured medical knowledge should always take precedence over generated knowledge.

---

### Rule 4

If database information is incomplete, the AI should clearly state uncertainty rather than fabricate missing information.

---

### Rule 5

The database remains the single source of truth for structured medical information.

---

# Medical Knowledge Scope

The database may contain:

- Generic Name
- Brand Name
- Active Ingredient
- Strength
- Dosage Form
- Manufacturer
- Uses
- Side Effects
- Contraindications
- Drug Interactions
- Pregnancy Information
- Storage Instructions
- Prescription Requirement
- References
- Last Updated

Additional fields may be added without changing this architecture.

---

# AI Responsibilities

AI may:

- Explain medicines
- Simplify medical terminology
- Summarize warnings
- Generate patient-friendly explanations
- Compare medicines using retrieved information

AI should not:

- Invent medicine data
- Diagnose diseases
- Recommend dosage changes
- Replace medical professionals

---

# Future Support

The architecture is designed to support future Retrieval-Augmented Generation (RAG).

Future pipeline:

```
User Query

↓

Medicine Database

↓

Vector Database

↓

Retriever

↓

Medical AI

↓

Moderation

↓

Response
```

The application architecture should not require major changes when RAG is introduced.

---

# Consequences

## Advantages

- Lower hallucination risk
- Better medical accuracy
- Reduced AI usage
- Lower operational cost
- Easier auditing
- Future-ready for RAG

## Disadvantages

- Requires maintaining a medicine database
- Knowledge updates become a project responsibility

---

# Related Documents

- 10_DATABASE_GUIDE.md
- 12_AI_PROMPT_GUIDE.md
- 13_DECISION_POLICY.md

---

# Rationale

Medical facts should originate from verified, structured knowledge.

Artificial Intelligence should improve understanding—not replace authoritative medical information.

This approach provides a safer, more reliable, and more scalable foundation for MediSync's medical assistance features.
