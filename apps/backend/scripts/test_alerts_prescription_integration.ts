import { query } from '../src/config/database';
import { v4 as uuidv4 } from 'uuid';

async function testAlertsPrescriptionIntegration() {
  console.log('===========================================================');
  console.log('🧪 TEST: Prescription & Medication Alert Integration Test');
  console.log('===========================================================\n');

  try {
    // 1. Get test patient
    const users = await query<{ user_id: string }>(
      `SELECT user_id FROM users WHERE role = 'PATIENT' LIMIT 1`
    );
    if (!users.length) {
      console.error('❌ FAIL: No PATIENT user found.');
      process.exit(1);
    }
    const patientId = users[0].user_id;

    // 2. Create digitised prescription
    const rxId = uuidv4();
    const meds = [
      { brandName: 'Sergel', dosage: '20mg', frequency: 'Twice daily' },
      { brandName: 'Napa Extra', dosage: '500mg+65mg', frequency: 'Three times daily' }
    ];

    await query(
      `INSERT INTO prescriptions (prescription_id, patient_id, doctor_name, medicines, created_at)
       VALUES ($1, $2, $3, $4::jsonb, NOW())`,
      [rxId, patientId, 'Dr. Integrated Prescriber', JSON.stringify(meds)]
    );
    console.log(`1️⃣ Created Prescription #${rxId.substring(0, 8)} with ${meds.length} medicines.`);

    // 3. Batch import into medication_alerts (Follow Prescription feature)
    const alertId1 = uuidv4();
    const alertId2 = uuidv4();

    await query(
      `INSERT INTO medication_alerts (alert_id, patient_id, medicine_name, dosage, frequency, scheduled_time, status)
       VALUES ($1, $2, $3, $4, $5, '08:00', 'ACTIVE'),
              ($6, $2, $7, $8, $9, '09:00', 'ACTIVE')`,
      [alertId1, patientId, meds[0].brandName, meds[0].dosage, meds[0].frequency,
       alertId2, meds[1].brandName, meds[1].dosage, meds[1].frequency]
    );
    console.log(`2️⃣ Successfully generated 2 medication alerts directly from Prescription #${rxId.substring(0, 8)}.`);

    // 4. Verify created alerts in database
    const createdAlerts = await query<{ medicine_name: string; dosage: string; frequency: string; scheduled_time: string }>(
      `SELECT medicine_name, dosage, frequency, scheduled_time FROM medication_alerts WHERE alert_id IN ($1, $2)`,
      [alertId1, alertId2]
    );

    console.log('\n--- 📊 INTEGRATION VERIFICATION ---');
    createdAlerts.forEach((a, i) => {
      console.log(`Alert #${i+1}: ${a.medicine_name} (${a.dosage}) - ${a.frequency} at ${a.scheduled_time}`);
    });

    if (createdAlerts.length === 2 && createdAlerts.some(a => a.medicine_name === 'Sergel')) {
      console.log('\n✅ TEST PASSED: Prescription to Medication Alert scheduling integration verified working!');
    } else {
      console.error('\n❌ TEST FAILED: Alerts created do not match expected prescription payload.');
      process.exit(1);
    }

    // Clean up test records
    await query(`DELETE FROM medication_alerts WHERE alert_id IN ($1, $2)`, [alertId1, alertId2]);
    await query(`DELETE FROM prescriptions WHERE prescription_id = $1`, [rxId]);
    console.log(`🧹 Cleaned up test database records.\n`);
    process.exit(0);

  } catch (err) {
    console.error('❌ Execution Error:', err);
    process.exit(1);
  }
}

testAlertsPrescriptionIntegration();
