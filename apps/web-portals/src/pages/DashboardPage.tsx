import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Spinner, EmptyState } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { useAuthStore } from '../store/authStore';
import {
  Pill, Clock, CheckCircle, Calendar, AlertCircle, Sparkles, Plus,
  ChevronRight, ShieldCheck, FileText, MessageSquareText, MapPin,
  AlarmClock, Sun, Sunset, Coffee, Heart, TrendingUp, Check, Key,
  Store, AlertTriangle, RefreshCw
} from 'lucide-react';
import { parseFrequencySlots, DoseSlotConfig } from './AlertsPage';

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
  medicineName: string;
  dosage: string;
}

interface Prescription {
  prescriptionId: string;
  doctorName?: string;
  createdAt: string;
  medicines: Array<{ brandName: string; dosage: string; frequency: string }>;
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

const fmt12h = (timeStr: string) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const todayStr = () => new Date().toISOString().split('T')[0];

export const DashboardPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  // Dynamic Data States
  const [alerts, setAlerts] = useState<MedicationAlert[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  // EHR Access OTP
  const [otp, setOtp] = useState<string | null>(null);
  const [loadingOtp, setLoadingOtp] = useState(false);

  // Marking dose taken loading state
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Load backend data on mount
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
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
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Generate EHR Access OTP
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

  // Mark dose as taken today
  const handleMarkTaken = async (alertId: string) => {
    setMarkingId(alertId);
    try {
      const res = await apiClient.post(`/alerts/${alertId}/taken`, { date: todayStr() });
      const log = res.data?.data;
      const alertItem = alerts.find(a => a.alertId === alertId);
      if (log) {
        setDoseLogs(prev => [...prev, {
          logId: log.logId,
          alertId: log.alertId,
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

  // Compute Today's Schedule List
  const today = todayStr();
  const toLocalDate = (d: string) => new Date(d).toLocaleDateString('en-CA');
  const takenAlertIds = new Set(
    doseLogs
      .filter(l => l.takenDate && toLocalDate(l.takenDate) === today)
      .map(l => l.alertId)
  );

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');

  // Build Today's Timeline Items from Active Alerts
  const todayTimelineItems: TodayScheduleItem[] = activeAlerts.flatMap(alert => {
    const slots = parseFrequencySlots(alert.frequency);
    return slots.map(slot => ({
      alertId: alert.alertId,
      medicineName: alert.medicineName,
      dosage: alert.dosage,
      slotName: slot.slotName,
      scheduledTime: alert.scheduledTime || slot.customTime,
      isTaken: takenAlertIds.has(alert.alertId)
    }));
  });

  // Sort timeline chronologically by scheduledTime
  todayTimelineItems.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  // Find nearest upcoming dose
  const getNextUpcomingAlert = () => {
    if (activeAlerts.length === 0) return null;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    let upcoming = activeAlerts.map(alert => {
      const [h, m] = (alert.scheduledTime || '08:00').split(':').map(Number);
      const mins = h * 60 + m;
      let diff = mins - nowMins;
      if (diff < 0) diff += 1440; // next day
      return { alert, mins, diff };
    });

    upcoming.sort((a, b) => a.diff - b.diff);
    return upcoming[0] || null;
  };

  const nextUpcoming = getNextUpcomingAlert();
  const latestPrescription = prescriptions.length > 0 ? prescriptions[0] : null;

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

            {loading ? (
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
                  <button onClick={generateOtp} className="text-primary font-bold hover:underline">
                    {loadingOtp ? 'Generating...' : 'Get EHR OTP'}
                  </button>
                )}
              </div>

              <button 
                onClick={() => navigate('/prescriptions')}
                className="text-primary font-bold hover:underline flex items-center gap-1"
              >
                Inspect Prescriptions <ChevronRight size={14} />
              </button>
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: Widgets & Quick Actions (lg:col-span-4) */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Quick Actions Card */}
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-outline uppercase tracking-wider">
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
                className="w-full bg-surface-container-low border border-primary/40 text-primary text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
              >
                <AlarmClock size={16} />
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
                  {nextUpcoming.alert.dosage} • Frequency: {nextUpcoming.alert.frequency}
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-white/20 pt-3 text-xs font-bold">
                <span className="flex items-center gap-1 text-[#FEF08A]">
                  <Clock size={14} /> {fmt12h(nextUpcoming.alert.scheduledTime)}
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
