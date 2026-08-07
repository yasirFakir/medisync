-- Dose Logs — tracks when a patient marks a dose as taken
CREATE TABLE IF NOT EXISTS dose_logs (
  log_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id    UUID NOT NULL REFERENCES medication_alerts(alert_id) ON DELETE CASCADE,
  patient_id  UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  taken_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  slot_name   VARCHAR(50) NOT NULL DEFAULT 'Morning',
  taken_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(alert_id, taken_date, slot_name)
);

CREATE INDEX IF NOT EXISTS idx_dose_logs_alert ON dose_logs (alert_id);
CREATE INDEX IF NOT EXISTS idx_dose_logs_patient ON dose_logs (patient_id);
