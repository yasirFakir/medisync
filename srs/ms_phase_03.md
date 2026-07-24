# Phase 03
# Functional Requirements

---

# 3. Functional Requirements

This section defines the core functionality that MediSync shall provide.

Each requirement describes the expected behavior of the system independent of implementation details.

---

## 3.0 Engine Responsibilities Separation

To ensure safety, deterministic accuracy, and cost-efficiency, the system clearly separates responsibilities between rule-based logic and AI-based intelligence:

### Rule Engine
The Rule Engine is responsible for:
- Reminders (scheduling, triggering)
- Schedule parsing (extracting standard frequencies from prescription text)
- Medicine alternatives (deterministic substitution mapping)
- Pharmacy lookup (inventory database query)
- Dosage parsing (standard unit and quantity extraction)

### Medical Intelligence Service
The Medical Intelligence Service is responsible for:
- Explanations (simplifying medical jargon for patients)
- Summarization (summarizing medical notes and prescription instructions)
- Educational answers (answering general drug usage queries)
- Ambiguity resolution (interpreting complex or non-standard instructions before mapping them to the rule engine)

---

# 3.1 User Authentication Module

## FR-001 User Registration

The system shall allow new users to register using:

- Full Name
- Email Address
- Password

The system shall:

- validate user input
- ensure email uniqueness
- securely hash passwords before storage
- require email verification before account activation

---

## FR-002 User Login

The system shall allow registered users to authenticate using their email address and password.

Upon successful authentication, the user shall be granted access to their dashboard.

Invalid login attempts shall return a generic authentication error without revealing whether the email exists.

---

## FR-003 Password Recovery

The system shall allow users to reset forgotten passwords through email verification.

Password reset links shall expire after a configurable period.

---

# 3.2 User Profile Module

## FR-004 Profile Management

Users shall be able to:

- update personal information
- change password
- update notification preferences
- configure reminder preferences

The system shall maintain profile history where applicable.

---

# 3.3 Prescription Upload Module

This module represents the primary feature of MediSync.

---

## FR-005 Upload Prescription

Users shall be able to upload prescriptions using supported image formats.

Initially supported formats:

- JPG
- JPEG
- PNG
- PDF

Future versions may support additional formats.

---

## FR-006 Prescription Validation

The system shall validate uploaded files before processing.

Validation shall include:

- supported file type
- maximum file size
- readable image quality
- corruption detection

Invalid files shall be rejected with descriptive error messages.

---

## FR-007 Prescription Storage

Uploaded prescriptions shall be stored securely and associated with the uploading user's account.

Each uploaded prescription shall receive a unique identifier.

---

# 3.4 OCR Processing Module

This is the primary intelligence feature of the application.

---

## FR-008 OCR Processing

The system shall extract structured prescription information from uploaded images.

Extracted information may include:

- medicine name
- dosage
- frequency
- duration
- timing instructions
- physician notes (if recognizable)

The system shall preserve the original uploaded prescription.

---

## FR-009 OCR Review

Users shall be able to review extracted information before saving.

Users may:

- edit medicine names
- edit dosage
- edit duration
- remove incorrect entries
- add missing medicines

No OCR result shall be permanently saved without user confirmation.

---

## FR-010 OCR Failure Handling

If OCR processing fails, the system shall:

- notify the user
- preserve the uploaded image
- allow manual data entry
- allow retrying OCR

The application shall never silently discard uploaded prescriptions.

---

# 3.5 Medicine Information Module

---

## FR-011 Medicine Explanation

Users shall be able to view simplified explanations for extracted medicines.

The explanation may include:

- common usage
- medicine category
- administration guidance
- common side effects
- precautions

The system shall present explanations using patient-friendly language.

---

## FR-012 Medicine Information

The system shall display available medicine information including:

- brand name
- generic name
- salt composition
- dosage strength
- manufacturer
- medicine category

when available.

---

# 3.6 Generic Medicine Recommendation Module

---

## FR-013 Alternative Medicine Suggestions

The system shall identify medicines with equivalent active ingredients when available.

Suggestions may include:

- lower-cost brands
- generic medicines
- equivalent alternatives

Alternative recommendations shall be based on medicine composition rather than brand names whenever possible.

---

## FR-014 Recommendation Disclaimer

Whenever alternative medicines are displayed, the application shall clearly inform users that medication changes should only be made after consulting a qualified healthcare professional.

The system shall never recommend replacing prescribed medicines autonomously.

---

# 3.7 AI Medical Assistant Module

---

## FR-015 AI Question Answering

Users shall be able to ask questions related to medicines contained within their prescriptions.

Example questions:

- What is this medicine used for?
- Should I take this before meals?
- What happens if I miss one dose?

---

## FR-016 AI Context Awareness

When answering questions, the AI assistant should utilize available prescription context to provide more relevant explanations.

The system shall avoid requesting information already available within the user's prescription whenever possible.

---

## FR-017 AI Response Moderation

All AI-generated responses shall pass through a moderation layer before being presented to users.

The moderation layer shall prevent:

- medical diagnosis
- dosage modification
- emergency treatment advice
- prescription replacement
- unsafe recommendations
- overconfident language

---

## FR-018 AI Transparency

Whenever an AI-generated response is displayed, the application shall indicate that the information was generated by artificial intelligence and is intended for informational purposes only.

---

# 3.8 Reminder Module

---

## FR-019 Automatic Reminder Generation

After OCR confirmation, the system shall automatically generate a medication schedule based on extracted prescription information.

Reminder generation shall use deterministic scheduling logic whenever possible.

Artificial Intelligence shall only be used when prescription instructions cannot be interpreted through rule-based processing.

---

## FR-020 Reminder Management

Users shall be able to:

- enable reminders
- disable reminders
- edit reminder times
- delete reminders
- postpone reminders

---

## FR-021 Reminder Notifications

The system shall notify users according to configured reminder schedules.

Notifications may include:

- medicine name
- dosage
- scheduled time
- optional notes

---

## FR-022 Medication Tracking

Users shall be able to mark medicines as:

- Taken
- Skipped
- Missed

The application shall maintain a medication history log.

---

# 3.9 Prescription History Module

---

## FR-023 Prescription Archive

The system shall maintain a searchable history of uploaded prescriptions.

Users shall be able to:

- browse previous prescriptions
- search prescriptions
- reopen prescription details
- review extracted medicines

---

## FR-024 Prescription Editing

Users shall be able to update OCR-generated information after initial confirmation.

The system shall preserve an edit history whenever practical.

---

# 3.10 Pharmacy Inventory Module

---

## FR-025 Pharmacy Search

Users shall be able to search partner pharmacies for medicine availability.

Search results may include:

- pharmacy name
- availability
- estimated price
- distance (future)
- operating hours

---

## FR-026 Inventory Updates

Partner pharmacies shall be able to update:

- stock availability
- medicine pricing
- operating hours

Changes should become visible to users without requiring application updates.

---

# 3.11 Dashboard Module

---

## FR-027 Patient Dashboard

The patient dashboard shall summarize:

- upcoming reminders
- active medicines
- recent prescriptions
- AI conversations
- reminder statistics

---

# 3.12 Notifications Module

---

## FR-028 System Notifications

The application shall notify users regarding:

- reminder events
- OCR completion
- AI processing completion
- account activity
- pharmacy availability updates (future)

---

# 3.13 Administrative Module

---

## FR-029 Medicine Database Management

Administrators shall be able to:

- create medicine entries
- edit medicine information
- remove obsolete entries
- manage generic mappings

---

## FR-030 Pharmacy Management

Administrators shall be able to:

- approve pharmacies
- suspend pharmacies
- verify pharmacy information
- monitor inventory synchronization

---

## FR-031 User Management

Administrators shall be able to:

- suspend accounts
- restore accounts
- view audit logs
- investigate abuse reports

---

# 3.14 Functional Constraints

The system shall not:

- diagnose diseases
- prescribe medication
- replace physicians
- modify prescriptions without user confirmation
- automatically replace medicines
- guarantee medical correctness
- provide emergency medical advice

All potentially risky medical decisions shall remain the responsibility of qualified healthcare professionals.

---

# Phase Summary

This phase defines the complete functional behavior expected from MediSync.

The requirements described in this section specify **what** the system must accomplish while remaining independent of implementation technologies.

Subsequent phases will define **how** these requirements are realized through architecture, artificial intelligence, databases, APIs, and system infrastructure.
