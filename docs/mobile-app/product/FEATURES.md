# MediSync Product Feature Inventory

**Status Legend:**
- `[IMPLEMENTED]`: Fully functional in Web application and backend APIs.
- `[PARTIALLY IMPLEMENTED]`: Backend API exists; frontend UI in progress or fallback-mode supported.
- `[PLANNED]`: Roadmapped in SRS/ADR documents.

---

## 1. Authentication & Persona Management

### 1.1 User Login & Session Handling `[IMPLEMENTED]`
- **Purpose:** Secure single-point entry for all 4 personas (Patient, Doctor, Pharmacy, Admin).
- **Entry Point:** Web Route `/login`
- **Inputs:** Email, Password, Persona selector (Patient, Doctor, Pharmacy, Admin).
- **Outputs:** JWT Access Token (stored in auth store), Refresh Token, User Profile object.
- **Validation:** Non-empty email/password, standard email formatting.
- **Success Behavior:** Redirects user to their designated dashboard (`/dashboard`, `/patients`, `/inventory`, or `/users`).
- **Failure Behavior:** Inline red error toast without resetting form fields; 401 response handled without redirect loops.
- **Loading State:** Spinner inside primary submit button; inputs disabled during auth call.
- **Relevant API:** `POST /api/auth/login`

### 1.2 User Registration `[IMPLEMENTED]`
- **Purpose:** Create new user accounts for Patients, Doctors, and Pharmacies.
- **Entry Point:** Web Route `/register`
- **Inputs:** Full Name, Email, Password, Role (`PATIENT`, `DOCTOR`, `PHARMACY`), Phone Number.
- **Outputs:** Created user profile and automatic session token issuance.
- **Validation:** Password minimum length (6 chars), unique email check.
- **Relevant API:** `POST /api/auth/register`

---

## 2. Patient Domain Features

### 2.1 AI Symptom Triage Chatbot `[IMPLEMENTED]`
- **Purpose:** Multi-turn symptom assessment conversational agent assessing urgency and offering safe educational recommendations.
- **Entry Point:** Web Route `/triage`
- **Inputs:** Selected symptom chips (Fever, Headache, Cough, Chest Pain, Shortness of Breath, etc.) + Freeform natural language query.
- **Outputs:** AI response markdown, Urgency Badge (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), Recommended Action guidance, Session ID.
- **Clinical Safety Rules:** Never diagnoses or prescribes; advises emergency protocols on critical keywords; includes non-diagnostic disclaimers.
- **Fallback Behavior:** If Python AI microservice is unreachable, Express backend returns a deterministic fallback triage assessment.
- **History Management:** View previous triage sessions (`GET /api/triage/sessions`), delete historical sessions.
- **Relevant API:** `POST /api/triage/chat`, `GET /api/triage/sessions`, `DELETE /api/triage/sessions/:sessionId`

### 2.2 Prescription Digitizer & OCR Pipeline `[IMPLEMENTED]`
- **Purpose:** Upload photos/PDFs of physical doctor prescriptions and digitize medications into structured digital records.
- **Entry Point:** Web Route `/prescriptions`
- **Inputs:** Image file (`.jpg`, `.png`, `.webp`) or `.pdf` (up to 10MB).
- **Outputs:** Digitized prescription record, extracted brand names, salt compositions, dosage strings, frequency, and duration.
- **Interactive Review:** Patients can edit detected medication rows, fix misspelled brand names, add notes, and save.
- **Relevant API:** `POST /api/prescriptions/digitize`, `POST /api/prescriptions/validate`, `GET /api/prescriptions`, `PATCH /api/prescriptions/:id`, `DELETE /api/prescriptions/:id`

### 2.3 Generic Medicine Alternatives Finder `[IMPLEMENTED]`
- **Purpose:** Cost-saving tool that finds chemically identical bioequivalent generic drugs for any brand-name medication.
- **Entry Point:** Web Route `/alternatives`
- **Inputs:** Drug ID / Brand search query; optional budget cap, dosage form filter, strength filter.
- **Outputs:** Source drug breakdown, scored alternative cards (brand, manufacturer, estimated price, savings %, trust rating, match score).
- **Scoring Engine:** Deterministic multi-factor scoring $(0.60 \times P_{\text{score}} + 0.40 \times Q_{\text{score}})$ with strength/form match bonuses.
- **Relevant API:** `GET /api/alternatives/:drugId`, `POST /api/alternatives/compare`

### 2.4 Pharmacy Locator & Multi-Store Availability `[IMPLEMENTED]`
- **Purpose:** Locate nearby pharmacies and inspect real-time medicine stock status and prices.
- **Entry Point:** Web Route `/pharmacies` & `/availability`
- **Inputs:** City filter, search query, verified pharmacy toggle, drug ID.
- **Outputs:** Pharmacy directory cards (store name, license, address, city, phone, verification badge), stock badges (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`), price comparison.
- **Relevant API:** `GET /api/pharmacies`, `GET /api/pharmacies/search`, `GET /api/availability/:drugId`

### 2.5 Medication Schedule & Alerts `[IMPLEMENTED]`
- **Purpose:** Medication adherence reminders and alarms for prescribed doses.
- **Entry Point:** Web Route `/alerts`
- **Inputs:** Medicine Name, Dosage, Frequency (e.g., `1-0-1`), Scheduled Time (`HH:MM`), Status.
- **Outputs:** Interactive reminder cards, status toggles (`ACTIVE`, `SUSPENDED`, `ARCHIVED`).
- **Relevant API:** `GET /api/alerts`, `POST /api/alerts`, `PATCH /api/alerts/:alertId`, `DELETE /api/alerts/:alertId`

### 2.6 Dynamic TOTP Security Code Generator `[IMPLEMENTED]`
- **Purpose:** Generate time-limited 6-digit dynamic OTP codes allowing doctors and pharmacies temporary access to sensitive health records and prescriptions.
- **Entry Point:** Embedded inside Prescription and EHR Patient view modals.
- **Outputs:** 6-digit TOTP string, countdown timer ring (30-second epoch validity).
- **Relevant API:** `POST /api/ehr/otp/generate`

---

## 3. Doctor Domain Features

### 3.1 Patient Management Directory `[IMPLEMENTED]`
- **Purpose:** Search and browse assigned patient roster.
- **Entry Point:** Web Route `/patients`
- **Inputs:** Name/Email search query.
- **Outputs:** Patient card list with quick actions (View EHR, Schedule Session, Create Prescription).
- **Relevant API:** `GET /api/users?role=PATIENT`

### 3.2 OTP-Gated EHR Timeline & Record Creation `[IMPLEMENTED]`
- **Purpose:** Clinical record history access gated by patient-authorized TOTP tokens.
- **Entry Point:** Web Route `/ehr` & `/ehr/:patientId`
- **Inputs:** Patient ID + 6-digit OTP token entered by Doctor.
- **Outputs:** Unlocked medical history timeline (past diagnoses, doctor observations, linked prescriptions, session dates).
- **Record Creation:** Form with Diagnosis text, Clinical Observations, Follow-up date picker, Prescription ID link.
- **Relevant API:** `POST /api/ehr/otp/verify`, `GET /api/ehr/patient/:patientId`, `POST /api/ehr/records`

### 3.3 Clinical Session History & Doctor Appointments `[IMPLEMENTED]`
- **Purpose:** Manage consultation slots and patient appointment bookings.
- **Entry Point:** Web Route `/sessions`, `/doctor-appointments`
- **Relevant API:** `GET /api/appointments/doctor`, `PATCH /api/appointments/:id/status`

---

## 4. Pharmacy Domain Features

### 4.1 Real-Time Pharmacy Inventory Management `[IMPLEMENTED]`
- **Purpose:** Stock tracking, price setting, and catalog availability management for individual pharmacy branches.
- **Entry Point:** Web Route `/inventory`, `/update-stock`
- **Inputs:** Drug ID, inStock toggle, quantity count, unit selling price.
- **Outputs:** Filterable inventory table with low-stock warnings and price indicators.
- **Relevant API:** `GET /api/inventory`, `PUT /api/inventory/update`, `POST /api/inventory/bulk-update`

### 4.2 OTP-Verified Digital Dispenser `[IMPLEMENTED]`
- **Purpose:** Authenticate patient OTP code to unlock and dispense digital prescription items at the counter.
- **Entry Point:** Web Route `/dispenser`
- **Inputs:** Patient Email / UUID + 6-digit OTP Code.
- **Outputs:** Decrypted prescription list with dosage schedules; "Dispense to POS" action button.
- **Relevant API:** `POST /api/pharmacy/verify-prescription-otp`, `GET /api/pharmacy/prescriptions/:patientId`

### 4.3 Pharmacy POS Checkout & Sales Transactions `[IMPLEMENTED]`
- **Purpose:** Process counter sales, apply discounts/taxes, print invoices, and automatically decrement inventory counts.
- **Entry Point:** Web Route `/sales`
- **Inputs:** Selected inventory items, quantities, customer name, payment method (`CASH`, `CARD`, `BKASH`, `NAGAD`, `ROCKET`), discount amount, tax amount.
- **Outputs:** Unique invoice number (`INV-...`), subtotal, net total, printed receipt summary.
- **Relevant API:** `POST /api/pharmacy/sales`

---

## 5. Admin Domain Features

### 5.1 System User & Pharmacy Verification Management `[IMPLEMENTED]`
- **Purpose:** Admin oversight of all user accounts and pharmacy licensing verification.
- **Entry Point:** Web Route `/users`
- **Outputs:** User list by role, account activation/deletion controls.
- **Relevant API:** `GET /api/admin/users`, `DELETE /api/users/:userId`

### 5.2 Master Drug Catalog Browser `[IMPLEMENTED]`
- **Purpose:** View and search national drug master catalog (brand names, generics, strengths, manufacturers).
- **Entry Point:** Web Route `/drugs`
- **Relevant API:** `GET /api/drugs`

### 5.3 AI Triage Safety Audit Logs `[IMPLEMENTED]`
- **Purpose:** Clinical safety governance monitoring AI symptom triage conversations and flagged urgency levels.
- **Entry Point:** Web Route `/admin/triage-logs`
- **Relevant API:** `GET /api/admin/triage-logs`
