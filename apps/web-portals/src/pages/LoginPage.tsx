import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, Card, apiClient } from '@medisync/ui';
import { Mail, Lock, User, Phone, ShieldCheck, CheckCircle, ShieldAlert, HeartPulse, Activity, Landmark } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore(state => state.setAuth);

  // Determine initial tab based on path
  const isRegisterPath = location.pathname === '/register';
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(isRegisterPath ? 'register' : 'login');

  // Sync tab state if location path changes
  useEffect(() => {
    setActiveTab(location.pathname === '/register' ? 'register' : 'login');
  }, [location.pathname]);

  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register States
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<'PATIENT' | 'DOCTOR' | 'PHARMACY'>('PATIENT');

  // Shared status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/login', { email: loginEmail, password: loginPassword });
      const { accessToken, user } = res.data.data;
      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[LoginPage Error Traces]:', err);
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPassword) return;

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/register', {
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        phoneNumber: regPhone || undefined
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Brand panel */}
      <div style={{
        flex: 1.1,
        background: 'linear-gradient(135deg, rgba(5,13,26,1) 0%, rgba(10,22,40,1) 100%)',
        borderRight: '1px solid var(--border-default)',
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }} className="brand-panel-hide">
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(14,165,233,0.12)', filter: 'blur(80px)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-accent-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>M</div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>MediSync<span style={{ color: 'var(--color-brand-400)' }}> AI</span></span>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px', margin: 'auto 0' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '24px', letterSpacing: '-0.03em' }}>
            Unified Health <br />
            <span style={{ background: 'linear-gradient(135deg, var(--color-brand-400), var(--color-accent-400))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Diagnostics Gateway.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '32px' }}>
            Access clinical workflows, AI triage chatbots, prescription scanners, and inventory trackers from one secure console.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <CheckCircle style={{ color: 'var(--color-brand-400)' }} size={18} />
              <span style={{ fontSize: '0.875rem' }}>AI-Powered triage assessment algorithms</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <CheckCircle style={{ color: 'var(--color-brand-400)' }} size={18} />
              <span style={{ fontSize: '0.875rem' }}>Real-time pharmacy stock locator network</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <CheckCircle style={{ color: 'var(--color-brand-400)' }} size={18} />
              <span style={{ fontSize: '0.875rem' }}>Secure OTP-gated electronic health record access</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          &copy; 2026 MediSync AI system console. Secure TLS 1.3 encryption active.
        </div>
      </div>

      {/* Form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', overflowY: 'auto' }}>
        <Card glass style={{ width: '100%', maxWidth: '480px', padding: '36px' }} className="animate-fade-in">
          
          {/* Tab Switcher */}
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-elevated)', 
            padding: '4px', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '28px',
            border: '1px solid var(--border-default)'
          }}>
            <button 
              type="button"
              onClick={() => { setActiveTab('login'); navigate('/login'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: activeTab === 'login' ? 'var(--color-brand-600)' : 'transparent',
                color: activeTab === 'login' ? '#fff' : 'var(--text-secondary)',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setActiveTab('register'); navigate('/register'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: activeTab === 'register' ? 'var(--color-brand-600)' : 'transparent',
                color: activeTab === 'register' ? '#fff' : 'var(--text-secondary)',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Create Account
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
              {activeTab === 'login' ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {activeTab === 'login' 
                ? 'Authenticate coordinates to access your dashboard' 
                : 'Register a secure digital healthcare identity'}
            </p>
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(239,68,68,0.08)', 
              border: '1px solid rgba(239,68,68,0.15)', 
              borderRadius: 'var(--radius-md)', 
              padding: '12px', 
              fontSize: '0.8125rem', 
              color: 'var(--color-danger)', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <Input
                label="Email Address Coordinate"
                type="email"
                placeholder="user@medisync.ai"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                icon={<Mail size={16} />}
                required
              />

              <Input
                label="Password Key"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                icon={<Lock size={16} />}
                required
              />

              <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '8px' }}>
                Authenticate Coordinates
              </Button>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={regFullName}
                onChange={e => setRegFullName(e.target.value)}
                icon={<User size={16} />}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                icon={<Mail size={16} />}
                required
              />

              <Input
                label="Phone Number (Optional)"
                type="tel"
                placeholder="+88017XXXXXXXX"
                value={regPhone}
                onChange={e => setRegPhone(e.target.value)}
                icon={<Phone size={16} />}
              />

              {/* Role selector option (No admin) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  User Account Type
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[
                    { key: 'PATIENT', label: 'Patient', icon: <HeartPulse size={16} /> },
                    { key: 'DOCTOR', label: 'Doctor', icon: <Activity size={16} /> },
                    { key: 'PHARMACY', label: 'Pharmacy', icon: <Landmark size={16} /> }
                  ].map(roleOpt => {
                    const isSelected = regRole === roleOpt.key;
                    return (
                      <button
                        key={roleOpt.key}
                        type="button"
                        onClick={() => setRegRole(roleOpt.key as any)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '12px 8px',
                          background: isSelected ? 'rgba(14, 165, 233, 0.08)' : 'var(--bg-elevated)',
                          border: isSelected ? '1.5px solid var(--color-brand-500)' : '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-md)',
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                        }}
                      >
                        {roleOpt.icon}
                        {roleOpt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                icon={<Lock size={16} />}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={regConfirmPassword}
                onChange={e => setRegConfirmPassword(e.target.value)}
                icon={<ShieldCheck size={16} />}
                required
              />

              <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '8px' }}>
                Complete Registration
              </Button>
            </form>
          )}

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {activeTab === 'login' ? (
              <>
                Need a clinical account?{' '}
                <button 
                  type="button" 
                  onClick={() => { setActiveTab('register'); navigate('/register'); setError(''); }} 
                  style={{ background: 'none', border: 'none', color: 'var(--color-brand-400)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button 
                  type="button" 
                  onClick={() => { setActiveTab('login'); navigate('/login'); setError(''); }} 
                  style={{ background: 'none', border: 'none', color: 'var(--color-brand-400)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Access Account
                </button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
