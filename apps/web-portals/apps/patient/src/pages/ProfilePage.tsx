import React, { useState } from 'react';
import { Card, Input, Button, Avatar, apiClient } from '@medisync/ui';
import { User, Mail, Phone, Shield, Save, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const ProfilePage: React.FC = () => {
  const { user, token, setAuth } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;

    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const res = await apiClient.patch('/users/me', {
        fullName,
        phoneNumber: phoneNumber || null
      });
      
      const updatedUser = res.data.data;
      if (token) {
        setAuth(updatedUser, token);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px', alignItems: 'start' }}>
      
      {/* Profile info card */}
      <Card style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
        <Avatar name={user?.fullName || 'Patient'} size={80} />
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '4px' }}>{user?.fullName}</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Patient Account Profile</p>
        </div>

        <div className="divider" style={{ width: '100%' }} />

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <Mail size={14} />
            <span>{user?.email}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <Shield size={14} />
            <span>Role: {user?.role}</span>
          </div>
        </div>
      </Card>

      {/* Edit Form */}
      <Card style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '24px' }}>Edit Profile Information</h3>

        {success && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            fontSize: '0.8125rem',
            color: 'var(--color-success)',
            marginBottom: '20px',
          }}>
            <CheckCircle size={16} />
            Profile updated successfully
          </div>
        )}

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

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input
            label="Full Display Name"
            placeholder="John Doe"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            icon={<User size={16} />}
            required
          />

          <Input
            label="Registered Phone Number"
            placeholder="+88017XXXXXXXX"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            icon={<Phone size={16} />}
          />

          <Button type="submit" loading={loading} icon={<Save size={16} />} style={{ width: 'fit-content', marginTop: '10px' }}>
            Save Changes
          </Button>
        </form>
      </Card>

    </div>
  );
};
