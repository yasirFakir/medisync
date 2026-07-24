# MediSync AI

AI-Powered Triage Chatbot, Prescription Digitizer, EHR & Pharmacy Portal.
CSE327 Software Engineering Project under faculty Intisar Tahmid Naheen [ITN].

## Getting Started

Follow these steps to set up and run the application on your local machine.

### Prerequisites

- **Node.js** (v18+)
- **pnpm** (v9.0.0+) — installed at `~/.local/share/pnpm/bin/pnpm`
- **Python** (v3.11–3.13 recommended; v3.14 has limited library support)
- **PostgreSQL** (v15+)
- **Redis** (optional for development)

---

### Step-by-Step Setup

#### 1. Database Initialization
Ensure PostgreSQL is running. Create a database named `medisync_db`.

**Linux:**
```bash
createdb -U postgres medisync_db
```

**Windows:**
Run the following in your SQL shell (psql) or pgAdmin:
```sql
CREATE DATABASE medisync_db;
```

#### 2. Environment Configuration
Copy the example environment file to its active version.

**Linux:**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
copy .env.example .env
```

Open `.env` and fill in at minimum:
- `DATABASE_URL` — your PostgreSQL connection string
- `JWT_SECRET` — any strong random string
- `ENCRYPTION_KEY` — exactly 32 characters

#### 3. Install Node.js Dependencies

From the **root directory** of the project:
```bash
# If pnpm is not yet in your PATH:
~/.local/share/pnpm/bin/pnpm install

# Or if pnpm is available globally:
pnpm install
```

#### 4. Install Python AI Service Dependencies

```bash
# Navigate to the AI service directory
cd apps/ai-service

# Create the virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate          # Linux / macOS
# venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt
```

> ⚠️ **Python 3.14 users:** `Pillow` and `pytesseract` do not yet have pre-built wheels for Python 3.14. The OCR feature will be unavailable until compatible wheels are released. All other features work normally.

---

### Running the Application

Open separate terminals to run each service as needed.

#### 1. AI Service (FastAPI)
```bash
cd apps/ai-service
source venv/bin/activate
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Runs at: **http://127.0.0.1:8000** (Swagger documentation: `/docs`)

#### 2. Node.js Backend (Express API)
```bash
# Run from root workspace
npm run dev:backend
```
Runs at: **http://localhost:3001**

#### 3. Unified Web Portal (Frontend Layouts)
```bash
# Run from root workspace
npm run dev
```
Runs at: **http://localhost:3000** (Dynamically renders the Dashboard layout for Patients, Doctors, Pharmacy partners, or Admins depending on credentials inputed on the login screen).

> 💡 **Tip:** You can start all active developer servers (Backend API + Web Portal) simultaneously by running `npm run dev:all` from the root workspace folder.

---

### Database Migration and Seeding

#### Apply Schema
```bash
psql -U postgres -d medisync_db -f database/init.sql
```

#### Seed Mock Data
Seeds the database with dev users, pharmacy profiles, drugs, and inventory:
```bash
psql -U postgres -d medisync_db -f database/seed.sql
```

**Seed Users** (all have password: `Test@1234`):

| Email | Role |
|-------|------|
| `admin@medisync.ai` | ADMIN |
| `patient@medisync.ai` | PATIENT |
| `doctor@medisync.ai` | DOCTOR |
| `pharmacy@medisync.ai` | PHARMACY |

> ⚠️ Seed user passwords use a placeholder hash. Register a fresh user via the API to get a working account immediately.

---

### Testing the Application

#### Step 1 — Verify Both Services are Running
```bash
# Backend health check
curl http://localhost:3001/health

# AI service health check
curl http://127.0.0.1:8000/health
```

Expected responses:
```json
{ "success": true, "message": "MediSync AI Backend is operational" }
{ "status": "operational", "service": "medisync-ai", "version": "1.0.0" }
```

---

#### Step 2 — Register a New User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Patient",
    "email": "testpatient@test.com",
    "password": "Test@1234",
    "role": "PATIENT"
  }'
```
Save the `accessToken` from the response for the next steps.

---

#### Step 3 — Login and Get Token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testpatient@test.com",
    "password": "Test@1234"
  }'
```

---

#### Step 4 — Test Protected Endpoints

Replace `<TOKEN>` with your `accessToken` from Step 2 or 3.

**Get your profile:**
```bash
curl http://localhost:3001/api/users/me \
  -H "Authorization: Bearer <TOKEN>"
```

**Search for generic drug substitutes:**
```bash
curl "http://localhost:3001/api/drugs/substitutes?saltComposition=Paracetamol" \
  -H "Authorization: Bearer <TOKEN>"
```

**Find pharmacies with a medicine in stock:**
```bash
curl "http://localhost:3001/api/inventory/locate?saltComposition=Paracetamol&city=Dhaka" \
  -H "Authorization: Bearer <TOKEN>"
```

**Create a medication reminder alert:**
```bash
curl -X POST http://localhost:3001/api/alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "medicineName": "Napa",
    "dosage": "500mg",
    "frequency": "Twice daily",
    "scheduledTime": "08:00"
  }'
```

**Test AI triage chat:**
```bash
curl -X POST http://localhost:3001/api/triage/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "symptoms": ["fever", "headache", "sore throat"],
    "additionalNotes": "Symptoms started 2 days ago"
  }'
```

---

## Documentation
For more detailed information, see:
- [Setup & Installation Guide](docs/SETUP_GUIDE.md)
- [API Reference Manual](docs/API_REFERENCE.md)
- [System Architecture](docs/ARCHITECTURE.md)

## Versioning

This project follows strict Semantic Versioning (SemVer) guidelines:
- The base version is **`0.1.0`**.
- Every fix, patch, or minor correction must increment the patch version (e.g., `0.1.0`, `0.1.1`, etc.).
