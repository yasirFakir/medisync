import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Modal, Input, Spinner, EmptyState } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import {
  AlarmClock, Plus, Trash2, Bell, BellOff, Clock, Calendar, Pill,
  CheckCircle, AlertCircle, Check, XCircle, Heart, TrendingUp, FileText, CheckSquare, Square,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MedicationAlert {
  alertId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  scheduledTime: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
}

interface DoseLog {
  logId: string;
  alertId: string;
  takenDate: string;
  takenAt: string;
  medicineName: string;
  dosage: string;
}

interface PrescriptionMedicine {
  brandName: string;
  dosage: string;
  frequency: string;
  duration?: string;
}

interface Prescription {
  prescriptionId: string;
  doctorName?: string;
  createdAt: string;
  medicines: PrescriptionMedicine[];
  ocrResult?: {
    patient_name?: { value?: string };
    doctor_name?: { value?: string };
    medicines?: Array<{
      brand_name?: { value?: string };
      strength?: { value?: string };
      dosage?: { value?: string };
      frequency?: { value?: string };
    }>;
  };
}

// ─── Palette tailored to app theme (--color-brand variables & slate/teal palette) ──
const CARD_PALETTES = [
  { bg: 'var(--bg-elevated, #f8fafc)', border: 'var(--border-default, #e2e8f0)', accent: 'var(--color-brand-500, #0ea5e9)', gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)', light: '#e0f2fe' },
  { bg: 'var(--bg-elevated, #f8fafc)', border: 'var(--border-default, #e2e8f0)', accent: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)', light: '#d1fae5' },
  { bg: 'var(--bg-elevated, #f8fafc)', border: 'var(--border-default, #e2e8f0)', accent: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', light: '#ede9fe' },
  { bg: 'var(--bg-elevated, #f8fafc)', border: 'var(--border-default, #e2e8f0)', accent: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', light: '#fef3c7' },
];

const getPalette = (index: number) => CARD_PALETTES[index % CARD_PALETTES.length];

// ─── Medical Schedule Time Slot Ranges & Target Defaults ────────────────────────
// • Morning (Breakfast):  07:00 AM – 10:00 AM  (Target Default: 08:00 AM)
// • Midday  (Lunch):      12:00 PM – 03:00 PM  (Target Default: 01:00 PM / 13:00)
// • Evening (Dinner/Night): 07:00 PM – 10:00 PM  (Target Default: 08:00 PM / 20:00)

const SLOT_CONFIG = {
  morning: { label: 'Morning (7:00 AM - 10:00 AM)', time: '08:00', targetMins: 8 * 60 },
  lunch:   { label: 'Lunch (12:00 PM - 3:00 PM)',   time: '13:00', targetMins: 13 * 60 },
  dinner:  { label: 'Dinner (7:00 PM - 10:00 PM)',  time: '20:00', targetMins: 20 * 60 },
};

const fmt12h = (t: string) => {
  if (!t) return t;
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

/** Parses numeric e.g. "1+0+1", "0+1+0" or descriptive frequency string */
const getDoseTimes = (scheduledTime: string, frequency: string): string[] => {
  const normFreq = (frequency || '').trim();
  const digits = normFreq.replace(/\D/g, '');

  if (digits.length === 3) {
    const [m, l, d] = digits.split('').map(Number);
    const times: string[] = [];

    if (m > 0) times.push(`${fmt12h(SLOT_CONFIG.morning.time)} (7-10 AM)`);
    if (l > 0) times.push(`${fmt12h(SLOT_CONFIG.lunch.time)} (12-3 PM)`);
    if (d > 0) times.push(`${fmt12h(SLOT_CONFIG.dinner.time)} (7-10 PM)`);

    if (times.length > 0) return times;
  }

  const [hh, mm] = (scheduledTime || '08:00').split(':').map(Number);
  const base = hh * 60 + mm;
  const offsets: Record<string, number[]> = {
    'Once daily': [0],
    'Twice daily': [0, 720],
    'Three times daily': [0, 480, 960],
    'Every 8 hours': [0, 480, 960],
  };
  const offs = offsets[frequency] ?? [0];
  return offs.map(o => {
    const total = (base + o) % 1440;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return fmt12h(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  });
};

const getNextDoseInfo = (scheduledTime: string, frequency: string): { label: string; minutes: number } => {
  const now = new Date();
  const digits = (frequency || '').replace(/\D/g, '');

  let doseTimesInMinutes: number[] = [];

  if (digits.length === 3) {
    const [m, l, d] = digits.split('').map(Number);
    if (m > 0) doseTimesInMinutes.push(SLOT_CONFIG.morning.targetMins);
    if (l > 0) doseTimesInMinutes.push(SLOT_CONFIG.lunch.targetMins);
    if (d > 0) doseTimesInMinutes.push(SLOT_CONFIG.dinner.targetMins);
  } else {
    const [hh, mm] = (scheduledTime || '08:00').split(':').map(Number);
    const base = hh * 60 + mm;
    const offsets: Record<string, number[]> = {
      'Once daily': [0],
      'Twice daily': [0, 720],
      'Three times daily': [0, 480, 960],
      'Every 8 hours': [0, 480, 960],
    };
    const offs = offsets[frequency] ?? [0];
    doseTimesInMinutes = offs.map(o => (base + o) % 1440);
  }

  let nearest: Date | null = null;

  for (let day = 0; day <= 1; day++) {
    for (const mins of doseTimesInMinutes) {
      const d = new Date(now);
      d.setDate(d.getDate() + day);
      d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
      if (d > now && (!nearest || d < nearest)) nearest = d;
    }
  }

  if (!nearest) return { label: 'Soon', minutes: 0 };

  const diffMs = nearest.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffM = diffMin % 60;

  if (diffMin < 60) return { label: `in ${diffMin}m`, minutes: diffMin };
  return { label: `in ${diffH}h ${diffM}m`, minutes: diffMin };
};


const todayStr = () => new Date().toISOString().split('T')[0];

// ─── Countdown hook ───────────────────────────────────────────────────────────
const useCountdown = (scheduledTime: string, frequency: string, active: boolean) => {
  const [info, setInfo] = useState(() => getNextDoseInfo(scheduledTime, frequency));
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setInfo(getNextDoseInfo(scheduledTime, frequency)), 30000);
    return () => clearInterval(id);
  }, [scheduledTime, frequency, active]);
  return info;
};

// ─── Individual Alert Card ─────────────────────────────────────────────────────
const AlertCard: React.FC<{
  item: MedicationAlert;
  index: number;
  takenToday: boolean;
  onDelete: (id: string) => void;
  onToggle: (id: string, current: MedicationAlert['status']) => void;
  onMarkTaken: (id: string) => void;
  markingId: string | null;
}> = ({ item, index, takenToday, onDelete, onToggle, onMarkTaken, markingId }) => {
  const isActive = item.status === 'ACTIVE';
  const countdown = useCountdown(item.scheduledTime, item.frequency, isActive);
  const doseTimes = getDoseTimes(item.scheduledTime, item.frequency);
  const palette = getPalette(index);

  return (
    <div
      style={{
        background: 'var(--bg-elevated, #ffffff)',
        border: '1px solid var(--border-default, #e2e8f0)',
        borderRadius: '14px',
        overflow: 'hidden',
        opacity: item.status === 'ARCHIVED' ? 0.5 : 1,
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}
    >
      {/* Top accent strip matching brand theme */}
      <div style={{
        background: isActive ? palette.gradient : 'var(--border-default, #cbd5e1)',
        height: '4px',
        width: '100%',
      }} />

      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Top row: icon + name + badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: isActive ? palette.gradient : 'var(--border-default, #e2e8f0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Pill size={18} color="#fff" />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary, #0f172a)', margin: 0 }}>
                {item.medicineName}
              </h4>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', fontWeight: 500 }}>{item.dosage}</span>
            </div>
          </div>
          <Badge variant={isActive ? 'green' : item.status === 'SUSPENDED' ? 'yellow' : 'blue'}>
            {item.status}
          </Badge>
        </div>

        {/* Dose time pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={13} color="var(--text-secondary, #94a3b8)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', fontWeight: 600 }}>{item.frequency}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {doseTimes.map((t, i) => (
              <span key={i} style={{
                padding: '4px 10px',
                borderRadius: '8px',
                background: palette.light,
                fontSize: '0.75rem',
                fontWeight: 700,
                color: palette.accent,
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <Clock size={11} />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Next dose countdown */}
        {isActive && (
          <div style={{
            background: 'var(--bg-surface, #f8fafc)',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid var(--border-default, #e2e8f0)',
          }}>
            <AlarmClock size={16} style={{ color: countdown.minutes <= 30 ? '#ef4444' : palette.accent, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary, #94a3b8)', fontWeight: 700, letterSpacing: '0.5px' }}>NEXT DOSE</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: countdown.minutes <= 30 ? '#ef4444' : palette.accent }}>
                {fmt12h(item.scheduledTime)} — {countdown.label}
              </div>
            </div>
            {countdown.minutes <= 30 && (
              <span style={{
                fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px',
                borderRadius: '6px', background: '#fef2f2', color: '#ef4444',
              }}>
                SOON
              </span>
            )}
          </div>
        )}

        {/* Taken today indicator */}
        {isActive && takenToday && (
          <div style={{
            background: '#f0fdf4',
            borderRadius: '10px',
            padding: '8px 12px',
            display: 'flex', alignItems: 'center', gap: '8px',
            border: '1px solid #bbf7d0',
          }}>
            <CheckCircle size={15} color="#22c55e" />
            <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
              ✓ Dose taken today
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {isActive && !takenToday && (
            <button
              onClick={() => onMarkTaken(item.alertId)}
              disabled={markingId === item.alertId}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '8px 12px',
                background: palette.gradient,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: markingId === item.alertId ? 'not-allowed' : 'pointer',
                opacity: markingId === item.alertId ? 0.7 : 1,
              }}
            >
              <Check size={14} />
              {markingId === item.alertId ? 'Saving...' : "I've Taken This"}
            </button>
          )}

          {isActive && takenToday && (
            <div style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '8px 12px',
              background: '#f0fdf4',
              color: '#16a34a',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}>
              <CheckCircle size={14} />
              Taken Today ✓
            </div>
          )}

          {item.status !== 'ARCHIVED' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggle(item.alertId, item.status)}
              icon={isActive ? <BellOff size={14} /> : <Bell size={14} />}
              style={{
                fontSize: '0.75rem',
                color: isActive ? '#d97706' : '#16a34a',
                border: '1px solid var(--border-default, #e2e8f0)',
                borderRadius: '8px',
                padding: '6px 10px',
              }}
            >
              {isActive ? 'Pause' : 'Resume'}
            </Button>
          )}

          <button
            onClick={() => onDelete(item.alertId)}
            style={{
              padding: '6px 10px',
              background: 'var(--bg-surface, #f8fafc)',
              color: '#ef4444',
              border: '1px solid var(--border-default, #e2e8f0)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Summary Stats bar ────────────────────────────────────────────────────────
const SummaryBar: React.FC<{ alerts: MedicationAlert[]; takenCount: number; missedCount: number }> = ({ alerts, takenCount, missedCount }) => {
  const active = alerts.filter(a => a.status === 'ACTIVE').length;
  const suspended = alerts.filter(a => a.status === 'SUSPENDED').length;
  const total = alerts.length;

  const stats = [
    { label: 'Total Reminders', value: total, color: 'var(--color-brand-500, #0ea5e9)', icon: <Pill size={16} /> },
    { label: 'Active', value: active, color: '#10b981', icon: <Heart size={16} /> },
    { label: 'Taken Today', value: takenCount, color: '#14b8a6', icon: <CheckCircle size={16} /> },
    { label: 'Pending Today', value: missedCount, color: missedCount > 0 ? '#ef4444' : '#64748b', icon: <XCircle size={16} /> },
    { label: 'Suspended', value: suspended, color: '#f59e0b', icon: <BellOff size={16} /> },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
      {stats.map(stat => (
        <div
          key={stat.label}
          style={{
            background: 'var(--bg-elevated, #ffffff)',
            border: '1px solid var(--border-default, #e2e8f0)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{
            width: '34px', height: '34px', borderRadius: '8px',
            background: 'var(--bg-surface, #f8fafc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: stat.color,
            border: '1px solid var(--border-default, #e2e8f0)',
          }}>
            {stat.icon}
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #64748b)', fontWeight: 500, marginTop: '2px' }}>{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<MedicationAlert[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Custom schedule state
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [scheduledTime, setScheduledTime] = useState('08:00');

  // Prescription selection state
  const [selectedRxId, setSelectedRxId] = useState<string>('');
  const [selectedMeds, setSelectedMeds] = useState<{ [brandName: string]: boolean }>({});
  const [rxScheduledTimes, setRxScheduledTimes] = useState<{ [brandName: string]: string }>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, logsRes, rxRes] = await Promise.all([
        apiClient.get('/alerts'),
        apiClient.get('/alerts/dose-logs?days=1').catch(() => ({ data: { data: [] } })),
        apiClient.get('/prescriptions').catch(() => ({ data: { data: [] } })),
      ]);
      setAlerts(alertsRes.data.data || []);
      setDoseLogs(logsRes.data.data || []);
      setPrescriptions(rxRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch medication alerts or prescriptions', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const today = todayStr();
  const toLocalDate = (d: string) => new Date(d).toLocaleDateString('en-CA');
  const takenAlertIds = new Set(
    doseLogs
      .filter(l => l.takenDate && toLocalDate(l.takenDate) === today)
      .map(l => l.alertId)
  );

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const takenCount = activeAlerts.filter(a => takenAlertIds.has(a.alertId)).length;
  const missedCount = activeAlerts.filter(a => !takenAlertIds.has(a.alertId)).length;

  // Single Custom Alert Submit
  const handleCreateCustomAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName || !dosage) return;
    setSaving(true);
    try {
      const res = await apiClient.post('/alerts', { medicineName, dosage, frequency, scheduledTime });
      setAlerts(prev => [res.data.data, ...prev]);
      setIsCustomModalOpen(false);
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

  // Prescription Selection handler
  const handleSelectRx = (rxId: string) => {
    setSelectedRxId(rxId);
    const rx = prescriptions.find(p => p.prescriptionId === rxId);
    if (!rx) return;

    const medMap: { [brandName: string]: boolean } = {};
    const timeMap: { [brandName: string]: string } = {};

    const medsList = rx.medicines?.length ? rx.medicines : (rx.ocrResult?.medicines?.map(m => ({
      brandName: m.brand_name?.value || 'Unknown',
      dosage: m.strength?.value || m.dosage?.value || 'Standard',
      frequency: m.frequency?.value || 'Once daily',
    })) || []);

    medsList.forEach(m => {
      medMap[m.brandName] = true;
      timeMap[m.brandName] = '08:00';
    });

    setSelectedMeds(medMap);
    setRxScheduledTimes(timeMap);
  };

  // Batch create alerts from selected prescription
  const handleImportRxAlerts = async () => {
    const rx = prescriptions.find(p => p.prescriptionId === selectedRxId);
    if (!rx) return;

    const medsList = rx.medicines?.length ? rx.medicines : (rx.ocrResult?.medicines?.map(m => ({
      brandName: m.brand_name?.value || 'Unknown',
      dosage: m.strength?.value || m.dosage?.value || 'Standard',
      frequency: m.frequency?.value || 'Once daily',
    })) || []);

    const toImport = medsList.filter(m => selectedMeds[m.brandName]).map(m => ({
      medicineName: m.brandName,
      dosage: m.dosage || 'Standard',
      frequency: m.frequency || 'Once daily',
      scheduledTime: rxScheduledTimes[m.brandName] || '08:00',
    }));

    if (toImport.length === 0) return;

    setSaving(true);
    try {
      const res = await apiClient.post('/alerts', { alerts: toImport });
      const created = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
      setAlerts(prev => [...created, ...prev]);
      setIsRxModalOpen(false);
      setSelectedRxId('');
    } catch (err) {
      console.error('Failed to import prescription alerts', err);
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

  const handleToggleStatus = async (alertId: string, currentStatus: MedicationAlert['status']) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setTogglingId(alertId);
    try {
      await apiClient.patch(`/alerts/${alertId}`, { status: nextStatus });
      setAlerts(prev => prev.map(a => a.alertId === alertId ? { ...a, status: nextStatus } : a));
    } catch (err) {
      console.error('Failed to update alert status', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleMarkTaken = async (alertId: string) => {
    setMarkingId(alertId);
    try {
      const res = await apiClient.post(`/alerts/${alertId}/taken`, { date: todayStr() });
      const log = res.data.data;
      const alert = alerts.find(a => a.alertId === alertId);
      setDoseLogs(prev => [...prev, {
        logId: log.logId,
        alertId: log.alertId,
        takenDate: log.takenDate,
        takenAt: log.takenAt,
        medicineName: alert?.medicineName || '',
        dosage: alert?.dosage || '',
      }]);
    } catch (err) {
      console.error('Failed to mark dose as taken', err);
    } finally {
      setMarkingId(null);
    }
  };

  const displayAlerts = alerts.filter(a => a.status !== 'ARCHIVED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ minWidth: '240px', flex: '1 1 auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
            My Medication Schedule
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 500 }}>
            Sync schedules directly from digitised prescriptions or set custom reminders.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={() => setIsRxModalOpen(true)}
            icon={<FileText size={16} />}
          >
            Follow Prescription
          </Button>
          <Button
            onClick={() => setIsCustomModalOpen(true)}
            icon={<Plus size={16} />}
          >
            Custom Schedule
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      {!loading && alerts.length > 0 && (
        <SummaryBar alerts={alerts} takenCount={takenCount} missedCount={missedCount} />
      )}

      {/* Alerts grid */}
      <div style={{ width: '100%', boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <Spinner size={32} />
          </div>
        ) : displayAlerts.length === 0 ? (
          <EmptyState
            icon={<AlarmClock size={28} />}
            title="No Dosage Reminders Set"
            description="You don't have any medication reminders scheduled. Import from your prescriptions or create a custom schedule."
            action={
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button variant="secondary" onClick={() => setIsRxModalOpen(true)} icon={<FileText size={16} />}>
                  Follow Prescription
                </Button>
                <Button onClick={() => setIsCustomModalOpen(true)} icon={<Plus size={16} />}>

                  Custom Schedule
                </Button>
              </div>
            }
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
            {displayAlerts.map((item, index) => (
              <div key={item.alertId} style={{ opacity: togglingId === item.alertId ? 0.6 : 1, transition: 'opacity 0.2s', minWidth: 0 }}>
                <AlertCard
                  item={item}
                  index={index}
                  takenToday={takenAlertIds.has(item.alertId)}
                  onDelete={handleDeleteAlert}
                  onToggle={handleToggleStatus}
                  onMarkTaken={handleMarkTaken}
                  markingId={markingId}
                />
              </div>
            ))}
          </div>

        )}
      </div>

      {/* ── 1. FOLLOW PRESCRIPTION MODAL ────────────────────────────────────── */}
      <Modal isOpen={isRxModalOpen} onClose={() => setIsRxModalOpen(false)} title="Import Schedule from Prescription" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Select Digitised Prescription
            </label>
            {prescriptions.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No prescriptions available. Upload a prescription first in the Prescriptions tab.</p>
            ) : (
              <select
                value={selectedRxId}
                onChange={e => handleSelectRx(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '0.85rem',
                  border: '1px solid var(--border-default)', borderRadius: '8px',
                  background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600,
                  outline: 'none',
                }}
              >
                <option value="">-- Select Prescription --</option>
                {prescriptions.map(p => (
                  <option key={p.prescriptionId} value={p.prescriptionId}>
                    Rx #{p.prescriptionId.substring(0, 8)} — Dr. {p.doctorName || p.ocrResult?.doctor_name?.value || 'Prescriber'} ({new Date(p.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Prescription Medicines Checklist */}
          {selectedRxId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-surface, #f8fafc)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Select Medicines to Schedule
              </span>
              {(() => {
                const rx = prescriptions.find(p => p.prescriptionId === selectedRxId);
                const meds = rx?.medicines?.length ? rx.medicines : (rx?.ocrResult?.medicines?.map(m => ({
                  brandName: m.brand_name?.value || 'Unknown',
                  dosage: m.strength?.value || m.dosage?.value || 'Standard',
                  frequency: m.frequency?.value || 'Once daily',
                })) || []);

                return meds.map((med, idx) => {
                  const isChecked = selectedMeds[med.brandName] ?? true;
                  return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                      padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                      borderRadius: '8px',
                    }}>
                      <div
                        onClick={() => setSelectedMeds(p => ({ ...p, [med.brandName]: !isChecked }))}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
                      >
                        {isChecked ? <CheckSquare size={18} color="var(--color-brand-500)" /> : <Square size={18} color="var(--text-secondary)" />}
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{med.brandName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{med.dosage} • {med.frequency}</div>
                        </div>
                      </div>

                      {/* Scheduled Time input for this medicine */}
                      {isChecked && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} color="var(--text-secondary)" />
                          <input
                            type="time"
                            value={rxScheduledTimes[med.brandName] || '08:00'}
                            onChange={e => setRxScheduledTimes(p => ({ ...p, [med.brandName]: e.target.value }))}
                            style={{
                              padding: '4px 8px', fontSize: '0.8rem', border: '1px solid var(--border-default)',
                              borderRadius: '6px', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 600,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => setIsRxModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleImportRxAlerts}
              disabled={!selectedRxId || saving}
              loading={saving}
            >
              Set Selected Reminders
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── 2. CUSTOM SCHEDULE REMINDER MODAL ────────────────────────────────── */}
      <Modal isOpen={isCustomModalOpen} onClose={() => setIsCustomModalOpen(false)} title="Schedule Custom Dosage Reminder" size="sm">
        <form onSubmit={handleCreateCustomAlert} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Medicine Brand Name"
            placeholder="e.g. Napa"
            value={medicineName}
            onChange={e => setMedicineName(e.target.value)}
            required
          />

          <Input
            label="Dosage Strength"
            placeholder="e.g. 500mg"
            value={dosage}
            onChange={e => setDosage(e.target.value)}
            required
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Frequency</label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)', borderRadius: '8px',
                color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem', fontWeight: 500,
              }}
            >
              <option value="Once daily">Once daily</option>
              <option value="Twice daily">Twice daily</option>
              <option value="Three times daily">Three times daily</option>
              <option value="Every 8 hours">Every 8 hours</option>
            </select>
          </div>

          <Input
            label="First Dose Time"
            type="time"
            value={scheduledTime}
            onChange={e => setScheduledTime(e.target.value)}
            required
          />

          {scheduledTime && (
            <div style={{
              background: 'var(--bg-surface, #f8fafc)', border: '1px solid var(--border-default)',
              borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>PREVIEW SCHEDULE</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {getDoseTimes(scheduledTime, frequency).map((t, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--color-brand-500)', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" loading={saving} style={{ width: '100%', marginTop: '8px' }}>
            Save Reminder
          </Button>
        </form>
      </Modal>
    </div>
  );
};
