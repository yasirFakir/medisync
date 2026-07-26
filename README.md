# MediSync AI

AI-Powered Triage Chatbot, Prescription Digitizer, EHR & Pharmacy Portal.
CSE327 Software Engineering Project under faculty Intisar Tahmid Naheen [ITN].

---

## 🏗️ Architecture & Port Allocation

MediSync AI is a monorepo consisting of 3 distinct runtimes:

| Service | Technology | Default Port | URL | Description |
|---|---|---|---|---|
| **Web Portals** | React + Vite + TypeScript | **`3000`** | `http://localhost:3000` | Frontend UI (Patient / Doctor / Pharmacy / Admin) |
| **Main API Gateway** | Node.js + Express | **`3001`** | `http://localhost:3001` | REST API Gateway, Auth, Database, Alerts, EHR |
| **AI Microservice** | Python 3.12 + FastAPI | **`8000`** | `http://127.0.0.1:8000` | OCR Prescription Extraction & AI Symptom Triage |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18+)
- **pnpm** or **npm**
- **Python** (v3.12 or `uv` manager)
- **PostgreSQL** (v15+)

---

### Option A: Run Everything Concurrently (Recommended)

From the project root directory, run these scripts to start the complete stack:

#### 1. Start AI Microservice & Backend Gateway:
```bash
./run_backend.sh
```
*(This starts the FastAPI AI service on port `8000` and the Express Backend on port `3001` in your current terminal).*

#### 2. Start Frontend Web Portals (in a second terminal):
```bash
npm run dev
# OR with pnpm
pnpm dev
```
Open **`http://localhost:3000`** in your browser!

---

### Option B: Run Services Individually

If you prefer to start each service manually in its own terminal window:

#### Terminal 1 — Python AI Microservice (Port 8000)
```bash
cd apps/ai-service

# Option 1: Standard Python venv
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Option 2: Using uv (Python 3.12)
uv venv --python 3.12 venv
source venv/bin/activate
uv pip install -r requirements.txt
python main.py
```

#### Terminal 2 — Express Backend API (Port 3001)
```bash
# From root or apps/backend
npm run dev:backend
```

#### Terminal 3 — React Frontend Web Portals (Port 3000)
```bash
# From project root
npm run dev
```

---

### Option C: Run with Docker Compose

Start all services automatically inside Docker containers:

```bash
sudo docker compose up --build
```
- Web Portal: **`http://localhost:3000`**
- API Gateway: **`http://localhost:3001`**
- AI Service: **`http://localhost:8000`**

---

## 🗄️ Database Setup & Seeding

### 1. Initialize PostgreSQL Database
Make sure PostgreSQL is running, then create `medisync_db`:
```bash
createdb -U postgres medisync_db
```

### 2. Configure `.env`
Copy the template file:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` matches your local setup:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medisync_db
```

### 3. Initialize Schema & Seed Data
```bash
# Initialize DB tables
npm run db:init

# Seed initial users, pharmacies, and alerts
npm run db:seed

# Seed master medicine database (80 drugs)
npm run db:seed:drugs
```

### 🔑 Test User Credentials (Password for all: `password123`)
- **Patient**: `patient@medisync.ai`
- **Doctor**: `doctor@medisync.ai`
- **Pharmacy**: `pharmacy@medisync.ai`
- **Admin**: `admin@medisync.ai`

---
c
## 🧪 Testing

```bash
# Run backend & database unit verification tests
node database/test_runner.js

# Run Python OCR unit tests
cd apps/ai-service && ./venv/bin/python test_ocr.py
```

---

## 📚 Related Documentation
- [OCR Pipeline & RAG Guide](docs/OCR_RAG_GUIDE.md)
- [Docker Configuration Guide](ISSUE_DOCKER_CONFIG.md)
- [Project Progress Tracker](progress.md)
