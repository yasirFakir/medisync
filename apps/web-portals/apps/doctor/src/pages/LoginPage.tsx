import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, apiClient } from '@medisync/ui';
import { Mail, Lock, HeartHandshake, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { accessToken, user } = res.data.data;
      if (user.role !== 'DOCTOR') {
        setError('Unauthorized. This portal is for registered clinical doctors only.');
        setLoading(false);
        return;
      }
      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Clinical authentication denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Brand panel */}
      <div style={{
        flex: 1.2,
        background: 'linear-gradient(135deg, rgba(5,20,15,1) 0%, rgba(10,22,40,1) 100%)',
        borderRight: '1px solid var(--border-default)',
        padding: '64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(5,150,105,0.15)', filter: 'blur(80px)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>M</div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>MediSync<span style={{ color: '#059669' }}> Doctor</span></span>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px', margin: 'auto 0' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '24px', letterSpacing: '-0.03em' }}>
            Clinical Record <br />
            <span style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Orchestration Hub.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '40px' }}>
            Verify patient-generated secure access credentials, log active treatment observations, and write prescriptions with automatic generic substitute scoring.
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <ShieldAlert style={{ color: '#34d399', marginTop: '3px', flexShrink: 0 }} size={20} />
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 2 }}>Secure HIPAA Compliance Gating</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>EHR record timelines are fully locked. Access requires matching 6-digit verification keys generated dynamically by the patient.</p>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          &copy; 2026 MediSync clinical workspace portal. Secure TLS 1.3 enforced.
        </div>
      </div>

      {/* Form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <Card glass style={{ width: '100%', maxWidth: '420px', padding: '40px' }} className="animate-fade-in">
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>Clinical Sign In</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Enter verified doctor coordinates below</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '0.8125rem', color: 'var(--color-danger)', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Doctor Email Coordinate"
              type="email"
              placeholder="doctor@medisync.ai"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
            />

            <Input
              label="Secure Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
            />

            <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '10px' }}>
              Unlock Dashboard
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
