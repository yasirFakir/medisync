import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, StatCard, Button, Input } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import {
  MessageSquare,
  FileText,
  MapPin,
  AlarmClock,
  ShieldCheck,
  KeyRound,
  Loader2,
  Users,
  Activity,
  History,
  Store,
  BadgePercent,
  AlertTriangle,
  ShieldAlert,
  ClipboardEdit,
  Pill
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  // Doctor Dashboard States
  const [patientId, setPatientId] = useState('');
  const [otpToken, setOtpToken] = useState('');

  // Patient Dashboard States
  const [otp, setOtp] = useState<string | null>(null);
  const [loadingOtp, setLoadingOtp] = useState(false);

  const generateOtp = async () => {
    setLoadingOtp(true);
    try {
      const res = await apiClient.post('/ehr/generate-otp');
      setOtp(res.data.data.otp);
    } catch (err) {
      console.error('Failed to generate EHR access OTP', err);
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleQuickAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !otpToken) return;
    navigate(`/ehr?patientId=${patientId}&otp=${otpToken}`);
  };

  // Render PATIENT Dashboard
  if (user?.role === 'PATIENT') {
    const quickActions = [
      { title: 'AI Symptom Triage', desc: 'Describe symptoms to our virtual health helper.', path: '/triage', icon: <MessageSquare size={20} />, color: 'var(--color-brand-500)' },
      { title: 'Prescriptions', desc: 'Upload images, digitize, and review generic substitutes.', path: '/prescriptions', icon: <FileText size={20} />, color: 'var(--color-accent-400)' },
      { title: 'Locate Medicine', desc: 'Locate local stocks and check relative cost scores.', path: '/locator', icon: <MapPin size={20} />, color: 'var(--color-success)' },
      { title: 'Daily Dosage Reminders', desc: 'Manage your daily prescription alarm frequencies.', path: '/alerts', icon: <AlarmClock size={20} />, color: 'var(--color-warning)' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div style={{
          padding: '32px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(139,92,246,0.05) 100%)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }} className="animate-fade-in">
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
              Hello, {user?.fullName || 'Patient'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '520px' }}>
              Welcome to your MediSync health dashboard. All services are currently fully operational. You can scan prescriptions or locate generic drug listings below.
            </p>
          </div>

          <div className="glass-elevated" style={{ padding: '16px 20px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent-400)' }}>
              <KeyRound size={16} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>EHR DOCTOR GATEWAY</span>
            </div>
            {otp ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-primary)' }}>{otp}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Expires in 5 minutes</div>
                </div>
                <Button size="sm" variant="ghost" onClick={generateOtp} style={{ padding: '6px' }}>
                  Regenerate
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={generateOtp} disabled={loadingOtp} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', width: '100%' }}>
                {loadingOtp ? <Loader2 size={14} className="animate-spin" /> : 'Generate Secure OTP'}
              </Button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <StatCard label="My Active Reminders" value="2 Alerts" icon={<AlarmClock size={20} />} trend={{ value: 100, label: 'since last week' }} color="var(--color-warning)" />
          <StatCard label="Saved Prescriptions" value="4 Files" icon={<FileText size={20} />} color="var(--color-brand-400)" />
          <StatCard label="Triage Sessions" value="1 History" icon={<MessageSquare size={20} />} color="var(--color-accent-400)" />
          <StatCard label="System Security Gate" value="Active" icon={<ShieldCheck size={20} />} color="var(--color-success)" />
        </div>

        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px' }}>Quick Health Services</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {quickActions.map(action => (
              <Card key={action.title} onClick={() => navigate(action.path)} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '24px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: `${action.color}15`,
                  border: `1px solid ${action.color}25`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: action.color,
                  flexShrink: 0
                }}>
                  {action.icon}
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '4px', color: 'var(--text-primary)' }}>{action.title}</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{action.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render DOCTOR Dashboard
  if (user?.role === 'DOCTOR') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <StatCard label="Patients Seen Today" value="5 Sessions" icon={<Users size={20} />} trend={{ value: 25, label: 'vs yesterday' }} color="#059669" />
          <StatCard label="Active Access Keys" value="2 Verified" icon={<ShieldAlert size={20} />} color="var(--color-brand-400)" />
          <StatCard label="Recent Session Notes" value="12 Notes" icon={<History size={20} />} color="var(--color-accent-400)" />
          <StatCard label="Clinical Security status" value="Secured" icon={<Activity size={20} />} color="var(--color-success)" />
        </div>

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
          </div>
        </div>
      </div>
    );
  }

  // Render PHARMACY Dashboard
  if (user?.role === 'PHARMACY') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div style={{
          padding: '32px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(139,92,246,0.05) 100%)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }} className="animate-fade-in">
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
              {user?.fullName || 'Partner Store'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '520px' }}>
              MediSync inventory sync dashboard. Update stock status and manage current drug pricing lists for patients.
            </p>
          </div>
          <Button onClick={() => navigate('/update-stock')} icon={<ClipboardEdit size={16} />}>
            Quick Stock Update
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <StatCard label="Total Inventory SKUs" value="10 Items" icon={<Store size={20} />} trend={{ value: 0, label: 'synchronized' }} color="#f59e0b" />
          <StatCard label="Active Stock Ratio" value="100%" icon={<BadgePercent size={20} />} color="var(--color-brand-400)" />
          <StatCard label="Catalog Out of Stock" value="0 Items" icon={<AlertTriangle size={20} />} color="var(--color-danger)" />
        </div>
      </div>
    );
  }

  // Render ADMIN Dashboard
  if (user?.role === 'ADMIN') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div style={{
          padding: '32px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(14,165,233,0.05) 100%)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }} className="animate-fade-in">
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
              System Core Console
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '520px' }}>
              Administrator workspace environment dashboard. Oversee global database configurations and track API cluster parameters.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <StatCard label="Total Users registered" value="5 Accounts" icon={<Users size={20} />} trend={{ value: 10, label: 'since yesterday' }} color="#8b5cf6" />
          <StatCard label="Drug catalogue entries" value="10 Items" icon={<Pill size={20} />} color="var(--color-brand-400)" />
          <StatCard label="EHR Access Requests" value="3 Requests" icon={<ShieldAlert size={20} />} color="var(--color-accent-400)" />
        </div>
      </div>
    );
  }

  return (
    <Card style={{ padding: '24px' }}>
      Authentication check pending...
    </Card>
  );
};
