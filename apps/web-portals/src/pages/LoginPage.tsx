import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Phone, ShieldCheck, ShieldAlert, HeartPulse, Activity, Landmark } from 'lucide-react';
import { apiClient } from '@medisync/ui';
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
    <div className="bg-[#f9f9ff] text-[#111c2d] antialiased min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Ambient Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#89f5e7] blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#cae6ff] blur-[100px]"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div 
          onClick={() => navigate('/')}
          className="flex items-center justify-center space-x-3 cursor-pointer mb-6"
        >
          <span className="material-symbols-outlined text-[#00685f] text-[36px]">health_and_safety</span>
          <span className="text-[28px] font-bold text-[#00685f]">MediSync</span>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-[#111c2d]">
          {activeTab === 'login' ? 'Welcome Back' : 'Create Your Account'}
        </h2>
        <p className="mt-2 text-center text-sm text-[#3d4947]">
          {activeTab === 'login'
            ? 'Sign in to access your prescriptions and clinical dashboard'
            : 'Join MediSync to manage medication with intelligent AI assistance'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-[0px_12px_32px_rgba(30,41,59,0.08)] border border-[#bcc9c6]/30 sm:rounded-xl sm:px-10">
          
          {/* Tab Switcher */}
          <div className="flex bg-[#f0f3ff] p-1 rounded-lg mb-6 border border-[#bcc9c6]/20">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); navigate('/login'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === 'login'
                  ? 'bg-[#00685f] text-white shadow-sm'
                  : 'text-[#3d4947] hover:text-[#111c2d]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); navigate('/register'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === 'register'
                  ? 'bg-[#00685f] text-white shadow-sm'
                  : 'text-[#3d4947] hover:text-[#111c2d]'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            /* Login Form */
            <form className="space-y-5" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3d4947] mb-1">
                  Email Address
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-[#bcc9c6] rounded-lg focus:ring-2 focus:ring-[#00685f] focus:border-[#00685f] text-sm text-[#111c2d] placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3d4947] mb-1">
                  Password
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 border border-[#bcc9c6] rounded-lg focus:ring-2 focus:ring-[#00685f] focus:border-[#00685f] text-sm text-[#111c2d] placeholder-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#0D9488] hover:bg-[#008378] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00685f] transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3d4947] mb-1">
                  Full Name
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="block w-full pl-10 pr-3 py-2.5 border border-[#bcc9c6] rounded-lg focus:ring-2 focus:ring-[#00685f] focus:border-[#00685f] text-sm text-[#111c2d] placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3d4947] mb-1">
                  Email Address
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-[#bcc9c6] rounded-lg focus:ring-2 focus:ring-[#00685f] focus:border-[#00685f] text-sm text-[#111c2d] placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3d4947] mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="block w-full pl-10 pr-3 py-2.5 border border-[#bcc9c6] rounded-lg focus:ring-2 focus:ring-[#00685f] focus:border-[#00685f] text-sm text-[#111c2d] placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3d4947] mb-2">
                  Account Type
                </label>
                <div className="grid grid-cols-3 gap-2">
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
                        className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-[#00685f] bg-[#e7eeff] text-[#00685f]'
                            : 'border-[#bcc9c6]/60 bg-white text-[#3d4947] hover:border-[#00685f]'
                        }`}
                      >
                        {roleOpt.icon}
                        <span className="mt-1">{roleOpt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3d4947] mb-1">
                  Password
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 border border-[#bcc9c6] rounded-lg focus:ring-2 focus:ring-[#00685f] focus:border-[#00685f] text-sm text-[#111c2d] placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3d4947] mb-1">
                  Confirm Password
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <ShieldCheck size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 border border-[#bcc9c6] rounded-lg focus:ring-2 focus:ring-[#00685f] focus:border-[#00685f] text-sm text-[#111c2d] placeholder-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#0D9488] hover:bg-[#008378] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00685f] transition-all cursor-pointer mt-2"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
