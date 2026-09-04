import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Input, Button } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { FileText, ArrowRight, User, Users } from 'lucide-react';

interface Patient {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
}

export const EHRAccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientId, setPatientId] = useState(searchParams.get('patientId') || '');
  const [error, setError] = useState('');

  // Fetch patient directory for selector
  useEffect(() => {
    const fetchDirectory = async () => {
      setLoadingPatients(true);
      try {
        const res = await apiClient.get('/users', { params: { role: 'PATIENT' } });
        setPatients(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch {
        /* silent */
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchDirectory();
  }, []);

  const handleOpenEhr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim()) {
      setError('Please select or enter a valid Patient ID.');
      return;
    }
    navigate(`/ehr/${patientId.trim()}`);
  };

  useEffect(() => {
    const paramId = searchParams.get('patientId');
    if (paramId) {
      navigate(`/ehr/${paramId}`);
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '36px 16px' }}>
      <Card
        glass
        style={{ width: '100%', maxWidth: '520px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}
        className="animate-fade-in"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', color: '#00685f' }}>
          <FileText size={28} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Patient Clinical Records</h3>
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
          Select a patient from your clinical directory or enter a patient ID to view and manage their electronic health records.
        </p>

        {/* Error Alert */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px', borderRadius: '10px', color: '#dc2626', fontSize: '0.8125rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleOpenEhr} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Patient Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Select Patient Profile
            </label>
            {patients.length > 0 ? (
              <select
                value={patientId}
                onChange={e => {
                  setPatientId(e.target.value);
                  setError('');
                }}
                className="input"
                style={{ padding: '10px 12px', fontSize: '0.8125rem', borderRadius: '10px', outline: 'none' }}
                disabled={loadingPatients}
              >
                <option value="">-- Choose Patient from Directory --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.email})
                  </option>
                ))}
              </select>
            ) : null}

            <Input
              placeholder="Or enter Patient UUID (e.g. 00000000-0000-...)"
              value={patientId}
              onChange={e => {
                setPatientId(e.target.value);
                setError('');
              }}
            />
          </div>

          <Button type="submit" disabled={!patientId.trim()} icon={<ArrowRight size={16} />} style={{ width: '100%', marginTop: '6px' }}>
            Open Patient EHR
          </Button>
        </form>
      </Card>
    </div>
  );
};
