import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Modal, Input, Spinner, Badge } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { Plus, Calendar, ArrowLeft, ClipboardList, AlertTriangle } from 'lucide-react';

interface EHRRecord {
  recordId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  observations: string;
  followUpDate?: string;
  createdAt: string;
  doctorName?: string;
}

export const EHRViewerPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [records, setRecords] = useState<EHRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [diagnosis, setDiagnosis] = useState('');
  const [observations, setObservations] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const fetchRecords = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/ehr/records/${patientId}`);
      setRecords(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Access expired or unauthorized. Please re-verify via OTP.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [patientId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis || !observations || !patientId) return;

    setSaving(true);
    try {
      await apiClient.post('/ehr/records', {
        patientId,
        diagnosis,
        observations,
        followUpDate: followUpDate || undefined
      });
      fetchRecords();
      setIsModalOpen(false);
      setDiagnosis('');
      setObservations('');
      setFollowUpDate('');
    } catch (err) {
      console.error('Failed to append EHR record', err);
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: '20px' }}>
        <p style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{error}</p>
        <Button onClick={() => navigate('/ehr')} icon={<ArrowLeft size={16} />}>
          Return to Verification Gate
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="ghost" onClick={() => navigate('/patients')} icon={<ArrowLeft size={16} />}>
          Back to Directory
        </Button>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={16} />}>
          Add Clinical Note
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}><Spinner size={32} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>EHR Treatment Log Timeline</h3>
            
            {records.length === 0 ? (
              <Card style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No clinical entries found for this patient profile. Click "Add Clinical Note" above to write the first record.
              </Card>
            ) : (
              records.map(rec => (
                <Card key={rec.recordId} className="animate-fade-in" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '24px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(5,150,105,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                    <ClipboardList size={20} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{rec.diagnosis}</h4>
                      <Badge variant="blue">
                        {new Date(rec.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Badge>
                    </div>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {rec.observations}
                    </p>

                    {rec.followUpDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-warning)', fontWeight: 600, marginTop: '12px' }}>
                        <Calendar size={12} />
                        <span>Recommended Follow-up: {new Date(rec.followUpDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Active Medical Profile</h3>
            <div className="divider" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Patient ID Coordinate:</div>
                <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', wordBreak: 'break-all', fontSize: '0.75rem', marginTop: 2 }}>{patientId}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>HIPAA Record status:</div>
                <Badge variant="green">Verified Access Active</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Clinical Note"
        size="md"
      >
        <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input
            label="Diagnosis / Reason of Visit"
            placeholder="e.g. Acute Viral Fever"
            value={diagnosis}
            onChange={e => setDiagnosis(e.target.value)}
            required
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Clinical Observations & Notes</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Record observations, medication plan, and advice..."
              value={observations}
              onChange={e => setObservations(e.target.value)}
              style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
              required
            />
          </div>

          <Input
            label="Follow-up Date (Optional)"
            type="date"
            value={followUpDate}
            onChange={e => setFollowUpDate(e.target.value)}
          />

          <Button type="submit" loading={saving} style={{ width: '100%', marginTop: '10px' }}>
            Append to Patient Timeline
          </Button>
        </form>
      </Modal>
    </div>
  );
};
