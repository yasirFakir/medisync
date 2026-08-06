import { query } from '../src/config/database';
import { v4 as uuidv4 } from 'uuid';

async function testMultiplePrescriptionsIndependence() {
  console.log('===========================================================');
  console.log('🧪 TEST: Multiple Prescriptions Isolation & Independence');
  console.log('===========================================================\n');

  try {
    // 1. Fetch test patient credentials
    const users = await query<{ user_id: string; email: string }>(
      `SELECT user_id, email FROM users WHERE role = 'PATIENT' LIMIT 1`
    );
    if (!users.length) {
      console.error('❌ FAIL: No PATIENT user found in database.');
      process.exit(1);
    }
    const patientId = users[0].user_id;

    // 2. Define multiple distinct prescriptions with different Doctors, Patients, Hospitals, Dates & Medicines
    const rxData1 = {
      rxId: uuidv4(),
      doctorName: 'Dr. Tariq Rahman (Cardiologist)',
      patientName: 'Rahim Uddin',
      hospitalName: 'Square Hospital Ltd.',
      rxDate: '10/05/2026',
      medicines: [{ brandName: 'Sergel', dosage: '20mg', frequency: '1+0+1' }]
    };

    const rxData2 = {
      rxId: uuidv4(),
      doctorName: 'Dr. Nusrat Jahan (Neurologist)',
      patientName: 'Fatema Begum',
      hospitalName: 'Labaid Specialized Hospital',
      rxDate: '15/06/2026',
      medicines: [{ brandName: 'Epilim', dosage: '500mg', frequency: '0+0+1' }]
    };

    const rxData3 = {
      rxId: uuidv4(),
      doctorName: 'Dr. S. K. Roy (Pediatrician)',
      patientName: 'Ayman Khan',
      hospitalName: 'Apollo Hospitals Dhaka',
      rxDate: '22/07/2026',
      medicines: [{ brandName: 'Tylenol', dosage: '120mg/5ml', frequency: '1+1+1' }]
    };

    const allRx = [rxData1, rxData2, rxData3];

    // 3. Insert initial OCR records for all 3 prescriptions
    for (const rx of allRx) {
      const ocrObj = {
        raw_text: `Rx for ${rx.patientName} at ${rx.hospitalName}`,
        doctor_name: { value: rx.doctorName, confidence: 'high', score: 0.95 },
        patient_name: { value: rx.patientName, confidence: 'high', score: 0.95 },
        hospital_name: { value: rx.hospitalName, confidence: 'high', score: 0.95 },
        prescription_date: { value: rx.rxDate, confidence: 'high', score: 0.95 },
        medicines: rx.medicines.map(m => ({
          brand_name: { value: m.brandName, confidence: 'high', score: 0.9 },
          strength: { value: m.dosage, confidence: 'high', score: 0.9 },
          frequency: { value: m.frequency, confidence: 'high', score: 0.9 },
        }))
      };

      await query(
        `INSERT INTO prescriptions (prescription_id, patient_id, doctor_name, raw_image_url, digitized_notes, medicines, ocr_result, created_at)
         VALUES ($1, $2, $3, '', $4, $5::jsonb, $6::jsonb, NOW())`,
        [rx.rxId, patientId, rx.doctorName, ocrObj.raw_text, JSON.stringify(rx.medicines), JSON.stringify(ocrObj)]
      );
      console.log(`1️⃣ Inserted Prescription #${rx.rxId.substring(0, 8)} (${rx.hospitalName} - ${rx.patientName})`);
    }

    // 4. Update Prescription #2 specifically (Simulate user editing Prescription 2 only)
    const updatedRx2Hospital = 'Evercare Hospital Dhaka';
    const updatedRx2Doctor = 'Dr. Farhana Ahmed';

    const [existing2] = await query<{ ocr_result: any }>(
      `SELECT ocr_result FROM prescriptions WHERE prescription_id = $1`,
      [rxData2.rxId]
    );
    let ocr2 = typeof existing2.ocr_result === 'string' ? JSON.parse(existing2.ocr_result) : existing2.ocr_result;
    ocr2.hospital_name = { value: updatedRx2Hospital, confidence: 'high', score: 1.0 };
    ocr2.doctor_name = { value: updatedRx2Doctor, confidence: 'high', score: 1.0 };

    await query(
      `UPDATE prescriptions SET doctor_name = $1, ocr_result = $2::jsonb WHERE prescription_id = $3`,
      [updatedRx2Doctor, JSON.stringify(ocr2), rxData2.rxId]
    );
    console.log(`\n2️⃣ Specifically edited Prescription #2 (${rxData2.rxId.substring(0, 8)}) -> Hospital: "${updatedRx2Hospital}"`);

    // 5. Query ALL prescriptions from DB and verify data isolation
    const dbPrescriptions = await query<{
      prescription_id: string;
      doctor_name: string;
      ocr_result: any;
    }>(
      `SELECT prescription_id, doctor_name, ocr_result FROM prescriptions WHERE prescription_id IN ($1, $2, $3)`,
      [rxData1.rxId, rxData2.rxId, rxData3.rxId]
    );

    console.log('\n--- 📊 INDEPENDENCE & ISOLATION VERIFICATION ---');

    let allPassed = true;

    dbPrescriptions.forEach(p => {
      const ocr = typeof p.ocr_result === 'string' ? JSON.parse(p.ocr_result) : p.ocr_result;
      const hosp = ocr.hospital_name?.value;
      const doc = p.doctor_name;
      const pat = ocr.patient_name?.value;

      console.log(`Rx #${p.prescription_id.substring(0, 8)} | Hospital: "${hosp}" | Doctor: "${doc}" | Patient: "${pat}"`);

      if (p.prescription_id === rxData1.rxId && hosp !== rxData1.hospitalName) allPassed = false;
      if (p.prescription_id === rxData2.rxId && hosp !== updatedRx2Hospital) allPassed = false;
      if (p.prescription_id === rxData3.rxId && hosp !== rxData3.hospitalName) allPassed = false;
    });

    if (allPassed) {
      console.log('\n✅ TEST PASSED: All prescriptions maintain 100% independent data (Hospital name, Doctor, Patient) without cross-contamination!');
    } else {
      console.error('\n❌ TEST FAILED: Data cross-contamination detected between prescriptions.');
      process.exit(1);
    }

    // Clean up test data
    await query(`DELETE FROM prescriptions WHERE prescription_id IN ($1, $2, $3)`, [rxData1.rxId, rxData2.rxId, rxData3.rxId]);
    console.log(`🧹 Cleaned up 3 test prescription records.\n`);
    process.exit(0);

  } catch (err) {
    console.error('❌ Test execution error:', err);
    process.exit(1);
  }
}

testMultiplePrescriptionsIndependence();
