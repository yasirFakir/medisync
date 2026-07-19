# MediSync AI — System Architecture

> Version: 2.0 | Based on SRS v2.0 Final

---

## High-Level System Architecture

```
┌─────────────────────────┐     ┌──────────────────────────────┐
│   Mobile App            │     │   Web Portals (React.js)      │
│   (React Native)        │     │   Admin / Doctor / Pharmacy   │
└────────────┬────────────┘     └──────────────┬───────────────┘
             │                                 │
             └────────────────┬────────────────┘
                              │ HTTPS / WSS
                              ▼
                ┌─────────────────────────────┐
                │    JWT Auth Gateway          │
                │  (Helmet + CORS + Rate Limit)│
                └─────────────┬───────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │   Node.js Express Backend    │
                │   Port: 3001                 │
                │   RBAC + Queue Broker        │
                └──┬──────┬──────────────┬────┘
                   │      │              │
          ┌────────┘   ┌──┘         ┌───┘
          ▼            ▼            ▼
  ┌──────────────┐ ┌──────────┐ ┌────────────────────┐
  │ PostgreSQL   │ │  Redis   │ │  FastAPI AI Service │
  │ (Supabase/  │ │ (Upstash)│ │  Port: 8000         │
  │  Neon)      │ │          │ │  (Tesseract + LLM)  │
  └──────────────┘ └──────────┘ └────────────────────┘
```

---

## Monorepo Structure

```
medisync/                            ← Root workspace
├── package.json                     ← Turborepo scripts
├── pnpm-workspace.yaml              ← pnpm workspace declaration
├── turbo.json                       ← Turborepo pipeline
├── .env.example                     ← Environment template
│
├── apps/
│   ├── backend/                     ← @medisync/backend
│   │   └── src/
│   │       ├── server.ts            ← HTTP server bootstrap
│   │       ├── app.ts               ← Express app + middleware
│   │       ├── config/              ← env, database, redis, logger
│   │       ├── middleware/          ← auth, validate, errorHandler
│   │       ├── routes/              ← Route modules (8 modules)
│   │       └── controllers/         ← Business logic (8 modules)
│   │
│   ├── web-portals/                 ← @medisync/web-portals [Phase 2]
│   ├── mobile-app/                  ← @medisync/mobile-app [Phase 4]
│   └── ai-service/                  ← FastAPI Python
│       ├── main.py
│       └── requirements.txt
│
├── packages/
│   └── shared-types/                ← @medisync/shared-types
│       └── src/index.ts             ← 20+ shared TypeScript interfaces
│
├── database/
│   ├── init.sql                     ← DDL schema
│   └── seed.sql                     ← Dev seed data
│
└── docs/                            ← You are here
```

---

## Backend Middleware Stack

Request flows through middleware in this order:

```
Request
  → Helmet (Security headers)
  → CORS
  → Rate Limiter (100 req / 15 min per IP)
  → Compression (gzip)
  → Body Parser (JSON, 10MB limit)
  → Morgan Logger
  → Route Handler
    → JWT authenticate()
    → authorize(...roles)     ← RBAC
    → validateBody/Query()    ← Joi validation
    → Controller
  → Error Handler (AppError vs 500)
```

---

## Database Schema Overview

```
users (UUID PK)
  ├── pharmacies (1:1 via pharmacy_id FK → users.user_id)
  │     └── pharmacy_inventory (M:M with master_pharmacy)
  │           └── master_pharmacy (drug catalog)
  ├── prescriptions (1:M patient_id)
  ├── ehr_records (1:M patient_id, doctor_id)
  ├── patient_totp_secrets (1:1 patient_id)
  ├── triage_sessions (1:M patient_id)
  └── medication_alerts (1:M patient_id)
```

---

## Security Architecture

| Layer | Mechanism |
|-------|-----------|
| Auth | JWT (access 7d) + Refresh tokens (30d) in Redis |
| RBAC | Role enum guard middleware per route |
| EHR Access | TOTP (speakeasy, 5-min window, 6-digit) |
| Transport | TLS 1.3 (enforced in production) |
| At-rest | AES-256 for patient PII (TODO: Phase 5) |
| Rate limit | 100 req / 15 min per IP on /api |
| Input | Joi schema validation on all POST/PATCH bodies |
| Headers | Helmet (CSP, HSTS, etc.) |

---

## Generic Drug Scoring Algorithm

From SRS Section 5.1:

```
Score = (0.60 × Pscore) + (0.40 × Qscore)

Where:
  Pscore = max(0, (Branded Price - Generic Price) / Branded Price) × 100
  Qscore = Trust Rating (1.0–5.0) × 20
```

Result is sorted descending (highest score = best recommendation).

---

## AI Service Communication

The Node.js backend acts as a **proxy** to the Python FastAPI service:

```
Patient → POST /api/prescriptions/digitize
         → Backend validates JWT + role
         → Forwards multipart file to FastAPI /ocr/digitize
         → FastAPI runs Tesseract OCR + NLP
         → Returns structured medicine JSON
         → Backend saves to prescriptions table
         → Returns to client
```

Timeout: 30 seconds per AI service request.  
Fallback: Returns 503 if FastAPI is unreachable.
