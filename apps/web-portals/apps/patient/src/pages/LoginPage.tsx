import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card, apiClient } from '@medisync/ui';
import { Mail, Lock, CheckCircle, Shield } from 'lucide-react';
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
      if (user.role !== 'PATIENT') {
        setError('Unauthorized access. This portal is for patients only.');
        setLoading(false);
        return;
      }
      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Brand panel */}
      <div style={{
        flex: 1.2,
        background: 'linear-gradient(135deg, rgba(5,13,26,1) 0%, rgba(10,22,40,1) 100%)',
        borderRight: '1px solid var(--border-default)',
        padding: '64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow blur background elements */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(14,165,233,0.15)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '450px', height: '450px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)', filter: 'blur(100px)' }} />

        {/* Branding header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-accent-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>M</div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>MediSync<span style={{ color: 'var(--color-brand-400)' }}> AI</span></span>
        </div>

        {/* Dynamic value statements */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px', margin: 'auto 0' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '24px', letterSpacing: '-0.03em' }}>
            Your Health, <br />
            <span style={{ background: 'linear-gradient(135deg, var(--color-brand-400), var(--color-accent-400))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intelligently Managed.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '40px' }}>
            Connect directly with verified pharmacy stocks, explore cost-saving generic drug alternatives, and triage your symptoms instantly using advanced AI agents.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle style={{ color: 'var(--color-brand-400)', marginTop: '3px', flexShrink: 0 }} size={20} />
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 2 }}>Generic Drug Score Scoring</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Dynamically calculate savings against quality metrics with our customized pricing score.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Shield style={{ color: 'var(--color-accent-400)', marginTop: '3px', flexShrink: 0 }} size={20} />
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 2 }}>TOTP EHR Security Gating</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>You control who views your records. Doctors access logs only via patient-generated active keys.</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', position: 'relative', zIndex: 1 }}>
          &copy; 2026 MediSync AI. Certified medical workflow orchestration stack.
        </div>
      </div>

      {/* Form panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}>
        <Card glass style={{ width: '100%', maxWidth: '420px', padding: '40px' }} className="animate-fade-in">
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>Welcome back</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Enter patient portal credentials to continue</p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              fontSize: '0.8125rem',
              color: 'var(--color-danger)',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Email Address"
              type="email"
              placeholder="patient@medisync.ai"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
            />

            <Input
              label="Secret Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
            />

            <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '10px' }}>
              Access Portal
            </Button>
          </form>

          <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            New to MediSync?{' '}
            <Link to="/register" style={{ color: 'var(--color-brand-400)', fontWeight: 600, textDecoration: 'none' }}>
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
