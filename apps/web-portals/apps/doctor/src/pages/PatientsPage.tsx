import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Table, Button, apiClient } from '@medisync/ui';
import { Search, Eye, KeyRound } from 'lucide-react';

interface Patient {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  createdAt: string;
}

export const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // Endpoint to list all users, filter on PATIENT role
      const res = await apiClient.get('/users', { params: { role: 'PATIENT', search: query } });
      setPatients(res.data.data || []);
    } catch (err) {
      console.error('Failed to load patients list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [query]);

  const columns = [
    { key: 'fullName', label: 'Full Name', width: '30%' },
    { key: 'email', label: 'Email Coordinate', width: '30%' },
    { key: 'phoneNumber', label: 'Phone Number', render: (val: any) => val || 'Not Configured' },
    {
      key: 'id',
      label: 'Security Access Action',
      render: (val: any) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="sm" variant="primary" icon={<KeyRound size={12} />} onClick={() => navigate(`/ehr?patientId=${val}`)}>
            Verify OTP Gate
          </Button>
        </div>
      )
    }
  ];

  return (
    <Card style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Patient Directory</h3>
        <div style={{ width: '280px' }}>
          <Input
            placeholder="Search directory by name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={patients}
        loading={loading}
        keyExtractor={row => row.id}
      />
    </Card>
  );
};
