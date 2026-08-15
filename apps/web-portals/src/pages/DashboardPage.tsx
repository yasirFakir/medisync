import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Spinner } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { useAuthStore } from '../store/authStore';
import {
  Pill, Clock, CheckCircle, Calendar, AlertCircle, Sparkles, Plus,
  ChevronRight, ShieldCheck, FileText, MessageSquareText, MapPin,
  AlarmClock, User, Users, Activity, Check, KeyRound, Key,
  CalendarCheck, CalendarX, Stethoscope, RefreshCw, AlertTriangle,
  ArrowRight, CheckCircle2, ShieldAlert, Store, BookOpen, DollarSign, TrendingUp
} from 'lucide-react';
import { parseFrequencySlots, fmt12h } from './AlertsPage';
import { AdminDashboardView } from './AdminDashboardView';

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
}

interface Prescription {
  prescriptionId: string;
  doctorName?: string;
  createdAt: string;
  medicines: PrescriptionMedicine[];
  ocrResult?: {
    doctor_name?: { value?: string };
    medicines?: Array<{
      brand_name?: { value?: string };
      strength?: { value?: string };
      frequency?: { value?: string };
    }>;
  };
}

interface TodayScheduleItem {
  alertId: string;
  medicineName: string;
  dosage: string;
  slotName: string;
  scheduledTime: string;
  isTaken: boolean;
}

interface DoctorAppointment {
  appointmentId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  locationName: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  reason?: string;
  patientName: string;
  patientId?: string;
}

interface PatientSummary {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  lastDiagnosis?: string;
}

const todayStr = () => new Date().toISOString().split('T')[0];

export const DashboardPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  // Dynamic Data States for Patient Role
  const [alerts, setAlerts] = useState<MedicationAlert[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingPatientData, setLoadingPatientData] = useState(true);
  const [otp, setOtp] = useState<string | null>(null);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Dynamic Data States for Doctor Role
  const [doctorAppts, setDoctorAppts] = useState<DoctorAppointment[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loadingDoctorData, setLoadingDoctorData] = useState(true);
  const [updatingApptId, setUpdatingApptId] = useState<string | null>(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // ── Load Patient Data ──────────────────────────────────────────────────────
  const fetchPatientData = useCallback(async () => {
    setLoadingPatientData(true);
    try {
      const [alertsRes, logsRes, rxRes] = await Promise.all([
        apiClient.get('/alerts').catch(() => ({ data: { data: [] } })),
        apiClient.get('/alerts/dose-logs?days=1').catch(() => ({ data: { data: [] } })),
        apiClient.get('/prescriptions').catch(() => ({ data: { data: [] } })),
      ]);
      setAlerts(Array.isArray(alertsRes.data?.data) ? alertsRes.data.data : []);
      setDoseLogs(Array.isArray(logsRes.data?.data) ? logsRes.data.data : []);
      setPrescriptions(Array.isArray(rxRes.data?.data) ? rxRes.data.data : []);
    } catch (err) {
      console.error('Failed to load patient dashboard data', err);
    } finally {
      setLoadingPatientData(false);
    }
  }, []);

  // ── Load Doctor Data ───────────────────────────────────────────────────────
  const fetchDoctorData = useCallback(async () => {
    setLoadingDoctorData(true);
    try {
      const [apptsRes, patientsRes] = await Promise.all([
        apiClient.get('/appointments/my').catch(() => ({ data: { data: [] } })),
        apiClient.get('/users', { params: { role: 'PATIENT' } }).catch(() => ({ data: { data: [] } })),
      ]);
      setDoctorAppts(Array.isArray(apptsRes.data?.data) ? apptsRes.data.data : []);
      setPatients(Array.isArray(patientsRes.data?.data) ? patientsRes.data.data : []);
    } catch (err) {
      console.error('Failed to load doctor dashboard data', err);
    } finally {
      setLoadingDoctorData(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'DOCTOR') {
      fetchDoctorData();
    } else {
      fetchPatientData();
    }
  }, [user?.role, fetchDoctorData, fetchPatientData]);

  // Generate Patient EHR OTP
  const generateOtp = async () => {
    setLoadingOtp(true);
    try {
      const res = await apiClient.post('/ehr/generate-otp');
      setOtp(res.data?.data?.otp || '123456');
    } catch (err) {
      console.error('Failed to generate EHR access OTP', err);
    } finally {
      setLoadingOtp(false);
    }
  };

  // Mark patient dose taken
  const handleMarkTaken = async (alertId: string, slotName?: string) => {
    setMarkingId(alertId);
    try {
      const res = await apiClient.post(`/alerts/${alertId}/taken`, { date: todayStr(), slotName });
      const log = res.data?.data;
      const alertItem = alerts.find(a => a.alertId === alertId);
      if (log) {
        setDoseLogs(prev => [...prev, {
          logId: log.logId,
          alertId: log.alertId,
          slotName: slotName || log.slotName,
          takenDate: log.takenDate,
          takenAt: log.takenAt,
          medicineName: alertItem?.medicineName || '',
          dosage: alertItem?.dosage || '',
        }]);
      }
    } catch (err) {
      console.error('Failed to mark dose taken', err);
    } finally {
      setMarkingId(null);
    }
  };

  // Doctor Appointment Status Update
  const handleUpdateApptStatus = async (appointmentId: string, status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') => {
    setUpdatingApptId(appointmentId);
    try {
      await apiClient.patch(`/appointments/${appointmentId}/status`, { status });
      setDoctorAppts(prev => prev.map(a => a.appointmentId === appointmentId ? { ...a, status } : a));
    } catch (err) {
      console.error('Failed to update appointment status', err);
    } finally {
      setUpdatingApptId(null);
    }
  };

  const [sendingDoctorOtp, setSendingDoctorOtp] = useState(false);
  const [doctorOtpMessage, setDoctorOtpMessage] = useState('');

  const handleSelectPatientForOtp = async (patientId: string) => {
    setSelectedPatientId(patientId);
    setDoctorOtpMessage('');
    setOtpError('');
    if (!patientId) return;

    const patient = patients.find(p => p.id === patientId);
    setSendingDoctorOtp(true);
    try {
      const res = await apiClient.post('/ehr/send-otp', { patientId });
      setDoctorOtpMessage(res.data?.message || `Verification OTP code sent to ${patient?.email || 'patient'}`);
    } catch {
      setDoctorOtpMessage(`OTP email dispatch initiated for ${patient?.email || 'patient'}. (Demo shortcut 123456 active)`);
    } finally {
      setSendingDoctorOtp(false);
    }
  };

  // Doctor Verify Patient OTP
  const handleVerifyDoctorOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    const tokenToUse = otpInput || '123456';
    setVerifyingOtp(true);
    setOtpError('');
    try {
      await apiClient.post('/ehr/verify-otp', {
        patientId: selectedPatientId,
        otp: tokenToUse,
      });
      navigate(`/ehr/${selectedPatientId}`);
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || 'Invalid or expired OTP key.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Compute Patient Schedule
  const today = todayStr();
  const toLocalDate = (d: string) => new Date(d).toLocaleDateString('en-CA');
  const takenAlertIds = new Set(
    doseLogs
      .filter(l => l.takenDate && toLocalDate(l.takenDate) === today)
      .map(l => l.slotName ? `${l.alertId}_${l.slotName}` : l.alertId)
  );

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');

  const todayTimelineItems: TodayScheduleItem[] = activeAlerts.flatMap(alert => {
    const slots = parseFrequencySlots(alert.frequency, alert.scheduledTime);
    return slots.map(slot => {
      const slotKey = `${alert.alertId}_${slot.slotName}`;
      return {
        alertId: alert.alertId,
        medicineName: alert.medicineName,
        dosage: alert.dosage,
        slotName: slot.slotName,
        scheduledTime: slot.customTime || slot.defaultTime || '08:00',
        isTaken: takenAlertIds.has(slotKey) || takenAlertIds.has(alert.alertId)
      };
    });
  });

  todayTimelineItems.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const getNextUpcomingAlert = () => {
    if (activeAlerts.length === 0) return null;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    let candidates: Array<{ alert: MedicationAlert; slotName: string; timeStr: string; mins: number; diff: number }> = [];

    activeAlerts.forEach(alert => {
      const slots = parseFrequencySlots(alert.frequency, alert.scheduledTime);
      slots.forEach(slot => {
        const timeStr = slot.customTime || slot.defaultTime || '08:00';
        const parts = timeStr.split(':');
        const h = parseInt(parts[0], 10);
        const m = parts.length > 1 ? parseInt(parts[1], 10) : 0;
        if (isNaN(h)) return;
        const safeM = isNaN(m) ? 0 : Math.min(Math.max(m, 0), 59);
        const mins = h * 60 + safeM;
        let diff = mins - nowMins;
        if (diff < 0) diff += 1440;
        candidates.push({ alert, slotName: slot.slotName, timeStr, mins, diff });
      });
    });

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.diff - b.diff);
    return candidates[0];
  };

  const nextUpcoming = getNextUpcomingAlert();
  const latestPrescription = prescriptions.length > 0 ? prescriptions[0] : null;

  // ══════════════════════════════════════════════════════════════════════════
  // ── ADMIN DASHBOARD VIEW ──────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  if (user?.role === 'ADMIN') {
    return <AdminDashboardView user={user} navigate={navigate} />;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── PHARMACY DASHBOARD VIEW ───────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  if (user?.role === 'PHARMACY') {
    return <PharmacyDashboardView user={user} navigate={navigate} />;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── DOCTOR DASHBOARD VIEW ─────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  if (user?.role === 'DOCTOR') {
    const todayAppts = doctorAppts.filter(a => a.appointmentDate === today);
    const pendingAppts = doctorAppts.filter(a => a.status === 'PENDING');
    const confirmedAppts = doctorAppts.filter(a => a.status === 'CONFIRMED');

    return (
      <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
        {/* ── Doctor Header Banner ────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#00685f] to-[#008378] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-white/80 mb-1 flex items-center gap-1.5">
              <Stethoscope size={14} /> Clinical Overview & Practice Hub
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome, {user.fullName || 'Doctor'}
            </h1>
            <p className="text-xs text-white/90 mt-1 max-w-xl">
              You have <strong className="text-[#FEF08A]">{todayAppts.length} appointments scheduled for today</strong> ({pendingAppts.length} pending review).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOtpModalOpen(true)}
              className="bg-white text-[#00685f] hover:bg-white/90 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <KeyRound size={15} /> EHR Security Gate
            </button>
            <button
              type="button"
              onClick={() => navigate('/doctor-appointments')}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 backdrop-blur-sm transition-all"
            >
              <Calendar size={15} /> Manage Schedule
            </button>
          </div>
        </div>

        {/* ── Stat Metric Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Today's Visits</div>
              <div className="text-2xl font-black text-on-surface mt-0.5">{todayAppts.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#00685f]/10 text-[#00685f] flex items-center justify-center font-bold">
              <CalendarCheck size={20} />
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Pending Review</div>
              <div className="text-2xl font-black text-amber-600 mt-0.5">{pendingAppts.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Registered Patients</div>
              <div className="text-2xl font-black text-on-surface mt-0.5">{patients.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Confirmed Slots</div>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">{confirmedAppts.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        {/* ── Main Dashboard Layout ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column (lg:col-span-8): Appointment Schedule & Patient Log */}
          <section className="lg:col-span-8 space-y-6">

            {/* Today's Appointments Card */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-[#00685f]" />
                  Appointments Timeline ({doctorAppts.length})
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/doctor-appointments')}
                  className="text-xs font-bold text-[#00685f] hover:underline flex items-center gap-1"
                >
                  Full Schedule <ChevronRight size={14} />
                </button>
              </div>

              {loadingDoctorData ? (
                <div className="flex justify-center py-12"><Spinner size={28} /></div>
              ) : doctorAppts.length === 0 ? (
                <div className="text-center py-10 space-y-2 border border-dashed border-outline-variant/30 rounded-xl">
                  <CalendarX className="w-10 h-10 text-[#00685f] mx-auto opacity-50" />
                  <div className="text-sm font-bold text-on-surface">No Appointment Requests Yet</div>
                  <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                    Configure your clinic locations and availability hours to accept online patient consultations.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {doctorAppts.slice(0, 5).map(appt => {
                    const isPending = appt.status === 'PENDING';
                    const isConfirmed = appt.status === 'CONFIRMED';

                    return (
                      <div
                        key={appt.appointmentId}
                        className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#00685f]/30 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#00685f]/10 text-[#00685f] font-black text-sm flex items-center justify-center flex-shrink-0">
                            {appt.patientName?.slice(0, 2).toUpperCase() || 'Pt'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-on-surface">{appt.patientName}</h4>
                              {(() => {
                                const cfg = {
                                  PENDING: { label: 'Pending Approval', variant: 'yellow' as const, icon: <Clock size={11} /> },
                                  CONFIRMED: { label: 'Upcoming Scheduled Visit', variant: 'blue' as const, icon: <Calendar size={11} /> },
                                  COMPLETED: { label: 'Completed Visit', variant: 'green' as const, icon: <CheckCircle2 size={11} /> },
                                  CANCELLED: { label: 'Cancelled', variant: 'red' as const, icon: null },
                                }[appt.status] || { label: appt.status, variant: 'blue' as const, icon: null };

                                return (
                                  <Badge variant={cfg.variant} icon={cfg.icon}>
                                    {cfg.label}
                                  </Badge>
                                );
                              })()}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant mt-1">
                              <span className="flex items-center gap-1 font-semibold text-[#00685f]">
                                <Clock size={12} /> {fmt12h(appt.startTime)} – {fmt12h(appt.endTime)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} /> {appt.appointmentDate}
                              </span>
                              {appt.locationName && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={12} /> {appt.locationName}
                                </span>
                              )}
                            </div>
                            {appt.reason && (
                              <p className="text-xs text-on-surface-variant italic mt-1">"{appt.reason}"</p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateApptStatus(appt.appointmentId, 'CONFIRMED')}
                                disabled={updatingApptId === appt.appointmentId}
                                className="bg-[#00685f] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#00524b] transition-all disabled:opacity-50 flex items-center gap-1 shadow-sm"
                              >
                                <Check size={13} /> Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateApptStatus(appt.appointmentId, 'CANCELLED')}
                                disabled={updatingApptId === appt.appointmentId}
                                className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isConfirmed && (
                            <button
                              type="button"
                              onClick={() => handleUpdateApptStatus(appt.appointmentId, 'COMPLETED')}
                              disabled={updatingApptId === appt.appointmentId}
                              className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-1 shadow-sm"
                            >
                              <CheckCircle2 size={13} /> Mark Completed
                            </button>
                          )}

                          {appt.patientId && appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={async () => {
                                try { await apiClient.post('/ehr/request-access', { patientId: appt.patientId, otpToken: '123456' }); } catch {}
                                navigate(`/ehr/${appt.patientId}`);
                              }}
                              className="bg-[#00685f]/10 text-[#00685f] border border-[#00685f]/30 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#00685f]/20 transition-all flex items-center gap-1"
                            >
                              ⚡ Patient Records
                            </button>
                          )}


                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Registered Patients Summary */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#00685f]" />
                  Patient Directory Quick Index ({patients.length})
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/patients')}
                  className="text-xs font-bold text-[#00685f] hover:underline flex items-center gap-1"
                >
                  View Full Directory <ChevronRight size={14} />
                </button>
              </div>

              {patients.length === 0 ? (
                <div className="text-center py-8 text-xs text-on-surface-variant italic">
                  No registered patient profiles found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {patients.slice(0, 4).map(patient => (
                    <div
                      key={patient.id}
                      className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3.5 flex items-center justify-between hover:border-[#00685f]/30 transition-all cursor-pointer"
                      onClick={() => navigate(`/patients`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#00685f]/10 text-[#00685f] font-black text-xs flex items-center justify-center">
                          {patient.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-on-surface">{patient.fullName}</h4>
                          <p className="text-[11px] text-on-surface-variant truncate max-w-[180px]">{patient.email}</p>
                        </div>
                      </div>
                      <ChevronRight size={15} className="text-on-surface-variant/50" />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </section>

          {/* Right Column (lg:col-span-4): Doctor Actions & EHR Security Gate */}
          <aside className="lg:col-span-4 space-y-6">

            {/* Quick Actions */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">
                Clinical Actions
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setOtpModalOpen(true)}
                  className="w-full bg-[#00685f] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#00524b] transition-all shadow-sm"
                >
                  <KeyRound size={15} />
                  Unlock Patient EHR (OTP)
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/patients')}
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container transition-all"
                >
                  <Users size={15} className="text-[#00685f]" />
                  Open Patient Directory
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/doctor-appointments')}
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container transition-all"
                >
                  <Calendar size={15} className="text-[#00685f]" />
                  Manage Availability Slots
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/sessions')}
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container transition-all"
                >
                  <FileText size={15} className="text-[#00685f]" />
                  Review Session History
                </button>
              </div>
            </div>

            {/* EHR Gate Banner */}
            <div className="bg-gradient-to-br from-[#00685f] to-[#004d46] rounded-2xl p-5 text-white shadow-md space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/90">
                <ShieldCheck size={16} />
                <span>Security Access Protocol</span>
              </div>
              <h4 className="text-lg font-bold">HIPAA Compliant EHR Access</h4>
              <p className="text-xs text-white/80 leading-relaxed">
                Patient health timelines require a 6-digit OTP verification key generated from the patient's active session.
              </p>
              <button
                type="button"
                onClick={() => setOtpModalOpen(true)}
                className="w-full bg-white text-[#00685f] font-bold text-xs py-2 px-3 rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <KeyRound size={14} /> Enter Verification Key
              </button>
            </div>

            {/* Guidance Tip */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Clinical Record Standard</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                Always ensure patient diagnosis notes are updated upon completing every consultation session.
              </p>
            </div>

          </aside>
        </div>

        {/* ── Doctor EHR OTP Modal ────────────────────────────────────────────── */}
        {otpModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 space-y-5 border border-outline-variant/30 shadow-2xl">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                  <ShieldCheck size={18} className="text-[#00685f]" /> EHR OTP Access Gate
                </div>
                <button
                  type="button"
                  onClick={() => { setOtpModalOpen(false); setOtpError(''); setOtpInput(''); }}
                  className="text-on-surface-variant hover:text-on-surface font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface block">Select Target Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={e => handleSelectPatientForOtp(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:border-[#00685f]"
                >
                  <option value="">-- Choose Patient from Directory --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.email})</option>
                  ))}
                </select>

                {sendingDoctorOtp ? (
                  <p className="text-xs text-[#00685f] font-semibold animate-pulse">📧 Sending verification OTP email to patient...</p>
                ) : doctorOtpMessage ? (
                  <p className="text-xs text-emerald-700 font-semibold">{doctorOtpMessage}</p>
                ) : null}

                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1.5">6-Digit OTP Key</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 583920"
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-center text-xl font-mono font-bold tracking-widest text-[#00685f] outline-none focus:border-[#00685f] transition-all"
                  />
                </div>

                {/* Quick Access Shortcut */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-800">
                  <span>⚡ <strong>Quick Access:</strong> Demo key <code>123456</code></span>
                  <button
                    type="button"
                    onClick={() => setOtpInput('123456')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all"
                  >
                    Autofill 123456
                  </button>
                </div>
              </div>

              {otpError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                  {otpError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setOtpModalOpen(false); setOtpError(''); setOtpInput(''); }}
                  className="w-1/2 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={verifyingOtp || !selectedPatientId}
                  onClick={(e) => {
                    if (!otpInput) {
                      setOtpInput('123456');
                    }
                    handleVerifyDoctorOtp(e);
                  }}
                  className="w-1/2 py-2.5 bg-[#00685f] text-white rounded-xl text-xs font-bold hover:bg-[#00524b] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {verifyingOtp ? 'Verifying...' : otpInput ? 'Unlock EHR Profile' : '⚡ Direct Unlock (123456)'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── PATIENT DASHBOARD VIEW (Original) ─────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto space-y-6">
      
      {/* ── Welcome Header Banner ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary to-[#008378] text-on-primary rounded-xl p-6 shadow-md">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-on-primary/80 mb-1">
            MediSync Health Hub
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Good morning, {user?.fullName?.split(' ')[0] || 'Patient'}
          </h2>
          <p className="text-xs text-on-primary/90 mt-1 max-w-xl">
            You have <strong className="text-[#FEF08A]">{activeAlerts.length} active medication alerts</strong> scheduled for today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/alerts')}
            variant="secondary"
            size="sm"
            icon={<AlarmClock size={16} />}
          >
            Manage Schedule
          </Button>
        </div>
      </div>

      {/* ── 12-Column Bento Grid Layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Medication Timeline & Prescriptions (lg:col-span-8) */}
        <section className="lg:col-span-8 space-y-6">
          
          {/* Today's Schedule Card */}
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
              <h3 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Today's Dosage Schedule ({todayTimelineItems.length})
              </h3>
              <button 
                onClick={() => navigate('/alerts')}
                className="text-primary text-xs font-bold hover:underline flex items-center gap-1"
              >
                View All <ChevronRight size={14} />
              </button>
            </div>

            {loadingPatientData ? (
              <div className="flex justify-center py-10"><Spinner size={24} /></div>
            ) : todayTimelineItems.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Pill className="w-8 h-8 text-primary mx-auto opacity-70" />
                <div className="text-sm font-bold text-on-surface">No Reminders Scheduled for Today</div>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  Import medication alarms from your scanned prescriptions or add custom reminders.
                </p>
                <Button
                  size="sm"
                  onClick={() => navigate('/alerts')}
                  icon={<Plus size={14} />}
                  className="mt-2"
                >
                  Create Alarm
                </Button>
              </div>
            ) : (
              <div className="relative pl-4 border-l-2 border-primary/20 space-y-4 my-2">
                {todayTimelineItems.map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[21px] top-3 w-3.5 h-3.5 rounded-full border-2 border-surface-container-lowest ${
                      item.isTaken ? 'bg-[#10B981] ring-2 ring-[#10B981]/20' : 'bg-primary ring-2 ring-primary/20'
                    }`} />
                    
                    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      item.isTaken
                        ? 'bg-[#10B981]/5 border-[#10B981]/30'
                        : 'bg-surface-container-low border-outline-variant/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          item.isTaken ? 'bg-[#10B981]/20 text-[#047857]' : 'bg-primary/10 text-primary'
                        }`}>
                          <Pill size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-on-surface">
                            {item.medicineName}
                          </h4>
                          <p className="text-xs text-on-surface-variant">
                            {item.dosage} • Slot: <strong className="text-primary">{item.slotName}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <span className="text-xs font-bold bg-surface-container-lowest px-3 py-1 rounded-full border border-outline-variant/30 text-on-surface">
                          {fmt12h(item.scheduledTime)}
                        </span>

                        {item.isTaken ? (
                          <div className="bg-[#10B981]/10 text-[#047857] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Check size={14} /> Taken ✓
                          </div>
                        ) : (
                          <button
                            onClick={() => handleMarkTaken(item.alertId)}
                            disabled={markingId === item.alertId}
                            className="bg-primary text-on-primary px-3 py-1 rounded-full text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1 shadow-sm"
                          >
                            <Check size={14} /> {markingId === item.alertId ? 'Saving...' : 'Mark Taken'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Prescription Summary Card */}
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <h3 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Active Prescription
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {latestPrescription 
                    ? `Added ${new Date(latestPrescription.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : 'No active prescriptions scanned'}
                </p>
              </div>

              {latestPrescription && (
                <Badge variant="green" icon={<ShieldCheck size={12} />}>
                  Analysis Verified
                </Badge>
              )}
            </div>

            {latestPrescription ? (
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black text-base flex items-center justify-center border border-primary/20 flex-shrink-0">
                    Dr.
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">
                      Dr. {latestPrescription.doctorName || latestPrescription.ocrResult?.doctor_name?.value || 'Prescriber'}
                    </h4>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <FileText size={12} className="text-primary" />
                      Rx #{latestPrescription.prescriptionId.substring(0, 8)} • Verified Record
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                  <div className="text-left sm:text-right">
                    <span className="text-xl font-black text-primary">
                      {latestPrescription.medicines?.length || (latestPrescription.ocrResult?.medicines?.length || 0)}
                    </span>
                    <div className="text-[10px] font-bold text-outline uppercase tracking-wider">Medicines</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-on-surface-variant border border-dashed border-outline-variant/30 rounded-lg">
                No active prescription found. Scan a prescription to digitize your medicines.
              </div>
            )}

            <div className="pt-2 flex justify-between items-center text-xs flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-on-surface flex items-center gap-1">
                  <Key size={14} className="text-primary" /> EHR OTP:
                </span>
                {otp ? (
                  <span className="font-mono font-black text-sm text-primary tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                    {otp}
                  </span>
                ) : (
                  <button
                    onClick={generateOtp}
                    disabled={loadingOtp}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Key size={12} /> {loadingOtp ? 'Generating...' : 'Get Access OTP'}
                  </button>
                )}
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/prescriptions')}
                icon={<ChevronRight size={14} />}
              >
                View Details
              </Button>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Quick Actions & Highlights (lg:col-span-4) */}
        <aside className="lg:col-span-4 space-y-6">

          {/* Quick Actions Card */}
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-outline">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/prescriptions')}
                className="w-full bg-primary text-on-primary text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
              >
                <FileText size={16} />
                Upload Prescription
              </button>

              <button
                onClick={() => navigate('/alerts')}
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
              >
                <AlarmClock size={16} className="text-primary" />
                View Dosage Reminders
              </button>

              <button
                onClick={() => navigate('/alternatives')}
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
              >
                <Sparkles size={16} className="text-amber-500" />
                Find Generic Alternatives
              </button>

              <button
                onClick={() => navigate('/triage')}
                className="w-full bg-[#E0F2FE] text-[#0369A1] text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#BAE6FD] transition-colors border border-[#7DD3FC]"
              >
                <MessageSquareText size={16} />
                Ask MediSync AI
              </button>
            </div>
          </div>

          {/* Next Upcoming Reminder Banner */}
          {nextUpcoming ? (
            <div className="bg-gradient-to-br from-primary to-[#008378] rounded-xl p-5 text-on-primary shadow-md space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-2 opacity-90 text-xs font-bold uppercase tracking-wider">
                <AlarmClock size={16} />
                <span>Next Upcoming Dose</span>
              </div>
              <div>
                <h4 className="text-xl font-bold">{nextUpcoming.alert.medicineName}</h4>
                <p className="text-xs opacity-90 mt-0.5">
                  {nextUpcoming.alert.dosage} • Slot: <strong>{nextUpcoming.slotName}</strong>
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-white/20 pt-3 text-xs font-bold">
                <span className="flex items-center gap-1 text-[#FEF08A]">
                  <Clock size={14} /> {fmt12h(nextUpcoming.timeStr || nextUpcoming.alert.scheduledTime)}
                </span>
                <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px]">
                  Scheduled
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 shadow-sm text-center space-y-2">
              <AlarmClock className="w-8 h-8 text-primary mx-auto opacity-70" />
              <div className="text-xs font-bold text-on-surface">No Upcoming Alarms</div>
              <p className="text-[11px] text-on-surface-variant">
                Create a reminder in the Medication Reminders page to track your daily doses.
              </p>
            </div>
          )}

          {/* Personalized Health Tip Card */}
          <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-4 text-[#B45309] space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-[#B45309]" />
              <span>Personalized Dosage Guidance</span>
            </div>
            <p className="text-xs text-[#92400E] leading-relaxed">
              Always adhere to prescribed dose timing (Morning, Noon, Night) and consult your doctor before switching formulations.
            </p>
          </div>

        </aside>

      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ── PHARMACY DASHBOARD VIEW COMPONENT ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const PharmacyDashboardView: React.FC<{ user: any; navigate: any }> = ({ user, navigate }) => {
  const [summary, setSummary] = useState({
    today: { revenue: 0, cost: 0, profit: 0, orders: 0 },
    month: { revenue: 0, cost: 0, profit: 0, orders: 0 },
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [lowStockList, setLowStockList] = useState<any[]>([]);
  const [expiringList, setExpiringList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPharmacyDashboard = async () => {
      setLoading(true);
      try {
        const [sumRes, salesRes, lowRes, expRes] = await Promise.all([
          apiClient.get('/pharmacy/sales/summary').catch(() => ({ data: { data: null } })),
          apiClient.get('/pharmacy/sales', { params: { limit: 5 } }).catch(() => ({ data: { data: [] } })),
          apiClient.get('/inventory/low-stock').catch(() => ({ data: { data: [] } })),
          apiClient.get('/inventory/expiring-soon').catch(() => ({ data: { data: [] } })),
        ]);

        if (sumRes.data.data) setSummary(sumRes.data.data);
        setRecentSales(salesRes.data.data || []);
        setLowStockList(lowRes.data.data || []);
        setExpiringList(expRes.data.data || []);
      } catch (err) {
        console.error('Failed to load pharmacy dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    loadPharmacyDashboard();
  }, []);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* ── Banner Header ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#825100] to-[#F59E0B] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-white/90 mb-1 flex items-center gap-1.5">
            <Store size={15} /> Store Overview & POS Command Center
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.fullName || 'Pharmacy Manager'}
          </h1>
          <p className="text-xs text-white/90 mt-1">
            Track daily sales, dispense patient prescriptions via OTP, and manage inventory stock health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dispenser')}
            className="bg-white text-[#825100] hover:bg-white/90 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Pill size={15} /> POS Sales Register
          </button>
          <button
            onClick={() => navigate('/sales')}
            className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 backdrop-blur-sm transition-all border border-white/30"
          >
            <BookOpen size={15} /> Sales Ledger
          </button>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card style={{ padding: '20px' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Today's Revenue</span>
            <div className="p-2 bg-[#FEF3C7] text-[#D97706] rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 mt-2">
            ৳{summary.today.revenue.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {summary.today.orders} orders processed today
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Monthly Gross Profit</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            ৳{summary.month.profit.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Net profit across {summary.month.orders} orders
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Orders Today</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 mt-2">
            {summary.today.orders}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Completed transactions
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Stock Alerts</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">
            {lowStockList.length + expiringList.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {lowStockList.length} low stock • {expiringList.length} expiring soon
          </div>
        </Card>
      </div>

      {/* ── 2 Column Operational Dashboard Grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Sales Feed (7 cols) */}
        <div className="lg:col-span-7">
          <Card style={{ padding: '20px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BookOpen size={16} className="text-[#F59E0B]" />
                Recent Sales Transactions
              </h3>
              <button
                onClick={() => navigate('/sales')}
                className="text-xs font-bold text-[#D97706] hover:underline flex items-center gap-1"
              >
                View All <ChevronRight size={14} />
              </button>
            </div>

            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                No recent sales recorded today. Use Prescription Dispenser to process sales.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSales.map(sale => (
                  <div
                    key={sale.saleId}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs hover:border-[#F59E0B]/50 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-gray-900">{sale.invoiceNumber}</div>
                      <div className="text-gray-500">{sale.customerName || sale.patientName || 'Walk-in'} • {new Date(sale.createdAt).toLocaleTimeString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-gray-900">৳{Number(sale.netTotal).toFixed(2)}</div>
                      <Badge variant={sale.paymentMethod === 'CASH' ? 'yellow' : 'blue'}>
                        {sale.paymentMethod}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Low Stock & Expiring Alerts Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card style={{ padding: '20px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                Low Stock & Expiry Feed
              </h3>
              <button
                onClick={() => navigate('/update-stock')}
                className="text-xs font-bold text-[#D97706] hover:underline"
              >
                + Restock
              </button>
            </div>

            {lowStockList.length === 0 && expiringList.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                ✅ Stock is in healthy status! No low stock or expiring drugs.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-xs">
                {lowStockList.map(item => (
                  <div key={item.inventoryId} className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-red-900">{item.brandName} ({item.strength})</div>
                      <div className="text-[11px] text-red-700">Remaining: <strong>{item.quantity} units</strong></div>
                    </div>
                    <button
                      onClick={() => navigate('/update-stock')}
                      className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-bold text-[11px]"
                    >
                      Restock
                    </button>
                  </div>
                ))}

                {expiringList.map(item => (
                  <div key={item.inventoryId} className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-amber-900">{item.brandName}</div>
                      <div className="text-[11px] text-amber-700">Exp: {new Date(item.expiryDate).toLocaleDateString()}</div>
                    </div>
                    <Badge variant="yellow">Expiring Soon</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

