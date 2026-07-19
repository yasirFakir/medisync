import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Spinner, EmptyState, apiClient } from '@medisync/ui';
import { AlarmClock, Plus, Trash2, BellOff, Loader2 } from 'lucide-react';

interface MedicationAlert {
  alertId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  scheduledTime: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
}

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<MedicationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [scheduledTime, setScheduledTime] = useState('08:00');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/alerts');
      setAlerts(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch medication alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName || !dosage) return;

    setSaving(true);
    try {
      const res = await apiClient.post('/alerts', {
        medicineName,
        dosage,
        frequency,
        scheduledTime
      });
      setAlerts(prev => [...prev, res.data.data]);
      setIsModalOpen(false);
      // Reset form
      setMedicineName('');
      setDosage('');
      setFrequency('Once daily');
      setScheduledTime('08:00');
    } catch (err) {
      console.error('Failed to create alert', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await apiClient.delete(`/alerts/${alertId}`);
      setAlerts(prev => prev.filter(item => item.alertId !== alertId));
    } catch (err) {
      console.error('Failed to delete alert', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top action header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>My Medication Schedule</h3>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={16} />}>
          Schedule Reminder
        </Button>
      </div>

      {/* Grid List */}
      <div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}><Spinner size={32} /></div>
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={<AlarmClock size={28} />}
            title="No Dosage Reminders Set"
            description="You don't have any active medication alarms scheduled yet."
            action={<Button onClick={() => setIsModalOpen(true)} icon={<Plus size={16} />}>Schedule Reminder</Button>}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {alerts.map(item => (
              <Card key={item.alertId} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{item.medicineName}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.dosage}</span>
                  </div>
                  <Badge variant={item.status === 'ACTIVE' ? 'green' : 'yellow'}>
                    {item.status}
                  </Badge>
                </div>

                <div className="divider" />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Schedule</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <AlarmClock size={14} style={{ color: 'var(--color-brand-400)' }} />
                      {item.scheduledTime} ({item.frequency})
                    </div>
                  </div>

                  <Button size="sm" variant="ghost" onClick={() => handleDeleteAlert(item.alertId)} style={{ padding: '8px', color: 'var(--color-danger)' }}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Alert Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Dosage Reminder"
        size="sm"
      >
        <form onSubmit={handleCreateAlert} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input
            label="Medicine Brand Name"
            placeholder="e.g. Napa"
            value={medicineName}
            onChange={e => setMedicineName(e.target.value)}
            required
          />

          <Input
            label="Dosage Strength"
            placeholder="e.g. 500mg (1 Tablet)"
            value={dosage}
            onChange={e => setDosage(e.target.value)}
            required
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Frequency</label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 16px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            >
              <option value="Once daily">Once daily</option>
              <option value="Twice daily">Twice daily</option>
              <option value="Three times daily">Three times daily</option>
              <option value="Every 8 hours">Every 8 hours</option>
            </select>
          </div>

          <Input
            label="Daily Reminder Time"
            type="time"
            value={scheduledTime}
            onChange={e => setScheduledTime(e.target.value)}
            required
          />

          <Button type="submit" loading={saving} style={{ width: '100%', marginTop: '10px' }}>
            Save Reminder
          </Button>
        </form>
      </Modal>

    </div>
  );
};
