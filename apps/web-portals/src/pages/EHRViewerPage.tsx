import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Button, Modal, Input, Spinner, Badge,
  PrescriptionResultModal, CreatePrescriptionModal, formatDoctorName, type Prescription
} from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { Plus, Calendar, ArrowLeft, ClipboardList, Pill, Eye, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

interface EHRRecord {
  recordId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  observations: string;
  followUpDate?: string;
  createdAt: string;
  sessionDate?: string;
  doctorName?: string;
}

type TimelineItem =
  | { type: 'NOTE'; date: string; data: EHRRecord }
  | { type: 'PRESCRIPTION'; date: string; data: Prescription };

export const EHRViewerPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [records, setRecords] = useState<EHRRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateRxOpen, setIsCreateRxOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  const [diagnosis, setDiagnosis] = useState('');
  const [observations, setObservations] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');


  const fetchData = async () => {
    if (!patientId) return;
    setLoading(true);
    setError('');
    try {
      const [recordsRes, rxRes] = await Promise.all([
        apiClient.get(`/ehr/records/${patientId}`).catch(() => ({ data: { data: [] } })),
        apiClient.get(`/prescriptions`, { params: { patientId } }).catch(() => ({ data: { data: [] } }))
      ]);

      setRecords(recordsRes.data.data || []);
      setPrescriptions(rxRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load clinical records for this patient.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      fetchData();
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

  const handleDeleteRx = async (id: string) => {
    try {
      await apiClient.delete(`/prescriptions/${id}`);
      setPrescriptions(prev => prev.filter(p => p.prescriptionId !== id));
      setSelectedRx(null);
    } catch (err) {
      console.error('Failed to delete prescription', err);
    }
  };

  const handleUpdateRx = (updated: Prescription) => {
    setPrescriptions(prev => prev.map(p => p.prescriptionId === updated.prescriptionId ? updated : p));
    setSelectedRx(updated);
  };

  // Combine records and prescriptions into timeline sorted by date DESC
  const timelineItems: TimelineItem[] = [
    ...records.map(r => ({ type: 'NOTE' as const, date: r.createdAt || r.sessionDate || new Date().toISOString(), data: r })),
    ...prescriptions.map(p => ({ type: 'PRESCRIPTION' as const, date: p.createdAt || new Date().toISOString(), data: p }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => setIsCreateRxOpen(true)} icon={<Pill size={16} />}>
            Create Prescription
          </Button>
          <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={16} />}>
            Add Clinical Note
          </Button>
        </div>

      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}><Spinner size={32} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px', alignItems: 'start' }}>
          {/* LEFT COLUMN: Combined EHR & Prescription Treatment Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>EHR Treatment Log Timeline</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Badge variant="blue">{records.length} Clinical Notes</Badge>
                <Badge variant="green">{prescriptions.length} Prescriptions</Badge>
              </div>
            </div>

            {timelineItems.length === 0 ? (
              <Card style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No clinical entries or prescriptions found for this patient profile. Click "Add Clinical Note" above to write the first record.
              </Card>
            ) : (
              timelineItems.map((item, idx) => {
                if (item.type === 'NOTE') {
                  const rec = item.data;
                  return (
                    <Card key={`note-${rec.recordId || idx}`} className="animate-fade-in" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '24px' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(5,150,105,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                        <ClipboardList size={20} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{rec.diagnosis}</h4>
                          <Badge variant="blue">
                            Clinical Note • {new Date(item.date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                          </Badge>
                        </div>

                        {rec.doctorName && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Attending Doctor: <strong>{formatDoctorName(rec.doctorName)}</strong>
                          </div>
                        )}

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
                  );
                } else {
                  const rx = item.data;
                  const ocr = typeof rx.ocrResult === 'string'
                    ? (() => { try { return JSON.parse(rx.ocrResult as unknown as string); } catch { return undefined; } })()
                    : rx.ocrResult;
                  const docName = rx.doctorName || ocr?.doctor_name?.value || 'Prescriber';
                  const rawMeds = typeof rx.medicines === 'string'
                    ? (() => { try { return JSON.parse(rx.medicines as unknown as string); } catch { return []; } })()
                    : rx.medicines;
                  const meds = Array.isArray(rawMeds) && rawMeds.length > 0
                    ? rawMeds
                    : (Array.isArray(ocr?.medicines) ? ocr.medicines : []);



                  return (
                    <Card key={`rx-${rx.prescriptionId || idx}`} className="animate-fade-in" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '24px', borderLeft: '4px solid #00685f' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,104,95,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00685f', flexShrink: 0 }}>
                        <Pill size={20} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#00685f' }}>
                              Prescription #{rx.prescriptionId.substring(0, 8)}
                            </h4>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              Prescribed by <strong>{formatDoctorName(docName)}</strong>
                            </div>
                          </div>
                          <Badge variant="green">
                            Prescription • {new Date(item.date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                          </Badge>
                        </div>

                        {/* Medicines List Preview */}
                        <div style={{ marginTop: '12px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Prescribed Medication ({meds.length})
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {meds.slice(0, 5).map((m: any, mIdx: number) => {
                              const bName = m.brandName || m.brand_name?.value || 'Medicine';
                              const dose = m.dosage || m.strength?.value || '';
                              return (
                                <span key={mIdx} style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>
                                  💊 {bName} {dose && `(${dose})`}
                                </span>
                              );
                            })}
                            {meds.length > 5 && (
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, alignSelf: 'center' }}>
                                +{meds.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ID: <code>{rx.prescriptionId}</code>
                          </span>
                          <Button
                            size="sm"
                            variant="primary"
                            icon={<Eye size={14} />}
                            onClick={() => setSelectedRx(rx)}
                          >
                            ✏️ View & Correct Prescription
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                }
              })
            )}
          </div>

          {/* RIGHT COLUMN: Active Patient Profile */}
          <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Active Medical Profile</h3>
            <div className="divider" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Patient ID Coordinate:</div>
                <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', wordBreak: 'break-all', fontSize: '0.75rem', marginTop: 2 }}>{patientId}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Session Access Status:</div>
                <Badge variant="green">Verified Patient Session</Badge>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Prescriptions Recorded:</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{prescriptions.length} Prescriptions</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Clinical Notes:</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{records.length} Notes</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Prescription View & Correct Shared Modal ── */}
      {selectedRx && (
        <Modal
          isOpen={Boolean(selectedRx)}
          onClose={() => setSelectedRx(null)}
          title={`Prescription #${selectedRx.prescriptionId.substring(0, 8)}`}
          size="xl"
        >
          <PrescriptionResultModal
            prescription={selectedRx}
            onClose={() => setSelectedRx(null)}
            onDelete={handleDeleteRx}
            onUpdate={handleUpdateRx}
          />
        </Modal>
      )}

      {/* ── Create Prescription Modal ── */}
      <CreatePrescriptionModal
        isOpen={isCreateRxOpen}
        onClose={() => setIsCreateRxOpen(false)}
        patientId={patientId || ''}
        onCreated={(newRx) => {
          setPrescriptions(prev => [newRx, ...prev]);
          setSelectedRx(newRx);
        }}
      />

      {/* ── Add Clinical Note Modal ── */}

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
