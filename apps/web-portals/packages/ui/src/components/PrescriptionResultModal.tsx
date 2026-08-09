import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../index';
import { apiClient } from '../lib/apiClient';
import { CheckCircle, AlertCircle, AlertTriangle, Trash2, Plus, Search, Tag } from 'lucide-react';


// ─── Shared Prescription Types ────────────────────────────────────────────────
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ExtractedField {
  value: string | null;
  confidence: ConfidenceLevel;
  score: number;
}

export interface ParsedMedicine {
  brand_name: ExtractedField;
  strength: ExtractedField;
  dosage: ExtractedField;
  frequency: ExtractedField;
  duration: ExtractedField;
  special_instructions: ExtractedField;
}

export interface OCRResult {
  raw_text: string;
  doctor_name: ExtractedField;
  doctor_degrees?: ExtractedField;
  doctor_specialty?: ExtractedField;
  hospital_name?: ExtractedField;
  patient_name?: ExtractedField;
  patient_age?: ExtractedField;
  patient_gender?: ExtractedField;
  prescription_date?: ExtractedField;
  clinical_diagnosis?: ExtractedField;
  clinical_tests?: ExtractedField[];
  follow_up_date?: ExtractedField;
  medicines: ParsedMedicine[];
  low_confidence_fields: string[];
  ocr_engine: string;
  processing_time_ms: number;
}

export interface ValidatedItem {
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

export interface ValidationSummary {
  totalMedicines: number;
  matchedCount: number;
  unknownCount: number;
  overallConfidence: number;
  flaggedForReviewCount?: number;
  medicines: ValidatedItem[];
}

export interface Prescription {
  prescriptionId: string;
  digitizedNotes: string;
  medicines: Array<{ brandName: string; dosage: string; frequency: string; duration?: string }>;
  validationSummary?: ValidationSummary;
  ocrResult?: OCRResult;
  createdAt: string;
  doctorName?: string;
  doctorDegrees?: string;
  doctorSpecialty?: string;
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  hospitalName?: string;
  clinicalDiagnosis?: string;
}

export interface MasterDrug {
  drugId: string;
  brandName: string;
  saltComposition: string;
  strength: string;
}

export interface PrescriptionResultModalProps {
  prescription: Prescription;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onUpdate: (updated: Prescription) => void;
  onFindAlternatives?: (rx: Prescription) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Formats continuous numeric frequency: "222" → "2+2+2", "101" → "1+0+1" */
const formatFrequency = (val: string): string => {
  const d = val.replace(/\D/g, '');
  if (d.length === 3) return `${d[0]}+${d[1]}+${d[2]}`;
  return val;
};

// ─── Confidence Badge ─────────────────────────────────────────────────────────
export const ConfidenceBadge: React.FC<{ level: ConfidenceLevel; score: number }> = ({ level, score }) => {
  const cfg = {
    high: { icon: <CheckCircle size={11} />, color: 'var(--color-success)', bg: 'rgba(34,197,94,0.12)', label: 'High' },
    medium: { icon: <AlertCircle size={11} />, color: 'var(--color-warning)', bg: 'rgba(234,179,8,0.12)', label: 'Medium' },
    low: { icon: <AlertTriangle size={11} />, color: 'var(--color-danger)', bg: 'rgba(239,68,68,0.12)', label: 'Low' },
  }[level];

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '2px 6px', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 600,
      color: cfg.color, background: cfg.bg,
    }}>
      {cfg.icon} {cfg.label} ({Math.round(score * 100)}%)
    </span>
  );
};

const PRESET_DURATIONS = ['3 Days', '5 Days', '7 Days', '10 Days', '14 Days', '1 Month', 'Continue'];

export const PrescriptionResultModal: React.FC<PrescriptionResultModalProps> = ({
  prescription,
  onClose,
  onDelete,
  onUpdate,
  onFindAlternatives,
}) => {
  const [showRawText, setShowRawText] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userVerified, setUserVerified] = useState(false);

  const ocr = typeof prescription.ocrResult === 'string'
    ? (() => { try { return JSON.parse(prescription.ocrResult as unknown as string); } catch { return undefined; } })()
    : prescription.ocrResult;
  const vs: ValidationSummary | undefined = (() => {
    const raw = prescription.validationSummary;
    if (!raw) return undefined;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) as ValidationSummary; } catch { return undefined; }
    }
    return raw as ValidationSummary;
  })();

  // ── Editable header fields ─────────────────────────────────────────────────
  const [doctorName, setDoctorName] = useState(ocr?.doctor_name?.value || prescription.doctorName || 'Prescriber');
  const [doctorDegrees, setDoctorDegrees] = useState(ocr?.doctor_degrees?.value || prescription.doctorDegrees || '');
  const [doctorSpecialty, setDoctorSpecialty] = useState(ocr?.doctor_specialty?.value || prescription.doctorSpecialty || '');
  const [patientName, setPatientName] = useState(ocr?.patient_name?.value || prescription.patientName || 'Patient');
  const [patientAge, setPatientAge] = useState(ocr?.patient_age?.value || prescription.patientAge || '');
  const [patientGender, setPatientGender] = useState(ocr?.patient_gender?.value || prescription.patientGender || '');
  const [hospitalName, setHospitalName] = useState((ocr as any)?.hospital_name?.value || prescription.hospitalName || 'Medical Center');
  const [rxDate, setRxDate] = useState(ocr?.prescription_date?.value || '18/04/2026');
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState(ocr?.clinical_diagnosis?.value || prescription.clinicalDiagnosis || '');

  // ── Editable medicine list ─────────────────────────────────────────────────
  type EditMed = { brandName: string; dosage: string; frequency: string; duration: string; isCustomDuration?: boolean };

  const [editMeds, setEditMeds] = useState<EditMed[]>(() => {
    if (prescription.medicines?.length > 0) {
      return prescription.medicines.map(m => ({
        brandName: m.brandName || '',
        dosage: m.dosage || '',
        frequency: m.frequency || '',
        duration: m.duration || '',
      }));
    }
    if (ocr?.medicines) {
      return ocr.medicines.map((m: ParsedMedicine) => ({
        brandName: m.brand_name?.value || '',
        dosage: m.strength?.value || m.dosage?.value || '',
        frequency: m.frequency?.value || '',
        duration: m.duration?.value || '',
      }));
    }
    return [];
  });

  // ── Brand fast-search state ───────────────────────────────────────────────
  const [searchResults, setSearchResults] = useState<{ [idx: number]: MasterDrug[] }>({});
  const [availableStrengths, setAvailableStrengths] = useState<{ [idx: number]: string[] }>({});
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const handleMedChange = (idx: number, field: keyof EditMed, raw: string) => {
    const value = field === 'frequency' ? formatFrequency(raw) : raw;

    setEditMeds(prev => {
      const next = [...prev];
      if (field === 'duration') {
        if (raw === '__CUSTOM__') {
          next[idx] = { ...next[idx], duration: '', isCustomDuration: true };
          return next;
        }
        next[idx] = { ...next[idx], duration: value, isCustomDuration: false };
        return next;
      }
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });

    if (field === 'brandName') {
      if (raw.trim().length >= 1) searchDrugs(idx, raw);
      else setSearchResults(p => ({ ...p, [idx]: [] }));
    }
  };

  const searchDrugs = async (idx: number, q: string) => {
    try {
      const res = await apiClient.get('/drugs', { params: { search: q } });
      setSearchResults(p => ({ ...p, [idx]: res.data.data || [] }));
      setActiveDropdown(idx);
    } catch { /* silent */ }
  };

  const selectDrug = (idx: number, drug: MasterDrug) => {
    setEditMeds(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], brandName: drug.brandName, dosage: drug.strength || next[idx].dosage };
      return next;
    });
    if (drug.strength) {
      setAvailableStrengths(p => ({ ...p, [idx]: drug.strength.split(',').map(s => s.trim()) }));
    }
    setActiveDropdown(null);
    setSearchResults(p => ({ ...p, [idx]: [] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        doctorName, doctorDegrees, doctorSpecialty,
        patientName, patientAge, patientGender, hospitalName, prescriptionDate: rxDate,
        clinicalDiagnosis, medicines: editMeds
      };
      const res = await apiClient.patch(`/prescriptions/${prescription.prescriptionId}`, payload);
      const highConf: ConfidenceLevel = 'high';
      const updated: Prescription = res.data.data || {
        ...prescription, ...payload,
        ocrResult: ocr ? {
          ...ocr,
          patient_name: { value: patientName, confidence: highConf, score: 1.0 },
          patient_age: { value: patientAge, confidence: highConf, score: 1.0 },
          patient_gender: { value: patientGender, confidence: highConf, score: 1.0 },
          doctor_name: { value: doctorName, confidence: highConf, score: 1.0 },
          doctor_degrees: { value: doctorDegrees, confidence: highConf, score: 1.0 },
          doctor_specialty: { value: doctorSpecialty, confidence: highConf, score: 1.0 },
          hospital_name: { value: hospitalName, confidence: highConf, score: 1.0 } as any,
          prescription_date: { value: rxDate, confidence: highConf, score: 1.0 },
          clinical_diagnosis: { value: clinicalDiagnosis, confidence: highConf, score: 1.0 }
        } : undefined
      };
      setUserVerified(true);
      onUpdate(updated);
      setIsEditing(false);
    } catch {
      const highConf: ConfidenceLevel = 'high';
      const updated: Prescription = {
        ...prescription,
        doctorName, doctorDegrees, doctorSpecialty,
        patientName, patientAge, patientGender, hospitalName,
        clinicalDiagnosis, medicines: editMeds,
        ocrResult: ocr ? {
          ...ocr,
          patient_name: { value: patientName, confidence: highConf, score: 1.0 },
          patient_age: { value: patientAge, confidence: highConf, score: 1.0 },
          patient_gender: { value: patientGender, confidence: highConf, score: 1.0 },
          doctor_name: { value: doctorName, confidence: highConf, score: 1.0 },
          doctor_degrees: { value: doctorDegrees, confidence: highConf, score: 1.0 },
          doctor_specialty: { value: doctorSpecialty, confidence: highConf, score: 1.0 },
          hospital_name: { value: hospitalName, confidence: highConf, score: 1.0 } as any,
          prescription_date: { value: rxDate, confidence: highConf, score: 1.0 },
          clinical_diagnosis: { value: clinicalDiagnosis, confidence: highConf, score: 1.0 }
        } : undefined
      } as any;
      setUserVerified(true);
      onUpdate(updated);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // ── Display medicines (original OCR list, used in view mode) ───────────────
  const displayMeds = ocr?.medicines ?? prescription.medicines?.map(m => ({
    brand_name: { value: m.brandName, confidence: 'medium' as ConfidenceLevel, score: 0.6 },
    strength: { value: m.dosage, confidence: 'medium' as ConfidenceLevel, score: 0.6 },
    dosage: { value: m.dosage, confidence: 'medium' as ConfidenceLevel, score: 0.6 },
    frequency: { value: m.frequency, confidence: 'medium' as ConfidenceLevel, score: 0.6 },
    duration: { value: m.duration ?? null, confidence: 'low' as ConfidenceLevel, score: 0.3 },
    special_instructions: { value: null, confidence: 'low' as ConfidenceLevel, score: 0 },
  })) ?? [];

  const handlePrintRx = () => {
    const printElem = document.getElementById('printable-prescription-pad');
    if (!printElem) return;
    let iframe = document.getElementById('rx-print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'rx-print-iframe';
      Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0px', height: '0px', border: '0' });
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><title>Prescription #${prescription.prescriptionId.substring(0, 8)}</title>
      <style>@page{size:auto;margin:10mm}body{background:#fff!important;color:#111827!important;font-family:'Inter',system-ui,sans-serif!important;margin:0!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}#printable-prescription-pad{border:1px solid #cbd5e1!important;padding:20px 24px!important;background:#fff!important;width:100%!important;box-sizing:border-box!important}.no-print{display:none!important}</style>
      </head><body>${printElem.outerHTML}</body></html>`);
    doc.close();
    setTimeout(() => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); }, 250);
  };

  const hasOcrWarnings = !userVerified && ocr?.low_confidence_fields && ocr.low_confidence_fields.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant={vs?.flaggedForReviewCount && vs.flaggedForReviewCount > 0 ? 'yellow' : 'green'}>
            {vs ? `${vs.matchedCount}/${vs.totalMedicines} Verified in Master DB (${Math.round(vs.overallConfidence * 100)}% match)` : 'Digitized Prescription'}
          </Badge>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '8px 16px', background: '#f0f3ff', color: '#111c2d',
                  fontSize: '0.8125rem', fontWeight: 700, border: '1px solid #bcc9c6',
                  borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                ✕ Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 20px', background: '#00685f', color: '#ffffff',
                  fontSize: '0.8125rem', fontWeight: 700, border: 'none',
                  borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(0,104,95,0.25)', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                {saving ? 'Saving…' : '✓ Save Changes'}
              </button>
            </>
          ) : (
            <>
              {onFindAlternatives && (
                <Button size="sm" variant="primary" icon={<Tag size={14} />} onClick={() => onFindAlternatives(prescription)}>
                  💡 Find Cheap Alternatives
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>✏️ Edit & Correct</Button>
              <Button size="sm" variant="secondary" onClick={() => setShowRawText(!showRawText)}>
                {showRawText ? '📋 View Medical Pad' : '📄 View Raw OCR Text'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handlePrintRx}>🖨️ Print Rx</Button>
            </>
          )}
        </div>
      </div>

      {/* ── Persistent OCR Warning Banner (until user saves corrections) ──── */}
      {hasOcrWarnings && !showRawText && !isEditing && (
        <div className="no-print" style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
          padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a',
          borderLeft: '4px solid #d97706', borderRadius: '8px',
          fontSize: '0.75rem', color: '#b45309',
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <strong>OCR Review Required:</strong> Click <strong>✏️ Edit & Correct</strong> to verify and save.
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            style={{
              whiteSpace: 'nowrap', padding: '3px 10px', background: '#b45309', color: '#fff',
              fontSize: '0.7rem', fontWeight: 700, border: 'none', borderRadius: '6px', cursor: 'pointer',
            }}
          >
            Correct Now
          </button>
        </div>
      )}

      {/* ── Clinical Coherence Warning — medicines flagged for diagnosis mismatch ── */}
      {!userVerified && !isEditing && vs && (vs.flaggedForReviewCount ?? 0) > 0 && (() => {
        const flagged = vs.medicines.filter(m => m.requiresReview);
        return (
          <div className="no-print" style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
            padding: '10px 14px', background: '#fff7ed', border: '1px solid #fed7aa',
            borderLeft: '4px solid #ea580c', borderRadius: '8px',
            fontSize: '0.75rem', color: '#c2410c',
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <strong>Clinical Alignment Notice:</strong>{' '}
                {flagged.length} medicine{flagged.length !== 1 ? 's' : ''} may not align with the recorded diagnosis.{' '}
                {flagged.map(m => m.input.brandName || m.input.genericName).filter(Boolean).join(', ')}.
                {' '}Please verify with <strong>✏️ Edit & Correct</strong>.
              </div>
            </div>
          </div>
        );
      })()}

      {showRawText ? (
        /* ── Raw OCR text view ─────────────────────────────────────────── */
        <div style={{
          fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.65,
          color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          padding: '16px', background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)',
          maxHeight: '450px', overflowY: 'auto',
        }}>
          {ocr?.raw_text || prescription.digitizedNotes || 'No raw text recorded.'}
        </div>
      ) : isEditing ? (
        /* ── EDIT MODE ─────────────────────────────────────────────────── */
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '16px',
          background: '#ffffff', color: '#111c2d', borderRadius: '12px',
          padding: '24px', border: '1px solid #d8e3fb',
          boxShadow: '0px 4px 20px rgba(30,41,59,0.05)',
        }}>
          {/* Header fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Doctor Name', value: doctorName, setter: setDoctorName },
              { label: 'Doctor Degrees', value: doctorDegrees, setter: setDoctorDegrees },
              { label: 'Doctor Specialty', value: doctorSpecialty, setter: setDoctorSpecialty },
              { label: 'Patient Name', value: patientName, setter: setPatientName },
              { label: 'Patient Age', value: patientAge, setter: setPatientAge },
              { label: 'Patient Sex/Gender', value: patientGender, setter: setPatientGender },
              { label: 'Hospital Name', value: hospitalName, setter: setHospitalName },
              { label: 'Date', value: rxDate, setter: setRxDate },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#3d4947', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {label}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={e => setter(e.target.value)}
                  placeholder={label}
                  style={{
                    width: '100%', padding: '8px 12px', fontSize: '0.85rem',
                    border: '1px solid #bcc9c6', borderRadius: '8px',
                    background: '#f0f3ff', color: '#111c2d', fontWeight: 600,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Clinical Diagnosis input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#3d4947', marginBottom: '4px', textTransform: 'uppercase' }}>
              Clinical Diagnosis
            </label>
            <input
              type="text"
              value={clinicalDiagnosis}
              onChange={e => setClinicalDiagnosis(e.target.value)}
              placeholder="e.g. • HTN | • Fever | • Type 2 Diabetes"
              style={{
                width: '100%', padding: '8px 12px', fontSize: '0.85rem',
                border: '1px solid #bcc9c6', borderRadius: '8px',
                background: '#f0f3ff', color: '#111c2d', fontWeight: 600,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Medicine list editor */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3d4947', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Medicines List
              </span>
              <button
                onClick={() => setEditMeds(p => [...p, { brandName: '', dosage: '', frequency: '1+0+1', duration: '' }])}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '0.75rem', fontWeight: 700, color: '#00685f',
                  background: '#e7eeff', border: '1px solid #6bd8cb', cursor: 'pointer', padding: '6px 12px',
                  borderRadius: '6px',
                }}
              >
                <Plus size={14} /> Add Medicine
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {editMeds.map((med, i) => {
                const drugMatches = searchResults[i] || [];
                const strengthOpts = availableStrengths[i] || [];

                return (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '3fr 2fr 2fr 2fr auto',
                    gap: '10px', alignItems: 'flex-end',
                    padding: '12px 14px', borderRadius: '10px',
                    background: '#f9f9ff', border: '1px solid #d8e3fb',
                    position: 'relative',
                  }}>
                    {/* Brand Name + Autocomplete */}
                    <div style={{ position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 700, color: '#6d7a77', marginBottom: '4px', textTransform: 'uppercase' }}>
                        Brand Name
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={med.brandName}
                          onChange={e => handleMedChange(i, 'brandName', e.target.value)}
                          onFocus={() => { if (med.brandName.trim()) searchDrugs(i, med.brandName); setActiveDropdown(i); }}
                          placeholder="Type to search…"
                          style={{
                            width: '100%', padding: '7px 28px 7px 10px', fontSize: '0.8125rem',
                            border: '1px solid #bcc9c6', borderRadius: '6px',
                            background: '#ffffff', color: '#111c2d', fontWeight: 600,
                            outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                        <Search size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#6d7a77', pointerEvents: 'none' }} />
                      </div>
                      {activeDropdown === i && drugMatches.length > 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                          background: '#ffffff', border: '1px solid #00685f',
                          borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          maxHeight: '180px', overflowY: 'auto', marginTop: '4px',
                        }}>
                          {drugMatches.map(drug => (
                            <button
                              key={drug.drugId}
                              onClick={() => selectDrug(i, drug)}
                              style={{
                                width: '100%', textAlign: 'left', padding: '8px 12px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: '#ffffff', border: 'none', cursor: 'pointer',
                                fontSize: '0.8rem', borderBottom: '1px solid #e7eeff', color: '#111c2d',
                              }}
                            >
                              <span style={{ fontWeight: 700, color: '#111c2d' }}>{drug.brandName}</span>
                              <span style={{ fontSize: '0.7rem', color: '#00685f', fontWeight: 700, background: '#e7eeff', padding: '2px 6px', borderRadius: '4px' }}>{drug.strength}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dosage / Strength */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 700, color: '#6d7a77', marginBottom: '4px', textTransform: 'uppercase' }}>
                        Dosage / Strength
                      </label>
                      {strengthOpts.length > 0 ? (
                        <select
                          value={med.dosage}
                          onChange={e => handleMedChange(i, 'dosage', e.target.value)}
                          style={{ width: '100%', padding: '7px 8px', fontSize: '0.8125rem', border: '1px solid #bcc9c6', borderRadius: '6px', background: '#ffffff', color: '#111c2d', fontWeight: 600, outline: 'none' }}
                        >
                          {strengthOpts.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={e => handleMedChange(i, 'dosage', e.target.value)}
                          placeholder="e.g. 500mg"
                          style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', border: '1px solid #bcc9c6', borderRadius: '6px', background: '#ffffff', color: '#111c2d', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                        />
                      )}
                    </div>

                    {/* Frequency */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 700, color: '#6d7a77', marginBottom: '4px', textTransform: 'uppercase' }}>
                        Frequency
                      </label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={e => handleMedChange(i, 'frequency', e.target.value)}
                        placeholder="222 → 2+2+2"
                        style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', border: '1px solid #bcc9c6', borderRadius: '6px', background: '#ffffff', color: '#111c2d', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Duration */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 700, color: '#6d7a77', marginBottom: '4px', textTransform: 'uppercase' }}>
                        Duration
                      </label>
                      {med.isCustomDuration ? (
                        <input
                          type="text"
                          value={med.duration}
                          onChange={e => handleMedChange(i, 'duration', e.target.value)}
                          placeholder="Type duration…"
                          style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', border: '1px solid #bcc9c6', borderRadius: '6px', background: '#ffffff', color: '#111c2d', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                        />
                      ) : (
                        <select
                          value={PRESET_DURATIONS.includes(med.duration) ? med.duration : (med.duration ? '__CUSTOM__' : '')}
                          onChange={e => handleMedChange(i, 'duration', e.target.value)}
                          style={{ width: '100%', padding: '7px 8px', fontSize: '0.8125rem', border: '1px solid #bcc9c6', borderRadius: '6px', background: '#ffffff', color: '#111c2d', fontWeight: 600, outline: 'none' }}
                        >
                          <option value="">-- Not Selected --</option>
                          {PRESET_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                          <option value="__CUSTOM__">✏️ Custom…</option>
                        </select>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => setEditMeds(p => p.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba1a1a', padding: '6px', alignSelf: 'flex-end', marginBottom: '2px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #d8e3fb', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{
                padding: '8px 18px', background: '#f0f3ff', color: '#111c2d',
                fontSize: '0.85rem', fontWeight: 700, border: '1px solid #bcc9c6',
                borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              ✕ Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 24px', background: '#00685f', color: '#ffffff',
                fontSize: '0.85rem', fontWeight: 700, border: 'none',
                borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(0,104,95,0.25)', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {saving ? 'Saving…' : '✓ Save Changes'}
            </button>
          </div>
        </div>
      ) : (
        /* ── AUTHENTIC MEDICAL PRESCRIPTION PAD (view mode, original OCR) ── */
        <div id="printable-prescription-pad" style={{
          background: '#ffffff', color: '#111c2d', borderRadius: '12px',
          border: '1px solid #d8e3fb', boxShadow: '0px 4px 20px rgba(30,41,59,0.05)',
          padding: '24px 28px',
          fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif",
          position: 'relative',
        }}>

          {/* Letterhead */}
          <div style={{ borderBottom: '2px solid #00685f', paddingBottom: '14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00685f', letterSpacing: '-0.02em' }}>
                Dr. {doctorName}
              </div>
              {(doctorDegrees || ocr?.doctor_degrees?.value) && (
                <div style={{ fontSize: '0.78rem', color: '#3d4947', fontWeight: 600, marginTop: '2px' }}>
                  {doctorDegrees || ocr?.doctor_degrees?.value}
                </div>
              )}
              {(doctorSpecialty || ocr?.doctor_specialty?.value) && (
                <div style={{ fontSize: '0.73rem', color: '#6d7a77', marginTop: '2px' }}>
                  {doctorSpecialty || ocr?.doctor_specialty?.value}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111c2d', textTransform: 'uppercase' }}>
                {hospitalName || ocr?.hospital_name?.value || 'Medical Center'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#6d7a77' }}>Dedicated to Medical Excellence</div>
            </div>
          </div>

          {/* Patient Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', background: '#f0f3ff', border: '1px solid #d8e3fb', borderRadius: '8px', padding: '8px 14px', fontSize: '0.775rem', marginBottom: '12px' }}>
            <div><span style={{ color: '#6d7a77', fontWeight: 600 }}>Patient:</span> <strong style={{ color: '#111c2d' }}>{patientName || ocr?.patient_name?.value || 'Patient (#' + prescription.prescriptionId.substring(0,4) + ')'}</strong></div>
            <div><span style={{ color: '#6d7a77', fontWeight: 600 }}>Age/Sex:</span> <strong style={{ color: '#111c2d' }}>{((patientAge || ocr?.patient_age?.value || '—') + ' / ' + (patientGender || ocr?.patient_gender?.value || '—'))}</strong></div>
            <div><span style={{ color: '#6d7a77', fontWeight: 600 }}>Date:</span> <strong style={{ color: '#111c2d' }}>{rxDate}</strong></div>
            <div><span style={{ color: '#6d7a77', fontWeight: 600 }}>Rx ID:</span> <strong style={{ color: '#00685f' }}>#{prescription.prescriptionId.substring(0,6)}</strong></div>
          </div>

          {/* Clinical Findings — always visible; shows OCR value or placeholder */}
          {(() => {
            const diagValue = clinicalDiagnosis || (ocr as any)?.clinical_diagnosis?.value || '';
            const testsValue = ocr?.clinical_tests?.length ? ocr.clinical_tests : [];
            if (!diagValue && !testsValue.length) return null;
            return (
              <div style={{ display: 'grid', gridTemplateColumns: diagValue && testsValue.length ? '1fr 1fr' : '1fr', gap: '12px', background: '#f9f9ff', border: '1px solid #d8e3fb', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.75rem' }}>
                {diagValue && (
                  <div>
                    <div style={{ fontWeight: 800, color: '#111c2d', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.68rem' }}>🩺 Clinical Diagnosis</div>
                    <div style={{ color: '#3d4947', fontWeight: 600 }}>{diagValue}</div>
                  </div>
                )}
                {testsValue.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 800, color: '#111c2d', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.68rem' }}>🧪 Investigations Advised</div>
                    <div style={{ color: '#00685f', fontWeight: 600, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {testsValue.map((t: any, i: number) => <span key={i} style={{ background: '#e7eeff', color: '#00685f', padding: '1px 6px', borderRadius: '4px' }}>{t.value}</span>)}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Medicines Grid */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '0', fontSize: '2.2rem', fontWeight: 900, fontFamily: 'serif', color: '#00685f', opacity: 0.9, userSelect: 'none', lineHeight: 1 }}>Rx</div>
            <div style={{ paddingTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
              {displayMeds.map((med: ParsedMedicine, i: number) => {
                const dbMatch = vs?.medicines[i];
                const displayBrand = dbMatch?.matchedDrug?.brandName || med.brand_name.value || 'Unknown';
                const isFlagged = Boolean(dbMatch?.requiresReview);

                return (
                  <div key={i} style={{
                    padding: '8px 10px',
                    background: isFlagged ? '#fef3c7' : '#ffffff',
                    border: isFlagged ? '1px solid #fde68a' : '1px solid #d8e3fb',
                    borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '2px',
                    pageBreakInside: 'avoid', breakInside: 'avoid',
                    boxShadow: '0px 2px 8px rgba(30,41,59,0.03)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#111c2d' }}>{i + 1}. {displayBrand}</span>
                          {(dbMatch?.matchedDrug?.strength || med.strength.value) && (
                            <span style={{ background: '#e7eeff', color: '#00685f', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px' }}>
                              {dbMatch?.matchedDrug?.strength || med.strength.value}
                            </span>
                          )}
                        </div>
                        {dbMatch?.matched && med.brand_name.value && med.brand_name.value !== displayBrand && (
                          <div style={{ fontSize: '0.65rem', color: '#6d7a77', fontStyle: 'italic' }}>(OCR: "{med.brand_name.value}")</div>
                        )}
                      </div>
                      {med.frequency.value && (
                        <div style={{ background: '#00685f', color: '#ffffff', fontWeight: 800, fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                          {med.frequency.value}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.68rem', color: '#3d4947' }}>
                      {dbMatch?.matchedDrug?.saltComposition && (
                        <span style={{ color: '#00685f', fontWeight: 600 }}>✓ {dbMatch.matchedDrug.saltComposition}</span>
                      )}
                      {med.duration.value && <span>⏱ {med.duration.value}</span>}
                    </div>
                    {isFlagged && (
                      <div style={{ marginTop: '2px', padding: '2px 6px', background: '#fef3c7', borderLeft: '3px solid #b45309', fontSize: '0.65rem', color: '#b45309', fontWeight: 500 }}>
                        ⚠️ <strong>Review:</strong> {dbMatch?.flagReason || 'Check OCR match'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #d8e3fb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.67rem', color: '#6d7a77' }}>
            <div><strong>Chamber:</strong> 1/8, Block-E, Lalmatia, Satmosjid Road, Dhaka-1207. Phone: 02 41023819-25</div>
            <div>Digitized by <strong>MediSync AI ({ocr?.ocr_engine || 'mistral-ocr'})</strong></div>
          </div>
        </div>
      )}

      {/* ── Action Bar Footer ─────────────────────────────────────────────── */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
        {onDelete ? (
          <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(prescription.prescriptionId); }}>
            Delete Prescription
          </Button>
        ) : <div />}
        <Button size="sm" variant="secondary" onClick={onClose}>Close Window</Button>
      </div>
    </div>
  );
};
