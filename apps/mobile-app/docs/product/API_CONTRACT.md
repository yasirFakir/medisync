# MediSync Backend API Contract Specification

**Base URL:** `http://<host>:3000/api` (Local default: `http://localhost:3000/api`)  
**Format:** JSON (except multipart OCR endpoints)  
**Standard Response Wrapper:**
```json
{
  "success": true,
  "message": "Operation description",
  "data": {},
  "timestamp": "2026-08-15T12:00:00.000Z"
}
```

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Login
- **Endpoint:** `POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "email": "patient@medisync.com",
    "password": "password123"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "user": {
        "id": "c7118320-333e-4b44-93e1-70bfba9173f4",
        "fullName": "Rahim Ahmed",
        "email": "patient@medisync.com",
        "role": "PATIENT",
        "phoneNumber": "+8801700000001"
      }
    }
  }
  ```

### 1.2 Register
- **Endpoint:** `POST /api/auth/register`
- **Request Body:**
  ```json
  {
    "fullName": "Dr. Sarah Khan",
    "email": "dr.sarah@medisync.com",
    "password": "password123",
    "role": "DOCTOR",
    "phoneNumber": "+8801800000002"
  }
  ```

---

## 2. AI Symptom Triage (`/api/triage`)

### 2.1 Chat / Symptom Assessment
- **Endpoint:** `POST /api/triage/chat`
- **Headers:** `Authorization: Bearer <token>` (Role: `PATIENT`)
- **Request Body:**
  ```json
  {
    "sessionId": "4b68e92a-3507-40fa-8041-8636bdf43719",
    "symptoms": ["Fever", "Headache", "Sore throat"],
    "additionalNotes": "Started 2 days ago, feels worse in the evening.",
    "conversationHistory": [
      { "role": "user", "content": "I have a mild fever", "timestamp": "2026-08-15T10:00:00Z" }
    ]
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "sessionId": "4b68e92a-3507-40fa-8041-8636bdf43719",
      "urgencyLevel": "MEDIUM",
      "response": "Based on your symptoms...",
      "recommendedAction": "Consult a healthcare provider if fever persists over 3 days.",
      "timestamp": "2026-08-15T10:05:00Z"
    }
  }
  ```

---

## 3. Prescriptions & OCR (`/api/prescriptions`)

### 3.1 Digitize Prescription (OCR)
- **Endpoint:** `POST /api/prescriptions/digitize`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Form-Data:** `file: <binary image/pdf>` (max 10MB)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "doctorName": "Dr. A. Rahman",
      "medicines": [
        {
          "brandName": "Napa Extra",
          "saltComposition": "Paracetamol 500mg + Caffeine 65mg",
          "dosage": "1 tablet",
          "frequency": "1+0+1",
          "duration": "5 days"
        }
      ],
      "rawImageUrl": "/uploads/prescriptions/sample.jpg",
      "digitizedNotes": "Patient presenting with acute viral fever."
    }
  }
  ```

---

## 4. Alternatives & Availability (`/api/alternatives`, `/api/availability`)

### 4.1 Get Ranked Generic Alternatives
- **Endpoint:** `GET /api/alternatives/:drugId?budget=50&dosageForm=tablet`
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "sourceDrug": {
        "drugId": "d1a89...",
        "brandName": "Napa Extra",
        "saltComposition": "Paracetamol + Caffeine",
        "strength": "500mg/65mg",
        "estimatedPrice": 3.00,
        "isGeneric": false,
        "trustRating": 4.8
      },
      "alternatives": [
        {
          "drugId": "d2b90...",
          "brandName": "Ace Plus",
          "saltComposition": "Paracetamol + Caffeine",
          "strength": "500mg/65mg",
          "dosageForm": "tablet",
          "manufacturer": "Square Pharmaceuticals",
          "estimatedPrice": 2.50,
          "isGeneric": true,
          "trustRating": 4.9,
          "score": 92.5,
          "matchDetails": {
            "sameActiveIngredient": true,
            "sameStrength": true,
            "sameDosageForm": true,
            "priceDifference": -0.50,
            "priceDifferencePercent": -16.67
          }
        }
      ]
    }
  }
  ```

---

## 5. EHR & Dynamic TOTP Security (`/api/ehr`)

### 5.1 Generate Patient Access OTP
- **Endpoint:** `POST /api/ehr/otp/generate`
- **Headers:** `Authorization: Bearer <token>` (Role: `PATIENT`)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "otp": "481920",
      "expiresInSeconds": 30
    }
  }
  ```

### 5.2 Verify OTP (Doctor / Pharmacy Access Gate)
- **Endpoint:** `POST /api/ehr/otp/verify`
- **Headers:** `Authorization: Bearer <token>` (Role: `DOCTOR`)
- **Request Body:**
  ```json
  {
    "patientId": "c7118320-333e-4b44-93e1-70bfba9173f4",
    "otpToken": "481920"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "OTP verified successfully. Access granted to patient EHR."
  }
  ```

---

## 6. Pharmacy Inventory & POS Checkout (`/api/inventory`, `/api/pharmacy`)

### 6.1 Process Sale & Deduct Stock
- **Endpoint:** `POST /api/pharmacy/sales`
- **Headers:** `Authorization: Bearer <token>` (Role: `PHARMACY`)
- **Request Body:**
  ```json
  {
    "patientId": "c7118320-333e-4b44-93e1-70bfba9173f4",
    "paymentMethod": "CASH",
    "customerName": "Rahim Ahmed",
    "discountAmount": 10.00,
    "taxAmount": 5.00,
    "items": [
      {
        "inventoryId": "inv-001-uuid",
        "quantity": 2,
        "durationDays": 5,
        "dosageSchedule": "1+0+1"
      }
    ]
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "saleId": "sale-uuid",
      "invoiceNumber": "INV-20260815-9921",
      "subtotal": 120.00,
      "discountAmount": 10.00,
      "taxAmount": 5.00,
      "netTotal": 115.00,
      "paymentMethod": "CASH",
      "createdAt": "2026-08-15T10:15:00Z"
    }
  }
  ```
