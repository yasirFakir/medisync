import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, apiClient } from '@medisync/ui';
import { Mail, Lock } from 'lucide-react';
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
      if (user.role !== 'ADMIN') {
        setError('Unauthorized. This portal is for administrative personnel only.');
        setLoading(false);
        return;
      }
      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Administrative credentials rejected.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Brand panel */}
      <div style={{
        flex: 1.2,
        background: 'linear-gradient(135deg, rgba(20,5,30,1) 0%, rgba(10,22,40,1) 100%)',
        borderRight: '1px solid var(--border-default)',
        padding: '64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', filter: 'blur(80px)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>M</div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>MediSync<span style={{ color: '#8b5cf6' }}> Admin</span></span>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px', margin: 'auto 0' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '24px', letterSpacing: '-0.03em' }}>
            System Core <br />
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Console Hub.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '40px' }}>
            Monitor backend system parameters, oversee user directories, and manage master drug directories.
          </p>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          &copy; 2026 MediSync admin workspace console. Secure TLS 1.3 enforced.
        </div>
      </div>

      {/* Form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <Card glass style={{ width: '100%', maxWidth: '420px', padding: '40px' }} className="animate-fade-in">
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>Secure Login</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Enter authorized administrator credentials</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '0.8125rem', color: 'var(--color-danger)', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Admin Username Email"
              type="email"
              placeholder="admin@medisync.ai"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
            />

            <Input
              label="Secret Key"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
            />

            <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '10px' }}>
              Unlock Console
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
