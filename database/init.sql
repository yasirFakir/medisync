-- ─────────────────────────────────────────────────────────────────────────────
-- MediSync AI — PostgreSQL Database Schema (init.sql)
-- Version: 2.0 | Based on SRS v2.0 Final
-- Run: psql $DATABASE_URL -f database/init.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Enum Types ────────────────────────────────────────────────────────────────
CREATE TYPE user_role_enum AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN', 'PHARMACY');
CREATE TYPE booking_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE alert_status_enum AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE urgency_level_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- ─── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  user_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role_enum NOT NULL DEFAULT 'PATIENT',
  full_name     VARCHAR(255) NOT NULL,
  phone_number  VARCHAR(50),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── Master Drug Catalog ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS master_pharmacy (
  drug_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_name        VARCHAR(255) NOT NULL,
  salt_composition  VARCHAR(255) NOT NULL,
  strength          VARCHAR(50) NOT NULL,
  estimated_price   NUMERIC(10, 2) NOT NULL,
  is_generic        BOOLEAN DEFAULT false,
  trust_rating      NUMERIC(3, 2) DEFAULT 5.00,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_master_pharmacy_salt ON master_pharmacy (LOWER(salt_composition));
CREATE INDEX IF NOT EXISTS idx_master_pharmacy_brand ON master_pharmacy (LOWER(brand_name));

-- ─── Pharmacies ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pharmacies (
  pharmacy_id    UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  store_name     VARCHAR(255) NOT NULL,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  street_address TEXT NOT NULL,
  city           VARCHAR(100) NOT NULL,
  is_verified    BOOLEAN DEFAULT false,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharmacies_city ON pharmacies (LOWER(city));

-- ─── Pharmacy Inventory ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pharmacy_inventory (
  inventory_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id   UUID NOT NULL REFERENCES pharmacies(pharmacy_id) ON DELETE CASCADE,
  drug_id       UUID NOT NULL REFERENCES master_pharmacy(drug_id) ON DELETE CASCADE,
  in_stock      BOOLEAN DEFAULT true,
  current_price NUMERIC(10, 2),
  last_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pharmacy_id, drug_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_drug ON pharmacy_inventory (drug_id);
CREATE INDEX IF NOT EXISTS idx_inventory_pharmacy ON pharmacy_inventory (pharmacy_id);

-- ─── Prescriptions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  prescription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  doctor_name     VARCHAR(255),
  raw_image_url   TEXT,
  digitized_notes TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions (patient_id);

-- ─── EHR Records ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ehr_records (
  record_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES users(user_id),
  diagnosis       TEXT NOT NULL,
  observations    TEXT NOT NULL,
  follow_up_date  DATE,
  prescription_id UUID REFERENCES prescriptions(prescription_id),
  session_date    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ehr_patient ON ehr_records (patient_id);
CREATE INDEX IF NOT EXISTS idx_ehr_doctor ON ehr_records (doctor_id);

-- ─── TOTP Secrets (for EHR OTP access) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_totp_secrets (
  patient_id   UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  totp_secret  VARCHAR(255) NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── Triage Sessions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS triage_sessions (
  session_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  symptoms           JSONB NOT NULL,
  urgency_level      urgency_level_enum NOT NULL DEFAULT 'LOW',
  ai_response        TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_triage_patient ON triage_sessions (patient_id);

-- ─── Medication Alerts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medication_alerts (
  alert_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  medicine_name  VARCHAR(255) NOT NULL,
  dosage         VARCHAR(100) NOT NULL,
  frequency      VARCHAR(100) NOT NULL,
  scheduled_time VARCHAR(10) NOT NULL,  -- HH:mm
  status         alert_status_enum NOT NULL DEFAULT 'ACTIVE',
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_patient ON medication_alerts (patient_id);

-- ─── Updated_at auto-trigger ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
