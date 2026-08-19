import { describe, test, expect } from './runner';
import { query } from '../src/config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';
import { v4 as uuidv4 } from 'uuid';

export async function runAuthAndDbSafeTests() {
  await describe('Database Rollback Compliant Auth & Persistence Tests', async () => {

    await test('User Creation, Hash Verification and Explicit Cleanup Rollback', async () => {
      const testUserId = uuidv4();
      const testEmail = `test.user.${Date.now()}@medisync.test`;
      const testPassword = 'SecurePassword123!';
      const passwordHash = await bcrypt.hash(testPassword, 10);

      try {
        // Insert test user
        await query(
          `INSERT INTO users (user_id, email, password_hash, role, full_name)
           VALUES ($1, $2, $3, 'PATIENT', 'Test User')`,
          [testUserId, testEmail, passwordHash]
        );

        // Verify retrieval & bcrypt comparison
        const users = await query<{ user_id: string; email: string; password_hash: string }>(
          `SELECT user_id, email, password_hash FROM users WHERE user_id = $1`,
          [testUserId]
        );
        expect(users.length).toBe(1);
        expect(users[0].email).toBe(testEmail);

        const passwordMatches = await bcrypt.compare(testPassword, users[0].password_hash);
        expect(passwordMatches).toBe(true);

        const wrongPasswordMatches = await bcrypt.compare('WrongPassword!', users[0].password_hash);
        expect(wrongPasswordMatches).toBe(false);

        // Verify JWT signing and decoding
        const token = jwt.sign(
          { userId: users[0].user_id, email: users[0].email, role: 'PATIENT' },
          config.jwtSecret,
          { expiresIn: '1h' }
        );
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        expect(decoded.userId).toBe(testUserId);
        expect(decoded.email).toBe(testEmail);

      } finally {
        // Database Rollback Policy: MUST clean up all created rows
        await query(`DELETE FROM users WHERE user_id = $1`, [testUserId]);
        const checkCleanup = await query(`SELECT user_id FROM users WHERE user_id = $1`, [testUserId]);
        expect(checkCleanup.length).toBe(0);
      }
    });

    await test('Prescription CRUD & Cleanup Verification', async () => {
      const rxId = uuidv4();
      const testDoctor = 'Dr. Automated Tester';
      const sampleMeds = [{ brandName: 'Napa 500mg', dosage: '1+0+1' }];

      // Find an existing patient for foreign key reference
      const patients = await query<{ user_id: string }>(
        `SELECT user_id FROM users WHERE role = 'PATIENT' LIMIT 1`
      );
      if (!patients.length) {
        console.log('    ℹ Skipped: No PATIENT found for prescription test');
        return;
      }
      const patientId = patients[0].user_id;

      try {
        // Create prescription
        await query(
          `INSERT INTO prescriptions (prescription_id, patient_id, doctor_name, raw_image_url, digitized_notes, medicines, created_at)
           VALUES ($1, $2, $3, '', 'Notes', $4::jsonb, NOW())`,
          [rxId, patientId, testDoctor, JSON.stringify(sampleMeds)]
        );

        // Read prescription
        const rxs = await query<{ prescription_id: string; doctor_name: string; medicines: any }>(
          `SELECT prescription_id, doctor_name, medicines FROM prescriptions WHERE prescription_id = $1`,
          [rxId]
        );
        expect(rxs.length).toBe(1);
        expect(rxs[0].doctor_name).toBe(testDoctor);

        // Update prescription
        await query(
          `UPDATE prescriptions SET doctor_name = $1 WHERE prescription_id = $2`,
          ['Dr. Updated Tester', rxId]
        );
        const updated = await query<{ doctor_name: string }>(
          `SELECT doctor_name FROM prescriptions WHERE prescription_id = $1`,
          [rxId]
        );
        expect(updated[0].doctor_name).toBe('Dr. Updated Tester');

      } finally {
        // Database Rollback Policy: Delete test prescription
        await query(`DELETE FROM prescriptions WHERE prescription_id = $1`, [rxId]);
        const checkCleanup = await query(`SELECT prescription_id FROM prescriptions WHERE prescription_id = $1`, [rxId]);
        expect(checkCleanup.length).toBe(0);
      }
    });

  });
}
