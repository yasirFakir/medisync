import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, Table, Modal, Badge, Spinner,
  PrescriptionResultModal, ConfidenceBadge,
  type Prescription, type OCRResult, type ValidationSummary, type MasterDrug, type ConfidenceLevel
} from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { Upload, Eye, Calendar, AlertTriangle, CheckCircle, AlertCircle, Trash2, Plus, Search, Tag, ArrowRightLeft } from 'lucide-react';


// ─── Upload Progress ──────────────────────────────────────────────────────────
const UploadProgress: React.FC<{ progress: number }> = ({ progress }) => (
  <div style={{ marginTop: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Processing prescription...</span>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-brand-400)' }}>{progress}%</span>
    </div>
    <div style={{ height: '4px', background: 'var(--border-default)', borderRadius: '99px', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${progress}%`,
        background: 'linear-gradient(90deg, var(--color-brand-500), var(--color-brand-300))',
        borderRadius: '99px', transition: 'width 0.4s ease',
      }} />
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export const PrescriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [prescriptions,        setPrescriptions]        = useState<Prescription[]>([]);
  const [selectedRxIds,        setSelectedRxIds]        = useState<string[]>([]);
  const [loading,              setLoading]              = useState(true);
  const [uploading,            setUploading]            = useState(false);
  const [uploadProgress,       setUploadProgress]       = useState(0);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [error,                setError]                = useState('');
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => { fetchPrescriptions(); }, []);

  const handleFindAlternatives = (selected: Prescription[]) => {
    if (!selected || selected.length === 0) return;
    navigate('/alternatives', {
      state: {
        selectedPrescriptions: selected
      }
    });
  };

  const handleDeletePrescription = async (prescriptionId: string) => {
    try {
      await apiClient.delete(`/prescriptions/${prescriptionId}`);
      setPrescriptions(prev => prev.filter(p => p.prescriptionId !== prescriptionId));
      setSelectedRxIds(prev => prev.filter(id => id !== prescriptionId));
      if (selectedPrescription?.prescriptionId === prescriptionId) setSelectedPrescription(null);
    } catch (err: any) {
      console.error('Failed to delete prescription', err);
      setError(err.response?.data?.message || 'Failed to delete prescription record');
    }
  };

  const handleUpdatePrescription = (updated: Prescription) => {
    setPrescriptions(prev => prev.map(p => p.prescriptionId === updated.prescriptionId ? updated : p));
    setSelectedPrescription(updated);
  };

  const simulateProgress = () => {
    setUploadProgress(0);
    progressInterval.current = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) { clearInterval(progressInterval.current!); return 85; }
        return prev + Math.floor(Math.random() * 12) + 3;
      });
    }, 400);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(''); simulateProgress();
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post('/prescriptions/digitize', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      clearInterval(progressInterval.current!); setUploadProgress(100);
      setTimeout(() => {
        setPrescriptions(prev => [res.data.data, ...prev]);
        setSelectedPrescription(res.data.data);
        setUploading(false); setUploadProgress(0);
      }, 600);
    } catch (err: any) {
      clearInterval(progressInterval.current!); setUploadProgress(0);
      const serverMessage = err.response?.data?.message || err.response?.data?.detail || err.message;
      setError(serverMessage || 'OCR digitization failed. Please verify the image format.');
      setUploading(false);
    }
    e.target.value = '';
  };

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={prescriptions.length > 0 && selectedRxIds.length === prescriptions.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRxIds(prescriptions.map(p => p.prescriptionId));
            } else {
              setSelectedRxIds([]);
            }
          }}
          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--color-brand-600)' }}
        />
      ),
      render: (_val: any, row: Prescription) => (
        <input
          type="checkbox"
          checked={selectedRxIds.includes(row.prescriptionId)}
          onChange={(e) => {
            e.stopPropagation();
            if (e.target.checked) {
              setSelectedRxIds(prev => [...prev, row.prescriptionId]);
            } else {
              setSelectedRxIds(prev => prev.filter(id => id !== row.prescriptionId));
            }
          }}
          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--color-brand-600)' }}
        />
      )
    },
    {
      key: 'createdAt', label: 'Upload Date',
      render: (val: any) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          {val ? new Date(val).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
        </span>
      )
    },
    {
      key: 'medicines', label: 'Identified Master Medicines',
      render: (_val: any, row: Prescription) => {
        const vsList = row.validationSummary?.medicines || [];
        const rawList = Array.isArray(row.medicines) ? row.medicines : [];
        const displayList = vsList.length > 0
          ? vsList.map(v => v.matchedDrug?.brandName || v.input?.brandName || 'Medicine')
          : rawList.map(m => m?.brandName || 'Medicine');
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {displayList.slice(0, 3).map((name: string, i: number) => <Badge key={i} variant="green">{name}</Badge>)}
            {displayList.length > 3 && <Badge variant="purple">+{displayList.length - 3} more</Badge>}
          </div>
        );
      }
    },
    {
      key: 'prescriptionId', label: 'Actions',
      render: (_val: any, row: Prescription) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => setSelectedPrescription(row)}>View & Correct</Button>
          <Button size="sm" variant="primary" icon={<Tag size={14} />} onClick={() => handleFindAlternatives([row])}>Alternatives</Button>
          <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={(e) => { e.stopPropagation(); handleDeletePrescription(row.prescriptionId); }}>Delete</Button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px', alignItems: 'start' }}>

        {/* Upload Card */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Scan Prescription</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Upload a JPEG, PNG, or PDF prescription. The OCR engine will extract medicine names, dosages, frequency, and duration with confidence indicators.
          </p>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '0.75rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertTriangle size={14} style={{ marginTop: '1px', flexShrink: 0 }} /> {error}
            </div>
          )}

          <label style={{ border: '2px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'not-allowed' : 'pointer', textAlign: 'center', transition: 'background 0.2s', background: uploading ? 'rgba(14,165,233,0.04)' : 'transparent' }}>
            <input type="file" id="prescription-upload" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
            {uploading ? (
              <>
                <Spinner size={32} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: '12px' }}>Extracting prescription data...</span>
                <UploadProgress progress={uploadProgress} />
              </>
            ) : (
              <>
                <Upload size={32} style={{ color: 'var(--color-brand-400)', marginBottom: '12px' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Click to upload prescription</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>JPEG, PNG, PDF · Max 10MB</span>
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
                  {level === 'high' ? '≥ 85% — Ready to use' : level === 'medium' ? '60–84% — Review recommended' : '< 60% — Manual verification needed'}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Scan History Table */}
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Previous Scan Logs</h3>
            {selectedRxIds.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Badge variant="blue">{selectedRxIds.length} Selected</Badge>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<ArrowRightLeft size={14} />}
                  onClick={() => handleFindAlternatives(prescriptions.filter(p => selectedRxIds.includes(p.prescriptionId)))}
                >
                  Find Cheap Alternatives
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedRxIds([])}>Clear</Button>
              </div>
            )}
          </div>

          {selectedRxIds.length > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', background: 'linear-gradient(90deg, rgba(0,104,95,0.08), rgba(14,165,233,0.08))',
              border: '1px solid var(--color-brand-300)', borderRadius: 'var(--radius-md)', marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
                <Tag size={16} color="var(--color-brand-600)" />
                <span>Selected {selectedRxIds.length} Prescription(s) for Cost Savings Analysis</span>
              </div>
              <Button
                size="sm"
                variant="primary"
                icon={<ArrowRightLeft size={14} />}
                onClick={() => handleFindAlternatives(prescriptions.filter(p => selectedRxIds.includes(p.prescriptionId)))}
              >
                Find Cheap Alternatives ({selectedRxIds.length})
              </Button>
            </div>
          )}

          <Table columns={columns} data={prescriptions} loading={loading} keyExtractor={row => row.prescriptionId} />
        </Card>

        {/* Result Modal */}
        <Modal
          isOpen={!!selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
          title="OCR Extraction Results — Medical Prescription Pad"
          size="xl"
        >
          {selectedPrescription && (
            <PrescriptionResultModal
              key={selectedPrescription.prescriptionId}
              prescription={selectedPrescription}
              onClose={() => setSelectedPrescription(null)}
              onDelete={handleDeletePrescription}
              onUpdate={handleUpdatePrescription}
              onFindAlternatives={(rx) => handleFindAlternatives([rx])}
            />
          )}
        </Modal>
      </div>
    </div>
  );
};
