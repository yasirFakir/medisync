import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Modal, Input, Spinner, EmptyState } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import {
  AlarmClock, Plus, Trash2, Bell, BellOff, Clock, Calendar, Pill,
  CheckCircle, AlertCircle, Check, XCircle, Heart, TrendingUp, FileText, CheckSquare, Square,
  Sparkles, Sun, Moon, Sunset, Coffee, AlertTriangle, ChevronRight, Edit3
} from 'lucide-react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

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
  slotName?: string;
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

export interface DoseSlotConfig {
  slotName: 'Morning' | 'Noon' | 'Night' | 'Bedtime';
  doseCount: number;
  defaultTime: string;
  customTime: string;
}

// Helper to format 24h string to 12h AM/PM
export const fmt12h = (timeStr: string): string => {
  if (!timeStr || typeof timeStr !== 'string') return '';

  // If timeStr contains comma-separated times (e.g. "08:00, 20:00"), format each
  if (timeStr.includes(',')) {
    return timeStr
      .split(',')
      .map(t => fmt12h(t.trim()))
      .filter(Boolean)
      .join(', ');
  }

  const clean = timeStr.trim();
  if (!clean) return '';

  // If already formatted with AM/PM (e.g. "08:00 AM", "8:00pm", "8 AM")
  const amPmMatch = clean.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)$/i);
  if (amPmMatch) {
    const rawH = parseInt(amPmMatch[1], 10);
    const rawM = amPmMatch[2] ? parseInt(amPmMatch[2], 10) : 0;
    const period = amPmMatch[3].toUpperCase();
    if (!isNaN(rawH)) {
      const h12 = rawH > 12 ? rawH % 12 || 12 : rawH === 0 ? 12 : rawH;
      const mStr = isNaN(rawM) ? '00' : String(Math.min(Math.max(rawM, 0), 59)).padStart(2, '0');
      return `${h12}:${mStr} ${period}`;
    }
  }

  // Standard 24h or HH:MM or HH:MM:SS or H format (e.g. "08:00", "20:00", "8:00", "8")
  const parts = clean.split(':');
  const h = parseInt(parts[0], 10);
  const m = parts.length > 1 ? parseInt(parts[1], 10) : 0;

  if (isNaN(h)) return clean;
  const safeM = isNaN(m) ? 0 : Math.min(Math.max(m, 0), 59);

  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(safeM).padStart(2, '0')} ${ampm}`;
};

// ─── Prescription Frequency Parser ────────────────────────────────────────────
export const parseFrequencySlots = (freqStr: string, scheduledTimeStr?: string): DoseSlotConfig[] => {
  const norm = (freqStr || '').trim();
  const times = (scheduledTimeStr || '').split(',').map(t => t.trim()).filter(Boolean);
  const matches = norm.match(/\d+/g);

  const slotTemplates = [
    { name: 'Morning' as const, defaultTime: '08:00' },
    { name: 'Noon' as const, defaultTime: '13:00' },
    { name: 'Night' as const, defaultTime: '20:00' },
    { name: 'Bedtime' as const, defaultTime: '22:00' }
  ];

  if (matches && matches.length >= 2) {
    const slots: DoseSlotConfig[] = [];
    let timeIdx = 0;
    matches.forEach((valStr, idx) => {
      const count = parseInt(valStr, 10);
      if (count > 0 && idx < slotTemplates.length) {
        const chosen = times[timeIdx] || slotTemplates[idx].defaultTime;
        slots.push({
          slotName: slotTemplates[idx].name,
          doseCount: count,
          defaultTime: slotTemplates[idx].defaultTime,
          customTime: chosen
        });
        timeIdx++;
      }
    });

    if (slots.length > 0) return slots;
  }

  // Text fallbacks e.g. "Twice daily", "Three times daily"
  const lower = norm.toLowerCase();
  if (lower.includes('twice') || lower.includes('2 times')) {
    return [
      { slotName: 'Morning', doseCount: 1, defaultTime: '08:00', customTime: times[0] || '08:00' },
      { slotName: 'Night', doseCount: 1, defaultTime: '20:00', customTime: times[1] || '20:00' }
    ];
  }
  if (lower.includes('three') || lower.includes('3 times') || lower.includes('tds')) {
    return [
      { slotName: 'Morning', doseCount: 1, defaultTime: '08:00', customTime: times[0] || '08:00' },
      { slotName: 'Noon', doseCount: 1, defaultTime: '13:00', customTime: times[1] || '13:00' },
      { slotName: 'Night', doseCount: 1, defaultTime: '20:00', customTime: times[2] || '20:00' }
    ];
  }

  // Default: Morning 8:00 AM
  return [
    { slotName: 'Morning', doseCount: 1, defaultTime: '08:00', customTime: times[0] || '08:00' }
  ];
};

const getSlotIcon = (slotName: string) => {
  switch (slotName) {
    case 'Morning': return <Sun className="w-3.5 h-3.5 text-amber-500" />;
    case 'Noon': return <Coffee className="w-3.5 h-3.5 text-orange-500" />;
    case 'Night': return <Sunset className="w-3.5 h-3.5 text-indigo-500" />;
    case 'Bedtime': return <Moon className="w-3.5 h-3.5 text-[#8B5CF6]" />;
    default: return <Clock className="w-3.5 h-3.5 text-primary" />;
  }
};

const todayStr = () => new Date().toISOString().split('T')[0];

const getNextDoseCountdown = (scheduledTime: string): { label: string; minutes: number } => {
  if (!scheduledTime) return { label: 'Scheduled', minutes: 999 };
  const allTimes = scheduledTime.split(',').map(t => t.trim()).filter(Boolean);
  if (allTimes.length === 0) return { label: 'Scheduled', minutes: 999 };

  const now = new Date();
  let nearestDiffMin = Infinity;

  allTimes.forEach(timeStr => {
    const parts = timeStr.split(':');
    const hh = parseInt(parts[0], 10);
    const mm = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    if (isNaN(hh)) return;
    const safeMm = isNaN(mm) ? 0 : Math.min(Math.max(mm, 0), 59);

    let target = new Date(now);
    target.setHours(hh, safeMm, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    const diffMs = target.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < nearestDiffMin) {
      nearestDiffMin = diffMin;
    }
  });

  if (nearestDiffMin === Infinity) return { label: 'Scheduled', minutes: 999 };

  const diffH = Math.floor(nearestDiffMin / 60);
  const diffM = nearestDiffMin % 60;

  if (nearestDiffMin < 60) return { label: `in ${nearestDiffMin}m`, minutes: nearestDiffMin };
  return { label: `in ${diffH}h ${diffM}m`, minutes: nearestDiffMin };
};

// ─── Alert Card Component ──────────────────────────────────────────────────────
const AlertCard: React.FC<{
  item: MedicationAlert;
  index: number;
  takenSlotsSet: Set<string>;
  onEdit: (item: MedicationAlert) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, current: MedicationAlert['status']) => void;
  onMarkTaken: (id: string, slotName: string) => void;
  markingKey: string | null;
}> = ({ item, takenSlotsSet, onEdit, onDelete, onToggle, onMarkTaken, markingKey }) => {
  const isActive = item.status === 'ACTIVE';
  const countdown = getNextDoseCountdown(item.scheduledTime);
  const slots = parseFrequencySlots(item.frequency, item.scheduledTime);

  const allSlotsTaken = slots.length > 0 && slots.every(s => takenSlotsSet.has(`${item.alertId}_${s.slotName}`));

  return (
    <div
      className={`bg-surface-container-lowest border rounded-xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4 ${
        isActive
          ? 'border-outline-variant/30 hover:border-primary/40 hover:shadow-md'
          : 'border-outline-variant/20 opacity-60 bg-surface-container-low'
      }`}
    >
      <div className="space-y-3">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-headline-md text-base font-bold text-on-surface">
                {item.medicineName}
              </h4>
              <p className="text-xs text-on-surface-variant font-medium">
                {item.dosage}
              </p>
            </div>
          </div>

          <Badge variant={isActive ? 'green' : item.status === 'SUSPENDED' ? 'yellow' : 'blue'}>
            {item.status}
          </Badge>
        </div>

        {/* Frequency & Granular Dose Slots */}
        <div className="space-y-2 pt-1 border-t border-outline-variant/20">
          <div className="flex items-center justify-between text-xs">
            <span className="text-on-surface-variant font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Frequency: <strong className="text-on-surface">{item.frequency}</strong>
            </span>
          </div>

          {/* Individual Slot Cards with Independent Taken Actions */}
          <div className="space-y-2 pt-1">
            {slots.map((slot, sIdx) => {
              const slotKey = `${item.alertId}_${slot.slotName}`;
              const isSlotTaken = takenSlotsSet.has(slotKey);
              const isMarkingThis = markingKey === slotKey;

              return (
                <div
                  key={sIdx}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${
                    isSlotTaken
                      ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#047857]'
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getSlotIcon(slot.slotName)}
                    <div>
                      <span className="font-bold">{slot.slotName} ({fmt12h(slot.customTime)})</span>
                      <span className="text-[10px] text-on-surface-variant ml-1.5">
                        {slot.doseCount} {slot.doseCount > 1 ? 'doses' : 'dose'}
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <div>
                      {isSlotTaken ? (
                        <span className="bg-[#10B981]/20 text-[#047857] px-2 py-0.5 rounded font-extrabold text-[11px] flex items-center gap-1">
                          <Check size={12} /> Taken
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onMarkTaken(item.alertId, slot.slotName)}
                          disabled={isMarkingThis}
                          className="bg-primary text-on-primary px-2.5 py-1 rounded text-[11px] font-bold hover:bg-primary/90 transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Check size={12} /> {isMarkingThis ? 'Saving...' : 'Mark Taken'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Countdown Banner */}
        {isActive && !allSlotsTaken && (
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <AlarmClock className={`w-4 h-4 ${countdown.minutes <= 30 ? 'text-red-500 animate-bounce' : 'text-primary'}`} />
              <div>
                <div className="text-[10px] uppercase font-bold text-outline">Next Dose</div>
                <div className={`font-bold ${countdown.minutes <= 30 ? 'text-red-500' : 'text-on-surface'}`}>
                  {fmt12h(item.scheduledTime)} ({countdown.label})
                </div>
              </div>
            </div>

            {countdown.minutes <= 30 && (
              <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-extrabold text-[10px]">
                DUE SOON
              </span>
            )}
          </div>
        )}

        {/* All Doses Taken Today Banner */}
        {isActive && allSlotsTaken && (
          <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg p-2.5 flex items-center gap-2 text-xs text-[#047857] font-bold">
            <CheckCircle className="w-4 h-4 fill-[#10B981] text-white" />
            <span>✓ All daily doses recorded for today</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-outline-variant/20">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-outline-variant/20 flex items-center gap-1 text-xs font-bold"
          title="Edit Reminder & Time"
        >
          <Edit3 size={14} /> Edit
        </button>

        {item.status !== 'ARCHIVED' && (
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => onToggle(item.alertId, item.status)}
            icon={isActive ? <BellOff size={14} /> : <Bell size={14} />}
          >
            {isActive ? 'Pause' : 'Resume'}
          </Button>
        )}

        <button
          type="button"
          onClick={() => onDelete(item.alertId)}
          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-outline-variant/20"
          title="Delete Reminder"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── Main Alerts Page ──────────────────────────────────────────────────────────
export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<MedicationAlert[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<MedicationAlert | null>(null);

  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [markingKey, setMarkingKey] = useState<string | null>(null);

  // Custom schedule state
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('1+0+1');
  const [customSlots, setCustomSlots] = useState<DoseSlotConfig[]>(parseFrequencySlots('1+0+1'));

  // Edit schedule state
  const [editMedName, setEditMedName] = useState('');
  const [editDosage, setEditDosage] = useState('');
  const [editFrequency, setEditFrequency] = useState('');
  const [editSlots, setEditSlots] = useState<DoseSlotConfig[]>([]);

  // Prescription selection state
  const [selectedRxId, setSelectedRxId] = useState<string>('');
  const [selectedMeds, setSelectedMeds] = useState<{ [brandName: string]: boolean }>({});
  const [rxSlotTimes, setRxSlotTimes] = useState<{ [brandName: string]: { [slotName: string]: string } }>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, logsRes, rxRes] = await Promise.all([
        apiClient.get('/alerts'),
        apiClient.get('/alerts/dose-logs?days=1').catch(() => ({ data: { data: [] } })),
        apiClient.get('/prescriptions').catch(() => ({ data: { data: [] } })),
      ]);
      setAlerts(Array.isArray(alertsRes.data?.data) ? alertsRes.data.data : []);
      setDoseLogs(Array.isArray(logsRes.data?.data) ? logsRes.data.data : []);
      setPrescriptions(Array.isArray(rxRes.data?.data) ? rxRes.data.data : []);
    } catch (err) {
      console.error('Failed to fetch medication alerts or prescriptions', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const today = todayStr();
  const toLocalDate = (d: string) => new Date(d).toLocaleDateString('en-CA');
  
  // Track taken status PER SLOT (e.g. alertId_Morning, alertId_Night)
  const takenSlotsSet = new Set(
    doseLogs
      .filter(l => l.takenDate && toLocalDate(l.takenDate) === today)
      .map(l => `${l.alertId}_${l.slotName || 'Morning'}`)
  );

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const takenCount = doseLogs.filter(l => l.takenDate && toLocalDate(l.takenDate) === today).length;

  // Single Custom Alert Submit
  const handleCreateCustomAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName || !dosage) return;
    setSaving(true);
    try {
      const combinedTimes = customSlots.map(s => s.customTime).join(',');
      const res = await apiClient.post('/alerts', {
        medicineName,
        dosage,
        frequency,
        scheduledTime: combinedTimes || '08:00'
      });
      setAlerts(prev => [res.data.data, ...prev]);
      setIsCustomModalOpen(false);
      setMedicineName('');
      setDosage('');
      setFrequency('1+0+1');
    } catch (err) {
      console.error('Failed to create alert', err);
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal for an alert
  const handleOpenEdit = (item: MedicationAlert) => {
    setEditingAlert(item);
    setEditMedName(item.medicineName);
    setEditDosage(item.dosage);
    setEditFrequency(item.frequency);
    const parsed = parseFrequencySlots(item.frequency, item.scheduledTime);
    setEditSlots(parsed);
    setIsEditModalOpen(true);
  };

  // Save Edit Alert Submit
  const handleUpdateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlert || !editMedName || !editDosage) return;
    setSaving(true);
    try {
      const combinedTimes = editSlots.map(s => s.customTime).join(',');
      const res = await apiClient.patch(`/alerts/${editingAlert.alertId}`, {
        medicineName: editMedName,
        dosage: editDosage,
        frequency: editFrequency,
        scheduledTime: combinedTimes || '08:00'
      });

      const updated = res.data?.data;
      if (updated) {
        setAlerts(prev => prev.map(a => a.alertId === editingAlert.alertId ? { ...a, ...updated } : a));
      }
      setIsEditModalOpen(false);
      setEditingAlert(null);
    } catch (err) {
      console.error('Failed to update alert', err);
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
    const slotTimesMap: { [brandName: string]: { [slotName: string]: string } } = {};

    const medsList = rx.medicines?.length ? rx.medicines : (rx.ocrResult?.medicines?.map(m => ({
      brandName: m.brand_name?.value || 'Unknown',
      dosage: m.strength?.value || m.dosage?.value || 'Standard',
      frequency: m.frequency?.value || '1+0+1',
    })) || []);

    medsList.forEach(m => {
      medMap[m.brandName] = true;
      const slots = parseFrequencySlots(m.frequency || '1+0+1');
      const timeSlotsForMed: { [slotName: string]: string } = {};
      slots.forEach(s => {
        timeSlotsForMed[s.slotName] = s.defaultTime;
      });
      slotTimesMap[m.brandName] = timeSlotsForMed;
    });

    setSelectedMeds(medMap);
    setRxSlotTimes(slotTimesMap);
  };

  // Batch create alerts from selected prescription
  const handleImportRxAlerts = async () => {
    const rx = prescriptions.find(p => p.prescriptionId === selectedRxId);
    if (!rx) return;

    const medsList = rx.medicines?.length ? rx.medicines : (rx.ocrResult?.medicines?.map(m => ({
      brandName: m.brand_name?.value || 'Unknown',
      dosage: m.strength?.value || m.dosage?.value || 'Standard',
      frequency: m.frequency?.value || '1+0+1',
    })) || []);

    const toImport: Array<{ medicineName: string; dosage: string; frequency: string; scheduledTime: string }> = [];

    medsList.forEach(m => {
      if (selectedMeds[m.brandName]) {
        const slots = parseFrequencySlots(m.frequency || '1+0+1');
        const medTimes = rxSlotTimes[m.brandName] || {};
        const chosenTimesList = slots.map(slot => medTimes[slot.slotName] || slot.defaultTime);
        
        toImport.push({
          medicineName: m.brandName,
          dosage: m.dosage || 'Standard',
          frequency: m.frequency || '1+0+1',
          scheduledTime: chosenTimesList.join(',')
        });
      }
    });

    if (toImport.length === 0) return;

    setSaving(true);
    try {
      const res = await apiClient.post('/alerts', { alerts: toImport });
      const created = Array.isArray(res.data?.data) ? res.data.data : [res.data?.data];
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

  // Mark specific slot (Morning, Noon, Night) as taken
  const handleMarkTaken = async (alertId: string, slotName: string) => {
    const key = `${alertId}_${slotName}`;
    setMarkingKey(key);
    try {
      const res = await apiClient.post(`/alerts/${alertId}/taken`, { date: todayStr(), slotName });
      const log = res.data?.data;
      const alert = alerts.find(a => a.alertId === alertId);
      if (log) {
        setDoseLogs(prev => [...prev, {
          logId: log.logId,
          alertId: log.alertId,
          takenDate: log.takenDate,
          takenAt: log.takenAt,
          slotName: log.slotName || slotName,
          medicineName: alert?.medicineName || '',
          dosage: alert?.dosage || '',
        }]);
      }
    } catch (err) {
      console.error('Failed to mark dose as taken', err);
    } finally {
      setMarkingKey(null);
    }
  };

  const displayAlerts = alerts.filter(a => a.status !== 'ARCHIVED');

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto space-y-6">
      
      {/* ── Page Header Banner ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Active Selection</span>
            <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
            <span className="font-label-sm text-label-sm text-primary font-bold">Medication Reminders & Dose Alarms</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-extrabold tracking-tight">
            Medication Alarms & Dosage Schedule
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 max-w-2xl">
            Automatically set medication alarms from prescription frequencies (e.g. 1+0+1) with customizable morning, noon, and night dose timings.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* ── Summary Stats Bento Grid ─────────────────────────────────────────── */}
      {!loading && alerts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Pill size={20} />
            </div>
            <div>
              <div className="text-xl font-black text-on-surface">{alerts.length}</div>
              <div className="text-[11px] font-semibold text-on-surface-variant">Total Alarms</div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center flex-shrink-0">
              <Heart size={20} />
            </div>
            <div>
              <div className="text-xl font-black text-on-surface">{activeAlerts.length}</div>
              <div className="text-[11px] font-semibold text-on-surface-variant">Active Alarms</div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center flex-shrink-0">
              <CheckCircle size={20} />
            </div>
            <div>
              <div className="text-xl font-black text-on-surface">{takenCount}</div>
              <div className="text-[11px] font-semibold text-on-surface-variant">Doses Taken Today</div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
              <AlarmClock size={20} />
            </div>
            <div>
              <div className="text-xl font-black text-on-surface">{alerts.length}</div>
              <div className="text-[11px] font-semibold text-on-surface-variant">Scheduled Alarms</div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
              <BellOff size={20} />
            </div>
            <div>
              <div className="text-xl font-black text-on-surface">{alerts.length - activeAlerts.length}</div>
              <div className="text-[11px] font-semibold text-on-surface-variant">Paused</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Reminders Grid ────────────────────────────────────────────── */}
      <div>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={32} /></div>
        ) : displayAlerts.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-10 border border-dashed border-outline-variant/40 text-center space-y-4">
            <AlarmClock className="w-12 h-12 text-primary mx-auto opacity-70" />
            <h4 className="text-base font-bold text-on-surface">No Dosage Reminders Scheduled</h4>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Follow a prescription to parse frequency patterns (like 1+0+1) or create custom medication alarms with customizable dose times.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="secondary" onClick={() => setIsRxModalOpen(true)} icon={<FileText size={16} />}>
                Follow Prescription
              </Button>
              <Button onClick={() => setIsCustomModalOpen(true)} icon={<Plus size={16} />}>
                Custom Schedule
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayAlerts.map((item, index) => (
              <AlertCard
                key={item.alertId}
                item={item}
                index={index}
                takenSlotsSet={takenSlotsSet}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteAlert}
                onToggle={handleToggleStatus}
                onMarkTaken={handleMarkTaken}
                markingKey={markingKey}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL 1: EDIT MEDICATION REMINDER MODAL ────────────────────────────── */}
      {isEditModalOpen && editingAlert && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingAlert(null);
          }}
          title={`Edit Reminder: ${editingAlert.medicineName}`}
          size="md"
        >
          <form onSubmit={handleUpdateAlert} className="space-y-4">
            <Input
              label="Medicine Brand Name"
              value={editMedName}
              onChange={e => setEditMedName(e.target.value)}
              required
            />

            <Input
              label="Dosage Strength"
              value={editDosage}
              onChange={e => setEditDosage(e.target.value)}
              required
            />

            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">
                Frequency Pattern (e.g. 1+0+1, 1+1+1)
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-semibold text-on-surface outline-none focus:border-primary transition-all"
                value={editFrequency}
                onChange={e => {
                  setEditFrequency(e.target.value);
                  const parsed = parseFrequencySlots(e.target.value, editSlots.map(s => s.customTime).join(','));
                  setEditSlots(parsed);
                }}
              />
            </div>

            {/* Custom Time per Dose Slot in Edit Modal */}
            {editSlots.length > 0 && (
              <div className="space-y-2 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30">
                <div className="text-xs font-bold text-on-surface flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>Customize Dose Scheduled Times:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {editSlots.map((slot, idx) => (
                    <div key={idx} className="bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/30 space-y-1">
                      <div className="text-xs font-bold text-on-surface flex items-center gap-1">
                        {getSlotIcon(slot.slotName)}
                        {slot.slotName} ({slot.doseCount} dose)
                      </div>
                      <input
                        type="time"
                        value={slot.customTime}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditSlots(prev => prev.map((s, i) => i === idx ? { ...s, customTime: val } : s));
                        }}
                        className="w-full px-2 py-1 bg-surface-container-low border border-outline-variant rounded text-xs font-bold text-on-surface outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving} disabled={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL 2: FOLLOW PRESCRIPTION MODAL ───────────────────────────────── */}
      {isRxModalOpen && (
        <Modal 
          isOpen={isRxModalOpen} 
          onClose={() => setIsRxModalOpen(false)} 
          title="Import Reminders from Scanned Prescription" 
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">
                Select Scanned Prescription
              </label>
              {prescriptions.length === 0 ? (
                <div className="text-xs text-on-surface-variant italic py-2">
                  No scanned prescriptions found. Upload a prescription first in the Prescriptions page.
                </div>
              ) : (
                <select
                  value={selectedRxId}
                  onChange={e => handleSelectRx(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-semibold text-on-surface outline-none focus:border-primary transition-all cursor-pointer"
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

            {/* Selected Prescription Medicines List & Customizable Dose Times */}
            {selectedRxId && (
              <div className="space-y-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center justify-between">
                  <span>Select Medicines & Customize Dose Times</span>
                  <span className="text-[11px] text-on-surface-variant font-normal">
                    1st = Morning • 2nd = Noon • 3rd = Night
                  </span>
                </div>

                {(() => {
                  const rx = prescriptions.find(p => p.prescriptionId === selectedRxId);
                  const meds = rx?.medicines?.length ? rx.medicines : (rx?.ocrResult?.medicines?.map(m => ({
                    brandName: m.brand_name?.value || 'Unknown',
                    dosage: m.strength?.value || m.dosage?.value || 'Standard',
                    frequency: m.frequency?.value || '1+0+1',
                  })) || []);

                  return (
                    <div className="space-y-3">
                      {meds.map((med, idx) => {
                        const isChecked = selectedMeds[med.brandName] ?? true;
                        const slots = parseFrequencySlots(med.frequency || '1+0+1');
                        const medTimes = rxSlotTimes[med.brandName] || {};

                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                              isChecked
                                ? 'bg-surface-container-lowest border-primary/40 shadow-sm'
                                : 'bg-surface-container-low border-outline-variant/20 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div
                                onClick={() => setSelectedMeds(p => ({ ...p, [med.brandName]: !isChecked }))}
                                className="flex items-center gap-3 cursor-pointer flex-1"
                              >
                                {isChecked ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-outline" />}
                                <div>
                                  <div className="font-bold text-sm text-on-surface">{med.brandName}</div>
                                  <div className="text-xs text-on-surface-variant">
                                    {med.dosage} • Frequency: <strong className="text-primary">{med.frequency}</strong>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* CUSTOMIZABLE TIME PER DOSE SLOT */}
                            {isChecked && slots.length > 0 && (
                              <div className="pt-2 border-t border-outline-variant/20 space-y-2">
                                <div className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-primary" />
                                  <span>Customize Dose Times for {med.brandName}:</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  {slots.map((slot, sIdx) => {
                                    const currentVal = medTimes[slot.slotName] || slot.defaultTime;

                                    return (
                                      <div
                                        key={sIdx}
                                        className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30 space-y-1"
                                      >
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="font-bold text-on-surface flex items-center gap-1">
                                            {getSlotIcon(slot.slotName)}
                                            {slot.slotName} ({slot.doseCount} {slot.doseCount > 1 ? 'doses' : 'dose'})
                                          </span>
                                        </div>

                                        <input
                                          type="time"
                                          value={currentVal}
                                          onChange={(e) => {
                                            const newTime = e.target.value;
                                            setRxSlotTimes(prev => ({
                                              ...prev,
                                              [med.brandName]: {
                                                ...(prev[med.brandName] || {}),
                                                [slot.slotName]: newTime
                                              }
                                            }));
                                          }}
                                          className="w-full px-2 py-1 bg-surface-container-lowest border border-outline-variant rounded text-xs font-bold text-on-surface outline-none focus:border-primary"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <Button type="button" variant="secondary" onClick={() => setIsRxModalOpen(false)}>Cancel</Button>
              <Button
                type="button"
                onClick={handleImportRxAlerts}
                disabled={!selectedRxId || saving}
                loading={saving}
              >
                Set Selected Reminders
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL 3: CUSTOM DOSAGE SCHEDULE REMINDER MODAL ────────────────────── */}
      {isCustomModalOpen && (
        <Modal 
          isOpen={isCustomModalOpen} 
          onClose={() => setIsCustomModalOpen(false)} 
          title="Schedule Custom Dosage Reminder" 
          size="md"
        >
          <form onSubmit={handleCreateCustomAlert} className="space-y-4">
            <Input
              label="Medicine Brand Name"
              placeholder="e.g. Napa, Seclo, Metformin"
              value={medicineName}
              onChange={e => setMedicineName(e.target.value)}
              required
            />

            <Input
              label="Dosage Strength"
              placeholder="e.g. 500mg, 20mg"
              value={dosage}
              onChange={e => setDosage(e.target.value)}
              required
            />

            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">
                Frequency Pattern (e.g. 1+0+1, 1+1+1)
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-semibold text-on-surface outline-none focus:border-primary transition-all"
                placeholder="1+0+1 (Morning & Night), 1+1+1 (Morning, Noon, Night)..."
                value={frequency}
                onChange={e => {
                  setFrequency(e.target.value);
                  setCustomSlots(parseFrequencySlots(e.target.value));
                }}
              />
              <span className="text-[11px] text-on-surface-variant mt-1 block">
                Format: 1st number = Morning, 2nd = Noon, 3rd = Night
              </span>
            </div>

            {/* Custom Dose Slots Time Selectors */}
            {customSlots.length > 0 && (
              <div className="space-y-2 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30">
                <div className="text-xs font-bold text-on-surface flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>Customize Time Per Dose:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {customSlots.map((slot, idx) => (
                    <div key={idx} className="bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/30 space-y-1">
                      <div className="text-xs font-bold text-on-surface flex items-center gap-1">
                        {getSlotIcon(slot.slotName)}
                        {slot.slotName} ({slot.doseCount} dose)
                      </div>
                      <input
                        type="time"
                        value={slot.customTime}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomSlots(prev => prev.map((s, i) => i === idx ? { ...s, customTime: val } : s));
                        }}
                        className="w-full px-2 py-1 bg-surface-container-low border border-outline-variant rounded text-xs font-bold text-on-surface outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <Button type="button" variant="secondary" onClick={() => setIsCustomModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving} disabled={saving || !medicineName || !dosage}>
                Save Reminder
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
