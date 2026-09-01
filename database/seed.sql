-- ─────────────────────────────────────────────────────────────────────────────
-- MediSync AI — Comprehensive Dev Seed File
-- Wipes all existing tables and seeds fresh users, doctors, pharmacies,
-- master drug catalog, inventory, appointments, prescriptions, and sales history.
-- All user passwords are: "password123"
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
TRUNCATE TABLE 
  doctor_profiles, 
  doctor_availability, 
  appointments, 
  pharmacy_sales, 
  pharmacy_sale_items,
  pharmacy_prescription_access
CASCADE;

-- ─── Seed Users (Password is: "password123") ─────────────────────────────────
-- Bcryptjs compatible hash of "password123"
INSERT INTO users (user_id, email, password_hash, role, full_name, phone_number, address) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'ADMIN', 'System Admin', '+880-1700-000001', 'House 12, Road 5, Dhanmondi, Dhaka'),
  ('00000000-0000-0000-0000-000000000002', 'patient@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'PATIENT', 'Md. Yasir Arafat', '+880-1700-000002', 'Plot 45, Sector 4, Uttara, Dhaka'),
  ('00000000-0000-0000-0000-000000000003', 'doctor@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'DOCTOR', 'Dr. Roman Mia', '+880-1700-000003', 'Green Life Hospital, Green Road, Dhaka'),
  ('00000000-0000-0000-0000-000000000004', 'pharmacy@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'PHARMACY', 'MediCare Pharmacy', '+880-1700-000004', '45 Green Road, Dhanmondi, Dhaka'),
  ('00000000-0000-0000-0000-000000000005', 'labaid.pharma@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'PHARMACY', 'Labaid Pharma & Wellness', '+880-1700-000005', 'House 1, Road 4, Dhanmondi, Dhaka'),
  ('00000000-0000-0000-0000-000000000006', 'popular.pharma@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'PHARMACY', 'Popular Dispensary & Pharmacy', '+880-1700-000006', 'Shantinagar Circle, Dhaka'),
  ('00000000-0000-0000-0000-000000000007', 'square.pharma@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'PHARMACY', 'Square Health Pharmacy', '+880-1700-000007', 'Sector 7, Uttara, Dhaka'),
  ('00000000-0000-0000-0000-000000000008', 'sadia.khan@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'PATIENT', 'Sadia Khan', '+880-1812-345678', 'House 5, Road 11, Banani, Dhaka'),
  ('00000000-0000-0000-0000-000000000009', 'kamrul.hasan@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'PATIENT', 'Kamrul Hasan', '+880-1912-345678', '42 Mirpur Road, Dhaka'),
  ('10000000-0000-0000-0000-000000000001', 'dr.rahman@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'DOCTOR', 'Dr. Arif Rahman', '+8801711111101', 'Gulshan 2, Dhaka'),
  ('10000000-0000-0000-0000-000000000002', 'dr.sultana@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'DOCTOR', 'Dr. Fatema Sultana', '+8801711111102', 'Bakshibazar, Dhaka');

-- ─── Seed Doctor Profiles ─────────────────────────────────────────────────────
INSERT INTO doctor_profiles (doctor_id, designation, specialization, qualifications, bio, consultation_fee, experience_years, area, city, is_available, rating, total_reviews, languages) VALUES
  ('00000000-0000-0000-0000-000000000003', 'General Physician & Internist', 'Internal Medicine', 'MBBS, FCPS (Medicine)', 'General Physician & Internist with 10+ years experience in chronic care, diagnostic medicine, and hypertension management.', 500, 10, 'Dhanmondi', 'Dhaka', true, 4.8, 142, ARRAY['Bengali', 'English']),
  ('10000000-0000-0000-0000-000000000001', 'Cardiologist', 'Cardiology', 'MBBS, MD (Cardiology), FCPS', 'Senior Cardiologist with 15+ years of clinical experience specializing in hypertension, arrhythmia, and heart health.', 800, 15, 'Gulshan', 'Dhaka', true, 4.8, 127, ARRAY['Bengali', 'English']),
  ('10000000-0000-0000-0000-000000000002', 'Gynecologist', 'Gynecology & Obstetrics', 'MBBS, FCPS (Gynae)', 'Experienced gynecologist providing women''s wellness and maternal health care.', 600, 12, 'Dhanmondi', 'Dhaka', true, 4.9, 203, ARRAY['Bengali', 'English', 'Hindi'])
ON CONFLICT (doctor_id) DO NOTHING;

-- ─── Seed Doctor Availability Slots ───────────────────────────────────────────
INSERT INTO doctor_availability (slot_id, doctor_id, location_name, address, day_of_week, start_time, end_time, max_patients) VALUES
  -- Dr. Roman Mia Slots (00000000-0000-0000-0000-000000000003)
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Green Life Hospital Chamber', '32 Green Road, Dhanmondi, Dhaka', ARRAY[0,1,2,3,4,5,6], '09:00', '13:00', 20),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'MediSync Central Clinic', 'Road 7, Dhanmondi, Dhaka', ARRAY[1,3,5], '16:00', '20:00', 15),
  -- Dr. Arif Rahman Slots (10000000-0000-0000-0000-000000000001)
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'MediSync Central Clinic', 'Road 7, Dhanmondi, Dhaka', ARRAY[0,1,2,3,4,5], '09:00', '14:00', 20),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Rahman Heart Center', '23 Gulshan Avenue, Dhaka', ARRAY[2,4], '15:00', '18:00', 10),
  -- Dr. Fatema Sultana Slots (10000000-0000-0000-0000-000000000002)
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Dhaka Medical College & Hospital', 'Bakshibazar, Dhaka', ARRAY[0,1,2,3,4], '10:00', '14:00', 20)
ON CONFLICT DO NOTHING;

-- ─── Seed Appointments (Today's Queue, Upcoming & Past Sessions) ───────────────
INSERT INTO appointments (
  appointment_id, patient_id, doctor_id, slot_id,
  appointment_date, start_time, end_time, location_name, address,
  reason, status, created_by
) VALUES
  -- ── TODAY'S APPOINTMENTS for Dr. Roman Mia ───────────────────────────────────
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    CURRENT_DATE,
    '09:30:00',
    '10:00:00',
    'Green Life Hospital Chamber',
    '32 Green Road, Dhanmondi, Dhaka',
    'Hypertension review & chronic headache consultation',
    'CONFIRMED',
    'PATIENT'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    CURRENT_DATE,
    '10:30:00',
    '11:00:00',
    'Green Life Hospital Chamber',
    '32 Green Road, Dhanmondi, Dhaka',
    'Persistent cough, seasonal fever and allergic rhinitis',
    'CONFIRMED',
    'PATIENT'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    CURRENT_DATE,
    '11:30:00',
    '12:00:00',
    'Green Life Hospital Chamber',
    '32 Green Road, Dhanmondi, Dhaka',
    'Acid peptic disease follow-up & abdominal discomfort',
    'CONFIRMED',
    'PATIENT'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    CURRENT_DATE,
    '12:30:00',
    '13:00:00',
    'Green Life Hospital Chamber',
    '32 Green Road, Dhanmondi, Dhaka',
    'Routine clinical review and blood profile check',
    'PENDING',
    'PATIENT'
  ),

  -- ── UPCOMING APPOINTMENTS ───────────────────────────────────────────────────
  (
    '30000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    CURRENT_DATE + INTERVAL '1 day',
    '10:00:00',
    '10:30:00',
    'Green Life Hospital Chamber',
    '32 Green Road, Dhanmondi, Dhaka',
    'Chest congestion and post-viral recovery check',
    'CONFIRMED',
    'PATIENT'
  ),
  (
    '30000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    CURRENT_DATE + INTERVAL '3 days',
    '11:00:00',
    '11:30:00',
    'Green Life Hospital Chamber',
    '32 Green Road, Dhanmondi, Dhaka',
    'Digestive health follow-up and dietary plan review',
    'CONFIRMED',
    'PATIENT'
  ),

  -- ── COMPLETED PAST APPOINTMENTS ─────────────────────────────────────────────
  (
    '30000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '1 day',
    '09:30:00',
    '10:00:00',
    'Green Life Hospital Chamber',
    '32 Green Road, Dhanmondi, Dhaka',
    'Initial cardiovascular and vitals baseline examination',
    'COMPLETED',
    'PATIENT'
  ),
  (
    '30000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '3 days',
    '10:30:00',
    '11:00:00',
    'Green Life Hospital Chamber',
    '32 Green Road, Dhanmondi, Dhaka',
    'Acute gastric reflux and epigastric burning pain assessment',
    'COMPLETED',
    'PATIENT'
  );

-- ─── Seed Patient Digitized Prescriptions ─────────────────────────────────────
INSERT INTO prescriptions (
  prescription_id,
  patient_id,
  doctor_name,
  raw_image_url,
  digitized_notes,
  ocr_result,
  medicines,
  validation_summary,
  created_at
) VALUES
  (
    '50000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Dr. Md. Arif Hossain',
    '',
    'Prescription for Cardiovascular & Acid Management (Hypertension, Reflux)',
    '{"ocr_engine": "gemini-vision", "doctor_name": {"value": "Dr. Md. Arif Hossain", "confidence": "high", "score": 0.98}, "prescription_date": {"value": "2026-08-15", "confidence": "high", "score": 0.95}}',
    '[
      {"brandName": "Clopilet A", "saltComposition": "Clopidogrel + Aspirin", "dosage": "75mg/75mg", "frequency": "0+1+0", "duration": "30 days"},
      {"brandName": "Aztor", "saltComposition": "Atorvastatin", "dosage": "40mg", "frequency": "0+0+1", "duration": "30 days"},
      {"brandName": "Seclo", "saltComposition": "Omeprazole", "dosage": "20mg", "frequency": "1+0+1", "duration": "14 days"},
      {"brandName": "Bisoren", "saltComposition": "Bisoprolol", "dosage": "2.5mg", "frequency": "1+0+0", "duration": "30 days"}
    ]',
    '{"safetyScore": 98, "interactionWarnings": [], "medicines": [
      {"input": {"brandName": "Clopilet A"}, "matchedDrug": {"brandName": "Clopilet A 75mg", "genericName": "Clopidogrel + Aspirin", "price": 12.00}},
      {"input": {"brandName": "Aztor"}, "matchedDrug": {"brandName": "Aztor 40mg", "genericName": "Atorvastatin", "price": 20.00}},
      {"input": {"brandName": "Seclo"}, "matchedDrug": {"brandName": "Seclo 20mg", "genericName": "Omeprazole", "price": 5.00}},
      {"input": {"brandName": "Bisoren"}, "matchedDrug": {"brandName": "Bisoren 2.5mg", "genericName": "Bisoprolol Fumarate", "price": 6.00}}
    ]}',
    NOW() - INTERVAL '3 days'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Dr. Fatema Sultana',
    '',
    'Prescription for Acute Respiratory Infection and Fever',
    '{"ocr_engine": "gemini-vision", "doctor_name": {"value": "Dr. Fatema Sultana", "confidence": "high", "score": 0.98}, "prescription_date": {"value": "2026-08-28", "confidence": "high", "score": 0.95}}',
    '[
      {"brandName": "Moxacil", "saltComposition": "Amoxicillin", "dosage": "500mg", "frequency": "1+1+1", "duration": "7 days"},
      {"brandName": "Napa Extra", "saltComposition": "Paracetamol + Caffeine", "dosage": "500mg/65mg", "frequency": "1+0+1", "duration": "5 days"},
      {"brandName": "Alatrol", "saltComposition": "Cetirizine", "dosage": "10mg", "frequency": "0+0+1", "duration": "5 days"}
    ]',
    '{"safetyScore": 100, "interactionWarnings": [], "medicines": [
      {"input": {"brandName": "Moxacil"}, "matchedDrug": {"brandName": "Moxacil 500mg", "genericName": "Amoxicillin Trihydrate", "price": 8.00}},
      {"input": {"brandName": "Napa Extra"}, "matchedDrug": {"brandName": "Napa Extra", "genericName": "Paracetamol + Caffeine", "price": 2.50}},
      {"input": {"brandName": "Alatrol"}, "matchedDrug": {"brandName": "Alatrol 10mg", "genericName": "Cetirizine Hydrochloride", "price": 3.50}}
    ]}',
    NOW() - INTERVAL '1 day'
  );

-- ─── Seed EHR Clinical Records ────────────────────────────────────────────────
INSERT INTO ehr_records (
  record_id, patient_id, doctor_id, diagnosis, observations, follow_up_date, prescription_id, session_date
) VALUES
  (
    '35000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'Stage 1 Essential Hypertension & Acid Reflux Disease',
    'Blood pressure: 142/92 mmHg, Pulse: 78 bpm. Patient reports occasional morning occipital headache and post-prandial heartburn. Advised low-sodium DASH diet, regular aerobic exercise, and adherence to anti-platelet and PPI regimen.',
    CURRENT_DATE + INTERVAL '30 days',
    '50000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '3 days'
  ),
  (
    '35000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000003',
    'Acute Upper Respiratory Tract Infection & Allergic Rhinitis',
    'Temperature: 100.2 F, Chest clear on auscultation, erythematous pharyngeal mucosa. Commenced 7-day amoxicillin course, oral antihistamines, and steam inhalation twice daily.',
    CURRENT_DATE + INTERVAL '7 days',
    '50000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '1 day'
  );

-- ─── Seed Pharmacies ─────────────────────────────────────────────────────────
INSERT INTO pharmacies (pharmacy_id, store_name, license_number, street_address, city, is_verified) VALUES
  ('00000000-0000-0000-0000-000000000004', 'MediCare Pharmacy', 'LIC-DH-001', '45 Green Road, Dhanmondi', 'Dhaka', true),
  ('00000000-0000-0000-0000-000000000005', 'Labaid Pharma & Wellness', 'LIC-DH-002', 'House 1, Road 4, Dhanmondi', 'Dhaka', true),
  ('00000000-0000-0000-0000-000000000006', 'Popular Dispensary & Pharmacy', 'LIC-DH-003', 'Shantinagar Circle', 'Dhaka', true),
  ('00000000-0000-0000-0000-000000000007', 'Square Health Pharmacy', 'LIC-DH-004', 'Sector 7, Uttara', 'Dhaka', true);

-- ─── Seed Master Drug Catalog (Comprehensive Bangladesh & International) ─────
INSERT INTO master_pharmacy (drug_id, brand_name, salt_composition, strength, dosage_form, manufacturer, uses, estimated_price, is_generic, trust_rating) VALUES
  -- Analgesics & Antipyretics
  ('40000000-0000-0000-0000-000000000001', 'Napa', 'Paracetamol', '500mg', 'Tablet', 'Square Pharmaceuticals', 'Fever, mild to moderate pain, headache', 1.20, false, 4.90),
  ('40000000-0000-0000-0000-000000000002', 'Napa Extra', 'Paracetamol + Caffeine', '500mg/65mg', 'Tablet', 'Square Pharmaceuticals', 'Severe headache, body aches, migraines', 2.50, false, 4.85),
  ('40000000-0000-0000-0000-000000000003', 'Ace Plus', 'Paracetamol + Caffeine', '500mg/65mg', 'Tablet', 'Square Pharmaceuticals', 'Quick pain relief, fever, muscle aches', 2.50, false, 4.80),
  ('40000000-0000-0000-0000-000000000004', 'Paracetamol', 'Paracetamol', '500mg', 'Tablet', 'Essential Drugs Co.', 'Generic fever and pain management', 0.80, true, 4.50),
  ('40000000-0000-0000-0000-000000000005', 'Fast 500mg', 'Paracetamol', '500mg', 'Tablet', 'Acme Laboratories', 'Fever and pain reduction', 1.20, false, 4.70),

  -- Gastric & Acid Reflux (PPIs)
  ('40000000-0000-0000-0000-000000000006', 'Seclo 20mg', 'Omeprazole', '20mg', 'Capsule', 'Square Pharmaceuticals', 'Gastric ulcer, GERD, acid reflux, heartburn', 5.00, false, 4.95),
  ('40000000-0000-0000-0000-000000000007', 'Sergel 20mg', 'Esomeprazole', '20mg', 'Tablet', 'Incepta Pharmaceuticals', 'Erosive esophagitis, severe acid indigestion', 7.00, false, 4.90),
  ('40000000-0000-0000-0000-000000000008', 'Pantobex 20mg', 'Pantoprazole', '20mg', 'Tablet', 'Beximco Pharma', 'Peptic ulcer, reflux esophagitis', 6.50, false, 4.80),
  ('40000000-0000-0000-0000-000000000009', 'Finix 20mg', 'Rabeprazole Sodium', '20mg', 'Tablet', 'Opsonin Pharma', 'Rapid acid relief, duodenal ulcer', 7.00, false, 4.75),
  ('40000000-0000-0000-0000-000000000010', 'Lanso D 30mg', 'Lansoprazole + Domperidone', '30mg/10mg', 'Capsule', 'Incepta Pharmaceuticals', 'Acid reflux associated with nausea and bloating', 10.00, false, 4.80),

  -- Antibiotics & Anti-Infectives
  ('40000000-0000-0000-0000-000000000011', 'Moxacil 500mg', 'Amoxicillin Trihydrate', '500mg', 'Capsule', 'Square Pharmaceuticals', 'Bacterial respiratory infections, ear-nose-throat infections', 8.00, false, 4.90),
  ('40000000-0000-0000-0000-000000000012', 'Amoxicillin', 'Amoxicillin Trihydrate', '500mg', 'Capsule', 'Essential Drugs Co.', 'Generic broad-spectrum antibiotic', 5.50, true, 4.60),
  ('40000000-0000-0000-0000-000000000013', 'Ciprocin 500mg', 'Ciprofloxacin', '500mg', 'Tablet', 'Square Pharmaceuticals', 'Urinary tract infections, typhoid, gastrointestinal infections', 15.00, false, 4.85),
  ('40000000-0000-0000-0000-000000000014', 'Zimax 500mg', 'Azithromycin', '500mg', 'Tablet', 'Incepta Pharmaceuticals', 'Pneumonia, bronchitis, sinusitis, throat infections', 35.00, false, 4.90),
  ('40000000-0000-0000-0000-000000000015', 'Azithrocin 500mg', 'Azithromycin', '500mg', 'Tablet', 'Square Pharmaceuticals', 'Upper respiratory tract infections, skin infections', 35.00, false, 4.90),
  ('40000000-0000-0000-0000-000000000016', 'Sodiclox 500mg', 'Cloxacillin Sodium', '500mg', 'Capsule', 'Square Pharmaceuticals', 'Skin and soft tissue staphylococcal infections', 10.00, false, 4.75),

  -- Antihistamines & Respiratory
  ('40000000-0000-0000-0000-000000000017', 'Alatrol 10mg', 'Cetirizine Hydrochloride', '10mg', 'Tablet', 'Square Pharmaceuticals', 'Allergic rhinitis, urticaria, sneezing, runny nose', 3.50, false, 4.90),
  ('40000000-0000-0000-0000-000000000018', 'Cetirizine 10mg', 'Cetirizine Hydrochloride', '10mg', 'Tablet', 'Essential Drugs Co.', 'Generic allergy relief', 2.00, true, 4.60),
  ('40000000-0000-0000-0000-000000000019', 'Fexo 120mg', 'Fexofenadine Hydrochloride', '120mg', 'Tablet', 'Square Pharmaceuticals', 'Non-drowsy allergy relief, seasonal hay fever', 9.00, false, 4.85),
  ('40000000-0000-0000-0000-000000000020', 'Bilasten 20mg', 'Bilastine', '20mg', 'Tablet', 'Square Pharmaceuticals', 'Second-generation non-sedating antihistamine for urticaria', 15.00, false, 4.85),
  ('40000000-0000-0000-0000-000000000021', 'Monas 10mg', 'Montelukast Sodium', '10mg', 'Tablet', 'Acme Laboratories', 'Asthma prevention, allergic bronchitis management', 16.00, false, 4.80),

  -- Cardiovascular & Chronic Care
  ('40000000-0000-0000-0000-000000000022', 'Aztor 40mg', 'Atorvastatin', '40mg', 'Tablet', 'Square Pharmaceuticals', 'Hypercholesterolemia, cardiovascular risk prevention', 20.00, false, 4.90),
  ('40000000-0000-0000-0000-000000000023', 'Clopilet A 75mg', 'Clopidogrel + Aspirin', '75mg/75mg', 'Tablet', 'Square Pharmaceuticals', 'Prevention of ischemic stroke and acute coronary syndrome', 12.00, false, 4.85),
  ('40000000-0000-0000-0000-000000000024', 'Bisoren 2.5mg', 'Bisoprolol Fumarate', '2.5mg', 'Tablet', 'Square Pharmaceuticals', 'Hypertension, chronic heart failure, angina', 6.00, false, 4.80),
  ('40000000-0000-0000-0000-000000000025', 'Olmedest 40mg', 'Olmesartan Medoxomil', '40mg', 'Tablet', 'Incepta Pharmaceuticals', 'Essential hypertension management', 14.00, false, 4.85),
  ('40000000-0000-0000-0000-000000000026', 'Vastarel MR 35mg', 'Trimetazidine Dihydrochloride', '35mg', 'Tablet', 'Servier Laboratories', 'Adjunctive treatment for stable angina pectoris and vertigo', 18.00, false, 4.80),
  ('40000000-0000-0000-0000-000000000027', 'Verserc 16mg', 'Betahistine Dihydrochloride', '16mg', 'Tablet', 'Square Pharmaceuticals', 'Meniere''s disease, vertigo, dizziness management', 11.00, false, 4.80),

  -- Vitamins, Minerals & Oral Solutions
  ('40000000-0000-0000-0000-000000000028', 'Electrol ORS', 'Oral Rehydration Salts', 'Standard Sachet', 'Powder', 'SMC Enterprise', 'Dehydration due to diarrhea and heat exhaustion', 6.00, true, 4.95),
  ('40000000-0000-0000-0000-000000000029', 'Zinc B', 'Zinc Sulfate + Vitamin B Complex', 'Standard', 'Syrup/Tablet', 'Square Pharmaceuticals', 'Immune support, nutritional deficiency, recovery', 3.00, false, 4.75),
  ('40000000-0000-0000-0000-000000000030', 'Bextram Gold', 'Multivitamins & Multiminerals', 'Standard', 'Tablet', 'Beximco Pharma', 'Daily comprehensive dietary multivitamin supplement', 12.00, false, 4.85);

-- ─── Seed Pharmacy Inventory (Detailed Batch, Expiry, Cost & Quantities) ──────
-- 1. MediCare Pharmacy (00000000-0000-0000-0000-000000000004) - Primary Store
INSERT INTO pharmacy_inventory (
  inventory_id, pharmacy_id, drug_id, in_stock, current_price, cost_price, quantity, batch_number, expiry_date, rack_location, supplier_name
) VALUES
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001', true, 1.20, 0.90, 250, 'NP-2026-A1', '2027-11-30', 'Rack A-01', 'Square Central Depot'),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', true, 2.50, 1.95, 180, 'NX-2026-C2', '2027-08-15', 'Rack A-02', 'Square Central Depot'),
  ('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000006', true, 5.00, 3.80, 120, 'SC-2026-F1', '2028-02-28', 'Rack B-01', 'Square Central Depot'),
  ('60000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000007', true, 7.00, 5.20, 95, 'SG-2026-B3', '2027-06-30', 'Rack B-02', 'Incepta Pharma Supply'),
  ('60000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000010', true, 10.00, 7.50, 45, 'LD-2026-D4', '2027-05-15', 'Rack B-05', 'Incepta Pharma Supply'),
  ('60000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000011', true, 8.00, 6.10, 80, 'MX-2026-K1', '2027-09-30', 'Rack C-01', 'Square Central Depot'),
  ('60000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000014', true, 35.00, 27.00, 40, 'ZX-2026-M2', '2027-10-31', 'Rack C-03', 'Incepta Pharma Supply'),
  ('60000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000017', true, 3.50, 2.60, 160, 'AL-2026-T1', '2027-12-31', 'Rack D-01', 'Square Central Depot'),
  ('60000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000019', true, 9.00, 6.80, 75, 'FX-2026-H2', '2028-01-31', 'Rack D-02', 'Square Central Depot'),
  ('60000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000021', true, 16.00, 12.00, 50, 'MN-2026-P1', '2027-07-31', 'Rack D-04', 'Acme Distribution'),
  ('60000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000022', true, 20.00, 15.00, 60, 'AZ-2026-Q1', '2027-10-31', 'Rack E-01', 'Square Central Depot'),
  ('60000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000023', true, 12.00, 9.20, 70, 'CL-2026-R3', '2027-09-30', 'Rack E-02', 'Square Central Depot'),
  ('60000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000024', true, 6.00, 4.50, 90, 'BS-2026-S1', '2028-03-31', 'Rack E-03', 'Square Central Depot'),
  ('60000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000026', true, 18.00, 13.50, 40, 'VT-2026-V1', '2027-11-30', 'Rack E-05', 'Servier Bangladesh'),
  ('60000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000028', true, 6.00, 4.50, 300, 'EL-2026-W1', '2028-06-30', 'Rack F-01', 'SMC Distribution'),
  ('60000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000029', true, 3.00, 2.10, 110, 'ZB-2026-Y2', '2027-08-31', 'Rack F-02', 'Square Central Depot'),
  ('60000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000030', true, 12.00, 9.00, 65, 'BG-2026-Z1', '2027-12-31', 'Rack F-03', 'Beximco Pharma Direct'),
  -- Low Stock item (< 10) for testing Low Stock filter
  ('60000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000013', true, 15.00, 11.20, 6, 'CP-2026-J1', '2027-09-30', 'Rack C-02', 'Square Central Depot'),
  -- Expiring Soon item (expires in 15 days) for testing Expiring Soon filter
  ('60000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000020', true, 15.00, 11.00, 25, 'BL-2026-E1', CURRENT_DATE + INTERVAL '15 days', 'Rack D-03', 'Square Central Depot');

-- 2. Labaid Pharma & Wellness Inventory (00000000-0000-0000-0000-000000000005)
INSERT INTO pharmacy_inventory (
  inventory_id, pharmacy_id, drug_id, in_stock, current_price, cost_price, quantity, batch_number, expiry_date, rack_location, supplier_name
) VALUES
  ('60000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000001', true, 1.15, 0.90, 300, 'LB-NP-01', '2027-11-30', 'A-01', 'Labaid Central Warehouse'),
  ('60000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000003', true, 2.45, 1.95, 220, 'LB-AP-01', '2027-10-15', 'A-02', 'Labaid Central Warehouse'),
  ('60000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000007', true, 6.80, 5.20, 140, 'LB-SG-01', '2027-08-30', 'B-01', 'Incepta Supply'),
  ('60000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000013', true, 14.50, 11.00, 90, 'LB-CP-01', '2027-09-30', 'C-01', 'Square Depot'),
  ('60000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000015', true, 34.00, 26.50, 60, 'LB-AZ-01', '2027-12-31', 'C-02', 'Square Depot');

-- ─── Seed Pharmacy Selling History (POS Sales & Invoices) ─────────────────────
-- Sale 1: Walk-in Patient OTC order (Today)
INSERT INTO pharmacy_sales (
  sale_id, pharmacy_id, patient_id, prescription_id, invoice_number,
  subtotal, discount_amount, tax_amount, net_total, cost_total,
  payment_method, pharmacist_id, customer_name, created_at
) VALUES
  (
    '70000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000001',
    'RX-20260902-1042',
    490.00, 20.00, 0.00, 470.00, 362.00,
    'BKASH',
    '00000000-0000-0000-0000-000000000004',
    'Md. Yasir Arafat',
    NOW() - INTERVAL '2 hours'
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    NULL,
    NULL,
    'RX-20260901-8819',
    180.00, 0.00, 0.00, 180.00, 136.00,
    'CASH',
    '00000000-0000-0000-0000-000000000004',
    'Walk-in Customer (Tanvir Ahmed)',
    NOW() - INTERVAL '1 day 3 hours'
  ),
  (
    '70000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000002',
    'RX-20260830-4521',
    315.00, 15.00, 0.00, 300.00, 227.00,
    'CARD',
    '00000000-0000-0000-0000-000000000004',
    'Md. Yasir Arafat',
    NOW() - INTERVAL '3 days 5 hours'
  ),
  (
    '70000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    NULL,
    NULL,
    'RX-20260828-9902',
    560.00, 30.00, 0.00, 530.00, 420.00,
    'NAGAD',
    '00000000-0000-0000-0000-000000000004',
    'Walk-in Customer (Rahima Begum)',
    NOW() - INTERVAL '5 days 4 hours'
  );

-- ─── Seed Pharmacy Sale Line Items ───────────────────────────────────────────
INSERT INTO pharmacy_sale_items (
  item_id, sale_id, inventory_id, medicine_name, generic_name,
  dosage_strength, batch_number, unit_selling_price, unit_cost_price,
  quantity, duration_days, dosage_schedule, line_total, created_at
) VALUES
  -- Sale 1 Line Items (Clopilet A, Aztor, Seclo)
  (
    '80000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000012',
    'Clopilet A 75mg',
    'Clopidogrel + Aspirin',
    '75mg/75mg',
    'CL-2026-R3',
    12.00,
    9.20,
    15,
    15,
    '0+1+0',
    180.00,
    NOW() - INTERVAL '2 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000002',
    '70000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000011',
    'Aztor 40mg',
    'Atorvastatin',
    '40mg',
    'AZ-2026-Q1',
    20.00,
    15.00,
    10,
    10,
    '0+0+1',
    200.00,
    NOW() - INTERVAL '2 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000003',
    '70000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000003',
    'Seclo 20mg',
    'Omeprazole',
    '20mg',
    'SC-2026-F1',
    5.00,
    3.80,
    22,
    11,
    '1+0+1',
    110.00,
    NOW() - INTERVAL '2 hours'
  ),

  -- Sale 2 Line Items (Napa Extra, Alatrol)
  (
    '80000000-0000-0000-0000-000000000004',
    '70000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000002',
    'Napa Extra',
    'Paracetamol + Caffeine',
    '500mg/65mg',
    'NX-2026-C2',
    2.50,
    1.95,
    40,
    NULL,
    'As needed',
    100.00,
    NOW() - INTERVAL '1 day 3 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000005',
    '70000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000008',
    'Alatrol 10mg',
    'Cetirizine Hydrochloride',
    '10mg',
    'AL-2026-T1',
    3.50,
    2.60,
    20,
    NULL,
    '0+0+1',
    70.00,
    NOW() - INTERVAL '1 day 3 hours'
  ),

  -- Sale 3 Line Items (Moxacil 500mg, Napa 500mg)
  (
    '80000000-0000-0000-0000-000000000006',
    '70000000-0000-0000-0000-000000000003',
    '60000000-0000-0000-0000-000000000006',
    'Moxacil 500mg',
    'Amoxicillin Trihydrate',
    '500mg',
    'MX-2026-K1',
    8.00,
    6.10,
    21,
    7,
    '1+1+1',
    168.00,
    NOW() - INTERVAL '3 days 5 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000007',
    '70000000-0000-0000-0000-000000000003',
    '60000000-0000-0000-0000-000000000001',
    'Napa 500mg',
    'Paracetamol',
    '500mg',
    'NP-2026-A1',
    1.20,
    0.90,
    30,
    5,
    '1+0+1',
    36.00,
    NOW() - INTERVAL '3 days 5 hours'
  ),

  -- Sale 4 Line Items (Zimax 500mg, Electrol ORS)
  (
    '80000000-0000-0000-0000-000000000008',
    '70000000-0000-0000-0000-000000000004',
    '60000000-0000-0000-0000-000000000007',
    'Zimax 500mg',
    'Azithromycin',
    '500mg',
    'ZX-2026-M2',
    35.00,
    27.00,
    14,
    7,
    '1+0+0',
    490.00,
    NOW() - INTERVAL '5 days 4 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000009',
    '70000000-0000-0000-0000-000000000004',
    '60000000-0000-0000-0000-000000000015',
    'Electrol ORS',
    'Oral Rehydration Salts',
    'Standard Sachet',
    'EL-2026-W1',
    6.00,
    4.50,
    10,
    NULL,
    'As directed',
    60.00,
    NOW() - INTERVAL '5 days 4 hours'
  );

-- ─── Seed Medication Alerts ───────────────────────────────────────────────────
INSERT INTO medication_alerts (patient_id, medicine_name, dosage, frequency, scheduled_time, status) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Clopilet A', '75mg/75mg', 'Once daily', '13:00', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000002', 'Aztor', '40mg', 'Once daily at bedtime', '22:00', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000002', 'Seclo', '20mg', 'Twice daily before meals', '08:00', 'ACTIVE');
