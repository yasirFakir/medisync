-- ─────────────────────────────────────────────────────────────────────────────
-- MediSync AI — Prescription Seed File
-- Seeds realistic digitized prescriptions for demo patient (patient@medisync.ai)
-- Safe to re-run: uses ON CONFLICT / DELETE existing sample prescriptions
-- ─────────────────────────────────────────────────────────────────────────────

-- Ensure missing JSONB columns exist if created from older schema
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS ocr_result JSONB;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS medicines JSONB;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS validation_summary JSONB;

DELETE FROM prescriptions WHERE patient_id = '00000000-0000-0000-0000-000000000002';

-- ─── Prescription 1: General Fever & Antibiotic ────────────────────────────────
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
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'Dr. Roman Mia',
  'https://medisync.ai/samples/rx1.jpg',
  'Patient presenting with high fever and respiratory distress. Prescribed Napa, Moxacil, and Voltaren.',
  '{
    "raw_text": "Dr. Roman Mia\nSquare Hospitals Ltd.\nPatient: Md. Yasir Arafat\nDiagnosis: Respiratory Infection & Fever\nRx:\n1. Tab Napa 500mg — 1+0+1 — 5 Days\n2. Cap Moxacil 500mg — 1+1+1 — 7 Days\n3. Tab Voltaren 50mg — 1+0+0 — 3 Days",
    "doctor_name": { "value": "Roman Mia", "confidence": "high", "score": 0.98 },
    "doctor_specialty": { "value": "Internal Medicine", "confidence": "high", "score": 0.95 },
    "patient_name": { "value": "Md. Yasir Arafat", "confidence": "high", "score": 0.96 },
    "patient_age": { "value": "28", "confidence": "high", "score": 0.90 },
    "prescription_date": { "value": "05/08/2026", "confidence": "high", "score": 0.95 },
    "clinical_diagnosis": { "value": "Respiratory Infection & High Fever", "confidence": "high", "score": 0.92 },
    "medicines": [
      {
        "brand_name": { "value": "Napa", "confidence": "high", "score": 0.99 },
        "strength": { "value": "500mg", "confidence": "high", "score": 0.95 },
        "dosage": { "value": "500mg", "confidence": "high", "score": 0.95 },
        "frequency": { "value": "1+0+1", "confidence": "high", "score": 0.95 },
        "duration": { "value": "5 Days", "confidence": "high", "score": 0.90 },
        "special_instructions": { "value": "After meals", "confidence": "medium", "score": 0.75 }
      },
      {
        "brand_name": { "value": "Moxacil", "confidence": "high", "score": 0.98 },
        "strength": { "value": "500mg", "confidence": "high", "score": 0.95 },
        "dosage": { "value": "500mg", "confidence": "high", "score": 0.95 },
        "frequency": { "value": "1+1+1", "confidence": "high", "score": 0.95 },
        "duration": { "value": "7 Days", "confidence": "high", "score": 0.90 },
        "special_instructions": { "value": "Complete full course", "confidence": "high", "score": 0.90 }
      },
      {
        "brand_name": { "value": "Voltaren", "confidence": "high", "score": 0.96 },
        "strength": { "value": "50mg", "confidence": "high", "score": 0.95 },
        "dosage": { "value": "50mg", "confidence": "high", "score": 0.95 },
        "frequency": { "value": "1+0+0", "confidence": "high", "score": 0.95 },
        "duration": { "value": "3 Days", "confidence": "high", "score": 0.90 },
        "special_instructions": { "value": "Take after breakfast", "confidence": "medium", "score": 0.80 }
      }
    ],
    "low_confidence_fields": [],
    "ocr_engine": "mistral-ocr-v2",
    "processing_time_ms": 320
  }',
  '[
    { "brandName": "Napa", "dosage": "500mg", "frequency": "1+0+1", "duration": "5 Days" },
    { "brandName": "Moxacil", "dosage": "500mg", "frequency": "1+1+1", "duration": "7 Days" },
    { "brandName": "Voltaren", "dosage": "50mg", "frequency": "1+0+0", "duration": "3 Days" }
  ]',
  '{
    "totalMedicines": 3,
    "matchedCount": 3,
    "unknownCount": 0,
    "overallConfidence": 0.96,
    "medicines": [
      {
        "input": { "brandName": "Napa", "dosage": "500mg" },
        "matched": true,
        "matchType": "EXACT_BRAND",
        "confidence": 0.99,
        "matchedDrug": { "drugId": "10000000-0000-0000-0000-000000000001", "brandName": "Napa", "saltComposition": "Paracetamol", "strength": "500mg", "estimatedPrice": 2.50 }
      },
      {
        "input": { "brandName": "Moxacil", "dosage": "500mg" },
        "matched": true,
        "matchType": "EXACT_BRAND",
        "confidence": 0.98,
        "matchedDrug": { "drugId": "10000000-0000-0000-0000-000000000009", "brandName": "Moxacil", "saltComposition": "Amoxicillin Trihydrate", "strength": "500mg", "estimatedPrice": 8.00 }
      },
      {
        "input": { "brandName": "Voltaren", "dosage": "50mg" },
        "matched": true,
        "matchType": "EXACT_BRAND",
        "confidence": 0.96,
        "matchedDrug": { "drugId": "10000000-0000-0000-0000-000000000008", "brandName": "Voltaren", "saltComposition": "Diclofenac Sodium", "strength": "50mg", "estimatedPrice": 12.00 }
      }
    ]
  }',
  NOW() - INTERVAL '2 days'
);

-- ─── Prescription 2: Joint Pain & Infection Rx ─────────────────────────────────
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
) VALUES (
  '20000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'Dr. Fatema Begum',
  'https://medisync.ai/samples/rx2.jpg',
  'Patient complaining of acute joint pain and pharyngitis. Prescribed Brufen and Zithromax.',
  '{
    "raw_text": "Dr. Fatema Begum\nPopular Diagnostic Centre\nPatient: Md. Yasir Arafat\nDiagnosis: Acute Joint Inflammation\nRx:\n1. Tab Brufen 400mg — 1+0+1 — 5 Days\n2. Tab Zithromax 500mg — 1+0+0 — 3 Days",
    "doctor_name": { "value": "Fatema Begum", "confidence": "high", "score": 0.97 },
    "doctor_specialty": { "value": "Orthopedics & Pain Management", "confidence": "high", "score": 0.94 },
    "patient_name": { "value": "Md. Yasir Arafat", "confidence": "high", "score": 0.96 },
    "prescription_date": { "value": "06/08/2026", "confidence": "high", "score": 0.95 },
    "clinical_diagnosis": { "value": "Acute Joint Inflammation & Pharyngitis", "confidence": "high", "score": 0.91 },
    "medicines": [
      {
        "brand_name": { "value": "Brufen", "confidence": "high", "score": 0.97 },
        "strength": { "value": "400mg", "confidence": "high", "score": 0.95 },
        "dosage": { "value": "400mg", "confidence": "high", "score": 0.95 },
        "frequency": { "value": "1+0+1", "confidence": "high", "score": 0.95 },
        "duration": { "value": "5 Days", "confidence": "high", "score": 0.90 },
        "special_instructions": { "value": "Take after meals", "confidence": "high", "score": 0.88 }
      },
      {
        "brand_name": { "value": "Zithromax", "confidence": "high", "score": 0.96 },
        "strength": { "value": "500mg", "confidence": "high", "score": 0.95 },
        "dosage": { "value": "500mg", "confidence": "high", "score": 0.95 },
        "frequency": { "value": "1+0+0", "confidence": "high", "score": 0.95 },
        "duration": { "value": "3 Days", "confidence": "high", "score": 0.90 },
        "special_instructions": { "value": "Single daily dose", "confidence": "high", "score": 0.85 }
      }
    ],
    "low_confidence_fields": [],
    "ocr_engine": "mistral-ocr-v2",
    "processing_time_ms": 280
  }',
  '[
    { "brandName": "Brufen", "dosage": "400mg", "frequency": "1+0+1", "duration": "5 Days" },
    { "brandName": "Zithromax", "dosage": "500mg", "frequency": "1+0+0", "duration": "3 Days" }
  ]',
  '{
    "totalMedicines": 2,
    "matchedCount": 2,
    "unknownCount": 0,
    "overallConfidence": 0.96,
    "medicines": [
      {
        "input": { "brandName": "Brufen", "dosage": "400mg" },
        "matched": true,
        "matchType": "EXACT_BRAND",
        "confidence": 0.97,
        "matchedDrug": { "drugId": "10000000-0000-0000-0000-000000000006", "brandName": "Brufen", "saltComposition": "Ibuprofen", "strength": "400mg", "estimatedPrice": 5.00 }
      },
      {
        "input": { "brandName": "Zithromax", "dosage": "500mg" },
        "matched": true,
        "matchType": "EXACT_BRAND",
        "confidence": 0.96,
        "matchedDrug": { "drugId": "10000000-0000-0000-0000-000000000012", "brandName": "Zithromax", "saltComposition": "Azithromycin", "strength": "500mg", "estimatedPrice": 35.00 }
      }
    ]
  }',
  NOW() - INTERVAL '1 day'
);
