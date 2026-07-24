# TASK-005.md

**Task ID:** TASK-005

**Title:** Medicine Recognition & Prescription Validation

**Priority:** Critical

**Status:** Todo

**Estimated Time:** 8–10 Hours

**Owner:** Unassigned

---

# Objective

Connect the OCR pipeline with the Medicine Database to automatically recognize medicines from prescriptions.

This task converts raw OCR output into verified medicine records.

No AI should be used unless deterministic matching fails.

---

# Background

After OCR extracts prescription text, the application must determine whether the extracted medicines exist in the database.

This stage acts as the bridge between OCR and the AI layer.

Architecture:

```text
OCR Output

↓

Medicine Matching

↓

Database Lookup

↓

Validation

↓

Verified Prescription
```

This is a deterministic process.

---

# Scope

Implement the medicine recognition pipeline.

---

## Medicine Matching

For every extracted medicine:

* Search database
* Match by Brand Name
* Match by Generic Name
* Match by Synonyms (Future)

Return the best matching medicine.

---

## Fuzzy Matching

Implement fuzzy searching for OCR mistakes.

Examples:

```
Paracetamol

↓

Paracetamol
```

```
Amoxilin

↓

Amoxicillin
```

The matching threshold should be configurable.

---

## Strength Verification

Validate medicine strength.

Example:

```
Paracetamol

500mg
```

If OCR extracts:

```
500 mq
```

Normalize when confidence is high.

Otherwise mark as uncertain.

---

## Prescription Validation

For every medicine determine:

* Found in database
* Confidence
* Possible alternatives
* Unknown medicine

Unknown medicines should never crash the pipeline.

---

## Unknown Medicine Handling

If a medicine cannot be matched:

Return:

* Original OCR text
* Confidence
* Unknown status

Do not fabricate a match.

---

## Response Model

Suggested structure:

```text
Prescription

↓

Medicine

↓

Matched Database Record

↓

Confidence

↓

Validation Status
```

---

## API Endpoint

Suggested endpoint:

```
POST /prescription/validate
```

Input:

Structured OCR output

Output:

Validated prescription

---

# Out of Scope

Do NOT implement:

* AI explanations
* Drug interaction analysis
* Reminder generation
* Pharmacy availability
* Medicine alternatives
* Medical reasoning

These belong to later tasks.

---

# Deliverables

Backend:

* Medicine matching service
* Validation service
* Fuzzy search implementation
* Validation endpoint

Frontend:

* Prescription validation page
* Confidence indicators
* Unknown medicine highlighting

---

# Acceptance Criteria

The task is complete when:

* OCR medicines are matched against the database.
* OCR spelling mistakes are handled gracefully.
* Unknown medicines are identified correctly.
* Confidence scores are returned.
* Structured validated prescription is generated.
* No AI is required for successful validation.

---

# Files Expected

Possible modules:

```text
backend/

matching/

service.py

validator.py

fuzzy.py

router.py

schemas.py
```

Project organization should follow established conventions.

---

# Dependencies

Requires:

* TASK-001 Project Bootstrap
* TASK-002 Authentication
* TASK-003 Medicine Database
* TASK-004 OCR Pipeline

---

# Related Documents

Read before implementation:

* docs/Engineering/AGENT_RULES.md
* docs/Engineering/09_DATABASE_GUIDE.md
* docs/Engineering/08_API_GUIDE.md

Related ADRs:

* ADR-001 Hybrid AI Architecture
* ADR-003 Medical Knowledge Retrieval Strategy
* ADR-004 OCR Processing Pipeline

---

# Notes

This task intentionally avoids AI.

Medicine recognition should rely on deterministic database matching and configurable fuzzy search.

Only when structured matching cannot confidently resolve a medicine should future AI components be considered.

The output of this task becomes the primary input for AI explanations, medicine alternatives, pharmacy lookup, and reminder generation.
