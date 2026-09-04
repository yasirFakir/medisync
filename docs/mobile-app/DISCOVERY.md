# Phase 1: MediSync Web Application Discovery Report

**Repository Source (Read-Only Reference):** `/data/rspace/codespace/projects/medisync`  
**Target Workspace:** `/home/roman/links/projects/temp-files/medisync-android`  
**Discovery Date:** 2026-08-15

---

## 1. System Architecture & Topology

The MediSync application is structured as a TypeScript/pnpm monorepo managed via Turborepo (`turbo.json`).

### Applications & Services
1. **Web Portals (`apps/web-portals`)**:
   - **Framework:** React 19 + TypeScript + Vite 6.
   - **Styling:** TailwindCSS 3.4, Lucide React icons, Plus Jakarta Sans typography.
   - **State & Routing:** Zustand (`authStore.ts`), React Router v7 with protected role-based layouts.
   - **Personas Supported:** Patient, Doctor, Pharmacy, Admin.
2. **Backend API Gateway (`apps/backend`)**:
   - **Framework:** Node.js + Express 4.21 + TypeScript (`tsx`).
   - **Data Layer:** PostgreSQL 16 managed via Prisma ORM 5.21 (`prisma/schema.prisma`).
   - **Security & Caching:** JWT access/refresh tokens, Speakeasy TOTP/OTP validation, Helmet, CORS, express-rate-limit, Redis (`ioredis`).
   - **Validation & Logging:** Joi schema validation middleware, Winston logger, Morgan HTTP logs.
3. **AI Microservice (`apps/ai-service`)**:
   - **Framework:** Python 3 + FastAPI + Uvicorn (Port 8000).
   - **AI Providers:** Google Gemini API (`GeminiProvider`) with local offline fallback stubs.
   - **Pipelines:** OCR prescription digitization & structured text extraction, symptom triage assessment.
4. **Shared Types (`packages/shared-types`)**:
   - Canonical TypeScript interfaces for auth, users, drugs, inventory, prescriptions, EHR records, triage sessions, and API response wrappers.
5. **Database Importers & Seeds (`database/`)**:
   - PostgreSQL schema initialization scripts, seed data (`seed.sql`, `pharmacy_seed.sql`, `prescription_seed.sql`), and Bangladesh medicine importer (`scripts/import_bd_medicines.js`).

---

## 2. Relational Database Schema & Entities

PostgreSQL database using UUID primary keys across the following core models:

| Model | Table | Purpose | Key Relations |
| :--- | :--- | :--- | :--- |
| `User` | `users` | User credentials, roles (`PATIENT`, `DOCTOR`, `PHARMACY`, `ADMIN`) | 1:1 with `Pharmacy`, 1:N with Prescriptions, EHR, Triage |
| `Pharmacy` | `pharmacies` | Registered pharmacy stores, licenses, verification status | 1:1 with User, 1:N with `PharmacyInventory`, `PharmacySale` |
| `Drug` | `drugs` | Master drug catalog (brand name, salt, strength, price, trust rating) | 1:N with `PharmacyInventory` |
| `PharmacyInventory` | `pharmacy_inventory` | Pharmacy stock levels, real-time pricing, availability status | N:1 with Pharmacy and Drug |
| `Prescription` | `prescriptions` | Digitized prescription notes, image URL, doctor name | N:1 with Patient (User), 1:N with `EhrRecord` |
| `EhrRecord` | `ehr_records` | Patient electronic health records, diagnosis, follow-up dates | N:1 with Patient, Doctor, and Prescription |
| `PatientTotpSecret` | `patient_totp_secrets` | Time-based OTP secrets for clinical/pharmacy authorization | 1:1 with Patient (User) |
| `TriageSession` | `triage_sessions` | AI symptom assessment chat sessions, urgency level, recommendations | N:1 with Patient (User) |
| `MedicationAlert` | `medication_alerts` | Patient medicine reminders, dosage schedules, alert statuses | N:1 with Patient (User) |
| `PharmacySale` | `pharmacy_sales` | POS sales transactions, invoice numbers, totals, payment methods | N:1 with Pharmacy, Patient, 1:N with `PharmacySaleItem` |
| `PharmacySaleItem` | `pharmacy_sale_items` | Sale line items, quantities, duration, unit prices | N:1 with PharmacySale, PharmacyInventory |
| `PharmacyPrescriptionAccess` | `pharmacy_prescription_access` | Audit log of pharmacy access to patient prescriptions | N:1 with Pharmacy, Patient, Prescription |

---

## 3. Web Application Route & Persona Mapping

### Public Routes
- `/`: Welcome & Landing Page
- `/login`: Unified Login and Portal Selector
- `/register`: Patient / Doctor / Pharmacy Registration

### Patient Portal (`/`)
- `/dashboard`: Patient overview (recent prescriptions, triage shortcuts, alerts, upcoming appointments)
- `/triage`: AI symptom checker and triage chat
- `/prescriptions`: OCR upload, digitized prescription list, medicine viewer
- `/pharmacies` & `/locator`: Pharmacy locator and contact directory
- `/alternatives`: Generic medicine alternative finder and price comparisons
- `/availability`: Real-time stock status across nearby pharmacies
- `/alerts`: Medication schedule reminders and dosage alarms
- `/appointments`: Doctor appointment booking and schedule

### Doctor Portal
- `/patients`: Assigned patient list and search
- `/ehr`: Secure EHR access (OTP authentication gate)
- `/ehr/:patientId`: Patient clinical history, diagnosis records, follow-up scheduling
- `/sessions`: Clinical session history and notes
- `/doctor-appointments`: Doctor appointment management calendar

### Pharmacy Portal
- `/inventory`: Pharmacy stock list, quantity adjustments, unit pricing
- `/update-stock`: Quick single/bulk inventory update
- `/dispenser`: OTP-gated prescription verification & medicine dispensing
- `/sales`: Pharmacy Point-of-Sale (POS) checkout, sales history, invoice generation

### Admin Portal
- `/users`: System-wide user list, role management, account verification
- `/drugs`: Master drug database catalog and search
- `/admin/triage-logs`: Safety audit logs of AI symptom triage interactions

---

## 4. API Endpoints Surface

| Base Path | Method / Route | Auth / Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth` | `POST /login` | Public | Authenticates user; returns JWT access/refresh tokens and user profile |
| | `POST /register` | Public | Registers a new user account |
| | `POST /refresh` | Public | Issues new access token from refresh token |
| `/api/users` | `GET /me`, `PATCH /me` | Authenticated | Retrieves/updates logged-in user profile |
| | `GET /` | ADMIN, DOCTOR | Lists users with search and role filters |
| `/api/triage` | `POST /chat` | PATIENT | Evaluates patient symptoms via Gemini AI with urgency score |
| | `GET /sessions` | PATIENT | Returns patient triage session history |
| | `DELETE /sessions/:sessionId` | PATIENT | Deletes a triage session |
| `/api/prescriptions`| `POST /digitize` | Authenticated | Uploads prescription image/PDF to OCR pipeline |
| | `POST /validate` | Authenticated | Validates extracted medicines against master drug list |
| | `GET /`, `POST /` | Authenticated | Lists and manually creates prescriptions |
| | `GET /:id`, `PATCH /:id`, `DELETE /:id` | Authenticated | Retrieves, edits, or deletes prescription |
| `/api/ehr` | `POST /otp/generate` | PATIENT | Generates 6-digit TOTP code for doctor/pharmacy access |
| | `POST /otp/verify` | DOCTOR | Validates patient OTP to grant time-limited EHR access |
| | `GET /patient/:patientId` | DOCTOR | Retrieves patient medical records |
| | `POST /records` | DOCTOR | Creates a new diagnosis/EHR clinical record |
| `/api/alerts` | `GET /`, `POST /` | PATIENT | Lists and schedules medication reminders |
| | `PATCH /:alertId`, `DELETE /:alertId`| PATIENT | Updates alert status or deletes reminder |
| `/api/inventory` | `GET /`, `PUT /update` | PHARMACY | Retrieves inventory and updates stock/pricing |
| | `POST /bulk-update` | PHARMACY | Batch updates multiple inventory items |
| `/api/alternatives`| `GET /:drugId` | Authenticated | Algorithmic generic alternative scoring |
| `/api/availability`| `GET /:drugId` | Authenticated | Real-time stock status across pharmacies |
| `/api/pharmacy` | `POST /verify-prescription-otp` | PHARMACY | Validates patient OTP to unlock prescription for dispensing |
| | `POST /sales` | PHARMACY | Processes sale transaction and deducts inventory |
| `/api/admin` | `GET /stats`, `GET /triage-logs`| ADMIN | System overview metrics and safety triage audit logs |

---

## 5. Security & Verification Architecture
- **Time-Based Access Control:** Clinical records and digital dispensing require dynamic 6-digit TOTP verification generated by the patient.
- **Safety Policy:** Strict non-diagnostic safety prompts on AI triage; local fallback stubs if AI service is offline.
- **Data Integrity:** Explicit foreign keys, UUIDs, atomic transactions for POS inventory deductions.
