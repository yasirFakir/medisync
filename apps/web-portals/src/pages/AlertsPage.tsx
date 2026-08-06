import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Modal, Input, Spinner, EmptyState } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import {
  AlarmClock, Plus, Trash2, Bell, BellOff, Clock, Calendar, Pill,
  CheckCircle, AlertCircle, Check, XCircle, Heart, TrendingUp,
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

// ─── Colour Palette for Cards ─────────────────────────────────────────────────

const CARD_PALETTES = [
  { bg: '#eef6ff', border: '#bfdbfe', accent: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', light: '#dbeafe' },
  { bg: '#f0fdf4', border: '#bbf7d0', accent: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #06b6d4)', light: '#dcfce7' },
  { bg: '#fdf4ff', border: '#f0abfc', accent: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #ec4899)', light: '#fae8ff' },
  { bg: '#fff7ed', border: '#fed7aa', accent: '#f97316', gradient: 'linear-gradient(135deg, #f97316, #eab308)', light: '#ffedd5' },
  { bg: '#fef2f2', border: '#fecaca', accent: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #f97316)', light: '#fee2e2' },
  { bg: '#f0fdfa', border: '#99f6e4', accent: '#14b8a6', gradient: 'linear-gradient(135deg, #14b8a6, #06b6d4)', light: '#ccfbf1' },
  { bg: '#fefce8', border: '#fde68a', accent: '#eab308', gradient: 'linear-gradient(135deg, #eab308, #f97316)', light: '#fef9c3' },
  { bg: '#eff6ff', border: '#93c5fd', accent: '#2563eb', gradient: 'linear-gradient(135deg, #2563eb, #7c3aed)', light: '#dbeafe' },
];

const getPalette = (index: number) => CARD_PALETTES[index % CARD_PALETTES.length];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getNextDoseInfo = (scheduledTime: string, frequency: string): { label: string; minutes: number } => {
  const now = new Date();
  const [hh, mm] = scheduledTime.split(':').map(Number);

  const buildDate = (dayOffset = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hh, mm, 0, 0);
    return d;
  };

  const offsetsMinutes: Record<string, number[]> = {
    'Once daily': [0],
    'Twice daily': [0, 720],
    'Three times daily': [0, 480, 960],
    'Every 8 hours': [0, 480, 960],
  };

  const doseOffsets = offsetsMinutes[frequency] ?? [0];
  let nearest: Date | null = null;

  for (let day = 0; day <= 1; day++) {
    for (const off of doseOffsets) {
      const d = buildDate(day);
      d.setMinutes(d.getMinutes() + off);
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

const fmt12h = (t: string) => {
  if (!t) return t;
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const getDoseTimes = (scheduledTime: string, frequency: string): string[] => {
  const [hh, mm] = scheduledTime.split(':').map(Number);
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

// ─── Individual Alert Card (Professional & Colourful) ─────────────────────────
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
      className="animate-fade-in"
      style={{
        background: palette.bg,
        border: `1.5px solid ${palette.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
        opacity: item.status === 'ARCHIVED' ? 0.5 : 1,
        transition: 'all 0.3s ease',
        boxShadow: `0 4px 16px ${palette.accent}12`,
      }}
    >
      {/* Gradient top strip */}
      <div style={{
        background: isActive ? palette.gradient : '#e2e8f0',
        height: '5px',
        width: '100%',
      }} />

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Top row: icon + name + badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: isActive ? palette.gradient : '#e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: isActive ? `0 4px 12px ${palette.accent}30` : 'none',
            }}>
              <Pill size={20} color="#fff" />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', margin: 0 }}>
                {item.medicineName}
              </h4>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{item.dosage}</span>
            </div>
          </div>
          <Badge variant={isActive ? 'green' : item.status === 'SUSPENDED' ? 'yellow' : 'blue'}>
            {item.status}
          </Badge>
        </div>

        {/* Dose time pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={13} color="#94a3b8" />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{item.frequency}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {doseTimes.map((t, i) => (
              <span key={i} style={{
                padding: '4px 12px',
                borderRadius: '20px',
                background: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: palette.accent,
                display: 'flex', alignItems: 'center', gap: '4px',
                border: `1px solid ${palette.border}`,
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
            background: '#fff',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: `1px solid ${palette.border}`,
          }}>
            <AlarmClock size={16} style={{ color: countdown.minutes <= 30 ? '#ef4444' : palette.accent, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.5px' }}>NEXT DOSE</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: countdown.minutes <= 30 ? '#ef4444' : palette.accent }}>
                {fmt12h(item.scheduledTime)} — {countdown.label}
              </div>
            </div>
            {countdown.minutes <= 30 && (
              <span style={{
                fontSize: '0.6rem', fontWeight: 800, padding: '3px 8px',
                borderRadius: '20px', background: '#fef2f2', color: '#ef4444',
                letterSpacing: '0.5px',
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
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: '8px',
            border: '1px solid #bbf7d0',
          }}>
            <CheckCircle size={16} color="#22c55e" />
            <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
              ✓ Dose taken today
            </span>
          </div>
        )}

        {/* Suspended info */}
        {item.status === 'SUSPENDED' && (
          <div style={{
            background: '#fffbeb',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: '8px',
            border: '1px solid #fde68a',
          }}>
            <AlertCircle size={14} color="#f59e0b" />
            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 500 }}>
              Reminders paused — tap Resume to re-activate.
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Mark as Taken button */}
          {isActive && !takenToday && (
            <button
              onClick={() => onMarkTaken(item.alertId)}
              disabled={markingId === item.alertId}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '9px 12px',
                background: palette.gradient,
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: markingId === item.alertId ? 'not-allowed' : 'pointer',
                opacity: markingId === item.alertId ? 0.7 : 1,
                transition: 'opacity 0.2s',
                boxShadow: `0 3px 10px ${palette.accent}30`,
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
              padding: '9px 12px',
              background: '#f0fdf4',
              color: '#16a34a',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}>
              <CheckCircle size={14} />
              Taken Today ✓
            </div>
          )}

          {/* Suspend / Resume */}
          {item.status !== 'ARCHIVED' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggle(item.alertId, item.status)}
              icon={isActive ? <BellOff size={14} /> : <Bell size={14} />}
              style={{
                fontSize: '0.78rem',
                color: isActive ? '#d97706' : '#16a34a',
                border: isActive ? '1px solid #fde68a' : '1px solid #bbf7d0',
                borderRadius: '10px',
                background: isActive ? '#fffbeb' : '#f0fdf4',
                padding: '8px 12px',
              }}
            >
              {isActive ? 'Pause' : 'Resume'}
            </Button>
          )}

          <button
            onClick={() => onDelete(item.alertId)}
            style={{
              padding: '8px 10px',
              background: '#fef2f2',
              color: '#ef4444',
              border: '1px solid #fecaca',
              borderRadius: '10px',
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
    { label: 'Total Reminders', value: total, color: '#3b82f6', bg: '#eef6ff', border: '#bfdbfe', icon: <Pill size={18} /> },
    { label: 'Active', value: active, color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', icon: <Heart size={18} /> },
    { label: 'Taken Today', value: takenCount, color: '#14b8a6', bg: '#f0fdfa', border: '#99f6e4', icon: <CheckCircle size={18} /> },
    { label: 'Missed Today', value: missedCount, color: missedCount > 0 ? '#ef4444' : '#94a3b8', bg: missedCount > 0 ? '#fef2f2' : '#f8fafc', border: missedCount > 0 ? '#fecaca' : '#e2e8f0', icon: <XCircle size={18} /> },
    { label: 'Suspended', value: suspended, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: <BellOff size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {stats.map(stat => (
        <div
          key={stat.label}
          style={{
            flex: '1 1 130px',
            background: stat.bg,
            border: `1.5px solid ${stat.border}`,
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'transform 0.2s ease',
          }}
        >
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: stat.color,
            border: `1px solid ${stat.border}`,
          }}>
            {stat.icon}
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Missed Doses Bar ─────────────────────────────────────────────────────────
const MissedDosesBar: React.FC<{ alerts: MedicationAlert[]; takenAlertIds: Set<string> }> = ({ alerts, takenAlertIds }) => {
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const missedAlerts = activeAlerts.filter(a => !takenAlertIds.has(a.alertId));

  if (missedAlerts.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
        border: '1.5px solid #bbf7d0',
        borderRadius: '14px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: '#dcfce7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <TrendingUp size={20} color="#22c55e" />
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16a34a' }}>All doses taken today! 🎉</div>
          <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 500 }}>Great job keeping up with your medication schedule.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fef2f2, #fff1f2)',
      border: '1.5px solid #fecaca',
      borderRadius: '14px',
      padding: '16px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: '#fee2e2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertCircle size={18} color="#ef4444" />
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>
            {missedAlerts.length} medication{missedAlerts.length > 1 ? 's' : ''} not taken today
          </div>
          <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 500 }}>
            Please take your pending medicines or mark them as taken.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {missedAlerts.map(a => (
          <span key={a.alertId} style={{
            padding: '5px 14px',
            borderRadius: '20px',
            background: '#fff',
            border: '1px solid #fecaca',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#dc2626',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <XCircle size={12} />
            {a.medicineName} ({a.dosage})
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<MedicationAlert[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [scheduledTime, setScheduledTime] = useState('08:00');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, logsRes] = await Promise.all([
        apiClient.get('/alerts'),
        apiClient.get('/alerts/dose-logs?days=1').catch(() => ({ data: { data: [] } })),
      ]);
      setAlerts(alertsRes.data.data || []);
      setDoseLogs(logsRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch medication alerts', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Today's taken alert IDs — PostgreSQL DATE comes back as UTC ISO string,
  // so we convert to local date string for comparison.
  const today = todayStr();
  const toLocalDate = (d: string) => new Date(d).toLocaleDateString('en-CA'); // YYYY-MM-DD in local tz
  const takenAlertIds = new Set(
    doseLogs
      .filter(l => l.takenDate && toLocalDate(l.takenDate) === today)
      .map(l => l.alertId)
  );

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const takenCount = activeAlerts.filter(a => takenAlertIds.has(a.alertId)).length;
  const missedCount = activeAlerts.filter(a => !takenAlertIds.has(a.alertId)).length;

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName || !dosage) return;
    setSaving(true);
    try {
      const res = await apiClient.post('/alerts', { medicineName, dosage, frequency, scheduledTime });
      setAlerts(prev => [res.data.data, ...prev]);
      setIsModalOpen(false);
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
      // Find medicine info to add to log display
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            My Medication Schedule
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0', fontWeight: 500 }}>
            Set daily reminders, track doses, and stay on top of your medication.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={16} />}>
          Schedule Reminder
        </Button>
      </div>

      {/* Summary stats */}
      {!loading && alerts.length > 0 && (
        <SummaryBar alerts={alerts} takenCount={takenCount} missedCount={missedCount} />
      )}

      {/* Missed doses bar */}
      {!loading && activeAlerts.length > 0 && (
        <MissedDosesBar alerts={alerts} takenAlertIds={takenAlertIds} />
      )}

      {/* Alerts grid */}
      <div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <Spinner size={32} />
          </div>
        ) : displayAlerts.length === 0 ? (
          <EmptyState
            icon={<AlarmClock size={28} />}
            title="No Dosage Reminders Set"
            description="You don't have any active medication alarms scheduled yet."
            action={
              <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={16} />}>
                Schedule Reminder
              </Button>
            }
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {displayAlerts.map((item, index) => (
              <div key={item.alertId} style={{ opacity: togglingId === item.alertId ? 0.6 : 1, transition: 'opacity 0.2s' }}>
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

      {/* Create modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Dosage Reminder" size="sm">
        <form onSubmit={handleCreateAlert} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input
            label="Medicine Brand Name"
            placeholder="e.g. Napa"
            value={medicineName}
            onChange={e => setMedicineName(e.target.value)}
            style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px' }}
            required
          />

          <Input
            label="Dosage Strength"
            placeholder="e.g. 500mg (1 Tablet)"
            value={dosage}
            onChange={e => setDosage(e.target.value)}
            style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px' }}
            required
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>Frequency</label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 16px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                color: '#0f172a',
                outline: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <option value="Once daily" style={{ background: '#ffffff', color: '#0f172a' }}>Once daily</option>
              <option value="Twice daily" style={{ background: '#ffffff', color: '#0f172a' }}>Twice daily</option>
              <option value="Three times daily" style={{ background: '#ffffff', color: '#0f172a' }}>Three times daily</option>
              <option value="Every 8 hours" style={{ background: '#ffffff', color: '#0f172a' }}>Every 8 hours</option>
            </select>
          </div>

          <Input
            label="First Dose Time"
            type="time"
            value={scheduledTime}
            onChange={e => setScheduledTime(e.target.value)}
            style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px' }}
            required
          />

          {/* Preview of all dose times */}
          {scheduledTime && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, letterSpacing: '0.5px' }}>
                DAILY DOSE SCHEDULE PREVIEW
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {getDoseTimes(scheduledTime, frequency).map((t, i) => (
                  <span key={i} style={{
                    padding: '5px 14px',
                    borderRadius: '20px',
                    background: 'var(--color-brand-500)',
                    color: '#ffffff',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 6px rgba(14, 165, 233, 0.25)',
                  }}>
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
