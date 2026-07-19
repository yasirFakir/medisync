-- ─────────────────────────────────────────────────────────────────────────────
-- MediSync AI — Simple Dev Seed File
-- Wipes all existing tables and seeds fresh users with password: "password123"
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Clean Up Existing Data ──────────────────────────────────────────────────
TRUNCATE TABLE 
  users, 
  pharmacies, 
  master_pharmacy, 
  pharmacy_inventory, 
  prescriptions, 
  ehr_records, 
  patient_totp_secrets, 
  triage_sessions, 
  medication_alerts 
CASCADE;

-- ─── Seed Users (Password is: "password123") ─────────────────────────────────
-- Bcryptjs compatible hash of "password123"
INSERT INTO users (user_id, email, password_hash, role, full_name, phone_number) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'ADMIN', 'System Admin', '+880-1700-000001'),
  ('00000000-0000-0000-0000-000000000002', 'patient@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'PATIENT', 'Md. Yasir Arafat', '+880-1700-000002'),
  ('00000000-0000-0000-0000-000000000003', 'doctor@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'DOCTOR', 'Dr. Roman Mia', '+880-1700-000003'),
  ('00000000-0000-0000-0000-000000000004', 'pharmacy@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'PHARMACY', 'MediCare Pharmacy', '+880-1700-000004');

-- ─── Seed Pharmacy Details ───────────────────────────────────────────────────
INSERT INTO pharmacies (pharmacy_id, store_name, license_number, street_address, city, is_verified) VALUES
  ('00000000-0000-0000-0000-000000000004', 'MediCare Pharmacy', 'LIC-DH-001', '45 Green Road, Dhanmondi', 'Dhaka', true);

-- ─── Seed Master Drug Catalog ────────────────────────────────────────────────
INSERT INTO master_pharmacy (drug_id, brand_name, salt_composition, strength, estimated_price, is_generic, trust_rating) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Napa', 'Paracetamol', '500mg', 2.50, false, 4.80),
  ('10000000-0000-0000-0000-000000000002', 'Paracetamol', 'Paracetamol', '500mg', 1.20, true, 4.50),
  ('10000000-0000-0000-0000-000000000003', 'Moxacil', 'Amoxicillin Trihydrate', '500mg', 8.00, false, 4.90);

-- ─── Seed Pharmacy Inventory ──────────────────────────────────────────────────
INSERT INTO pharmacy_inventory (pharmacy_id, drug_id, in_stock, current_price) VALUES
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', true, 2.50),
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', true, 1.20);

-- ─── Seed Medication Alerts ───────────────────────────────────────────────────
INSERT INTO medication_alerts (patient_id, medicine_name, dosage, frequency, scheduled_time, status) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Napa', '500mg', 'Twice daily', '08:00', 'ACTIVE');
