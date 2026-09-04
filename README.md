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

### ⚙️ Initial Environment Setup

1. **Clone & Configure Environment Files**:
   ```bash
   cp .env.example .env
   ```
   *(Ensure `.env` contains your local `DATABASE_URL` and secrets. Local `.env` and `.env.*.local` files are ignored by git).*

2. **Install Node Dependencies**:
   ```bash
   pnpm install
   # OR
   npm install
   ```

3. **Set Up Python Virtual Environment**:
   ```bash
   cd apps/ai-service
   python3.12 -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   cd ../..
   ```

---


### 🪟 Windows Execution Options (VS Code / PowerShell / CMD)

#### Option 1: Automatic Windows Launcher (Easiest — `run.bat`)
Open the VS Code Terminal (`Ctrl + ~`) or PowerShell / CMD and run:
```powershell
.\run.bat
# OR
npm run run:win
```
*(This automatically launches the **AI Microservice**, **Express Backend**, and **React Frontend** in separate windows).*

#### Option 2: Single Terminal Command (All-in-One)
In VS Code Terminal (PowerShell or CMD), run:
```powershell
pnpm dev:all
# OR
npm run dev:all
```

#### Option 3: VS Code 1-Click Debug Launcher (F5)
1. Open `medisync` in **VS Code**.
2. Press **`F5`** (or go to **Run and Debug** `Ctrl+Shift+D`) and select **`🚀 Launch Backend + AI Microservice`**.
3. In VS Code Terminal (`Ctrl + ~`), run the React frontend:
   ```powershell
   pnpm dev
   ```
4. Open **`http://localhost:3000`** in your browser!

> 💡 **VS Code Tasks:** Press `Ctrl+Shift+P` ➔ **Tasks: Run Task** to pick and launch individual services directly in VS Code tabs.

#### Option 4: Manual Windows Terminals (PowerShell / CMD)
If starting services in separate terminal windows/tabs:
- **Terminal 1 (AI Microservice — Port 8000)**:
  ```powershell
  .\apps\ai-service\venv\Scripts\python.exe apps\ai-service\main.py
  ```
- **Terminal 2 (Express Backend API — Port 3001)**:
  ```powershell
  npm run dev:backend
  ```
- **Terminal 3 (React Frontend Portals — Port 3000)**:
  ```powershell
  npm run dev
  ```

---

### Option A: Run Directly in VS Code (Easiest)

1. Open the project folder `medisync` in **VS Code**.
2. Press **`F5`** (or go to **Run and Debug** sidebar `Ctrl+Shift+D`) and select **`🚀 Launch Backend + AI Microservice`**.
3. Open a terminal (`Ctrl+\``) and run the React frontend:
   ```bash
   npm run dev
   # OR with pnpm
   pnpm dev
   ```
4. Open **`http://localhost:3000`** in your browser!

> **Alternative (VS Code Tasks):** Press `Ctrl+Shift+B` or open Command Palette (`Ctrl+Shift+P`) ➔ **Tasks: Run Task** and choose any service to run directly in VS Code terminals.

---

### Option B: Run Everything Concurrently (Terminal)

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
# Initialize DB tables (creates missing tables)
npm run db:init

# Seed initial users, pharmacies, and alerts
npm run db:seed

# Seed master medicine database (80 drugs)
npm run db:seed:drugs
```

### 🔄 Resetting the Database (Clean Wipe & Reseed)
If you ever encounter table/schema mismatch errors or want a completely fresh database state:
```bash
# Option 1: Clean reset schema & re-seed everything automatically
npm run db:reset:all

# Option 2: Reset schema only (without seeding)
npm run db:reset
```

### 🔑 Test User Credentials (Password for all: `password123`)
- **Patient**: `patient@medisync.ai`
- **Doctor**: `doctor@medisync.ai`
- **Pharmacy**: `pharmacy@medisync.ai`
- **Admin**: `admin@medisync.ai`


## 🧪 Testing

```bash
# Run backend & database unit verification tests
npm run test:backend
# OR
npx tsx apps/backend/scripts/test_prescriptions_feature.ts


# Run Python OCR unit tests
cd apps/ai-service && ./venv/bin/python test_ocr.py
```

---

## 📱 Mobile App (Android & Waydroid)

The Android application is located in `apps/mobile-app` and built using **Kotlin**, **Jetpack Compose**, and **Ktor**.

### 🛠️ Prerequisites for Compiling Android App (CachyOS / Arch Linux)
Install JDK 21 and Android platform tools:
```bash
sudo pacman -S jdk21-openjdk android-tools
```

### 🔨 Building the Android APK
```bash
cd apps/mobile-app

# Grant execution permission to Gradle wrapper (first time only)
chmod +x gradlew

# Build Debug APK
./gradlew assembleDebug
```
The compiled APK will be at: `apps/mobile-app/app/build/outputs/apk/debug/app-debug.apk`

---

### 🤖 Running & Testing on Waydroid (CachyOS)

Your Waydroid container is already running on CachyOS with default IP gateway `192.168.240.1` and container IP `192.168.240.112`.

1. **Ensure `android-tools` (ADB) is installed:**
   ```bash
   sudo pacman -S android-tools
   ```

2. **Connect ADB to Waydroid:**
   ```bash
   adb connect 192.168.240.112:5555
   # Verify device connection:
   adb devices
   ```

3. **Install the Compiled APK into Waydroid:**
   ```bash
   adb install -r apps/mobile-app/app/build/outputs/apk/debug/app-debug.apk
   ```

4. **Launch the Waydroid App:**
   - Either open **MediSync** directly inside the Waydroid UI / application launcher.
   - Or start it via ADB:
   ```bash
   adb shell monkey -p com.medisync.android.debug 1
   ```

5. **Waydroid Host Network Access:**
   - The Android app is preconfigured to talk directly to the Express backend at `http://192.168.240.1:3001/api` (the default host gateway).
   - Ensure your backend and AI services are running on the host (`./run_backend.sh`).

---

## 📚 Related Documentation
- [OCR Pipeline & RAG Guide](docs/OCR_RAG_GUIDE.md)
- [Docker Configuration Guide](ISSUE_DOCKER_CONFIG.md)
- [Project Progress Tracker](progress.md)
