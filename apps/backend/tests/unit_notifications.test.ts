import { describe, test, expect } from './runner';
import {
  registerClient,
  sendNotification,
  broadcastToRole,
} from '../src/services/notification.service';
import { sendAppointmentEmail, sendEhrRecordAddedEmail, sendEhrOtpEmail } from '../src/services/email.service';
import { EventEmitter } from 'events';

// Mock Express Response for SSE testing
class MockSseResponse extends EventEmitter {
  public headers: Record<string, string> = {};
  public writtenData: string[] = [];
  public writableEnded: boolean = false;

  setHeader(name: string, value: string) {
    this.headers[name.toLowerCase()] = value;
  }

  flushHeaders() {
    // mock flush
  }

  write(chunk: string) {
    this.writtenData.push(chunk);
    return true;
  }

  end() {
    this.writableEnded = true;
    this.emit('close');
  }
}

export async function runNotificationUnitTests() {
  await describe('Live Notification & Email Services (Unit & Integration Tests)', async () => {
    await test('registerClient sets proper SSE headers and registers client', () => {
      const mockRes = new MockSseResponse();
      const testUserId = 'user-test-sse-1';

      registerClient(testUserId, mockRes as any);

      expect(mockRes.headers['content-type']).toBe('text/event-stream');
      expect(mockRes.headers['cache-control']).toBe('no-cache, no-transform');
      expect(mockRes.headers['connection']).toBe('keep-alive');
      expect(mockRes.writtenData.length).toBeGreaterThan(0);
      expect(mockRes.writtenData[0]).toContain(': connected');
    });

    await test('sendNotification dispatches structured SSE event to connected client', () => {
      const mockRes = new MockSseResponse();
      const testUserId = 'user-test-sse-2';

      registerClient(testUserId, mockRes as any);

      sendNotification(testUserId, {
        type: 'APPOINTMENT_CONFIRMED',
        title: 'Appointment Confirmed',
        message: 'Dr. Sarah Smith confirmed your visit.',
        meta: { appointmentId: 'appt-123' },
      });

      const lastChunk = mockRes.writtenData[mockRes.writtenData.length - 1];
      expect(lastChunk).toContain('data: ');
      expect(lastChunk).toContain('APPOINTMENT_CONFIRMED');
      expect(lastChunk).toContain('Dr. Sarah Smith confirmed your visit.');
    });

    await test('broadcastToRole delivers notifications only to targeted user roles', () => {
      const patientRes = new MockSseResponse();
      const doctorRes = new MockSseResponse();

      const patientId = 'user-patient-1';
      const doctorId = 'user-doctor-1';

      registerClient(patientId, patientRes as any);
      registerClient(doctorId, doctorRes as any);

      const roleMap = new Map<string, string>([
        [patientId, 'PATIENT'],
        [doctorId, 'DOCTOR'],
      ]);

      broadcastToRole(roleMap, 'PATIENT', {
        type: 'MEDICATION_REMINDER',
        title: 'Time for dosage',
        message: 'Take Paracetamol 500mg',
      });

      const patientHasMsg = patientRes.writtenData.some((c) => c.includes('MEDICATION_REMINDER'));
      const doctorHasMsg = doctorRes.writtenData.some((c) => c.includes('MEDICATION_REMINDER'));

      expect(patientHasMsg).toBe(true);
      expect(doctorHasMsg).toBe(false);
    });

    await test('sendNotification safely handles disconnected/unregistered users without throwing', () => {
      let threw = false;
      try {
        sendNotification('non-existent-user-id', {
          type: 'LOW_STOCK_ALERT',
          title: 'Stock Low',
          message: 'Paracetamol stock under threshold',
        });
      } catch {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    await test('Client disconnect cleans up connection registry', () => {
      const mockRes = new MockSseResponse();
      const testUserId = 'user-test-sse-cleanup';

      registerClient(testUserId, mockRes as any);
      mockRes.end(); // triggers 'close' event

      // After close event, attempting to send should not crash or write to closed stream
      sendNotification(testUserId, {
        type: 'GENERAL',
        title: 'Hello',
        message: 'Test message',
      });

      expect(mockRes.writtenData.some((c) => c.includes('Test message'))).toBe(false);
    });

    await test('Email service functions gracefully handle dispatch without credentials without crashing', async () => {
      // Test sending appointment email
      const apptResult = await sendAppointmentEmail(
        'patient@example.com',
        'John Doe',
        'Appointment Update',
        '<p>Your appointment is scheduled.</p>'
      );
      // Should return boolean without throwing
      expect(typeof apptResult).toBe('boolean');

      // Test sending EHR Record added email
      const ehrResult = await sendEhrRecordAddedEmail(
        'patient@example.com',
        'John Doe',
        'Dr. Smith',
        'Seasonal Allergy - prescribed antihistamines'
      );
      expect(typeof ehrResult).toBe('boolean');

      // Test sending OTP email
      const otpResult = await sendEhrOtpEmail('patient@example.com', 'John Doe', '123456');
      expect(typeof otpResult).toBe('boolean');
    });
  });
}
