-- Doctor profiles (extends users WHERE role = 'DOCTOR')
CREATE TABLE IF NOT EXISTS doctor_profiles (
  doctor_id         UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  designation       VARCHAR(255) NOT NULL DEFAULT 'General Physician',
  specialization    VARCHAR(255),
  qualifications    TEXT,
  bio               TEXT,
  consultation_fee  NUMERIC(10,2) DEFAULT 0,
  experience_years  INTEGER DEFAULT 0,
  area              VARCHAR(255),
  city              VARCHAR(100),
  avatar_url        TEXT,
  is_available      BOOLEAN DEFAULT true,
  rating            NUMERIC(3,2) DEFAULT 5.00,
  total_reviews     INTEGER DEFAULT 0,
  languages         TEXT[] DEFAULT ARRAY['Bengali', 'English'],
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Doctor availability slots (multiple per doctor, no overlaps allowed)
CREATE TABLE IF NOT EXISTS doctor_availability (
  slot_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id      UUID NOT NULL REFERENCES doctor_profiles(doctor_id) ON DELETE CASCADE,
  location_name  VARCHAR(255) NOT NULL,  -- clinic/hospital name
  address        TEXT,
  day_of_week    INTEGER[],              -- 0=Sunday...6=Saturday, NULL means all days
  specific_dates DATE[],                 -- specific dates restriction, NULL means recurring
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  max_patients   INTEGER DEFAULT 20,
  is_active      BOOLEAN DEFAULT true,
  CONSTRAINT no_time_overlap UNIQUE (doctor_id, location_name, start_time)  -- enforced in app layer too
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  appointment_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  doctor_id        UUID NOT NULL REFERENCES doctor_profiles(doctor_id) ON DELETE CASCADE,
  slot_id          UUID REFERENCES doctor_availability(slot_id),
  appointment_date DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  location_name    VARCHAR(255),
  address          TEXT,
  reason           TEXT,
  notes            TEXT,
  status           booking_status_enum NOT NULL DEFAULT 'PENDING',
  created_by       user_role_enum NOT NULL DEFAULT 'PATIENT',  -- who created: PATIENT or DOCTOR
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_city ON doctor_profiles(LOWER(city));
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_designation ON doctor_profiles(LOWER(designation));

CREATE TRIGGER update_doctor_profiles_updated_at
  BEFORE UPDATE ON doctor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
