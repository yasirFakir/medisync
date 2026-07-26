import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Table, Modal, Badge, Spinner } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { Upload, Eye, Calendar, FlaskConical, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

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
  medicines:             ParsedMedicine[];
  low_confidence_fields: string[];
  ocr_engine:            string;
  processing_time_ms:    number;
}

interface Prescription {
  prescriptionId: string;
  digitizedNotes: string;
  medicines:      Array<{ brandName: string; dosage: string; frequency: string; duration?: string }>;
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
        <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => setSelectedPrescription(row)}>
          View Results
        </Button>
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
      </div>

      {/* ── Result Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        title="OCR Extraction Results"
        size="lg"
      >
        {selectedPrescription && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Low-confidence warning banner */}
            {selectedPrescription.ocrResult?.low_confidence_fields?.length ? (
              <div style={{
                padding:      '10px 14px',
                background:   'rgba(234,179,8,0.10)',
                border:       '1px solid rgba(234,179,8,0.25)',
                borderRadius: 'var(--radius-md)',
                fontSize:     '0.75rem',
                color:        'var(--color-warning)',
                display:      'flex',
                gap:          '8px',
                alignItems:   'flex-start',
              }}>
                <AlertTriangle size={14} style={{ marginTop: '1px', flexShrink: 0 }} />
                <span>
                  <strong>Review required:</strong> {selectedPrescription.ocrResult.low_confidence_fields.length} field(s) have low confidence and need manual verification:&nbsp;
                  {selectedPrescription.ocrResult.low_confidence_fields.join(', ')}.
                </span>
              </div>
            ) : null}

            {/* Raw OCR text */}
            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Extracted Raw Text
              </h4>
              <div style={{
                background:   'var(--bg-elevated)',
                border:       '1px solid var(--border-default)',
                padding:      '12px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize:     '0.8125rem',
                color:        'var(--text-primary)',
                whiteSpace:   'pre-line',
                lineHeight:   1.6,
                maxHeight:    '120px',
                overflowY:    'auto',
              }}>
                {selectedPrescription.ocrResult?.raw_text || selectedPrescription.digitizedNotes || 'No OCR text available.'}
              </div>
            </div>

            {/* Parsed medicines with confidence */}
            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Structured Medication Schedule
              </h4>

              {selectedPrescription.ocrResult?.medicines?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedPrescription.ocrResult.medicines.map((med, index) => (
                    <div key={index} style={{
                      padding:      '14px 16px',
                      background:   'var(--bg-surface)',
                      border:       '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      {/* Medicine header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                          {med.brand_name.value ?? 'Unknown Medicine'}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <ConfidenceBadge level={med.brand_name.confidence} score={med.brand_name.score} />
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<FlaskConical size={12} />}
                            onClick={() => window.location.href = `/locator?saltComposition=${med.brand_name.value ?? ''}`}
                          >
                            Substitutes
                          </Button>
                        </div>
                      </div>

                      {/* Field rows */}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <FieldRow label="Strength"     field={med.strength} />
                        <FieldRow label="Dosage"       field={med.dosage} />
                        <FieldRow label="Frequency"    field={med.frequency} />
                        <FieldRow label="Duration"     field={med.duration} />
                        <FieldRow label="Instructions" field={med.special_instructions} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback for legacy flat prescriptions without ocrResult */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedPrescription.medicines.map((med, index) => (
                    <div key={index} style={{
                      display:        'flex',
                      justifyContent: 'space-between',
                      alignItems:     'center',
                      padding:        '12px 16px',
                      background:     'var(--bg-surface)',
                      border:         '1px solid var(--border-default)',
                      borderRadius:   'var(--radius-md)',
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{med.brandName}</span>
                          <Badge variant="blue">{med.dosage}</Badge>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '8px' }}>
                          <span>Frequency: {med.frequency}</span>
                          {med.duration && <span>• Duration: {med.duration}</span>}
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" icon={<FlaskConical size={12} />}
                        onClick={() => window.location.href = `/locator?saltComposition=${med.brandName}`}>
                        Find Substitutes
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OCR metadata footer */}
            {selectedPrescription.ocrResult && (
              <div style={{ display: 'flex', gap: '16px', paddingTop: '8px', borderTop: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Engine: <strong>{selectedPrescription.ocrResult.ocr_engine}</strong>
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Processed in: <strong>{selectedPrescription.ocrResult.processing_time_ms}ms</strong>
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
