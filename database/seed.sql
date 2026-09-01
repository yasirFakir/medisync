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

-- Truncate extended tables if they exist
TRUNCATE TABLE doctor_profiles, doctor_availability, appointments CASCADE;

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
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'PHARMACY', 'MediCare Pharmacy', '+880-1700-000004'),
  ('10000000-0000-0000-0000-000000000001', 'dr.rahman@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'DOCTOR', 'Dr. Arif Rahman', '+8801711111101'),
  ('10000000-0000-0000-0000-000000000002', 'dr.sultana@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'DOCTOR', 'Dr. Fatema Sultana', '+8801711111102');

-- ─── Seed Doctor Profiles ─────────────────────────────────────────────────────
INSERT INTO doctor_profiles (doctor_id, designation, specialization, qualifications, bio, consultation_fee, experience_years, area, city, is_available, rating, total_reviews, languages) VALUES
  ('00000000-0000-0000-0000-000000000003', 'General Physician', 'Internal Medicine', 'MBBS, FCPS (Medicine)', 'General Physician specializing in diagnostic medicine and patient care.', 500, 10, 'Dhanmondi', 'Dhaka', true, 4.7, 112, ARRAY['Bengali', 'English']),
  ('10000000-0000-0000-0000-000000000001', 'Cardiologist', 'Cardiology', 'MBBS, MD (Cardiology), FCPS', 'Senior Cardiologist with 15+ years of experience specializing in heart disease prevention and treatment.', 800, 15, 'Gulshan', 'Dhaka', true, 4.8, 127, ARRAY['Bengali', 'English']),
  ('10000000-0000-0000-0000-000000000002', 'Gynecologist', 'Gynecology & Obstetrics', 'MBBS, FCPS (Gynae)', 'Experienced gynecologist providing comprehensive women''s health services.', 600, 12, 'Dhanmondi', 'Dhaka', true, 4.9, 203, ARRAY['Bengali', 'English', 'Hindi'])
ON CONFLICT (doctor_id) DO NOTHING;

-- ─── Seed Doctor Availability Slots ───────────────────────────────────────────
INSERT INTO doctor_availability (slot_id, doctor_id, location_name, address, day_of_week, start_time, end_time, max_patients) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'MediSync Central Clinic', 'Road 7, Dhanmondi, Dhaka', ARRAY[0,1,2,3,4,5], '09:00', '14:00', 20),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Rahman Heart Center', '23 Gulshan Avenue, Dhaka', ARRAY[2,4], '15:00', '18:00', 10),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Dhaka Medical College', 'Bakshibazar, Dhaka', ARRAY[0,1,2,3,4], '10:00', '14:00', 20)
ON CONFLICT DO NOTHING;

-- ─── Seed Sample Appointments (Upcoming Patient Follow-ups) ────────────────────
INSERT INTO appointments (
  appointment_id, 
  patient_id, 
  doctor_id, 
  slot_id, 
  appointment_date, 
  start_time, 
  end_time, 
  location_name, 
  address, 
  reason, 
  status, 
  created_by
) VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    CURRENT_DATE + INTERVAL '2 days',
    '10:00:00',
    '11:00:00',
    'MediSync Central Clinic',
    'Road 7, Dhanmondi, Dhaka',
    'Cardiovascular health review & blood pressure follow-up',
    'CONFIRMED',
    'PATIENT'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    CURRENT_DATE + INTERVAL '5 days',
    '11:30:00',
    '12:30:00',
    'Dhaka Medical College',
    'Bakshibazar, Dhaka',
    'Routine health checkup and consultation',
    'PENDING',
    'PATIENT'
  );

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
