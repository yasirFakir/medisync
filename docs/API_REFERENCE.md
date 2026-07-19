# MediSync AI — API Reference

**Base URL:** `http://localhost:3001`  
**Auth:** Bearer JWT token in `Authorization` header  
**Content-Type:** `application/json`

---

## Authentication

### POST `/api/auth/register`
Register a new user account.

**Auth:** Public

**Body:**
```json
{
  "fullName": "Md. Yasir Arafat",
  "email": "user@example.com",
  "password": "SecurePass@123",
  "role": "PATIENT",
  "phoneNumber": "+880-1700-000001"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": "uuid", "fullName": "...", "email": "...", "role": "PATIENT" }
  }
}
```

---

### POST `/api/auth/login`
**Auth:** Public

**Body:** `{ "email": "...", "password": "..." }`

**Response `200`:** Same as register response.

---

### POST `/api/auth/refresh`
**Auth:** Public

**Body:** `{ "refreshToken": "eyJ..." }`

---

### POST `/api/auth/logout`
**Auth:** Bearer Token (optional)

Revokes the refresh token from Redis cache.

---

## Users

### GET `/api/users/me`
Get the authenticated user's profile.
**Auth:** Any role

### PATCH `/api/users/me`
Update profile (`fullName`, `phoneNumber`).
**Auth:** Any role

### GET `/api/users`
List all users with pagination.
**Auth:** ADMIN only | Query: `?page=1&limit=20`

### DELETE `/api/users/:userId`
**Auth:** ADMIN only

---

## Drugs

### GET `/api/drugs/substitutes`
Get generic substitutes ranked by scoring algorithm.  
`Score = (0.60 × Pscore) + (0.40 × Qscore)`

**Auth:** Any role  
**Query:** `?saltComposition=Paracetamol&budget=5.00`

**Response `200`:**
```json
[
  { "drugId": "uuid", "brandName": "Napa", "saltComposition": "Paracetamol", "price": 2.50, "score": 82.4 }
]
```

### GET `/api/drugs`
Search drug catalogue.
**Auth:** Any role | Query: `?search=Para&page=1&limit=20`

### GET `/api/drugs/:drugId`
Get a single drug by ID.
**Auth:** Any role

---

## Inventory

### POST `/api/inventory/update`
Update pharmacy stock level.
**Auth:** PHARMACY only

**Body:**
```json
{ "drugId": "uuid", "inStock": true, "price": 2.50 }
```

**Response `200`:** `{ "status": "Inventory Updated" }`

### GET `/api/inventory/locate`
Find pharmacies with a specific drug in stock.
**Auth:** PATIENT, DOCTOR  
**Query:** `?drugId=uuid&city=Dhaka` OR `?saltComposition=Paracetamol&city=Dhaka`

### GET `/api/inventory/my-stock`
Get pharmacy's full stock list.
**Auth:** PHARMACY only

---

## Prescriptions

### POST `/api/prescriptions/digitize`
Upload a prescription image for OCR digitization.
**Auth:** PATIENT only  
**Content-Type:** `multipart/form-data`  
**Field:** `file` (JPEG / PNG / WebP / PDF, max 10MB)

**Response `200`:**
```json
{
  "prescriptionId": "uuid",
  "digitizedNotes": "...",
  "medicines": [{ "brandName": "Napa", "dosage": "500mg", ... }]
}
```

### GET `/api/prescriptions`
List prescriptions.
**Auth:** PATIENT (own), DOCTOR (by `?patientId=uuid`)

### GET `/api/prescriptions/:id`
Get a single prescription.
**Auth:** PATIENT (own), DOCTOR, ADMIN

---

## EHR (Electronic Health Records)

### POST `/api/ehr/generate-otp`
Patient generates a 6-digit TOTP token to share with a doctor.
**Auth:** PATIENT only

**Response `200`:** `{ "otp": "123456", "validFor": "5 minutes" }`

### POST `/api/ehr/request-access`
Doctor verifies OTP to gain access to patient records.
**Auth:** DOCTOR only

**Body:** `{ "patientId": "uuid", "otpToken": "123456" }`

### POST `/api/ehr/records`
Doctor creates an EHR session entry.
**Auth:** DOCTOR only

**Body:**
```json
{
  "patientId": "uuid",
  "diagnosis": "Viral fever",
  "observations": "Temperature 38.5°C, recommended rest",
  "followUpDate": "2026-07-26",
  "prescriptionId": "uuid (optional)"
}
```

### GET `/api/ehr/records/:patientId`
Retrieve all EHR records for a patient.
**Auth:** PATIENT (own), DOCTOR, ADMIN

---

## Triage (AI Chat)

### POST `/api/triage/chat`
Submit symptoms to the AI triage engine.
**Auth:** PATIENT only

**Body:**
```json
{
  "symptoms": ["fever", "headache", "sore throat"],
  "additionalNotes": "Symptoms started 2 days ago",
  "conversationHistory": []
}
```

**Response `200`:**
```json
{
  "sessionId": "uuid",
  "urgencyLevel": "LOW",
  "response": "Based on your symptoms...",
  "recommendedAction": "Rest and hydrate. Visit clinic if symptoms worsen."
}
```

### GET `/api/triage/sessions`
Get patient's triage chat history (last 20).
**Auth:** PATIENT only

---

## Medication Alerts

### POST `/api/alerts`
Create a medication reminder.
**Auth:** PATIENT only

**Body:**
```json
{
  "medicineName": "Napa",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "scheduledTime": "08:00"
}
```

### GET `/api/alerts`
List patient's alerts.
**Auth:** PATIENT only

### PATCH `/api/alerts/:alertId`
Update alert status.
**Auth:** PATIENT only  
**Body:** `{ "status": "SUSPENDED" }` — values: `ACTIVE`, `SUSPENDED`, `ARCHIVED`

### DELETE `/api/alerts/:alertId`
Delete an alert.
**Auth:** PATIENT only

---

## Error Responses

All errors follow this schema:
```json
{
  "success": false,
  "message": "Human-readable error description",
  "timestamp": "ISO 8601 string"
}
```

| Code | Meaning |
|------|---------|
| 401 | Unauthorized — missing/invalid/expired token |
| 403 | Forbidden — insufficient role |
| 404 | Resource not found |
| 409 | Conflict — duplicate resource |
| 422 | Validation error |
| 503 | AI service unavailable |
