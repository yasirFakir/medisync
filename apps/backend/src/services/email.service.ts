import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from '../config/logger';

// Create Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: config.smtp.user && config.smtp.pass ? {
    user: config.smtp.user,
    pass: config.smtp.pass,
  } : undefined,
  connectionTimeout: 8000,
});

/**
 * Sends EHR Access OTP via email to patient.
 * Gracefully handles failures without breaking application execution.
 */
export const sendEhrOtpEmail = async (toEmail: string, patientName: string, otp: string): Promise<boolean> => {
  if (!toEmail) {
    logger.warn('Email service: missing recipient address');
    return false;
  }

  const html = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
      <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #00685f;">
        <h2 style="color: #00685f; margin: 0; font-size: 22px; font-weight: 800;">MediSync AI Health Portal</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Electronic Health Record (EHR) Security Verification</p>
      </div>

      <div style="padding: 24px 0;">
        <p style="font-size: 14px; color: #1e293b;">Hello <strong>${patientName || 'Patient'}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
          A doctor or clinical practitioner has requested security verification to view your electronic health records.
        </p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
          <div style="font-size: 12px; color: #166534; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Your 6-Digit EHR Access OTP</div>
          <div style="font-size: 32px; font-weight: 900; color: #00685f; letter-spacing: 8px; font-family: monospace; margin: 10px 0;">${otp}</div>
          <div style="font-size: 12px; color: #15803d;">Valid for 5 minutes • Do not share with unauthorized persons</div>
        </div>

        <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #334155;">
          💡 <strong>Tip for Doctors:</strong> You can also use the instant demo shortcut key <code>123456</code> during testing.
        </div>
      </div>

      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} MediSync AI Medical Systems. All rights reserved.
      </div>
    </div>
  `;

  try {
    if (!config.smtp.user || !config.smtp.pass) {
      logger.warn(`SMTP credentials not fully configured in .env. Skipping email dispatch for ${toEmail}.`);
      return false;
    }

    const info = await transporter.sendMail({
      from: config.smtp.from,
      to: toEmail,
      subject: `[MediSync] Your EHR Access Verification OTP Key: ${otp}`,
      html,
    });

    logger.info(`📧 EHR OTP email dispatched successfully to ${toEmail}. MessageID: ${info.messageId}`);
    return true;
  } catch (err: any) {
    logger.error(`⚠️ Failed to send EHR OTP email to ${toEmail}: ${err?.message || err}`);
    return false;
  }
};

/**
 * Sends appointment-related notifications via email.
 */
export const sendAppointmentEmail = async (
  toEmail: string,
  recipientName: string,
  subject: string,
  bodyHtml: string
): Promise<boolean> => {
  if (!toEmail) return false;
  const html = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
      <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #00685f;">
        <h2 style="color: #00685f; margin: 0; font-size: 22px; font-weight: 800;">MediSync AI Health Portal</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Appointment Notification</p>
      </div>
      <div style="padding: 24px 0;">
        <p style="font-size: 14px; color: #1e293b;">Hello <strong>${recipientName}</strong>,</p>
        ${bodyHtml}
      </div>
      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} MediSync AI Medical Systems. All rights reserved.
      </div>
    </div>
  `;
  try {
    if (!config.smtp.user || !config.smtp.pass) {
      logger.warn(`SMTP not configured. Skipping appointment email to ${toEmail}.`);
      return false;
    }
    const info = await transporter.sendMail({ from: config.smtp.from, to: toEmail, subject, html });
    logger.info(`📧 Appointment email sent to ${toEmail}. MessageID: ${info.messageId}`);
    return true;
  } catch (err: any) {
    logger.error(`⚠️ Failed to send appointment email to ${toEmail}: ${err?.message || err}`);
    return false;
  }
};

/**
 * Sends an EHR record-added notification email to a patient.
 */
export const sendEhrRecordAddedEmail = async (
  toEmail: string,
  patientName: string,
  doctorName: string,
  diagnosis: string
): Promise<boolean> => {
  const formattedDoctor = (doctorName || 'Doctor')
    .trim()
    .replace(/^(?:(?:dr\.|dr|doctor)\s*)+/i, '')
    .trim();
  const docDisplayName = formattedDoctor ? `Dr. ${formattedDoctor}` : 'Your Doctor';

  const bodyHtml = `
    <p style="font-size: 14px; color: #475569; line-height: 1.5;">
      <strong>${docDisplayName}</strong> has added a new medical record to your Electronic Health Record (EHR).
    </p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <div style="font-size: 12px; color: #166534; font-weight: 700; text-transform: uppercase;">Diagnosis / Notes</div>
      <div style="font-size: 15px; font-weight: 600; color: #00685f; margin-top: 8px;">${diagnosis}</div>
    </div>
    <p style="font-size: 13px; color: #64748b;">You can review your full medical history on the MediSync portal.</p>
  `;
  return sendAppointmentEmail(
    toEmail,
    patientName,
    `[MediSync] New Health Record Added by ${docDisplayName}`,
    bodyHtml
  );
};
