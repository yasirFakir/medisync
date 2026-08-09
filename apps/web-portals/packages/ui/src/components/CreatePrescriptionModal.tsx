import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '../index';
import { apiClient } from '../lib/apiClient';
import type { Prescription, MasterDrug } from './PrescriptionResultModal';
import { Plus, Trash2, Search, Pill, Check, FlaskConical, X } from 'lucide-react';

export interface CreatePrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
  onCreated: (newRx: Prescription) => void;
}

const PRESET_DURATIONS = ['3 Days', '5 Days', '7 Days', '10 Days', '14 Days', '1 Month', 'Continue'];

const SUGGESTED_TESTS = [
  'CBC',
  'Serum Creatinine',
  'Fasting Blood Sugar (FBS)',
  'HbA1c',
  'Lipid Profile',
  'ECG (12-Lead)',
  'Chest X-Ray P/A',
  'Ultrasonogram (USG)',
  'Urinary R/M/E',
];

/** Formats continuous numeric frequency: "222" → "2+2+2", "101" → "1+0+1" */
const formatFrequency = (val: string): string => {
  const d = val.replace(/\D/g, '');
  if (d.length === 3) return `${d[0]}+${d[1]}+${d[2]}`;
  return val;
};

type EditMed = { brandName: string; dosage: string; frequency: string; duration: string; isCustomDuration?: boolean };

export const CreatePrescriptionModal: React.FC<CreatePrescriptionModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName: initialPatientName,
  onCreated,
}) => {
  const [doctorName, setDoctorName] = useState('Prescriber');
  const [doctorDegrees, setDoctorDegrees] = useState('MBBS, FCPS');
  const [doctorSpecialty, setDoctorSpecialty] = useState('General Medicine & Clinical Specialist');
  const [patientName, setPatientName] = useState(initialPatientName || 'Patient');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [hospitalName, setHospitalName] = useState('Central Health Clinic');
  const [rxDate, setRxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState('');

  // ── Clinical Tests / Investigations Advised state ──
  const [clinicalTests, setClinicalTests] = useState<string[]>([]);
  const [customTestInput, setCustomTestInput] = useState('');

  const [editMeds, setEditMeds] = useState<EditMed[]>([
    { brandName: '', dosage: '', frequency: '1+0+1', duration: '7 Days' }
  ]);

  const [searchResults, setSearchResults] = useState<{ [idx: number]: MasterDrug[] }>({});
  const [availableStrengths, setAvailableStrengths] = useState<{ [idx: number]: string[] }>({});
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ── Auto-fill doctor info from logged-in user profile on open ──
  useEffect(() => {
    if (!isOpen) return;
    const fetchDoctorInfo = async () => {
      try {
        const res = await apiClient.get('/users/me');
        const userData = res.data?.data;
        if (userData) {
          if (userData.fullName) {
            const rawName = userData.fullName.trim();
            setDoctorName(rawName.toLowerCase().startsWith('dr.') ? rawName : `Dr. ${rawName}`);
          }
          if (userData.qualifications) {
            setDoctorDegrees(userData.qualifications);
          }
          if (userData.designation || userData.specialization) {
            setDoctorSpecialty(userData.designation || userData.specialization);
          }
          if (userData.area || userData.city) {
            setHospitalName(`${userData.area || userData.city || 'Central'} Medical Center`);
          }
        }
      } catch {
        /* silent fallback to preset values */
      }
    };
    fetchDoctorInfo();
  }, [isOpen]);

  useEffect(() => {
    if (initialPatientName) {
      setPatientName(initialPatientName);
    }
  }, [initialPatientName]);

  const handleAddTest = (testName: string) => {
    const trimmed = testName.trim();
    if (!trimmed) return;
    if (!clinicalTests.includes(trimmed)) {
      setClinicalTests(prev => [...prev, trimmed]);
    }
    setCustomTestInput('');
  };

  const handleRemoveTest = (testName: string) => {
    setClinicalTests(prev => prev.filter(t => t !== testName));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setError('Patient ID is missing.');
      return;
    }
    if (editMeds.length === 0 || editMeds.every(m => !m.brandName.trim())) {
      setError('Please add at least one medicine to the prescription.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        patientId,
        doctorName,
        doctorDegrees,
        doctorSpecialty,
        patientName,
        patientAge,
        patientGender,
        hospitalName,
        prescriptionDate: rxDate,
        clinicalDiagnosis,
        clinicalTests,
        medicines: editMeds.filter(m => m.brandName.trim())
      };

      const res = await apiClient.post('/prescriptions', payload);
      onCreated(res.data.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Prescription"
      size="xl"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Doctor & Patient Metadata Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Doctor Name</label>
            <input className="input" type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Doctor Degrees</label>
            <input className="input" type="text" value={doctorDegrees} onChange={e => setDoctorDegrees(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Doctor Specialty</label>
            <input className="input" type="text" value={doctorSpecialty} onChange={e => setDoctorSpecialty(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Hospital / Clinic</label>
            <input className="input" type="text" value={hospitalName} onChange={e => setHospitalName(e.target.value)} required />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Patient Name</label>
            <input className="input" type="text" value={patientName} onChange={e => setPatientName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Patient Age</label>
            <input className="input" type="text" value={patientAge} onChange={e => setPatientAge(e.target.value)} placeholder="e.g. 35 yrs" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Patient Gender</label>
            <input className="input" type="text" value={patientGender} onChange={e => setPatientGender(e.target.value)} placeholder="e.g. Male / Female" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Rx Date</label>
            <input className="input" type="date" value={rxDate} onChange={e => setRxDate(e.target.value)} required />
          </div>
        </div>

        {/* Clinical Diagnosis */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px', textTransform: 'uppercase' }}>
            Clinical Diagnosis / Reason of Visit
          </label>
          <input
            className="input"
            type="text"
            placeholder="e.g. Acute Viral Fever • Hypertension"
            value={clinicalDiagnosis}
            onChange={e => setClinicalDiagnosis(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        {/* ── Clinical Tests & Investigations Advised Section ── */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#15803d', fontWeight: 700, fontSize: '0.8125rem' }}>
            <FlaskConical size={16} />
            <span>Advised Investigations & Lab Tests ({clinicalTests.length})</span>
          </div>

          {/* Selected Test Badges */}
          {clinicalTests.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {clinicalTests.map(test => (
                <span
                  key={test}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 10px', background: '#00685f', color: '#ffffff',
                    fontSize: '0.75rem', fontWeight: 700, borderRadius: '99px',
                  }}
                >
                  🧪 {test}
                  <button
                    type="button"
                    onClick={() => handleRemoveTest(test)}
                    style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Custom Test Input */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              className="input"
              placeholder="Add lab test or investigation (e.g. CBC, Serum Creatinine, ECG)..."
              value={customTestInput}
              onChange={e => setCustomTestInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTest(customTestInput);
                }
              }}
              style={{ flex: 1, padding: '7px 10px', fontSize: '0.8125rem' }}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={<Plus size={14} />}
              onClick={() => handleAddTest(customTestInput)}
            >
              Add Test
            </Button>
          </div>

          {/* Suggested Quick-Select Test Chips */}
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Quick Suggestions:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {SUGGESTED_TESTS.map(st => {
                const isSelected = clinicalTests.includes(st);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => isSelected ? handleRemoveTest(st) : handleAddTest(st)}
                    style={{
                      padding: '3px 8px', fontSize: '0.7rem', fontWeight: 600,
                      borderRadius: '6px', border: isSelected ? '1px solid #15803d' : '1px solid #cbd5e1',
                      background: isSelected ? '#dcfce7' : '#ffffff',
                      color: isSelected ? '#15803d' : '#334155',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                  >
                    {isSelected ? `✓ ${st}` : `+ ${st}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Medicines Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
              Prescribed Medicines ({editMeds.length})
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={<Plus size={14} />}
              onClick={() => setEditMeds(p => [...p, { brandName: '', dosage: '', frequency: '1+0+1', duration: '7 Days' }])}
            >
              Add Medicine
            </Button>
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
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  position: 'relative',
                }}>
                  {/* Brand Name + Autocomplete */}
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Brand Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={med.brandName}
                        onChange={e => handleMedChange(i, 'brandName', e.target.value)}
                        onFocus={() => { if (med.brandName.trim()) searchDrugs(i, med.brandName); setActiveDropdown(i); }}
                        placeholder="Type to search medicine..."
                        style={{
                          width: '100%', padding: '7px 28px 7px 10px', fontSize: '0.8125rem',
                          border: '1px solid #cbd5e1', borderRadius: '6px',
                          background: '#ffffff', color: '#0f172a', fontWeight: 600,
                          outline: 'none', boxSizing: 'border-box',
                        }}
                        required
                      />
                      <Search size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
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
                            type="button"
                            onClick={() => selectDrug(i, drug)}
                            style={{
                              width: '100%', textAlign: 'left', padding: '8px 12px',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              background: '#ffffff', border: 'none', cursor: 'pointer',
                              fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9', color: '#0f172a',
                            }}
                          >
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{drug.brandName}</span>
                            <span style={{ fontSize: '0.7rem', color: '#00685f', fontWeight: 700, background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>{drug.strength}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Strength / Dosage */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Dosage / Strength
                    </label>
                    {strengthOpts.length > 0 ? (
                      <select
                        value={med.dosage}
                        onChange={e => handleMedChange(i, 'dosage', e.target.value)}
                        style={{ width: '100%', padding: '7px 8px', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', color: '#0f172a', fontWeight: 600, outline: 'none' }}
                      >
                        {strengthOpts.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={e => handleMedChange(i, 'dosage', e.target.value)}
                        placeholder="e.g. 500mg"
                        style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', color: '#0f172a', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>

                  {/* Frequency */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Frequency
                    </label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={e => handleMedChange(i, 'frequency', e.target.value)}
                      placeholder="e.g. 1+0+1"
                      style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', color: '#0f172a', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Duration
                    </label>
                    {med.isCustomDuration ? (
                      <input
                        type="text"
                        value={med.duration}
                        onChange={e => handleMedChange(i, 'duration', e.target.value)}
                        placeholder="Type duration..."
                        style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', color: '#0f172a', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <select
                        value={PRESET_DURATIONS.includes(med.duration) ? med.duration : (med.duration ? '__CUSTOM__' : '')}
                        onChange={e => handleMedChange(i, 'duration', e.target.value)}
                        style={{ width: '100%', padding: '7px 8px', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', color: '#0f172a', fontWeight: 600, outline: 'none' }}
                      >
                        <option value="">-- Select --</option>
                        {PRESET_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        <option value="__CUSTOM__">✏️ Custom...</option>
                      </select>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => setEditMeds(p => p.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '6px', alignSelf: 'flex-end', marginBottom: '2px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} icon={<Check size={16} />}>
            Create & Save Prescription
          </Button>
        </div>
      </form>
    </Modal>
  );
};
