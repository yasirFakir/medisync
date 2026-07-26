import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Table, Modal, Badge, Spinner } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { Upload, Eye, Calendar, FlaskConical, AlertTriangle, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';


// ─── Types ────────────────────────────────────────────────────────────────────
type ConfidenceLevel = 'high' | 'medium' | 'low';

interface ExtractedField {
  value:      string | null;
  confidence: ConfidenceLevel;
  score:      number;
}

interface ParsedMedicine {
  brand_name:           ExtractedField;
  strength:             ExtractedField;
  dosage:               ExtractedField;
  frequency:            ExtractedField;
  duration:             ExtractedField;
  special_instructions: ExtractedField;
}

interface OCRResult {
  raw_text:              string;
  doctor_name:           ExtractedField;
  prescription_date?:    ExtractedField;
  clinical_tests?:       ExtractedField[];
  follow_up_date?:       ExtractedField;
  medicines:             ParsedMedicine[];
  low_confidence_fields: string[];
  ocr_engine:            string;
  processing_time_ms:    number;
}

interface ValidatedItem {
  input: { brandName?: string; genericName?: string; dosage?: string };
  matched: boolean;
  matchType: 'EXACT_BRAND' | 'EXACT_GENERIC' | 'FUZZY_BRAND' | 'FUZZY_GENERIC' | 'UNKNOWN';
  confidence: number;
  matchedDrug?: { drugId: string; brandName: string; saltComposition: string; strength: string; estimatedPrice: number } | null;
  normalizedStrength?: string | null;
  strengthVerified?: boolean;
}

interface ValidationSummary {
  totalMedicines: number;
  matchedCount: number;
  unknownCount: number;
  overallConfidence: number;
  medicines: ValidatedItem[];
}

interface Prescription {
  prescriptionId: string;
  digitizedNotes: string;
  medicines:      Array<{ brandName: string; dosage: string; frequency: string; duration?: string }>;
  validationSummary?: ValidationSummary;
  ocrResult?:     OCRResult;
  createdAt:      string;
}

// ─── Confidence Badge ─────────────────────────────────────────────────────────
const ConfidenceBadge: React.FC<{ level: ConfidenceLevel; score: number }> = ({ level, score }) => {
  const config = {
    high:   { icon: <CheckCircle  size={11} />, color: 'var(--color-success)', bg: 'rgba(34,197,94,0.12)',  label: 'High' },
    medium: { icon: <AlertCircle  size={11} />, color: 'var(--color-warning)', bg: 'rgba(234,179,8,0.12)',  label: 'Medium' },
    low:    { icon: <AlertTriangle size={11}/>, color: 'var(--color-danger)',  bg: 'rgba(239,68,68,0.12)',  label: 'Low' },
  }[level];

  return (
    <span style={{
      display:     'inline-flex',
      alignItems:  'center',
      gap:         '3px',
      padding:     '2px 6px',
      borderRadius:'99px',
      fontSize:    '0.65rem',
      fontWeight:   600,
      color:        config.color,
      background:   config.bg,
    }}>
      {config.icon} {config.label} ({Math.round(score * 100)}%)
    </span>
  );
};

// ─── Field Row ────────────────────────────────────────────────────────────────
const FieldRow: React.FC<{ label: string; field: ExtractedField }> = ({ label, field }) => (
  <div style={{
    display:         'flex',
    justifyContent:  'space-between',
    alignItems:      'center',
    padding:         '6px 0',
    borderBottom:    '1px solid var(--border-default)',
  }}>
    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '120px', flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: field.value ? 'var(--text-primary)' : 'var(--text-muted)', flex: 1, textAlign: 'center' }}>
      {field.value ?? '—'}
    </span>
    <ConfidenceBadge level={field.confidence} score={field.score} />
  </div>
);

// ─── Upload Progress ──────────────────────────────────────────────────────────
const UploadProgress: React.FC<{ progress: number }> = ({ progress }) => (
  <div style={{ marginTop: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Processing prescription...</span>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-brand-400)' }}>{progress}%</span>
    </div>
    <div style={{ height: '4px', background: 'var(--border-default)', borderRadius: '99px', overflow: 'hidden' }}>
      <div style={{
        height:           '100%',
        width:            `${progress}%`,
        background:       'linear-gradient(90deg, var(--color-brand-500), var(--color-brand-300))',
        borderRadius:     '99px',
        transition:       'width 0.4s ease',
      }} />
    </div>
  </div>
);

// ─── Prescription Result Modal ────────────────────────────────────────────────
const PrescriptionResultModal: React.FC<{
  prescription: Prescription;
  onClose: () => void;
  onDelete: (id: string) => void;
}> = ({ prescription, onClose, onDelete }) => {
  const [tab, setTab] = useState<'overview' | 'medicines' | 'raw'>('overview');
  const ocr = prescription.ocrResult;
  const vs  = prescription.validationSummary;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    cursor: 'pointer',
    background: active ? 'var(--color-brand-500)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.18s',
  });

  const medicines = ocr?.medicines ?? prescription.medicines?.map(m => ({
    brand_name: { value: m.brandName, confidence: 'medium' as ConfidenceLevel, score: 0.6 },
    strength:   { value: m.dosage,    confidence: 'medium' as ConfidenceLevel, score: 0.6 },
    dosage:     { value: m.dosage,    confidence: 'medium' as ConfidenceLevel, score: 0.6 },
    frequency:  { value: m.frequency, confidence: 'medium' as ConfidenceLevel, score: 0.6 },
    duration:   { value: m.duration ?? null, confidence: 'low' as ConfidenceLevel, score: 0.3 },
    special_instructions: { value: null, confidence: 'low' as ConfidenceLevel, score: 0 },
  })) ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* ── Header info strip ────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '8px',
        marginBottom: '12px',
      }}>
        {[
          { icon: '👨‍⚕️', label: 'Doctor',          value: ocr?.doctor_name?.value || '—' },
          { icon: '📋', label: 'Date',             value: ocr?.prescription_date?.value || '—' },
          { icon: '📅', label: 'Follow-up',        value: ocr?.follow_up_date?.value || '—' },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{
            padding: '8px 12px',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)',
          }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{icon} {label}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '4px',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-sm)',
        padding: '4px',
        marginBottom: '12px',
      }}>
        <button style={tabStyle(tab === 'overview')}  onClick={() => setTab('overview')}>Overview</button>
        <button style={tabStyle(tab === 'medicines')} onClick={() => setTab('medicines')}>
          Medicines {medicines.length > 0 ? `(${medicines.length})` : ''}
        </button>
        <button style={tabStyle(tab === 'raw')}       onClick={() => setTab('raw')}>Raw Text</button>
      </div>

      {/* ── Tab content (fixed height, scrollable) ───────────────── */}
      <div style={{ minHeight: '220px', maxHeight: '320px', overflowY: 'auto' }}>

        {/* OVERVIEW tab */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* DB verification row */}
            {vs && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
              }}>
                <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={13} />
                  {vs.matchedCount}/{vs.totalMedicines} medicines verified in DB
                </span>
                <Badge variant="green">{Math.round(vs.overallConfidence * 100)}% match</Badge>
              </div>
            )}

            {/* Low confidence warning */}
            {ocr?.low_confidence_fields?.length ? (
              <div style={{
                padding: '8px 12px',
                background: 'rgba(234,179,8,0.08)',
                border: '1px solid rgba(234,179,8,0.2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.775rem',
                color: 'var(--color-warning)',
                display: 'flex', gap: '6px', alignItems: 'flex-start',
              }}>
                <AlertTriangle size={13} style={{ marginTop: '1px', flexShrink: 0 }} />
                <span><strong>{ocr.low_confidence_fields.length}</strong> field(s) need review: {ocr.low_confidence_fields.slice(0,4).join(', ')}{ocr.low_confidence_fields.length > 4 ? '…' : ''}</span>
              </div>
            ) : null}

            {/* Lab tests */}
            {ocr?.clinical_tests?.length ? (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>🧪 Lab Tests &amp; Investigations</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {ocr.clinical_tests.map((t, i) => (
                    <Badge key={i} variant="blue">{t.value}</Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '8px 0' }}>No lab tests detected on this prescription.</div>
            )}

            {/* Quick medicine summary */}
            {medicines.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>💊 Medicines Summary</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {medicines.map((m, i) => (
                    <Badge key={i} variant="blue">{m.brand_name.value ?? 'Unknown'}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MEDICINES tab */}
        {tab === 'medicines' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {medicines.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '24px 0', textAlign: 'center' }}>No medicines detected.</div>
            )}
            {medicines.map((med, i) => {
              const dbMatch = vs?.medicines[i];
              return (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)',
                }}>
                  <div>
                    {/* Name row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        {med.brand_name.value ?? 'Unknown'}
                      </span>
                      {med.strength.value && <Badge variant="blue">{med.strength.value}</Badge>}
                      <ConfidenceBadge
                        level={dbMatch?.matched ? 'high' : med.brand_name.confidence}
                        score={dbMatch?.confidence ?? med.brand_name.score}
                      />
                    </div>
                    {/* Detail chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {med.frequency.value  && <span>🕐 {med.frequency.value}</span>}
                      {med.duration.value   && <span>⏱ {med.duration.value}</span>}
                      {dbMatch?.matchedDrug && (
                        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                          ✓ {dbMatch.matchedDrug.saltComposition}
                        </span>
                      )}
                      {med.special_instructions.value && <span>ℹ️ {med.special_instructions.value}</span>}
                    </div>
                  </div>
                  <Button
                    size="sm" variant="ghost"
                    icon={<FlaskConical size={12} />}
                    onClick={() => window.location.href = `/locator?saltComposition=${dbMatch?.matchedDrug?.saltComposition || med.brand_name.value || ''}`}
                  >Alt</Button>
                </div>
              );
            })}
          </div>
        )}

        {/* RAW TEXT tab */}
        {tab === 'raw' && (
          <div style={{
            fontFamily: 'monospace',
            fontSize: '0.775rem',
            lineHeight: 1.65,
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            padding: '2px 4px',
          }}>
            {ocr?.raw_text || prescription.digitizedNotes || 'No raw text available.'}
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: '12px', marginTop: '12px',
        borderTop: '1px solid var(--border-default)',
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {ocr && (
            <>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Engine: <strong>{ocr.ocr_engine}</strong></span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{ocr.processing_time_ms}ms</span>
            </>
          )}
        </div>
        <Button
          size="sm" variant="danger"
          icon={<Trash2 size={13} />}
          onClick={(e) => { e.stopPropagation(); onDelete(prescription.prescriptionId); }}
        >Delete</Button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const PrescriptionsPage: React.FC = () => {
  const [prescriptions, setPrescriptions]           = useState<Prescription[]>([]);
  const [loading, setLoading]                       = useState(true);
  const [uploading, setUploading]                   = useState(false);
  const [uploadProgress, setUploadProgress]         = useState(0);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [error, setError]                           = useState('');
  const progressInterval                            = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/prescriptions');
      setPrescriptions(res.data.data || []);
    } catch (err) {
      console.error('Failed to load prescriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleDeletePrescription = async (prescriptionId: string) => {
    try {
      await apiClient.delete(`/prescriptions/${prescriptionId}`);
      setPrescriptions(prev => prev.filter(p => p.prescriptionId !== prescriptionId));
      if (selectedPrescription?.prescriptionId === prescriptionId) {
        setSelectedPrescription(null);
      }
    } catch (err: any) {
      console.error('Failed to delete prescription', err);
      setError(err.response?.data?.message || 'Failed to delete prescription record');
    }
  };

  const simulateProgress = () => {
    setUploadProgress(0);
    progressInterval.current = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) {
          clearInterval(progressInterval.current!);
          return 85;
        }
        return prev + Math.floor(Math.random() * 12) + 3;
      });
    }, 400);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    simulateProgress();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/prescriptions/digitize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      clearInterval(progressInterval.current!);
      setUploadProgress(100);
      setTimeout(() => {
        setPrescriptions(prev => [res.data.data, ...prev]);
        setSelectedPrescription(res.data.data);
        setUploading(false);
        setUploadProgress(0);
      }, 600);
    } catch (err: any) {
      clearInterval(progressInterval.current!);
      setUploadProgress(0);
      setError(err.response?.data?.message || 'OCR digitization failed. Please verify the image format.');
      setUploading(false);
    }

    // Reset input
    e.target.value = '';
  };

  const columns = [
    {
      key: 'createdAt',
      label: 'Upload Date',
      render: (val: any) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          {val ? new Date(val).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
        </span>
      )
    },
    {
      key: 'medicines',
      label: 'Identified Medicines',
      render: (val: any) => {
        const list = Array.isArray(val) ? val : [];
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {list.slice(0, 3).map((med: any, i: number) => (
              <Badge key={i} variant="blue">{med?.brandName || 'Medicine'}</Badge>
            ))}
            {list.length > 3 && (
              <Badge variant="purple">+{list.length - 3} more</Badge>
            )}
          </div>
        );
      }
    },
    {
      key: 'prescriptionId',
      label: 'Actions',
      render: (_val: any, row: Prescription) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => setSelectedPrescription(row)}>
            View Results
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={<Trash2 size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePrescription(row.prescriptionId);
            }}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px', alignItems: 'start' }}>

        {/* ── Upload Card ───────────────────────────────────────────────── */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Scan Prescription</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Upload a JPEG, PNG, or PDF prescription. The OCR engine will extract medicine names, dosages, frequency, and duration with confidence indicators.
          </p>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger)',
              fontSize: '0.75rem',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
            }}>
              <AlertTriangle size={14} style={{ marginTop: '1px', flexShrink: 0 }} />
              {error}
            </div>
          )}

          <label style={{
            border:          '2px dashed var(--border-strong)',
            borderRadius:    'var(--radius-lg)',
            padding:         '32px 16px',
            display:         'flex',
            flexDirection:   'column',
            alignItems:      'center',
            justifyContent:  'center',
            cursor:           uploading ? 'not-allowed' : 'pointer',
            textAlign:       'center',
            transition:      'background 0.2s',
            background:       uploading ? 'rgba(14,165,233,0.04)' : 'transparent',
          }}>
            <input
              type="file"
              id="prescription-upload"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={uploading}
            />
            {uploading ? (
              <>
                <Spinner size={32} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: '12px' }}>
                  Extracting prescription data...
                </span>
                <UploadProgress progress={uploadProgress} />
              </>
            ) : (
              <>
                <Upload size={32} style={{ color: 'var(--color-brand-400)', marginBottom: '12px' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Click to upload prescription</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  JPEG, PNG, PDF · Max 10MB
                </span>
              </>
            )}
          </label>

          {/* Confidence Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence Guide</span>
            {(['high', 'medium', 'low'] as ConfidenceLevel[]).map(level => (
              <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ConfidenceBadge level={level} score={level === 'high' ? 0.9 : level === 'medium' ? 0.72 : 0.45} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {level === 'high'   ? '≥ 85% — Ready to use'    : ''}
                  {level === 'medium' ? '60–84% — Review recommended' : ''}
                  {level === 'low'    ? '< 60% — Manual verification needed' : ''}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Scan History Table ───────────────────────────────────────── */}
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Previous Scan Logs</h3>
          <Table
            columns={columns}
            data={prescriptions}
            loading={loading}
            keyExtractor={row => row.prescriptionId}
          />
        </Card>

        {/* ── Result Modal ─────────────────────────────────────────────────── */}
        <Modal
          isOpen={!!selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
          title="OCR Extraction Results"
          size="lg"
        >
          {selectedPrescription && (
            <PrescriptionResultModal
              prescription={selectedPrescription}
              onClose={() => setSelectedPrescription(null)}
              onDelete={handleDeletePrescription}
            />
          )}
        </Modal>
      </div>
    </div>
  );
};

