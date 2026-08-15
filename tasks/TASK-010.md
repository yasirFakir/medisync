# TASK-010.md

**Task ID:** TASK-010

**Title:** Doctor Review & Rating System (Verified Appointment Prerequisite)

**Priority:** High

**Status:** Todo

**Estimated Time:** 6–8 Hours

**Owner:** Unassigned

---

# Objective

Implement a verified review and rating system that enables patients to rate and review doctors after completing a consultation.

**Prerequisite Enforcement:** A patient **MUST** have a confirmed completed appointment (`status = 'COMPLETED'`) with the doctor to submit a review for them.

---

# Background

To maintain high clinical trust and eliminate fake or unverified feedback, doctor reviews on MediSync are strictly tied to real patient visits.

Architecture:

```text
Completed Doctor Appointment (status = 'COMPLETED')

↓

Verification Gate (Check patient_id + doctor_id + appointment_id)

↓

Review Submission (1-5 Stars + Medical Feedback)

↓

Doctor Rating Aggregation Engine

↓

Doctor Directory & Clinical Profile Cards
```

---

# Scope

Implement the complete doctor review pipeline.

---

## 1. Verified Appointment Gate (Prerequisite)
* Before allowing a patient to review a doctor:
  * Check the `doctor_appointments` table for an appointment record where `patient_id = current_user`, `doctor_id = target_doctor`, and `status = 'COMPLETED'`.
  * If no completed appointment exists, block review submission with a clear explanation: *"You can only review doctors after completing an appointment with them."*
  * Limit to **1 review per completed appointment** to prevent duplicate rating submissions.

---

## 2. Review & Rating Criteria
Allow eligible patients to rate:
* **Overall Rating** (1 to 5 Stars)
* **Category Ratings:**
  * Medical Care Quality (1 to 5 Stars)
  * Wait Time / Punctuality (1 to 5 Stars)
  * Communication & Empathy (1 to 5 Stars)
* Written feedback comment.
* Optional anonymous posting preference.

---

## 3. Rating Aggregation & UI Display
* Compute and update on doctor directory cards ([`DoctorAppointmentsPage.tsx`](file:///home/yasir/Data/dev/Projects/medisync/apps/web-portals/src/pages/DoctorAppointmentsPage.tsx)):
  * Average rating score (e.g. ⭐ 4.9 / 5.0)
  * Total verified reviews count
  * Verified Patient badge indicator on review cards
* Design Theme Tokens: All rating badges, stars, and modals must follow the MediSync Design System (`Plus Jakarta Sans`, Herbal Teal `#00685f`, Surface Container Low `#f0f3ff`).

---

## 4. Doctor Management Portal View
Allow doctors to:
* View patient reviews in their Doctor Portal.
* Post an official doctor response to patient feedback.

---

# API Endpoints

```text
POST   /api/reviews/doctor              - Submit a verified doctor review (Patient)
GET    /api/reviews/doctor/:doctorId    - Get reviews & rating summary for a doctor
GET    /api/reviews/doctor/eligible     - List completed appointments eligible for review
POST   /api/reviews/doctor/:id/response  - Submit official doctor response (Doctor)
```

---

# Database Impact

```sql
CREATE TABLE doctor_reviews (
  review_id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL REFERENCES users(user_id),
  doctor_id VARCHAR(36) NOT NULL REFERENCES users(user_id),
  appointment_id VARCHAR(36) UNIQUE NOT NULL REFERENCES doctor_appointments(appointment_id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  care_quality_rating INT CHECK (care_quality_rating >= 1 AND care_quality_rating <= 5),
  wait_time_rating INT CHECK (wait_time_rating >= 1 AND wait_time_rating <= 5),
  communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5),
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  doctor_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

# Acceptance Criteria

* Patient CANNOT review a doctor without a completed appointment record (`status = 'COMPLETED'`).
* Patient CAN submit a review for a completed appointment.
* Duplicate reviews for the same appointment are rejected.
* Doctor directory cards display accurate aggregated star ratings and total review counts.
* Doctor can view patient reviews and submit official responses.
* UI components follow MediSync design tokens and Plus Jakarta Sans typography.
