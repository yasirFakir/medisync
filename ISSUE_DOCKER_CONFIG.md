# Issue: Standardize & Streamline Docker Compose Environment Configuration and DB Auto-Seeding

**Type:** `bug` / `enhancement`  
**Priority:** `Medium`  
**Component:** `Infrastructure / Docker`

---

## 📌 Problem Description
Setting up and running the full MediSync stack via `docker compose up --build` currently encounters friction points:

1. **Host vs Container DB Port Conflict**: Port `5432` on the host machine conflicts with host PostgreSQL services if active (`ECONNREFUSED` / port binding errors).
2. **Database Initialization Race Condition**: `medisync-backend` fails to start (`getaddrinfo ENOTFOUND db` / connection timeouts / missing tables) if DB migrations (`init.sql`) and seed data (`seed.sql`) are not pre-loaded into the Postgres container before service bootstrap.
3. **Manual Seeding Dependency**: `npm run db:seed` relies on host Node environment and expects a direct local DB connection at `127.0.0.1:5432`.

---

## 🎯 Proposed Solution

1. **Automated DB Entrypoint Initialization**:
   - Update `docker-compose.yml` DB service volume mounts to auto-execute `database/init.sql` and `database/seed.sql` on container first boot via `/docker-entrypoint-initdb.d/`.
   - Update DB healthcheck to ensure tables exist before dependent services (`backend`, `ai-service`) start.

2. **Unified Local vs Docker Environment**:
   - Standardize `.env.docker` and `.env.example` configurations to avoid host `.env` overriding container environment variables.
   - Configure Vite preview/dev proxies cleanly to resolve `backend:3001` inside container networks.

3. **Developer Experience (DX) Improvement**:
   - Add a one-step Makefile or helper script (`pnpm docker:up`) to handle start, clean teardown, and seed execution without manual intervention.

---

## 📑 Steps to Reproduce / Affected Environment
- System: Linux / Docker 24+ / Docker Compose v2
- Command: `sudo docker compose up --build` followed by `npm run db:seed` from host terminal.

---

## ✅ Acceptance Criteria
- Running `docker compose up --build` initializes DB schema, runs seed data automatically, and starts all 4 services (`db`, `ai-service`, `backend`, `frontend`) cleanly on fresh clone.
- Zero manual host `psql` or `npm run db:seed` steps required when using Docker.
