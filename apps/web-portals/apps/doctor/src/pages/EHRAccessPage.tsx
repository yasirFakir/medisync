import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Input, Button, Badge, apiClient } from '@medisync/ui';
import { KeyRound, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

export const EHRAccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [patientId, setPatientId] = useState(searchParams.get('patientId') || '');
  const [otpToken, setOtpToken] = useState(searchParams.get('otp') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !otpToken) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await apiClient.post('/ehr/request-access', {
        patientId,
        otpToken
      });
      setSuccess(true);
      setTimeout(() => {
        navigate(`/ehr/${patientId}`);
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Access denied. The verification OTP code is incorrect or expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('patientId') && searchParams.get('otp')) {
      // Auto-trigger verification if pre-filled from quick dashboard entry
      const mockEvent = { preventDefault: () => {} } as React.FormEvent;
      handleVerify(mockEvent);
    }
  }, [searchParams]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <Card glass style={{ width: '100%', maxWidth: '480px', padding: '36px', display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', color: '#059669' }}>
          <ShieldAlert size={28} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>EHR Gate Verification</h3>
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.4 }}>
          Patients generate temporary 6-digit access tokens directly inside their patient app. Enter coordinates to verify authentication log and unlock records.
        </p>

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', fontSize: '0.8125rem' }}>
            <CheckCircle size={16} />
            OTP Verified! Unlocking EHR records...
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '0.8125rem' }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input
            label="Patient Medical UUID ID"
            placeholder="e.g. bbfc1f7b-9255-49cc-8413..."
            value={patientId}
            onChange={e => setPatientId(e.target.value)}
            required
            disabled={loading || success}
          />

          <Input
            label="Temporary 6-Digit Verification Token"
            placeholder="e.g. 123456"
            value={otpToken}
            onChange={e => setOtpToken(e.target.value)}
            maxLength={6}
            icon={<KeyRound size={16} />}
            required
            disabled={loading || success}
          />

          <Button type="submit" loading={loading} disabled={success} style={{ width: '100%', marginTop: '10px' }}>
            Authenticate Access
          </Button>
        </form>
      </Card>
    </div>
  );
};
