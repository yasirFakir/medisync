import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Badge, Spinner } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { Upload, Eye, FileDigit, Calendar, FlaskConical } from 'lucide-react';

interface Medicine {
  brandName: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

interface Prescription {
  prescriptionId: string;
  digitizedNotes: string;
  medicines: Medicine[];
  createdAt: string;
}

export const PrescriptionsPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [error, setError] = useState('');

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/prescriptions/digitize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPrescriptions(prev => [res.data.data, ...prev]);
      setSelectedPrescription(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'OCR Digitization failed. Please verify the image formatting.');
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      key: 'createdAt',
      label: 'Upload Date',
      render: (val: any) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          {new Date(val).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      )
    },
    {
      key: 'medicines',
      label: 'Identified Medicines',
      render: (val: any) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {(val as Medicine[]).slice(0, 3).map((med, i) => (
            <Badge key={i} variant="blue">{med.brandName}</Badge>
          ))}
          {(val as Medicine[]).length > 3 && (
            <Badge variant="purple">+{(val as Medicine[]).length - 3} more</Badge>
          )}
        </div>
      )
    },
    {
      key: 'prescriptionId',
      label: 'Actions',
      render: (_val: any, row: Prescription) => (
        <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => setSelectedPrescription(row)}>
          View Digitized Data
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px', alignItems: 'start' }}>
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Scan Prescription</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Upload an image of your prescription to scan salts using OCR engines.
          </p>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '0.75rem' }}>
              {error}
            </div>
          )}

          <label style={{
            border: '2px dashed var(--border-strong)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'background 0.2s',
            background: uploading ? 'rgba(14,165,233,0.04)' : 'transparent',
          }}>
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
            {uploading ? (
              <>
                <Spinner size={32} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: '12px' }}>Digitizing Prescription...</span>
              </>
            ) : (
              <>
                <Upload size={32} style={{ color: 'var(--color-brand-400)', marginBottom: '12px' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Click to upload file</span>
              </>
            )}
          </label>
        </Card>

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

      <Modal
        isOpen={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        title="Digitized Medical Assessment"
        size="lg"
      >
        {selectedPrescription && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Extracted Metadata Summary</h4>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--text-primary)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                {selectedPrescription.digitizedNotes || 'No custom OCR summary generated.'}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Scanned Medication Schedule</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedPrescription.medicines.map((med, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)'
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

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button size="sm" variant="secondary" icon={<FlaskConical size={12} />} onClick={() => window.location.href = `/locator?saltComposition=${med.brandName}`}>
                        Find Substitutes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
