import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { Calendar, Eye } from 'lucide-react';

interface Session {
  recordId: string;
  patientId: string;
  diagnosis: string;
  observations: string;
  createdAt: string;
  followUpDate?: string;
}

export const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/ehr/records/my-sessions');
      setSessions(res.data.data || []);
    } catch (err) {
      console.error('Failed to load session logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const columns = [
    {
      key: 'createdAt',
      label: 'Date',
      render: (val: any) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          {new Date(val).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      )
    },
    { key: 'diagnosis', label: 'Diagnosis' },
    {
      key: 'recordId',
      label: 'Actions',
      render: (_val: any, row: Session) => (
        <Button size="sm" variant="secondary" icon={<Eye size={12} />} onClick={() => setSelectedSession(row)}>
          Read Notes
        </Button>
      )
    }
  ];

  return (
    <Card style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '24px' }}>My Treatment Sessions Log</h3>

      <Table
        columns={columns}
        data={sessions}
        loading={loading}
        keyExtractor={row => row.recordId}
      />

      <Modal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title="Diagnostic Record Assessment"
        size="md"
      >
        {selectedSession && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DIAGNOSIS</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>{selectedSession.diagnosis}</div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OBSERVATIONS & ADVICE</div>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--text-primary)', whiteSpace: 'pre-line', marginTop: '8px', lineHeight: 1.5 }}>
                {selectedSession.observations}
              </div>
            </div>

            {selectedSession.followUpDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                <Calendar size={14} />
                <span>Follow-up Date: {new Date(selectedSession.followUpDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};
