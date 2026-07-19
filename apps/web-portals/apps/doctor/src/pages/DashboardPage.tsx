import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, StatCard, Button, Input } from '@medisync/ui';
import { Users, ShieldAlert, History, UserCheck, KeyRound, Activity } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState('');
  const [otpToken, setOtpToken] = useState('');

  const handleQuickAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !otpToken) return;
    navigate(`/ehr?patientId=${patientId}&otp=${otpToken}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Overview Banner */}
      <div style={{
        padding: '32px',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, rgba(5,150,105,0.1) 0%, rgba(16,185,129,0.05) 100%)',
        border: '1px solid var(--border-default)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }} className="animate-fade-in">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
            Welcome back, Dr. {user?.fullName || 'Doctor'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '520px' }}>
            Verify secure patient credentials, manage session logs, and access EHR parameters. Use the quick access panel on the right to verify an active TOTP.
          </p>
        </div>

        {/* Quick OTP access panel */}
        <Card glass style={{ padding: '16px 20px', minWidth: '320px' }}>
          <form onSubmit={handleQuickAccess} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-brand-400)', fontSize: '0.75rem', fontWeight: 700 }}>
              <KeyRound size={14} />
              <span>QUICK ACCESS VERIFIER</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                placeholder="Patient UUID"
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                style={{ height: '36px', fontSize: '0.75rem' }}
                required
              />
              <Input
                placeholder="6-Digit OTP"
                value={otpToken}
                onChange={e => setOtpToken(e.target.value)}
                maxLength={6}
                style={{ height: '36px', fontSize: '0.75rem', width: '100px' }}
                required
              />
            </div>
            <Button type="submit" size="sm" style={{ width: '100%' }}>Verify Credentials</Button>
          </form>
        </Card>
      </div>

      {/* Grid of stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <StatCard label="Patients Seen Today" value="5 Sessions" icon={<Users size={20} />} trend={{ value: 25, label: 'vs yesterday' }} color="#059669" />
        <StatCard label="Active Access Keys" value="2 Verified" icon={<ShieldAlert size={20} />} color="var(--color-brand-400)" />
        <StatCard label="Recent Session Notes" value="12 Notes" icon={<History size={20} />} color="var(--color-accent-400)" />
        <StatCard label="Clinical Security status" value="Secured" icon={<Activity size={20} />} color="var(--color-success)" />
      </div>

      {/* Quick shortcuts */}
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px' }}>Clinical Workspace Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <Card onClick={() => navigate('/patients')} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '24px', cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(5,150,105,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Users size={20} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Patient Directory</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Browse and query patient records</p>
            </div>
          </Card>

          <Card onClick={() => navigate('/ehr')} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '24px', cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-400)' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>EHR Verification Gateway</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Input OTP keys for record access</p>
            </div>
          </Card>

          <Card onClick={() => navigate('/sessions')} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '24px', cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-400)' }}>
              <History size={20} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Clinical Session History</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Check completed diagnostic notes</p>
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
};
