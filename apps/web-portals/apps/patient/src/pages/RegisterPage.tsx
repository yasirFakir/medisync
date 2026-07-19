import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card, apiClient } from '@medisync/ui';
import { Mail, Lock, User, Phone, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/register', {
        fullName,
        email,
        password,
        role: 'PATIENT',
        phoneNumber: phoneNumber || undefined
      });
      const { accessToken, user } = res.data.data;
      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ position: 'absolute', top: '15%', left: '20%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(14,165,233,0.12)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '20%', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(139,92,246,0.08)', filter: 'blur(90px)', pointerEvents: 'none' }} />

      <Card glass style={{ width: '100%', maxWidth: '460px', padding: '40px', position: 'relative', zIndex: 1 }} className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '24px', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-accent-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>M</div>
          <span style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>MediSync<span style={{ color: 'var(--color-brand-400)' }}> AI</span></span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>Register Patient Account</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Get instant access to AI triage and pharmacy matching</p>
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
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            icon={<User size={16} />}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            icon={<Mail size={16} />}
            required
          />

          <Input
            label="Phone Number (Optional)"
            type="tel"
            placeholder="+88017XXXXXXXX"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            icon={<Phone size={16} />}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            icon={<Lock size={16} />}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            icon={<ShieldCheck size={16} />}
            required
          />

          <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '10px' }}>
            Complete Registration
          </Button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--color-brand-400)', fontWeight: 600, textDecoration: 'none' }}>
            Access Account
          </Link>
        </div>
      </Card>
    </div>
  );
};
