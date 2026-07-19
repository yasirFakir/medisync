# MediSync AI

AI-Powered Triage Chatbot, Prescription Digitizer, EHR & Pharmacy Portal.
CSE327 Software Engineering Project under faculty Intisar Tahmid Naheen [ITN].

## Getting Started

Follow these steps to set up and run the application on your local machine.

### Prerequisites

- **Node.js** (v18+)
- **pnpm** (v9.0.0+)
- **Python** (v3.11+)
- **Tesseract OCR** (Must be installed on the host OS)
- **PostgreSQL** (v15+)
- **Redis**

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
Copy the example environment files to their active versions.

**Linux / Windows:**
```bash
cp .env.example .env
```

Set your active database connection strings and configuration values in the newly created `.env` file.

#### 3. Install Dependencies

**Monorepo Workspaces (Root Directory):**
```bash
# If pnpm is not globally installed, use the local path:
~/.local/share/pnpm/bin/pnpm install

# Or if pnpm is in your PATH:
pnpm install
```

**AI Service (Python FastAPI):**
```bash
cd apps/ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

### Running the Application

#### Terminal 1: AI Service (FastAPI)
```bash
cd apps/ai-service
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### Terminal 2: Monorepo Orchestration (Node.js Backend & Apps)
```bash
# Run from the root directory
pnpm dev
```
Turborepo will spin up the backend server on port `3001` and run workspaces concurrently.

---

### Database Migration and Seeding

#### Apply Schema
Apply the DDL schemas to set up your PostgreSQL relational tables:
```bash
psql -d medisync_db -f database/init.sql
```

#### Seed Mock Data
Seed the database with development users, pharmacy profiles, master drug catalogs, and inventory:
```bash
psql -d medisync_db -f database/seed.sql
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
