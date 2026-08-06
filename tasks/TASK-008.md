# TASK-008.md

**Task ID:** TASK-008

**Title:** Medicine Reminder & Medication Routine System

**Priority:** High

**Status:** Completed


**Estimated Time:** 8–10 Hours

**Owner:** Unassigned

---

# Objective

Implement the medication reminder system.

Using the validated prescription, automatically generate a medication schedule and remind users to take their medicines on time.

This feature should be deterministic.

AI may assist only when prescription instructions cannot be interpreted using predefined rules.

---

# Background

One of MediSync's core features is helping users follow their prescribed medication schedule.

Rather than requiring users to manually create reminders, the application should automatically generate them from prescription data whenever possible.

Architecture:

```text
Validated Prescription

↓

Routine Generator

↓

Reminder Schedule

↓

Notification Service

↓

User
```

Reminder generation should not require AI for standard prescriptions.

---

# Scope

Implement the complete reminder pipeline.

---

## Prescription Interpretation

Extract:

* Medicine
* Dosage
* Frequency
* Duration
* Timing Instructions

Examples:

* Once Daily
* Twice Daily
* Three Times Daily
* Every 8 Hours
* Before Meal
* After Meal
* Before Sleep

Common instructions should be handled using predefined rules.

---

## Routine Generator

Automatically generate:

* Reminder times
* Start date
* End date
* Daily schedule

Example:

```text
Paracetamol

08:00 AM

02:00 PM

08:00 PM
```

The generated schedule should be editable by the user.

---

## User Customization

Allow users to:

* Change reminder times
* Skip reminders
* Pause reminders
* Resume reminders
* Delete reminders

User modifications should not overwrite the original prescription.

---

## Reminder Management

Each reminder should contain:

* Reminder ID
* User ID
* Medicine
* Scheduled Time
* Frequency
* Duration
* Status
* Created At
* Updated At

---

## Notification Service

Support:

* In-app notifications

Design the notification system so additional providers can be added later.

Future support:

* Push Notifications
* Email
* SMS

---

## Reminder History

Track:

* Taken
* Skipped
* Missed

History should be available for future analytics.

---

## Manual Reminder Creation

Allow users to manually create reminders without uploading a prescription.

---

## AI Assistance (Optional)

AI may assist only when prescription instructions cannot be interpreted using deterministic rules.

Example:

Unclear handwriting

↓

AI Interpretation

↓

User Confirmation

↓

Routine Generation

AI should never invent reminder schedules.

---

# API Endpoints

Suggested endpoints:

```text
POST   /reminders/generate

GET    /reminders

GET    /reminders/{id}

PUT    /reminders/{id}

DELETE /reminders/{id}

POST   /reminders/{id}/complete

POST   /reminders/{id}/skip
```

Endpoint naming may vary.

---

# Out of Scope

Do NOT implement:

* Push notification providers
* Email notifications
* SMS reminders
* Smart wearable integration
* Adherence analytics
* Caregiver notifications

These belong to future iterations.

---

# Deliverables

Backend:

* Reminder service
* Routine generator
* Reminder CRUD
* Reminder scheduler
* Reminder history

Frontend:

* Reminder dashboard
* Daily schedule view
* Reminder editor
* Reminder history
* Manual reminder creation

---

# Acceptance Criteria

The task is complete when:

* Prescription schedules are generated automatically.
* Users can edit reminder times.
* Reminder history is recorded.
* Manual reminders can be created.
* Reminder CRUD functions correctly.
* AI is only used for ambiguous prescription instructions.
* Reminder generation remains deterministic for common prescriptions.

---

# Files Expected

Possible modules:

```text
backend/

reminders/

models.py

schemas.py

repository.py

service.py

scheduler.py

router.py

generator.py

frontend/

reminders/

dashboard/

history/

editor/
```

Project organization should follow established architecture.

---

# Dependencies

Requires:

* TASK-001 Project Bootstrap
* TASK-002 Authentication
* TASK-003 Medicine Database
* TASK-004 OCR Pipeline
* TASK-005 Medicine Recognition
* TASK-006 AI Medical Assistant

---

# Related Documents

Read before implementation:

* docs/Engineering/05_AGENT_RULES.md
* docs/Engineering/01_DEVELOPMENT_GUIDE.md
* docs/Engineering/06_AI_DEVELOPMENT_GUIDE.md
* docs/Engineering/08_API_GUIDE.md
* docs/Engineering/09_DATABASE_GUIDE.md
* docs/Engineering/11_TESTING_SECURITY_GUIDE.md
* docs/Engineering/12_ARCHITECTURE.md

Related ADRs:

* ADR-001 Hybrid AI Architecture
* ADR-003 Medical Knowledge Retrieval Strategy
* ADR-005 AI Safety and Medical Moderation
* ADR-008 Reminder Engine Architecture (Future)

---

# Notes

The reminder system should primarily be a rule-based scheduling engine.

Use AI only as a fallback for interpreting ambiguous prescription instructions.

The reminder module should remain independent from the notification delivery mechanism, allowing future integration with push notifications, email, SMS, and mobile platforms without changing the core scheduling logic.
