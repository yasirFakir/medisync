# ADR-004 — OCR Processing Pipeline

**Status:** Accepted

**Date:** 2026-07-24

**Decision Makers:**
- Project Lead
- Backend Team
- AI Team

---

# Problem

One of MediSync's primary features is reading handwritten or printed medical prescriptions.

Prescription analysis involves multiple independent tasks:

- Image processing
- Text extraction
- Medicine identification
- Medical reasoning
- Reminder generation

Attempting to perform all of these tasks in a single AI prompt would:

- Increase token usage
- Increase cost
- Reduce reliability
- Make debugging difficult
- Increase hallucination risk

A modular processing pipeline is required.

---

# Decision

Prescription processing will be divided into independent stages.

Pipeline:

```
Prescription Image

↓

Image Validation

↓

OCR Engine

↓

Raw Text

↓

Medicine Parser

↓

Medicine Database Lookup

↓

Medical Intelligence Service (If Needed)

↓

Moderation

↓

Final Response
```

Each stage has a single responsibility.

---

# Why

Separating the pipeline provides:

- Better debugging
- Lower AI usage
- Higher OCR accuracy
- Easier testing
- Better scalability
- Lower operational cost

Each stage can be improved independently.

---

# Stage Responsibilities

## Stage 1 — Image Validation

Verify:

- Supported format
- File size
- Image quality
- Corruption

Reject invalid files immediately.

---

## Stage 2 — OCR

OCR is responsible only for:

- Reading text
- Preserving layout
- Returning confidence scores

OCR should never interpret medical meaning.

---

## Stage 3 — Medicine Parser

The parser extracts:

- Medicine names
- Strength
- Frequency
- Duration
- Dosage instructions

This stage converts OCR text into structured data.

---

## Stage 4 — Database Lookup

Search the medicine database for:

- Generic name
- Brand name
- Side effects
- Drug interactions
- Alternatives
- Availability

This stage retrieves structured knowledge.

---

## Stage 5 — Medical Intelligence

AI is used only when:

- OCR output is ambiguous.
- User requests explanation.
- Medical reasoning is required.
- Natural language interpretation is necessary.

AI should not replace earlier pipeline stages.

---

## Stage 6 — Moderation

Every AI response must be reviewed.

Moderation should detect:

- Unsafe recommendations
- Unsupported medical claims
- Confident diagnoses
- Dangerous dosage advice

Unsafe responses should never reach the user.

---

# Rules

### Rule 1

OCR performs extraction only.

---

### Rule 2

Medicine parsing is deterministic.

---

### Rule 3

Database lookup occurs before AI.

---

### Rule 4

AI is optional—not mandatory.

---

### Rule 5

Every stage should produce structured output.

---

### Rule 6

Failures in one stage should not compromise unrelated stages.

---

# Failure Strategy

If OCR fails:

```
Return OCR Error

↓

Request Better Image
```

If medicine parsing fails:

```
Return Partial Extraction

↓

Highlight Uncertain Text
```

If AI fails:

```
Use Database Information

↓

Return Limited Response
```

The pipeline should degrade gracefully.

---

# Future Support

The pipeline should allow future integration of:

- Better OCR engines
- Handwriting recognition
- Multi-language OCR
- Confidence scoring improvements
- Prescription layout detection
- RAG-based medicine retrieval

Each component should be replaceable without redesigning the entire system.

---

# Consequences

## Advantages

- Modular architecture
- Easier debugging
- Better testing
- Lower AI cost
- Improved maintainability
- Independent component upgrades

## Disadvantages

- More backend components
- Additional implementation effort

---

# Related Documents

- SRS.md
- 03_DEBUGGING_GUIDE.md
- 06_AI_DEVELOPMENT.md
- 10_DATABASE_GUIDE.md
- 11_API_GUIDE.md
- 12_AI_PROMPT_GUIDE.md
- 13_DECISION_POLICY.md

---

# Rationale

OCR is the foundation of MediSync.

Treating OCR as a modular processing pipeline instead of a single AI task produces a system that is more reliable, easier to maintain, and significantly more cost-efficient.

Each stage should solve one problem well, rather than attempting to solve the entire prescription analysis process at once.
