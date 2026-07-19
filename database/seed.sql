-- ─────────────────────────────────────────────────────────────────────────────
-- MediSync AI — Database Seed Data (seed.sql)
-- ⚠️  For development and testing only. DO NOT run in production.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Seed Users (passwords are all: "Test@1234") ─────────────────────────────
-- bcrypt hash of "Test@1234" with 12 rounds
INSERT INTO users (user_id, email, password_hash, role, full_name, phone_number) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@medisync.ai',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAoXqvWQ1WToE.1i', 'ADMIN', 'System Admin', '+880-1700-000001'),
  ('00000000-0000-0000-0000-000000000002', 'patient@medisync.ai',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAoXqvWQ1WToE.1i', 'PATIENT', 'Md. Yasir Arafat', '+880-1700-000002'),
  ('00000000-0000-0000-0000-000000000003', 'doctor@medisync.ai',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAoXqvWQ1WToE.1i', 'DOCTOR', 'Dr. Roman Mia', '+880-1700-000003'),
  ('00000000-0000-0000-0000-000000000004', 'pharmacy@medisync.ai',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAoXqvWQ1WToE.1i', 'PHARMACY', 'MediCare Pharmacy', '+880-1700-000004')
ON CONFLICT (email) DO NOTHING;

-- ─── Seed Pharmacy Profile ────────────────────────────────────────────────────
INSERT INTO pharmacies (pharmacy_id, store_name, license_number, street_address, city, is_verified) VALUES
  ('00000000-0000-0000-0000-000000000004', 'MediCare Pharmacy', 'LIC-DH-001', '45 Green Road, Dhanmondi', 'Dhaka', true)
ON CONFLICT (pharmacy_id) DO NOTHING;

-- ─── Seed Master Drug Catalog ─────────────────────────────────────────────────
INSERT INTO master_pharmacy (drug_id, brand_name, salt_composition, strength, estimated_price, is_generic, trust_rating) VALUES
  -- Paracetamol group
  ('10000000-0000-0000-0000-000000000001', 'Napa',       'Paracetamol',               '500mg', 2.50,  false, 4.80),
  ('10000000-0000-0000-0000-000000000002', 'Ace',        'Paracetamol',               '500mg', 2.00,  false, 4.70),
  ('10000000-0000-0000-0000-000000000003', 'Paracetamol','Paracetamol',               '500mg', 1.20,  true,  4.50),
  -- Amoxicillin group
  ('10000000-0000-0000-0000-000000000004', 'Moxacil',    'Amoxicillin Trihydrate',    '500mg', 8.00,  false, 4.90),
  ('10000000-0000-0000-0000-000000000005', 'Fimoxyl',    'Amoxicillin Trihydrate',    '500mg', 6.50,  false, 4.60),
  ('10000000-0000-0000-0000-000000000006', 'Amoxicillin','Amoxicillin Trihydrate',    '500mg', 4.00,  true,  4.30),
  -- Omeprazole group
  ('10000000-0000-0000-0000-000000000007', 'Losectil',   'Omeprazole',                '20mg',  12.00, false, 4.75),
  ('10000000-0000-0000-0000-000000000008', 'Omepra',     'Omeprazole',                '20mg',  8.00,  true,  4.40),
  -- Metformin group
  ('10000000-0000-0000-0000-000000000009', 'Glucomet',   'Metformin Hydrochloride',   '500mg', 5.00,  false, 4.85),
  ('10000000-0000-0000-0000-000000000010', 'Metformin',  'Metformin Hydrochloride',   '500mg', 3.00,  true,  4.50)
ON CONFLICT (drug_id) DO NOTHING;

-- ─── Seed Pharmacy Inventory ──────────────────────────────────────────────────
INSERT INTO pharmacy_inventory (pharmacy_id, drug_id, in_stock, current_price) VALUES
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', true,  2.50),
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', true,  1.20),
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', true,  8.00),
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000007', false, 12.00),
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000009', true,  5.00)
ON CONFLICT (pharmacy_id, drug_id) DO NOTHING;

-- ─── Seed Medication Alerts ────────────────────────────────────────────────────
INSERT INTO medication_alerts (patient_id, medicine_name, dosage, frequency, scheduled_time, status) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Napa', '500mg', 'Twice daily', '08:00', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000002', 'Glucomet', '500mg', 'Once daily', '07:00', 'ACTIVE');
