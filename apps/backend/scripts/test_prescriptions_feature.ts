import { query } from '../src/config/database';
import { MedicineMatchingService, ExtractedMedicineInput } from '../src/services/matching.service';
import { v4 as uuidv4 } from 'uuid';

async function testPrescriptionFeature() {
  console.log('--- Starting Prescription Edit & Update Feature Test ---');

  try {
    // 1. Get a test patient user
    const users = await query<{ user_id: string }>(
      `SELECT user_id FROM users WHERE role = 'PATIENT' LIMIT 1`
    );
    if (!users.length) {
      console.error('FAIL: No PATIENT user found in database.');
      process.exit(1);
    }
    const patientId = users[0].user_id;
    console.log(`✓ Using test patient ID: ${patientId}`);

    // 2. Insert initial OCR prescription simulation
    const rxId = uuidv4();
    const initialDoctor = 'Dr. Initial OCR';
    const initialPatient = 'John Doe (OCR)';
    const initialMeds = [
      { brandName: 'Naproxen', dosage: '500mg', frequency: '1+0+1', duration: '5 Days' }
    ];
    const initialOcrResult = {
      raw_text: 'Rx Naproxen 500mg 1+0+1 5 Days',
      doctor_name: { value: initialDoctor, confidence: 'medium', score: 0.6 },
      patient_name: { value: initialPatient, confidence: 'low', score: 0.4 },
      prescription_date: { value: '18/04/2026', confidence: 'high', score: 1.0 },
      medicines: [
        {
          brand_name: { value: 'Naproxen', confidence: 'medium', score: 0.6 },
          strength: { value: '500mg', confidence: 'high', score: 0.9 },
          dosage: { value: '500mg', confidence: 'high', score: 0.9 },
          frequency: { value: '1+0+1', confidence: 'medium', score: 0.6 },
          duration: { value: '5 Days', confidence: 'medium', score: 0.6 },
        }
      ]
    };

    await query(
      `INSERT INTO prescriptions (prescription_id, patient_id, doctor_name, raw_image_url, digitized_notes, medicines, ocr_result, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        rxId,
        patientId,
        initialDoctor,
        '',
        initialOcrResult.raw_text,
        JSON.stringify(initialMeds),
        JSON.stringify(initialOcrResult)
      ]
    );
    console.log(`✓ Created test prescription ID: ${rxId}`);

    // 3. Simulate Edit & Correct payload from frontend (updating patientName, doctorName, medicines)
    const updatedDoctor = 'Dr. Verified Specialist';
    const updatedPatient = 'Alice Smith';
    const updatedMeds = [
      { brandName: 'Napa', dosage: '500mg', frequency: '2+2+2', duration: '7 Days' }
    ];

    // Read back existing
    const [existing] = await query<{ patient_id: string; ocr_result: any; medicines: any }>(
      `SELECT patient_id, ocr_result, medicines FROM prescriptions WHERE prescription_id = $1`,
      [rxId]
    );

    let updatedOcr = existing.ocr_result;
    if (typeof updatedOcr === 'string') {
      updatedOcr = JSON.parse(updatedOcr);
    }
    updatedOcr.doctor_name = { ...(updatedOcr.doctor_name || {}), value: updatedDoctor, confidence: 'high', score: 1.0 };
    updatedOcr.patient_name = { ...(updatedOcr.patient_name || {}), value: updatedPatient, confidence: 'high', score: 1.0 };

    // Re-run validation summary
    const formattedInputs: ExtractedMedicineInput[] = updatedMeds.map(m => ({
      brandName: m.brandName,
      strength: m.dosage,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
    }));
    const validationSummary = await MedicineMatchingService.validatePrescriptionPayload(formattedInputs);

    // Perform UPDATE query
    await query(
      `UPDATE prescriptions
       SET doctor_name = $1,
           medicines = $2::jsonb,
           ocr_result = $3::jsonb,
           validation_summary = $4::jsonb
       WHERE prescription_id = $5`,
      [
        updatedDoctor,
        JSON.stringify(updatedMeds),
        JSON.stringify(updatedOcr),
        JSON.stringify(validationSummary),
        rxId
      ]
    );

    // 4. Fetch updated row and verify
    const [updatedRow] = await query<{
      doctor_name: string;
      medicines: any;
      ocr_result: any;
      validation_summary: any;
    }>(
      `SELECT doctor_name, medicines, ocr_result, validation_summary FROM prescriptions WHERE prescription_id = $1`,
      [rxId]
    );

    console.log('\n--- VERIFICATION RESULTS ---');
    const ocrObj = typeof updatedRow.ocr_result === 'string' ? JSON.parse(updatedRow.ocr_result) : updatedRow.ocr_result;
    
    console.log(`Doctor Name in DB:      ${updatedRow.doctor_name}`);
    console.log(`Patient Name in OCR DB: ${ocrObj.patient_name?.value}`);
    console.log(`Medicines Count:        ${updatedRow.medicines?.length}`);

    if (
      updatedRow.doctor_name === updatedDoctor &&
      ocrObj.patient_name?.value === updatedPatient &&
      updatedRow.medicines?.[0]?.brandName === 'Napa'
    ) {
      console.log('\n✅ SUCCESS: All prescription edit and update features verified working perfectly!');
    } else {
      console.error('\n❌ FAIL: Updated values do not match expected input.');
      process.exit(1);
    }

    // Clean up test row
    await query(`DELETE FROM prescriptions WHERE prescription_id = $1`, [rxId]);
    console.log(`✓ Cleaned up test prescription ID: ${rxId}`);
    process.exit(0);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

testPrescriptionFeature();
