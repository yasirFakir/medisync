# MediSync Product Acceptance Criteria

---

## 1. Authentication & Security
- [ ] User can log in with valid email/password and select role (`PATIENT`, `DOCTOR`, `PHARMACY`, `ADMIN`).
- [ ] Invalid credentials display clear, non-technical error messages without crashing or infinite re-renders.
- [ ] Protected endpoints reject unauthenticated requests with `401 Unauthorized`.
- [ ] Role-restricted endpoints reject unauthorized roles with `403 Forbidden`.
- [ ] Access token expires gracefully; refresh token seamlessly renews session.

---

## 2. Patient Domain
- [ ] **AI Triage:**
  - [ ] Patient can select symptom chips and submit multi-turn chat messages.
  - [ ] System returns an urgency classification badge (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  - [ ] If the AI microservice is offline, the backend returns fallback medical guidance with safety disclaimers.
  - [ ] Patient can review past triage sessions and delete previous session history.
- [ ] **Prescriptions & OCR:**
  - [ ] Patient can upload prescription photos or PDF documents up to 10MB.
  - [ ] OCR pipeline extracts doctor name, digitized notes, and line-item medicines (brand name, salt composition, dosage, frequency, duration).
  - [ ] Extracted medicines can be reviewed, edited, or deleted by the patient prior to saving.
- [ ] **Alternatives & Availability:**
  - [ ] Searching a drug presents ranked bioequivalent alternatives based on identical salt composition.
  - [ ] Alternative cards display price comparison, calculated percentage savings, trust score, and match details.
  - [ ] Multi-pharmacy availability displays real-time stock status (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`) and store locations.
- [ ] **Medication Reminders & OTP:**
  - [ ] Patient can create, toggle, and delete daily medication alerts.
  - [ ] Patient can generate a dynamic 6-digit TOTP code with a 30-second countdown indicator.

---

## 3. Doctor Domain
- [ ] Doctor can view assigned patients and search by name/email.
- [ ] Doctor entering a valid patient OTP gains access to patient EHR timeline.
- [ ] Doctor can record clinical observations, diagnosis, follow-up dates, and linked prescriptions.

---

## 4. Pharmacy Domain
- [ ] Pharmacy can view real-time inventory, filter by stock status, and adjust unit price and quantity.
- [ ] Pharmacist entering valid patient OTP unlocks patient prescriptions for digital dispensing.
- [ ] Completing POS sale atomically decrements stock in `pharmacy_inventory`, computes tax/discounts, and produces an invoice receipt.
