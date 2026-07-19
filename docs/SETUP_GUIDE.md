# MediSync AI — Setup & Installation Guide

> Architecture: Monorepo (pnpm + Turborepo) | Environment: Native / No-Docker

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 18.0.0 | [nodejs.org](https://nodejs.org) |
| pnpm | >= 9.0.0 | `curl -fsSL https://get.pnpm.io/install.sh | sh -` |
| Python | >= 3.11 | [python.org](https://python.org) |
| Tesseract OCR | latest | `sudo apt install tesseract-ocr` (Ubuntu) |
| PostgreSQL | Cloud (Supabase/Neon) | Sign up at [supabase.com](https://supabase.com) |
| Redis | Cloud (Upstash) | Sign up at [upstash.com](https://upstash.com) |

---

## Step 1: Clone & Configure

```bash
cd /data/files/Dev/Projects/medisync

# Copy environment template
cp .env.example .env

# Fill in your credentials
nano .env
```

Required environment variables to set:
- `DATABASE_URL` — Your Supabase/Neon PostgreSQL connection string
- `JWT_SECRET` — A strong random string (min 32 chars)
- `ENCRYPTION_KEY` — Exactly 32 characters for AES-256
- `REDIS_URL` — Your Upstash Redis URL (rediss://...)

---

## Step 2: Install Dependencies

```bash
# From monorepo root
~/.local/share/pnpm/bin/pnpm install

# Or if pnpm is in PATH:
pnpm install
```

This installs all workspace packages recursively including `@medisync/shared-types`.

---

## Step 3: Initialize the Database

```bash
# Apply schema
psql $DATABASE_URL -f database/init.sql

# Seed development data (optional)
psql $DATABASE_URL -f database/seed.sql
```

---

## Step 4: Run Services

### Terminal 1 — AI Service (Python FastAPI)
```bash
cd apps/ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Terminal 2 — Backend (Node.js)
```bash
# From monorepo root
pnpm dev

# Or run backend only
cd apps/backend
pnpm dev
```

Backend starts at: `http://localhost:3001`  
AI Service starts at: `http://localhost:8000`

---

## Step 5: Verify

```bash
# Backend health check
curl http://localhost:3001/health

# AI service health check
curl http://localhost:8000/health
```

Expected responses:
```json
{"success": true, "message": "MediSync AI Backend is operational"}
{"status": "operational", "service": "medisync-ai"}
```

---

## Seed Users (Development)

All seed users have password: `Test@1234`

| Email | Role | Purpose |
|-------|------|---------|
| `admin@medisync.ai` | ADMIN | System administration |
| `patient@medisync.ai` | PATIENT | Test patient workflows |
| `doctor@medisync.ai` | DOCTOR | Test doctor/EHR workflows |
| `pharmacy@medisync.ai` | PHARMACY | Test inventory workflows |

---

## Directory Structure

```
medisync/
├── apps/
│   ├── backend/          # Node.js Express API (port 3001)
│   ├── web-portals/      # React.js portals (port 3000) [Phase 2]
│   ├── mobile-app/       # React Native app [Phase 4]
│   └── ai-service/       # FastAPI Python (port 8000)
├── packages/
│   └── shared-types/     # @medisync/shared-types (shared TS interfaces)
├── database/
│   ├── init.sql          # PostgreSQL schema
│   └── seed.sql          # Development seed data
├── docs/                 # This documentation folder
├── progress.md           # Project phase tracker
└── agents.md             # AI agent session log
```
