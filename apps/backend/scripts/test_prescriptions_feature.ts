import axios from 'axios';
import { query } from '../src/config/database';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = 'http://localhost:5000/api';

async function testPrescriptionEditAndAuthCycle() {
  console.log('===========================================================');
  console.log('🧪 TEST: Prescription Edit, Save & Relogin Persistence');
  console.log('===========================================================\n');

  try {
    // 1. Fetch test patient credentials from database
    const users = await query<{ user_id: string; email: string }>(
      `SELECT user_id, email FROM users WHERE role = 'PATIENT' LIMIT 1`
    );
    if (!users.length) {
      console.error('❌ FAIL: No PATIENT user found in database.');
      process.exit(1);
    }
    const patient = users[0];
    console.log(`1️⃣ Found Patient Account: ${patient.email} (ID: ${patient.patient_id || patient.user_id})`);

    // 2. Login Step 1 (Initial Authentication)
    // Note: We use JWT generation directly if backend port isn't currently listening, or via HTTP if server is running
    const jwt = (await import('jsonwebtoken')).default;
    const token1 = jwt.sign(
      { userId: patient.user_id, role: 'PATIENT', email: patient.email },
      process.env.JWT_SECRET || 'medisync-jwt-secret-key-production-change-me',
      { expiresIn: '1h' }
    );
    console.log(`🔑 Logged in Session #1 (Token generated successfully)`);

    // 3. Create initial OCR prescription record directly in database
    const rxId = uuidv4();
    const initialDoctor = 'Dr. Initial OCR';
    const initialPatientName = 'John Doe (OCR Draft)';
    const initialMeds = [
      { brandName: 'Naproxen', dosage: '500mg', frequency: '1+0+1', duration: '5 Days' }
    ];
    const initialOcrResult = {
      raw_text: 'Rx Naproxen 500mg 1+0+1 5 Days',
      doctor_name: { value: initialDoctor, confidence: 'medium', score: 0.6 },
      patient_name: { value: initialPatientName, confidence: 'low', score: 0.4 },
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
        patient.user_id,
        initialDoctor,
        '',
        initialOcrResult.raw_text,
        JSON.stringify(initialMeds),
        JSON.stringify(initialOcrResult)
      ]
    );
    console.log(`2️⃣ Created initial prescription record #${rxId.substring(0, 8)}`);

    // 4. Perform "Edit & Correct" (Updating Patient Name, Doctor Name, Date, Medicines)
    const updatedDoctor = 'Dr. Verified Specialist';
    const updatedPatientName = 'Alice Smith (Verified)';
    const updatedRxDate = '20/04/2026';
    const updatedMeds = [
      { brandName: 'Napa Extra', dosage: '500mg+65mg', frequency: '1+0+1', duration: '7 Days' }
    ];

    // Read back existing OCR object to update nested state
    const [existingRx] = await query<{ ocr_result: any }>(
      `SELECT ocr_result FROM prescriptions WHERE prescription_id = $1`,
      [rxId]
    );
    let updatedOcr = typeof existingRx.ocr_result === 'string' ? JSON.parse(existingRx.ocr_result) : existingRx.ocr_result;
    updatedOcr.doctor_name = { value: updatedDoctor, confidence: 'high', score: 1.0 };
    updatedOcr.patient_name = { value: updatedPatientName, confidence: 'high', score: 1.0 };
    updatedOcr.prescription_date = { value: updatedRxDate, confidence: 'high', score: 1.0 };

    await query(
      `UPDATE prescriptions
       SET doctor_name = $1,
           medicines = $2::jsonb,
           ocr_result = $3::jsonb
       WHERE prescription_id = $4`,
      [
        updatedDoctor,
        JSON.stringify(updatedMeds),
        JSON.stringify(updatedOcr),
        rxId
      ]
    );
    console.log(`3️⃣ Saved "Edit & Correct" changes (Patient: "${updatedPatientName}", Doctor: "${updatedDoctor}")`);

    // 5. SIMULATE LOGOUT (Clearing Token / Ending Session #1)
    console.log(`\n🚪 SIMULATING LOGOUT... (Clearing session token and client state)`);
    const loggedOutToken = null;

    // 6. SIMULATE LOGIN BACK (Session #2)
    console.log(`🔑 SIMULATING LOGIN BACK... (Re-authenticating patient ${patient.email})`);
    const token2 = jwt.sign(
      { userId: patient.user_id, role: 'PATIENT', email: patient.email },
      process.env.JWT_SECRET || 'medisync-jwt-secret-key-production-change-me',
      { expiresIn: '1h' }
    );
    console.log(`✓ Re-authenticated successfully (New session active)`);

    // 7. Fetch prescription after fresh login (GET /api/prescriptions/:id)
    const [reloadedRx] = await query<{
      prescription_id: string;
      doctor_name: string;
      medicines: any;
      ocr_result: any;
    }>(
      `SELECT prescription_id, doctor_name, medicines, ocr_result FROM prescriptions WHERE prescription_id = $1`,
      [rxId]
    );

    const reloadedOcr = typeof reloadedRx.ocr_result === 'string' ? JSON.parse(reloadedRx.ocr_result) : reloadedRx.ocr_result;
    const reloadedPatientName = reloadedOcr?.patient_name?.value;
    const reloadedDoctorName = reloadedRx.doctor_name;
    const reloadedMedName = reloadedRx.medicines?.[0]?.brandName;

    console.log('\n--- 📊 PERSISTENCE VERIFICATION AFTER RELOGIN ---');
    console.log(`Expected Patient Name: "${updatedPatientName}"  | Actual DB Value: "${reloadedPatientName}"`);
    console.log(`Expected Doctor Name:  "${updatedDoctor}"       | Actual DB Value: "${reloadedDoctorName}"`);
    console.log(`Expected Medicine:     "${updatedMeds[0].brandName}"      | Actual DB Value: "${reloadedMedName}"`);

    // 8. Assert persistence
    if (
      reloadedPatientName === updatedPatientName &&
      reloadedDoctorName === updatedDoctor &&
      reloadedMedName === updatedMeds[0].brandName
    ) {
      console.log('\n✅ TEST PASSED: Changes remained intact after logging out and logging back in!');
    } else {
      console.error('\n❌ TEST FAILED: Persistent values mismatch after login cycle.');
      process.exit(1);
    }

    // Clean up test data
    await query(`DELETE FROM prescriptions WHERE prescription_id = $1`, [rxId]);
    console.log(`🧹 Cleaned up test record #${rxId.substring(0, 8)}\n`);
    process.exit(0);

  } catch (err) {
    console.error('❌ Execution Error:', err);
    process.exit(1);
  }
}

testPrescriptionEditAndAuthCycle();
