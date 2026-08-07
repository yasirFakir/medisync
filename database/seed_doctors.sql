INSERT INTO users (user_id, email, password_hash, role, full_name, phone_number) VALUES
  ('10000000-0000-0000-0000-000000000001', 'dr.rahman@medisync.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniMZDMiDOSPqe7qxoQqvZ/7Bq', 'DOCTOR', 'Dr. Arif Rahman', '+8801711111101'),
  ('10000000-0000-0000-0000-000000000002', 'dr.sultana@medisync.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniMZDMiDOSPqe7qxoQqvZ/7Bq', 'DOCTOR', 'Dr. Fatema Sultana', '+8801711111102'),
  ('10000000-0000-0000-0000-000000000003', 'dr.hossain@medisync.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniMZDMiDOSPqe7qxoQqvZ/7Bq', 'DOCTOR', 'Dr. Kamal Hossain', '+8801711111103'),
  ('10000000-0000-0000-0000-000000000004', 'dr.begum@medisync.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniMZDMiDOSPqe7qxoQqvZ/7Bq', 'DOCTOR', 'Dr. Nasrin Begum', '+8801711111104'),
  ('10000000-0000-0000-0000-000000000005', 'dr.chowdhury@medisync.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniMZDMiDOSPqe7qxoQqvZ/7Bq', 'DOCTOR', 'Dr. Tanvir Chowdhury', '+8801711111105')
ON CONFLICT DO NOTHING;

INSERT INTO doctor_profiles (doctor_id, designation, specialization, qualifications, bio, consultation_fee, experience_years, area, city, is_available, rating, total_reviews, languages) VALUES
  ('00000000-0000-0000-0000-000000000003', 'General Physician', 'Internal Medicine', 'MBBS, FCPS (Medicine)', 'General Physician specializing in diagnostic medicine and patient care.', 500, 10, 'Dhanmondi', 'Dhaka', true, 4.7, 112, ARRAY['Bengali', 'English']),
  ('10000000-0000-0000-0000-000000000001', 'Cardiologist', 'Cardiology', 'MBBS, MD (Cardiology), FCPS', 'Senior Cardiologist with 15+ years of experience specializing in heart disease prevention and treatment.', 800, 15, 'Gulshan', 'Dhaka', true, 4.8, 127, ARRAY['Bengali', 'English']),
  ('10000000-0000-0000-0000-000000000002', 'Gynecologist', 'Gynecology & Obstetrics', 'MBBS, FCPS (Gynae)', 'Experienced gynecologist providing comprehensive women''s health services including prenatal care.', 600, 12, 'Dhanmondi', 'Dhaka', true, 4.9, 203, ARRAY['Bengali', 'English', 'Hindi']),
  ('10000000-0000-0000-0000-000000000003', 'General Physician', 'Internal Medicine', 'MBBS, BCS (Health)', 'Dedicated general physician providing primary healthcare and chronic disease management.', 300, 8, 'Mirpur', 'Dhaka', true, 4.6, 89, ARRAY['Bengali']),
  ('10000000-0000-0000-0000-000000000004', 'Dermatologist', 'Dermatology', 'MBBS, DDV, MD (Derm)', 'Expert dermatologist specializing in skin, hair, and nail disorders.', 700, 10, 'Banani', 'Dhaka', true, 4.7, 156, ARRAY['Bengali', 'English']),
  ('10000000-0000-0000-0000-000000000005', 'Neurologist', 'Neurology', 'MBBS, MD (Neurology)', 'Specialist in neurological conditions including headache, epilepsy, and stroke.', 900, 14, 'Chittagong', 'Chittagong', true, 4.8, 98, ARRAY['Bengali', 'English'])
ON CONFLICT DO NOTHING;

INSERT INTO doctor_availability (doctor_id, location_name, address, day_of_week, start_time, end_time, max_patients) VALUES
  ('00000000-0000-0000-0000-000000000003', 'MediSync Central Clinic', 'Road 7, Dhanmondi, Dhaka', ARRAY[0,1,2,3,4,5], '09:00', '14:00', 20),
  ('10000000-0000-0000-0000-000000000001', 'Apollo Hospital Dhaka', 'Plot 81, Block E, Bashundhara R/A, Dhaka', ARRAY[0,1,3,5], '09:00', '13:00', 15),
  ('10000000-0000-0000-0000-000000000001', 'Rahman Heart Center', '23 Gulshan Avenue, Dhaka', ARRAY[2,4], '15:00', '18:00', 10),
  ('10000000-0000-0000-0000-000000000002', 'Dhaka Medical College', 'Bakshibazar, Dhaka', ARRAY[0,1,2,3,4], '10:00', '14:00', 20),
  ('10000000-0000-0000-0000-000000000003', 'Mirpur Health Center', '2 Mirpur Road, Dhaka', ARRAY[0,2,4,6], '16:00', '20:00', 25),
  ('10000000-0000-0000-0000-000000000004', 'SkinCare Clinic Banani', '15 Kamal Ataturk Ave, Dhaka', ARRAY[1,3,5], '11:00', '15:00', 12),
  ('10000000-0000-0000-0000-000000000005', 'Chittagong General Hospital', 'K.B. Fazlul Kader Road, Chittagong', ARRAY[0,1,2,3,4], '09:00', '13:00', 20)
ON CONFLICT DO NOTHING;
