# TASK-004.md

**Task ID:** TASK-004

**Title:** OCR Pipeline & Prescription Parsing

**Priority:** Critical

**Status:** Completed

**Estimated Time:** 8–12 Hours

**Owner:** Unassigned

---

# Objective

Implement the complete OCR pipeline capable of extracting structured medicine information from uploaded prescriptions.

This task is responsible only for extracting and structuring prescription data.

It must **not** perform medical reasoning or AI-assisted interpretation.

---

# Background

Prescription OCR is the core feature of MediSync.

The pipeline should transform a prescription image into structured, machine-readable data that downstream modules can process.

The architecture follows:

```text
Image

↓

Validation

↓

OCR

↓

Text Cleaning

↓

Medicine Parsing

↓

Structured Output
```

No AI should be involved in this pipeline unless explicitly required for future enhancements.

---

# Scope

Implement the complete OCR workflow.

---

## Image Upload

Support:

* JPG
* JPEG
* PNG
* PDF (optional for MVP)

Validate:

* File type
* File size
* Image readability

Reject invalid files before OCR.

---

## OCR Engine

Use:

* PaddleOCR

Design the system so OCR engines can be replaced later.

Responsibilities:

* Extract text
* Preserve reading order
* Return confidence scores when available

OCR should not interpret medical meaning.

---

## Text Cleaning

Normalize OCR output by:

* Removing unnecessary whitespace
* Correcting common OCR artifacts
* Standardizing line breaks
* Preserving medicine-related formatting

This stage should remain deterministic.

---

## Prescription Parser

Convert cleaned text into structured prescription data.

Extract when possible:

* Medicine Name
* Strength
* Dosage
* Frequency
* Duration
* Special Instructions

Unrecognized fields should be marked as unknown rather than guessed.

---

## Confidence Handling

For each extracted field:

* High confidence
* Medium confidence
* Low confidence

Fields with low confidence should be highlighted for user review.

---

## OCR Result Model

Create a structured response model.

Suggested format:

```text
Prescription

Medicine

Strength

Frequency

Duration

Instructions

Confidence

Raw OCR Text
```

Actual implementation may vary.

---

## API Endpoint

Suggested endpoint:

```text
POST /ocr/prescription
```

Accept:

* Multipart image upload

Return:

* Structured prescription object

---

# Out of Scope

Do NOT implement:

* Medicine explanation
* Drug interactions
* Alternative medicines
* AI interpretation
* Reminder generation
* Pharmacy availability

These are separate tasks.

---

# Deliverables

Backend:

* OCR service
* OCR parser
* OCR schemas
* OCR endpoint
* Image validation

Frontend:

* Prescription upload page
* Upload progress indicator
* OCR result preview

---

# Acceptance Criteria

The task is complete when:

* Prescription images upload successfully.
* OCR extracts readable text.
* Medicines are parsed into structured objects.
* Confidence information is available.
* Invalid images are rejected.
* OCR errors are handled gracefully.
* Structured data is returned through the API.

---

# Files Expected

Possible modules:

```text
backend/

ocr/

service.py

parser.py

cleaner.py

schemas.py

router.py

frontend/

ocr/

upload/

results/
```

Actual organization should follow established architecture.

---

# Dependencies

Requires:

* TASK-001 Project Bootstrap
* TASK-002 Authentication
* TASK-003 Medicine Database

---

# Related Documents

Read before implementation:

* docs/Engineering/AGENT_RULES.md
* docs/Engineering/01_DEVELOPMENT_GUIDE.md
* docs/Engineering/08_API_GUIDE.md
* docs/Engineering/12_ARCHITECTURE.md

Related ADRs:

* ADR-001 Hybrid AI Architecture
* ADR-003 Medical Knowledge Retrieval Strategy
* ADR-004 OCR Processing Pipeline

---

# Notes

This task should focus exclusively on **accurate extraction**.

Do not attempt to "understand" prescriptions using AI.

The output of this task becomes the input for medicine matching, AI explanation, reminder generation, and pharmacy lookup in subsequent tasks.

The OCR pipeline should be deterministic, modular, and independently testable.
