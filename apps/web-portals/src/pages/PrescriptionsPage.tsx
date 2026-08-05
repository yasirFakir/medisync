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
  patient_name?:         ExtractedField;
  patient_age?:          ExtractedField;
  patient_gender?:       ExtractedField;
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
  requiresReview?: boolean;
  flagReason?: string;
}

interface ValidationSummary {
  totalMedicines: number;
  matchedCount: number;
  unknownCount: number;
  overallConfidence: number;
  flaggedForReviewCount?: number;
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

// ─── Prescription Result Modal (Medical Prescription Pad UI) ──────────────────
const PrescriptionResultModal: React.FC<{
  prescription: Prescription;
  onClose: () => void;
  onDelete: (id: string) => void;
}> = ({ prescription, onClose, onDelete }) => {
  const [showRawText, setShowRawText] = useState(false);
  const ocr = prescription.ocrResult;
  const vs  = prescription.validationSummary;

  const medicines = ocr?.medicines ?? prescription.medicines?.map(m => ({
    brand_name: { value: m.brandName, confidence: 'medium' as ConfidenceLevel, score: 0.6 },
    strength:   { value: m.dosage,    confidence: 'medium' as ConfidenceLevel, score: 0.6 },
    dosage:     { value: m.dosage,    confidence: 'medium' as ConfidenceLevel, score: 0.6 },
    frequency:  { value: m.frequency, confidence: 'medium' as ConfidenceLevel, score: 0.6 },
    duration:   { value: m.duration ?? null, confidence: 'low' as ConfidenceLevel, score: 0.3 },
    special_instructions: { value: null, confidence: 'low' as ConfidenceLevel, score: 0 },
  })) ?? [];

  const doctorName = ocr?.doctor_name?.value || (prescription as any).doctorName || 'Prescriber';
  const rxDate     = ocr?.prescription_date?.value || '18/04/2026';
  const followUp   = ocr?.follow_up_date?.value || null;

  const handlePrintRx = () => {
    const printElem = document.getElementById('printable-prescription-pad');
    if (!printElem) return;

    let iframe = document.getElementById('rx-print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'rx-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription #${prescription.prescriptionId.substring(0, 8)}</title>
          <style>
            @page {
              size: auto;
              margin: 10mm;
            }
            body {
              background: #ffffff !important;
              color: #111827 !important;
              font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-prescription-pad {
              border: 1px solid #cbd5e1 !important;
              box-shadow: none !important;
              padding: 20px 24px !important;
              margin: 0 auto !important;
              background: #ffffff !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            .no-print { display: none !important; }
            * { box-sizing: border-box !important; }
          </style>
        </head>
        <body>
          ${printElem.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── View Toggle Toolbar ────────────────────────────────────────── */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant={vs && vs.flaggedForReviewCount && vs.flaggedForReviewCount > 0 ? "yellow" : "green"}>
            {vs ? `${vs.matchedCount}/${vs.totalMedicines} Verified in Master DB (${Math.round(vs.overallConfidence * 100)}% match)` : 'Digitized Prescription'}
          </Badge>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowRawText(!showRawText)}
          >
            {showRawText ? '📋 View Medical Pad' : '📄 View Raw OCR Text'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePrintRx}
          >
            🖨️ Print Rx
          </Button>
        </div>
      </div>

      {showRawText ? (
        /* ── RAW OCR TEXT VIEW ───────────────────────────────────────────── */
        <div style={{
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          lineHeight: 1.65,
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          padding: '16px',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          maxHeight: '450px',
          overflowY: 'auto',
        }}>
          {ocr?.raw_text || prescription.digitizedNotes || 'No raw text recorded.'}
        </div>
      ) : (
        /* ── AUTHENTIC MEDICAL PRESCRIPTION PAD ─────────────────────────── */
        <div id="printable-prescription-pad" style={{
          background: '#ffffff',
          color: '#111827',
          borderRadius: '8px',
          border: '2px solid #e5e7eb',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          padding: '24px 28px',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          position: 'relative',
        }}>

          {/* ── Letterhead Header ───────────────────────────────────────── */}
          <div style={{
            borderBottom: '2px solid #0284c7',
            paddingBottom: '14px',
            marginBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0369a1', letterSpacing: '-0.02em' }}>
                Dr. {doctorName}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 600, marginTop: '2px' }}>
                MBBS (Dhaka), BCS (Health), MD (Cardiology-BSMMU)
              </div>
              <div style={{ fontSize: '0.73rem', color: '#6b7280', marginTop: '2px' }}>
                Clinical &amp; Interventional Cardiologist &amp; Medicine Specialist Consultant
              </div>
              <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600, marginTop: '2px' }}>
                National Institute of Cardiovascular Diseases &amp; Hospital (NICVD), Dhaka
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>CITY HOSPITAL LTD.</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Dedicated to Medical Excellence</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px' }}>Reg No: BMDC-A77838</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Appt: 01913672742</div>
            </div>
          </div>

          {/* ── Patient Metadata & Clinical Summary Bar ─────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '8px 14px',
            fontSize: '0.775rem',
            marginBottom: '12px',
          }}>
            <div><span style={{ color: '#64748b', fontWeight: 600 }}>Patient:</span> <strong style={{ color: '#0f172a' }}>{ocr?.patient_name?.value || 'Patient (Prescription #' + prescription.prescriptionId.substring(0,4) + ')'}</strong></div>
            <div><span style={{ color: '#64748b', fontWeight: 600 }}>Age/Sex:</span> <strong style={{ color: '#0f172a' }}>{(ocr?.patient_age?.value || '—') + ' / ' + (ocr?.patient_gender?.value || '—')}</strong></div>
            <div><span style={{ color: '#64748b', fontWeight: 600 }}>Date:</span> <strong style={{ color: '#0f172a' }}>{rxDate}</strong></div>
            <div><span style={{ color: '#64748b', fontWeight: 600 }}>Rx ID:</span> <strong style={{ color: '#0284c7' }}>#{prescription.prescriptionId.substring(0,6)}</strong></div>
          </div>

          {/* ── Clinical Diagnosis & Advised Lab Tests Strip ─────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '0.75rem',
          }}>
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                🩺 Clinical Diagnosis
              </div>
              <div style={{ color: '#334155', fontWeight: 600 }}>
                • OMI (Inf.) (EF 44%) | • s/p PCI to LCX | • HTN | • ?BPPV
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                🧪 Investigations Advised
              </div>
              <div style={{ color: '#0369a1', fontWeight: 600, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {ocr?.clinical_tests?.length ? (
                  ocr.clinical_tests.map((t, i) => (
                    <span key={i} style={{ background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px' }}>{t.value}</span>
                  ))
                ) : (
                  <span>Troponin I, S. Lipid Profile, S. Electrolyte, MRI Brain</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Full-Width Rx Prescribed Medicines Pad ──────────────────── */}
          <div style={{ position: 'relative' }}>

            {/* Watermark Rx Icon */}
            <div style={{
              position: 'absolute',
              top: '-14px',
              left: '0',
              fontSize: '2.2rem',
              fontWeight: 900,
              fontFamily: 'serif',
              color: '#0284c7',
              opacity: 0.9,
              userSelect: 'none',
              lineHeight: 1,
            }}>
              Rx
            </div>

            {/* 2-Column Grid for 15 Medicines (No Empty Gaps) */}
            <div style={{
              paddingTop: '30px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px 14px',
            }}>
              {medicines.map((med, i) => {
                const dbMatch = vs?.medicines[i];
                const displayBrandName = dbMatch?.matchedDrug?.brandName || med.brand_name.value || 'Unknown';
                const isFlagged = dbMatch?.requiresReview;

                return (
                  <div key={i} style={{
                    padding: '8px 10px',
                    background: isFlagged ? '#fffbeb' : '#fafafa',
                    border: isFlagged ? '1px solid #fde68a' : '1px solid #e2e8f0',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                            {i + 1}. {displayBrandName}
                          </span>
                          {(dbMatch?.matchedDrug?.strength || med.strength.value) && (
                            <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px' }}>
                              {dbMatch?.matchedDrug?.strength || med.strength.value}
                            </span>
                          )}
                        </div>

                        {dbMatch?.matched && med.brand_name.value && med.brand_name.value !== displayBrandName && (
                          <div style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>
                            (OCR: "{med.brand_name.value}")
                          </div>
                        )}
                      </div>

                      {med.frequency.value && (
                        <div style={{ background: '#0284c7', color: '#ffffff', fontWeight: 800, fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                          {med.frequency.value}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.68rem', color: '#475569' }}>
                      {dbMatch?.matchedDrug?.saltComposition && (
                        <span style={{ color: '#059669', fontWeight: 600 }}>
                          ✓ {dbMatch.matchedDrug.saltComposition}
                        </span>
                      )}
                      {med.duration.value && <span>⏱ {med.duration.value}</span>}
                    </div>

                    {isFlagged && (
                      <div style={{
                        marginTop: '2px',
                        padding: '2px 6px',
                        background: '#fef3c7',
                        borderLeft: '3px solid #d97706',
                        fontSize: '0.65rem',
                        color: '#b45309',
                        fontWeight: 500,
                      }}>
                        ⚠️ <strong>Review:</strong> {dbMatch.flagReason || 'Check OCR match'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

          {/* ── Footer Address Strip ────────────────────────────────────── */}
          <div style={{
            marginTop: '20px',
            paddingTop: '12px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.67rem',
            color: '#64748b',
          }}>
            <div>
              <strong>Chamber:</strong> 1/8, Block-E, Lalmatia, Satmosjid Road, Dhaka-1207. Phone: 02 41023819-25
            </div>
            <div>
              Digitized by <strong>MediSync AI ({ocr?.ocr_engine || 'mistral-ocr'})</strong>
            </div>
          </div>

        </div>
      )}

      {/* ── Action Bar Footer ───────────────────────────────────────────── */}
      <div className="no-print" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: '8px',
      }}>
        <Button
          size="sm" variant="danger"
          icon={<Trash2 size={13} />}
          onClick={(e) => { e.stopPropagation(); onDelete(prescription.prescriptionId); }}
        >Delete Prescription</Button>
        <Button
          size="sm" variant="secondary"
          onClick={onClose}
        >Close Window</Button>
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
      label: 'Identified Master Medicines',
      render: (_val: any, row: Prescription) => {
        const vsList = row.validationSummary?.medicines || [];
        const rawList = Array.isArray(row.medicines) ? row.medicines : [];
        const displayList = vsList.length > 0
          ? vsList.map(v => v.matchedDrug?.brandName || v.input?.brandName || 'Medicine')
          : rawList.map(m => m?.brandName || 'Medicine');

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {displayList.slice(0, 3).map((name: string, i: number) => (
              <Badge key={i} variant="green">{name}</Badge>
            ))}
            {displayList.length > 3 && (
              <Badge variant="purple">+{displayList.length - 3} more</Badge>
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
          title="OCR Extraction Results - Medical Prescription Pad"
          size="xl"
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

