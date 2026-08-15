# TASK-012.md

**Task ID:** TASK-012

**Title:** Doctor Site & Clinical Portal Complete Implementation

**Priority:** High

**Status:** Todo

**Estimated Time:** 12–16 Hours

**Owner:** Unassigned

---

# Objective

Implement the complete end-to-end **Doctor Portal** (`apps/doctor` / Doctor Site) for MediSync.

This task covers backend clinical endpoints, single-use 6-digit EHR verification gates, appointment request management, chamber schedule configuration, patient registry, clinical observation logging, and doctor dashboard widgets.

---

# Background

MediSync provides dedicated portal views for Patients, Doctors, Pharmacies, and Admins.

The Doctor Portal enables physicians to:
1. Verify patient authorization via single-use 6-digit EHR OTPs.
2. Inspect digitized prescription history, patient timelines, and chronic health backgrounds.
3. Record new clinical observations, notes, and medication regimens during patient visits.
4. Manage patient appointment requests (Approve, Decline, Complete, Cancel).
5. Configure consultation chambers, available days, hours, and daily patient capacity limits.
6. Manage doctor profile coordinates and professional designations.

Architecture:

```text
Doctor Login (DOCTOR Role)

↓

Doctor Dashboard (Clinical Overview & Queue)

↓

┌───────────────────────┼───────────────────────┬───────────────────────┐
▼                       ▼                       ▼                       ▼
EHR OTP Verification    Appointment Requests    Patient Registry        Chamber Schedule
(6-Digit Gate)          (Approve/Decline/Done)  (Clinical Directory)    (Days, Hours, Seats)
│
▼
Patient EHR Viewer & Observation Form
```

---

# Step-by-Step Task Breakdown

---

### Step 1: Database Schema & Prisma Models (`apps/backend/prisma/schema.prisma`)
* **Task 1.1:** Verify and extend doctor-related data models:
  * `DoctorProfile` (user_id, specialization, designation, hospital_name, city, bio, consultation_fee).
  * `DoctorAvailabilitySlot` (slot_id, doctor_id, location_name, address, day_of_week, start_time, end_time, max_patients, is_active).
  * `DoctorAppointment` (appointment_id, patient_id, doctor_id, slot_id, appointment_date, status, reason_for_visit, cancellation_reason).
  * `ClinicalObservation` (observation_id, patient_id, doctor_id, appointment_id, diagnosis, notes, prescribed_medicines, created_at).
* **Task 1.2:** Generate migration or run schema update script.

---

### Step 2: Express Backend APIs (`apps/backend/src/controllers/` & `routes/`)
* **Task 2.1 — Doctor Profile API (`/api/doctor/profile`):**
  * `GET /api/doctor/profile` — Get doctor details & chamber configurations.
  * `PUT /api/doctor/profile` — Update professional details & specialization.
* **Task 2.2 — Chamber Availability API (`/api/doctor/availability`):**
  * `POST /api/doctor/availability` — Create new chamber schedule slot.
  * `GET /api/doctor/availability` — List active slots for doctor.
  * `DELETE /api/doctor/availability/:slotId` — Deactivate slot.
* **Task 2.3 — Appointment Management API (`/api/doctor/appointments`):**
  * `GET /api/doctor/appointments` — Fetch appointments with status filters (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
  * `PATCH /api/doctor/appointments/:id/status` — Change appointment status (`CONFIRMED`, `COMPLETED`, `CANCELLED`).
* **Task 2.4 — Patient Registry & EHR Access API (`/api/doctor/patients` & `/api/ehr`):**
  * `POST /api/ehr/verify-otp` — Verify 6-digit OTP provided by patient and issue temporary session grant.
  * `GET /api/doctor/patients/:patientId/ehr` — Fetch patient's digitized prescriptions, history, and past observations.
  * `POST /api/doctor/patients/:patientId/observations` — Log new clinical visit note & diagnosis.

---

### Step 3: Doctor Layout & Branding (`apps/web-portals/src/components/PortalLayout.tsx`)
* **Task 3.1:** Ensure doctor portal role styling uses emerald green accents (`#059669` / `#00685f`).
* **Task 3.2:** Verify Doctor navigation menu items:
  1. `Clinical Overview` (`/dashboard`)
  2. `Patient Directory` (`/patients`)
  3. `EHR Access Verification` (`/ehr`)
  4. `Session Logs` (`/sessions`)
  5. `Appointments` (`/doctor-appointments`)
  6. `My Profile` (`/profile`)

---

### Step 4: Doctor Dashboard View (`/dashboard`)
* **Task 4.1:** Render summary stat cards:
  * Active Patients Count
  * Today's Scheduled Appointments
  * Pending Requests
  * Verified EHR Access Sessions
* **Task 4.2:** Build Today's Consultation Queue widget with quick action buttons (*View Patient EHR*, *Mark Completed*).

---

### Step 5: Secure EHR Access Verification Gate (`/ehr`)
* **Task 5.1:** Build 6-digit OTP input form with validation.
* **Task 5.2:** On successful OTP entry, redirect to `/ehr/:patientId` with active session token.
* **Task 5.3:** Handle expired or invalid OTP error messages gracefully.

---

### Step 6: Patient EHR Timeline & Observation Form (`/ehr/:patientId`)
* **Task 6.1:** Render patient medical history timeline:
  * Uploaded digitized prescriptions & OCR outputs.
  * Past diagnoses, chronic conditions, and known allergies.
* **Task 6.2:** Build Clinical Observation Form:
  * Subjective/Objective notes input.
  * Diagnosis selection.
  * Prescribed medicines entry with strength & dosage instructions.
  * Submit button saving observation to database.

---

### Step 7: Patient Directory (`/patients`)
* **Task 7.1:** Build searchable patient directory table (Search by Name, Patient ID, Phone).
* **Task 7.2:** Display patient card with quick link to request EHR access or view past sessions.

---

### Step 8: Appointments & Schedule Management (`/doctor-appointments`)
* **Task 8.1:** Build Appointment Request Tabs (`Pending`, `Confirmed`, `Completed`, `Cancelled`).
* **Task 8.2:** Implement Accept / Decline / Complete action buttons with status updates.
* **Task 8.3:** Build Chamber Schedule Configurator:
  * Select Day of Week checkboxes (Sun–Sat).
  * Time Pickers for Start Time & End Time.
  * Chamber Name & Location Address input.
  * Max Patient Capacity per slot.

---

### Step 9: Clinical Session History (`/sessions`)
* **Task 9.1:** Build historical table listing all completed consultations, dates, notes, and patient IDs.

---

### Step 10: Verification & Testing
* **Task 10.1:** Verify TypeScript compilation (`npm run build --prefix apps/web-portals` and `npm run build --prefix apps/backend`).
* **Task 10.2:** Conduct end-to-end user flow test (Patient requests appointment $\to$ Doctor accepts $\to$ Patient generates EHR OTP $\to$ Doctor verifies OTP $\to$ Doctor logs clinical observation $\to$ Doctor completes appointment).

---

# Acceptance Criteria

* Doctor can log in and view their clinical dashboard.
* Doctor can configure consultation chambers (location, days, hours, seat capacity).
* Doctor can review, approve, decline, or complete appointment requests.
* Doctor CANNOT access patient EHR without verifying a valid 6-digit EHR OTP generated by the patient.
* Doctor can view patient history and record clinical observations.
* UI matches MediSync Design System (`Plus Jakarta Sans`, Emerald/Herbal Teal tokens, 8px rhythm grid).
