import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, StatCard, Button, apiClient } from '@medisync/ui';
import { MessageSquare, FileText, MapPin, AlarmClock, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  
  // OTP state
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

  const quickActions = [
    { title: 'AI Symptom Triage', desc: 'Describe symptoms to our virtual health helper.', path: '/triage', icon: <MessageSquare size={20} />, color: 'var(--color-brand-400)' },
    { title: 'Prescriptions', desc: 'Upload images, digitize, and review generic substitutes.', path: '/prescriptions', icon: <FileText size={20} />, color: 'var(--color-accent-400)' },
    { title: 'Locate Medicine', desc: 'Locate local stocks and check relative cost scores.', path: '/locator', icon: <MapPin size={20} />, color: 'var(--color-success)' },
    { title: 'Daily Dosage Reminders', desc: 'Manage your daily prescription alarm frequencies.', path: '/alerts', icon: <AlarmClock size={20} />, color: 'var(--color-warning)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Welcome Banner */}
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

        {/* Secure EHR Access Key Generator */}
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

      {/* Grid of stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <StatCard label="My Active Reminders" value="2 Alerts" icon={<AlarmClock size={20} />} trend={{ value: 100, label: 'since last week' }} color="var(--color-warning)" />
        <StatCard label="Saved Prescriptions" value="4 Files" icon={<FileText size={20} />} color="var(--color-brand-400)" />
        <StatCard label="Triage Sessions" value="1 History" icon={<MessageSquare size={20} />} color="var(--color-accent-400)" />
        <StatCard label="System Security Gate" value="Active" icon={<ShieldCheck size={20} />} color="var(--color-success)" />
      </div>

      {/* Quick Action Grid */}
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
};
