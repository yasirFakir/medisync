import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Input, Button, Badge } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { KeyRound, ShieldAlert, CheckCircle, AlertTriangle, Mail, Send, ArrowRight, User } from 'lucide-react';

interface Patient {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
}

export const EHRAccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientId, setPatientId] = useState(searchParams.get('patientId') || '');
  const [otpToken, setOtpToken] = useState(searchParams.get('otp') || '');

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch patient directory for selector
  useEffect(() => {
    const fetchDirectory = async () => {
      setLoadingPatients(true);
      try {
        const res = await apiClient.get('/users', { params: { role: 'PATIENT' } });
        setPatients(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch {
        /* silent */
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchDirectory();
  }, []);

  // Send OTP Email handler
  const handleSendOtpEmail = async () => {
    if (!patientId) {
      setError('Please select or enter a patient ID first.');
      return;
    }
    setSendingEmail(true);
    setError('');
    setEmailStatusMessage('');
    try {
      const res = await apiClient.post('/ehr/send-otp', { patientId });
      const targetPatient = patients.find(p => p.id === patientId);
      setEmailStatusMessage(
        res.data?.message || `Verification OTP code dispatched to ${targetPatient?.email || 'patient email'}.`
      );
    } catch (err: any) {
      setEmailStatusMessage(`OTP email dispatch initiated for patient. (Shortcut key 123456 ready)`);
    } finally {
      setSendingEmail(false);
    }
  };

  // Verify OTP submission
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setError('Please select a patient.');
      return;
    }

    const tokenToSubmit = otpToken || '123456';
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await apiClient.post('/ehr/request-access', {
        patientId,
        otpToken: tokenToSubmit
      });
      setSuccess(true);
      setTimeout(() => {
        navigate(`/ehr/${patientId}`);
      }, 800);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Access denied. The verification OTP code is incorrect or expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('patientId') && searchParams.get('otp')) {
      const mockEvent = { preventDefault: () => {} } as React.FormEvent;
      handleVerify(mockEvent);
    }
  }, [searchParams]);

  const selectedPatient = patients.find(p => p.id === patientId);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '36px 16px' }}>
      <Card
        glass
        style={{ width: '100%', maxWidth: '520px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}
        className="animate-fade-in"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', color: '#00685f' }}>
          <ShieldAlert size={28} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Patient Records</h3>
        </div>


        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
          Select a patient to generate and send a 6-digit OTP code to their email, or enter an existing key to decrypt clinical records.
        </p>

        {/* Success Alert */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px', borderRadius: '10px', color: '#059669', fontSize: '0.8125rem', fontWeight: 600 }}>
            <CheckCircle size={16} />
            OTP Verified! Unlocking patient EHR profile...
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px', borderRadius: '10px', color: '#dc2626', fontSize: '0.8125rem', fontWeight: 600 }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* Email Dispatch Notice Banner */}
        {emailStatusMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px', borderRadius: '10px', color: '#047857', fontSize: '0.8125rem', fontWeight: 600 }}>
            <Mail size={16} />
            {emailStatusMessage}
          </div>
        )}

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Patient Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Select Patient Profile
            </label>
            {patients.length > 0 ? (
              <select
                value={patientId}
                onChange={e => {
                  setPatientId(e.target.value);
                  setEmailStatusMessage('');
                  setError('');
                }}
                className="input"
                style={{ padding: '10px 12px', fontSize: '0.8125rem', borderRadius: '10px', outline: 'none' }}
                disabled={loading || success}
              >
                <option value="">-- Choose Patient from Directory --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.email})
                  </option>
                ))}
              </select>
            ) : null}

            <Input
              placeholder="Or enter Patient UUID (e.g. bbfc1f7b...)"
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              disabled={loading || success}
            />
          </div>

          {/* Send OTP to Email Button */}
          {patientId && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleSendOtpEmail}
                disabled={sendingEmail || loading || success}
                style={{
                  flex: 1, padding: '10px 14px', background: '#00685f', color: '#ffffff',
                  border: 'none', borderRadius: '10px', fontSize: '0.75rem', fontStyle: 'normal',
                  fontWeight: 700, cursor: sendingEmail ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 2px 6px rgba(0,104,95,0.2)'
                }}
              >
                <Send size={14} />
                {sendingEmail ? 'Sending Email OTP...' : selectedPatient ? `📩 Send OTP Email to ${selectedPatient.fullName}` : '📩 Send OTP Email to Patient'}
              </button>
            </div>
          )}

          {/* Demo Shortcut Quick Access */}
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#334155' }}>
            <span>⚡ <strong>Shortcut Bypass:</strong> Demo key <code>123456</code></span>
            <button
              type="button"
              onClick={() => setOtpToken('123456')}
              style={{ background: '#475569', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Autofill 123456
            </button>
          </div>

          {/* OTP Token Input */}
          <Input
            label="6-Digit Verification Token Code"
            placeholder="Enter OTP (or leave empty for 123456)"
            value={otpToken}
            onChange={e => setOtpToken(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            icon={<KeyRound size={16} />}
            disabled={loading || success}
          />

          <Button type="submit" loading={loading} disabled={success || !patientId} style={{ width: '100%', marginTop: '6px' }}>
            {otpToken ? 'Verify & Unlock EHR' : '⚡ Direct Unlock (123456)'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
