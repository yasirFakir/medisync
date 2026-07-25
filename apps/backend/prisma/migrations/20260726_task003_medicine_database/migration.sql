-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN', 'PHARMACY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extend master_pharmacy with TASK-003 required columns (idempotent)
ALTER TABLE master_pharmacy
  ADD COLUMN IF NOT EXISTS dosage_form           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS manufacturer          VARCHAR(255),
  ADD COLUMN IF NOT EXISTS uses                  TEXT,
  ADD COLUMN IF NOT EXISTS side_effects          TEXT,
  ADD COLUMN IF NOT EXISTS contraindications     TEXT,
  ADD COLUMN IF NOT EXISTS drug_interactions     TEXT,
  ADD COLUMN IF NOT EXISTS storage_instructions  TEXT,
  ADD COLUMN IF NOT EXISTS prescription_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add index on manufacturer if not exists
CREATE INDEX IF NOT EXISTS idx_master_pharmacy_manufacturer
  ON master_pharmacy (LOWER(manufacturer));

-- Add updated_at auto-trigger for master_pharmacy
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_master_pharmacy_updated_at
    BEFORE UPDATE ON master_pharmacy
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
