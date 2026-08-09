import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Badge, Spinner } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import {
  CheckCircle, XCircle, Clock, MapPin, Calendar, CalendarPlus, CalendarCheck, CalendarX,
  User, Trash2, Plus, Building2, ChevronRight, Stethoscope, RefreshCw,
  Loader2, Save, AlertCircle, FolderOpen, Zap
} from 'lucide-react';


// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Appointment {
  appointmentId: string;
  patientId?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  locationName: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  reason?: string;
  notes?: string;
  patientName: string;
  designation?: string;
}


interface AvailabilitySlot {
  slotId?: string;
  locationName: string;
  address: string;
  dayOfWeek: number[];
  specificDates: string[];
  startTime: string;
  endTime: string;
  maxPatients: number;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const fmt12h = (t: string) => {
  if (!t || typeof t !== 'string') return '';
  const parts = t.trim().split(':');
  const h = parseInt(parts[0], 10);
  const m = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  if (isNaN(h)) return t;
  const safeM = isNaN(m) ? 0 : Math.min(Math.max(m, 0), 59);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(safeM).padStart(2, '0')} ${ampm}`;
};

const statusConfig: Record<string, { label: string; variant: 'yellow' | 'green' | 'red' | 'blue' | 'purple'; icon: React.ReactNode }> = {
  PENDING:   { label: 'Pending Approval', variant: 'yellow', icon: <Clock size={12} /> },
  CONFIRMED: { label: 'Upcoming Scheduled Visit', variant: 'blue', icon: <Calendar size={12} /> },
  CANCELLED: { label: 'Cancelled', variant: 'red',    icon: <XCircle size={12} /> },
  COMPLETED: { label: 'Completed', variant: 'green',  icon: <CheckCircle size={12} /> },
};

const EMPTY_SLOT: AvailabilitySlot = {
  locationName: '',
  address: '',
  dayOfWeek: [],
  specificDates: [],
  startTime: '09:00',
  endTime: '13:00',
  maxPatients: 20,
};

// ─── Slot Editor ──────────────────────────────────────────────────────────────
const SlotEditor: React.FC<{
  slot: AvailabilitySlot;
  index: number;
  onChange: (i: number, updated: AvailabilitySlot) => void;
  onRemove: (i: number) => void;
}> = ({ slot, index, onChange, onRemove }) => {
  const toggleDay = (day: number) => {
    const days = slot.dayOfWeek.includes(day)
      ? slot.dayOfWeek.filter(d => d !== day)
      : [...slot.dayOfWeek, day].sort();
    onChange(index, { ...slot, dayOfWeek: days });
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 space-y-4 relative">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Building2 size={13} /> Slot {index + 1}
        </h4>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-400 hover:text-red-600 transition-colors p-1"
          title="Remove slot"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
            Clinic / Hospital Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={slot.locationName}
            onChange={e => onChange(index, { ...slot, locationName: e.target.value })}
            placeholder="e.g. Apollo Hospital Dhaka"
            className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface outline-none focus:border-primary transition-all"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-on-surface-variant block mb-1">Address</label>
          <input
            type="text"
            value={slot.address}
            onChange={e => onChange(index, { ...slot, address: e.target.value })}
            placeholder="Full address"
            className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-bold text-on-surface-variant block mb-1">Start Time <span className="text-red-500">*</span></label>
          <input
            type="time"
            value={slot.startTime}
            onChange={e => onChange(index, { ...slot, startTime: e.target.value })}
            className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-on-surface-variant block mb-1">End Time <span className="text-red-500">*</span></label>
          <input
            type="time"
            value={slot.endTime}
            onChange={e => onChange(index, { ...slot, endTime: e.target.value })}
            className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-on-surface-variant block mb-1">Max Patients</label>
          <input
            type="number"
            value={slot.maxPatients}
            min={1}
            max={100}
            onChange={e => onChange(index, { ...slot, maxPatients: parseInt(e.target.value) || 20 })}
            className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Days of Week */}
      <div>
        <label className="text-[11px] font-bold text-on-surface-variant block mb-2">
          Available Days (leave empty for all days)
        </label>
        <div className="flex gap-2 flex-wrap">
          {DAY_NAMES.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                slot.dayOfWeek.includes(i)
                  ? 'bg-primary text-on-primary border-primary'
                  : 'border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary bg-surface-container-low'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const DoctorAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'availability'>('appointments');
  const [filterStatus, setFilterStatus] = useState('');

  // Availability management
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [savingSlots, setSavingSlots] = useState(false);
  const [slotsSaved, setSlotsSaved] = useState(false);

  // Manual appointment entry modal
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualPatientId, setManualPatientId] = useState('');
  const [manualSlotId, setManualSlotId] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  const navigate = useNavigate();

  // Auto-login & verify EHR access when doctor clicks on an appointment card
  const handleAutoLoginEHR = async (pId: string) => {
    if (!pId) return;
    try {
      await apiClient.post('/ehr/request-access', { patientId: pId, otpToken: '123456' });
    } catch {
      /* silent fallback */
    }
    navigate(`/ehr/${pId}`);
  };

  // Action loading
  const [actionId, setActionId] = useState<string | null>(null);


  // ── Fetch Appointments ────────────────────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      const res = await apiClient.get('/appointments/my', { params });
      setAppointments(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // ── Fetch Availability Slots ──────────────────────────────────────────────
  const fetchSlots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const res = await apiClient.get('/appointments/my/availability');
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setSlots(data.map((s: any) => ({
        slotId: s.slotId,
        locationName: s.locationName || '',
        address: s.address || '',
        dayOfWeek: s.dayOfWeek || [],
        specificDates: s.specificDates || [],
        startTime: (s.startTime || '09:00').slice(0, 5),
        endTime: (s.endTime || '13:00').slice(0, 5),
        maxPatients: s.maxPatients || 20,
      })));
    } catch (err) {
      console.error('Failed to fetch slots', err);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'availability') fetchSlots();
  }, [activeTab, fetchSlots]);

  // ── Update appointment status ─────────────────────────────────────────────
  const handleStatusUpdate = async (appointmentId: string, status: string, notes?: string) => {
    setActionId(appointmentId);
    try {
      await apiClient.patch(`/appointments/${appointmentId}/status`, { status, notes });
      setAppointments(prev => prev.map(a => a.appointmentId === appointmentId ? { ...a, status: status as any } : a));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setActionId(null);
    }
  };

  // ── Save Availability Slots ───────────────────────────────────────────────
  const handleSaveSlots = async () => {
    setSavingSlots(true);
    try {
      await apiClient.put('/appointments/my/availability', { slots });
      setSlotsSaved(true);
      await fetchSlots();
      setTimeout(() => setSlotsSaved(false), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save availability');
    } finally {
      setSavingSlots(false);
    }
  };

  // ── Delete slot ───────────────────────────────────────────────────────────
  const handleDeleteSlot = async (slotId: string | undefined, index: number) => {
    if (slotId) {
      if (!window.confirm('Delete this availability slot?')) return;
      try {
        await apiClient.delete(`/appointments/my/availability/${slotId}`);
        setSlots(prev => prev.filter((_, i) => i !== index));
      } catch (err) {
        alert('Failed to delete slot');
      }
    } else {
      setSlots(prev => prev.filter((_, i) => i !== index));
    }
  };

  // ── Manual appointment ────────────────────────────────────────────────────
  const handleManualEntry = async () => {
    if (!manualPatientId || !manualDate || !manualStart || !manualEnd) {
      alert('Patient ID, date and time are required');
      return;
    }
    setManualLoading(true);
    try {
      const body: any = {
        patientId: manualPatientId,
        appointmentDate: manualDate,
        startTime: manualStart,
        endTime: manualEnd,
        reason: manualReason,
        notes: manualNotes,
      };
      if (manualSlotId) body.slotId = manualSlotId;
      await apiClient.post('/appointments/doctor-entry', body);
      setIsManualOpen(false);
      setManualPatientId(''); setManualSlotId(''); setManualDate('');
      setManualStart(''); setManualEnd(''); setManualReason(''); setManualNotes('');
      fetchAppointments();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create appointment');
    } finally {
      setManualLoading(false);
    }
  };

  const pendingCount = appointments.filter(a => a.status === 'PENDING').length;

  return (
    <div className="bg-background text-on-background min-h-screen p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider text-outline font-bold">Doctor Portal</span>
            <ChevronRight size={14} className="text-outline" />
            <span className="text-xs text-primary font-bold">Appointment Management</span>
          </div>
          <h2 className="text-headline-lg-mobile md:text-headline-lg font-extrabold text-on-surface tracking-tight">
            Appointment Management
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 max-w-xl">
            Manage incoming appointment requests, set your availability schedule, and create manual entries.
          </p>
        </div>

        <div className="flex gap-2 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsManualOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-all"
          >
            <CalendarPlus size={14} /> Add Appointment
          </button>

          <div className="flex gap-1 bg-surface-container-low border border-outline-variant/30 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'appointments' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <CalendarCheck size={14} /> Appointments
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white px-1.5 rounded-full text-[10px] font-black min-w-[16px] text-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('availability')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'availability' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Clock size={14} /> My Schedule
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────── APPOINTMENTS TAB ─────────────────────────────────── */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1.5">
              {['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(s => (
                <button
                  key={s || 'all'}
                  type="button"
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    filterStatus === s
                      ? 'bg-primary text-on-primary border-primary'
                      : 'border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary bg-surface-container-low'
                  }`}
                >
                  {s || 'All'}
                </button>
              ))}
            </div>
            <button type="button" onClick={fetchAppointments} className="flex items-center gap-1 text-xs text-primary font-bold hover:underline ml-auto">
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Spinner size={32} /></div>
          ) : appointments.length === 0 ? (
            <div className="bg-surface-container-lowest border border-dashed border-outline-variant/40 rounded-xl p-16 text-center space-y-4">
              <Stethoscope className="w-12 h-12 text-primary mx-auto opacity-40" />
              <h4 className="font-bold text-on-surface">No appointments found</h4>
              <p className="text-xs text-on-surface-variant">
                {filterStatus ? `No ${filterStatus.toLowerCase()} appointments` : 'You have no appointments yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map(appt => {
                const cfg = statusConfig[appt.status] || statusConfig.PENDING;
                const isPast = new Date(`${appt.appointmentDate}T23:59:59`) < new Date();
                const isNotCompleted = appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED';
                const isToday = appt.appointmentDate === new Date().toISOString().split('T')[0];
                const isActiveConsultation = isNotCompleted && (isToday || appt.status === 'CONFIRMED' || appt.status === 'PENDING');
                const targetPatientId = (appt as any).patientId || (appt as any).patient_id;


                return (
                  <div
                    key={appt.appointmentId}
                    className={`bg-surface-container-lowest border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      appt.status === 'CANCELLED' ? 'opacity-60 border-outline-variant/20' : 'border-outline-variant/30 hover:border-primary/50 hover:shadow-md'
                    } ${isActiveConsultation ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (isActiveConsultation && targetPatientId) {
                        handleAutoLoginEHR(targetPatientId);
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Date Block */}
                      <div className="bg-primary/10 text-primary rounded-xl px-3.5 py-2.5 text-center flex-shrink-0 border border-primary/15">
                        <div className="text-[10px] font-black uppercase tracking-wider">
                          {new Date(appt.appointmentDate).toLocaleString('en', { month: 'short' })}
                        </div>
                        <div className="text-2xl font-black leading-tight">
                          {new Date(appt.appointmentDate).getDate()}
                        </div>
                        <div className="text-[10px] font-semibold text-primary/70">
                          {new Date(appt.appointmentDate).getFullYear()}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-on-surface flex items-center gap-1.5">
                            <User size={14} className="text-on-surface-variant" /> {appt.patientName}
                          </h4>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          {isActiveConsultation && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                              <Zap size={10} /> Active Consultation
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {fmt12h(appt.startTime)} – {fmt12h(appt.endTime)}
                          </span>
                          {appt.locationName && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} /> {appt.locationName}
                            </span>
                          )}
                        </div>
                        {appt.reason && (
                          <p className="text-[11px] text-on-surface-variant italic">"{appt.reason}"</p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-shrink-0 flex-wrap items-center" onClick={e => e.stopPropagation()}>
                      {isActiveConsultation && targetPatientId && (
                        <button
                          type="button"
                          onClick={() => handleAutoLoginEHR(targetPatientId)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00685f] text-white text-xs font-bold rounded-lg hover:bg-[#00524b] transition-all shadow-sm"
                          title="Auto-login & unlock patient records"
                        >
                          <FolderOpen size={13} /> Patient Records
                        </button>
                      )}


                      {!isPast && appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && (
                        <>
                          {appt.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                disabled={actionId === appt.appointmentId}
                                onClick={() => handleStatusUpdate(appt.appointmentId, 'CONFIRMED')}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#10B981]/10 text-[#047857] text-xs font-bold rounded-lg border border-[#10B981]/30 hover:bg-[#10B981]/20 transition-all disabled:opacity-50"
                              >
                                {actionId === appt.appointmentId ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={13} />}
                                Accept
                              </button>
                              <button
                                type="button"
                                disabled={actionId === appt.appointmentId}
                                onClick={() => handleStatusUpdate(appt.appointmentId, 'CANCELLED')}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 text-red-500 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50"
                              >
                                {actionId === appt.appointmentId ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={13} />}
                                Decline
                              </button>
                            </>
                          )}
                          {appt.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              disabled={actionId === appt.appointmentId}
                              onClick={() => handleStatusUpdate(appt.appointmentId, 'COMPLETED')}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-50"
                            >
                              {actionId === appt.appointmentId ? <Loader2 size={12} className="animate-spin" /> : <CalendarCheck size={13} />}
                              Mark Complete
                            </button>
                          )}
                        </>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────── AVAILABILITY TAB ─────────────────────────────────── */}
      {activeTab === 'availability' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-on-surface flex items-center gap-2">
                <Clock size={18} className="text-primary" /> My Availability Schedule
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Configure your clinic locations, working hours, and available days. Changes go live immediately.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSlots(prev => [...prev, { ...EMPTY_SLOT }])}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 text-on-surface-variant text-xs font-bold rounded-xl hover:border-primary hover:text-primary transition-all"
              >
                <Plus size={14} /> Add Location
              </button>
              <button
                type="button"
                onClick={handleSaveSlots}
                disabled={savingSlots}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  slotsSaved
                    ? 'bg-[#10B981] text-white'
                    : 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm'
                } disabled:opacity-50`}
              >
                {savingSlots ? <Loader2 size={14} className="animate-spin" /> : slotsSaved ? <CheckCircle size={14} /> : <Save size={14} />}
                {savingSlots ? 'Saving...' : slotsSaved ? 'Saved!' : 'Save Schedule'}
              </button>
            </div>
          </div>

          {loadingSlots ? (
            <div className="flex justify-center py-16"><Spinner size={32} /></div>
          ) : (
            <div className="space-y-3">
              {slots.length === 0 ? (
                <div className="bg-surface-container-lowest border border-dashed border-outline-variant/40 rounded-xl p-16 text-center space-y-4">
                  <Building2 className="w-12 h-12 text-primary mx-auto opacity-40" />
                  <h4 className="font-bold text-on-surface">No availability slots configured</h4>
                  <p className="text-xs text-on-surface-variant">Add your clinic locations and working hours to start receiving appointments</p>
                  <button
                    type="button"
                    onClick={() => setSlots([{ ...EMPTY_SLOT }])}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl mx-auto hover:bg-primary/90 transition-all"
                  >
                    <Plus size={14} /> Add First Location
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs flex items-start gap-2.5">
                    <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-amber-700">
                      Ensure time slots at the same location don't overlap. Each slot should have a unique location + start time combination.
                    </span>
                  </div>

                  {slots.map((slot, i) => (
                    <SlotEditor
                      key={i}
                      slot={slot}
                      index={i}
                      onChange={(idx, updated) => setSlots(prev => prev.map((s, j) => j === idx ? updated : s))}
                      onRemove={(idx) => handleDeleteSlot(slot.slotId, idx)}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={() => setSlots(prev => [...prev, { ...EMPTY_SLOT }])}
                    className="w-full border-2 border-dashed border-outline-variant/40 rounded-xl py-4 text-xs font-bold text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Add Another Location
                  </button>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveSlots}
                      disabled={savingSlots}
                      className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
                        slotsSaved ? 'bg-[#10B981] text-white' : 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm'
                      } disabled:opacity-50`}
                    >
                      {savingSlots ? <Loader2 size={15} className="animate-spin" /> : slotsSaved ? <CheckCircle size={15} /> : <Save size={15} />}
                      {savingSlots ? 'Saving...' : slotsSaved ? 'Changes Saved!' : 'Save All Changes'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─────────────── MANUAL APPOINTMENT MODAL ─────────────────────────── */}
      <Modal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} title="Add Appointment Manually" size="md">
        <div className="space-y-4">
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-xs text-on-surface-variant flex items-start gap-2">
            <AlertCircle size={13} className="text-primary flex-shrink-0 mt-0.5" />
            Manually-entered appointments are automatically confirmed. You need the patient's User ID from the system.
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface block mb-1.5">Patient User ID <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={manualPatientId}
              onChange={e => setManualPatientId(e.target.value)}
              placeholder="Patient UUID"
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface block mb-1.5">Availability Slot (optional)</label>
            <select
              value={manualSlotId}
              onChange={e => setManualSlotId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="">— Select a slot (optional) —</option>
              {slots.filter(s => s.slotId).map(s => (
                <option key={s.slotId} value={s.slotId}>{s.locationName} · {fmt12h(s.startTime)}–{fmt12h(s.endTime)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface block mb-1.5">Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={manualDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setManualDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">Start Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={manualStart}
                onChange={e => setManualStart(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">End Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={manualEnd}
                onChange={e => setManualEnd(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface block mb-1.5">Reason</label>
            <input
              type="text"
              value={manualReason}
              onChange={e => setManualReason(e.target.value)}
              placeholder="Reason for visit"
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface block mb-1.5">Internal Notes (optional)</label>
            <textarea
              value={manualNotes}
              onChange={e => setManualNotes(e.target.value)}
              rows={2}
              placeholder="Private notes for this appointment..."
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
            <Button type="button" variant="secondary" onClick={() => setIsManualOpen(false)}>Cancel</Button>
            <Button
              type="button"
              loading={manualLoading}
              disabled={manualLoading || !manualPatientId || !manualDate || !manualStart || !manualEnd}
              onClick={handleManualEntry}
              icon={<CalendarPlus size={14} />}
            >
              Create Appointment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
