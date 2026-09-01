import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal, Button, Badge, Spinner } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import {
  Search, Filter, MapPin, Star, Clock, Calendar, Stethoscope, User,
  CheckCircle, XCircle, ChevronRight, Building2, Languages, GraduationCap,
  BadgeDollarSign, Award, CalendarCheck, CalendarX, History, Loader2,
  SlidersHorizontal, ChevronDown, RefreshCw
} from 'lucide-react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface DoctorSlot {
  slotId: string;
  locationName: string;
  address?: string;
  dayOfWeek?: number[];
  specificDates?: string[];
  startTime: string;
  endTime: string;
  maxPatients?: number;
}

interface Doctor {
  doctorId: string;
  fullName: string;
  designation: string;
  specialization?: string;
  qualifications?: string;
  bio?: string;
  consultationFee: number;
  experienceYears: number;
  area?: string;
  city?: string;
  avatarUrl?: string;
  rating: number;
  totalReviews: number;
  languages?: string[];
  slots: DoctorSlot[];
}

interface Appointment {
  appointmentId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  locationName: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  reason?: string;
  doctorName: string;
  designation?: string;
  specialization?: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
  PENDING:   { label: 'Pending',   variant: 'yellow', icon: <Clock size={12} /> },
  CONFIRMED: { label: 'Confirmed', variant: 'green',  icon: <CheckCircle size={12} /> },
  CANCELLED: { label: 'Cancelled', variant: 'red',    icon: <XCircle size={12} /> },
  COMPLETED: { label: 'Completed', variant: 'blue',   icon: <CheckCircle size={12} /> },
};

const DESIGNATIONS = ['Cardiologist', 'Gynecologist', 'General Physician', 'Dermatologist', 'Neurologist', 'Orthopedic', 'Pediatrician', 'Psychiatrist', 'ENT Specialist', 'Ophthalmologist'];
const CITIES = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal'];

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating: React.FC<{ rating?: number | string | null; reviews?: number | string | null }> = ({ rating, reviews }) => {
  const numRating = Number(rating ?? 5.0) || 5.0;
  const numReviews = Number(reviews ?? 0) || 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={12}
          className={i <= Math.round(numRating) ? 'text-amber-400 fill-amber-400' : 'text-outline-variant/40'}
        />
      ))}
      <span className="text-xs font-bold text-on-surface ml-0.5">{numRating.toFixed(1)}</span>
      <span className="text-[11px] text-on-surface-variant">({numReviews})</span>
    </div>
  );
};

// ─── Doctor Card ──────────────────────────────────────────────────────────────
const DoctorCard: React.FC<{ doctor: Doctor; onViewProfile: (d: Doctor) => void }> = ({ doctor, onViewProfile }) => {
  const initials = (doctor.fullName || 'Dr').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const uniqueDays = Array.from(new Set((doctor.slots || []).flatMap(s => s.dayOfWeek || []))).sort();
  const fee = Number(doctor.consultationFee || 0);

  return (
    <div
      className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col gap-4 cursor-pointer group"
      onClick={() => onViewProfile(doctor)}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-black text-lg flex-shrink-0 shadow-sm">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors truncate">
            {doctor.fullName}
          </h3>
          <p className="text-xs font-semibold text-primary">{doctor.designation}</p>
          {doctor.specialization && (
            <p className="text-[11px] text-on-surface-variant truncate">{doctor.specialization}</p>
          )}
        </div>
        <ChevronRight size={16} className="text-outline-variant/50 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
      </div>

      {/* Rating & Fee */}
      <div className="flex items-center justify-between gap-2">
        <StarRating rating={doctor.rating} reviews={doctor.totalReviews} />
        <div className="text-right">
          <div className="text-[10px] text-on-surface-variant">Consultation Fee</div>
          <div className="text-base font-black text-primary">৳{fee}</div>
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        {(doctor.area || doctor.city) && (
          <span className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-full border border-outline-variant/20 text-on-surface-variant font-medium">
            <MapPin size={10} className="text-primary" />
            {[doctor.area, doctor.city].filter(Boolean).join(', ')}
          </span>
        )}
        <span className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-full border border-outline-variant/20 text-on-surface-variant font-medium">
          <Award size={10} className="text-amber-500" />
          {doctor.experienceYears}yr exp
        </span>
      </div>

      {/* Available Days */}
      {uniqueDays.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Available Days</div>
          <div className="flex flex-wrap gap-1">
            {DAY_NAMES.map((d, idx) => (
              <span
                key={idx}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  uniqueDays.includes(idx)
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface-container text-on-surface-variant/40'
                }`}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onViewProfile(doctor); }}
        className="w-full bg-primary text-on-primary text-xs font-bold py-2.5 px-4 rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
      >
        <CalendarCheck size={14} /> View Profile & Book
      </button>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const AppointmentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMinFee, setFilterMinFee] = useState('');
  const [filterMaxFee, setFilterMaxFee] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);
  const [activeTab, setActiveTab] = useState<'find' | 'my'>(() => {
    return searchParams.get('tab') === 'my' ? 'my' : 'find';
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'my' || tab === 'find') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'find' | 'my') => {
    setActiveTab(tab);
    setSearchParams(tab === 'my' ? { tab: 'my' } : {});
  };

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<DoctorSlot | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingStartTime, setBookingStartTime] = useState('');
  const [bookingEndTime, setBookingEndTime] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // ── Fetch Doctors ─────────────────────────────────────────────────────────
  const fetchDoctors = useCallback(async () => {
    setLoadingDoctors(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterCity) params.city = filterCity;
      if (filterDesignation) params.designation = filterDesignation;
      if (filterArea) params.area = filterArea;
      if (filterDate) params.date = filterDate;
      if (filterMinFee) params.minFee = filterMinFee;
      if (filterMaxFee) params.maxFee = filterMaxFee;
      const res = await apiClient.get('/appointments/doctors', { params });
      setDoctors(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    } finally {
      setLoadingDoctors(false);
    }
  }, [search, filterCity, filterDesignation, filterArea, filterDate, filterMinFee, filterMaxFee]);

  useEffect(() => {
    const t = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(t);
  }, [fetchDoctors]);

  // ── Fetch My Appointments ─────────────────────────────────────────────────
  const fetchMyAppointments = useCallback(async () => {
    setLoadingMy(true);
    try {
      const res = await apiClient.get('/appointments/my');
      setMyAppointments(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    } finally {
      setLoadingMy(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'my') fetchMyAppointments();
  }, [activeTab, fetchMyAppointments]);

  // ── Open Profile Modal ────────────────────────────────────────────────────
  const openProfile = async (doctor: Doctor) => {
    try {
      const res = await apiClient.get(`/appointments/doctors/${doctor.doctorId}`);
      setSelectedDoctor(res.data?.data || doctor);
    } catch {
      setSelectedDoctor(doctor);
    }
    setIsProfileOpen(true);
  };

  // ── Open Booking Modal ────────────────────────────────────────────────────
  const openBooking = (slot?: DoctorSlot | null) => {
    const activeSlot = slot || {
      slotId: '',
      locationName: selectedDoctor?.area ? `${selectedDoctor.area} Medical Chamber` : 'Main Consultation Suite',
      address: selectedDoctor?.city || 'Main Clinic',
      startTime: '09:00:00',
      endTime: '12:00:00',
    };
    setBookingSlot(activeSlot);
    setBookingDate('');
    setBookingStartTime(activeSlot.startTime ? activeSlot.startTime.slice(0, 5) : '09:00');
    setBookingEndTime(activeSlot.endTime ? activeSlot.endTime.slice(0, 5) : '12:00');
    setBookingReason('');
    setBookingSuccess(false);
    setIsBookingOpen(true);
  };

  // ── Submit Booking ────────────────────────────────────────────────────────
  const handleBook = async () => {
    if (!selectedDoctor || !bookingDate) return;
    setBookingLoading(true);
    try {
      await apiClient.post('/appointments', {
        doctorId: selectedDoctor.doctorId,
        slotId: bookingSlot?.slotId || undefined,
        appointmentDate: bookingDate,
        startTime: bookingStartTime || '09:00',
        endTime: bookingEndTime || '10:00',
        reason: bookingReason,
      });
      setBookingSuccess(true);
      fetchMyAppointments();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to book. Please try another time slot.');
    } finally {
      setBookingLoading(false);
    }
  };

  // ── Cancel Appointment ────────────────────────────────────────────────────
  const handleCancel = async (appointmentId: string) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setCancellingId(appointmentId);
    try {
      await apiClient.patch(`/appointments/${appointmentId}/status`, { status: 'CANCELLED' });
      setMyAppointments(prev => prev.map(a => a.appointmentId === appointmentId ? { ...a, status: 'CANCELLED' as const } : a));
    } catch (err) {
      console.error('Failed to cancel', err);
    } finally {
      setCancellingId(null);
    }
  };

  const clearFilters = () => {
    setSearch(''); setFilterCity(''); setFilterDesignation('');
    setFilterArea(''); setFilterDate(''); setFilterMinFee(''); setFilterMaxFee('');
  };

  const hasFilters = !!(search || filterCity || filterDesignation || filterArea || filterDate || filterMinFee || filterMaxFee);
  const activeCount = myAppointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED').length;

  return (
    <div className="bg-background text-on-background min-h-screen p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider text-outline font-bold">Patient Portal</span>
            <ChevronRight size={14} className="text-outline" />
            <span className="text-xs text-primary font-bold">Doctor Appointments</span>
          </div>
          <h2 className="text-headline-lg-mobile md:text-headline-lg font-extrabold text-on-surface tracking-tight">
            Book Doctor Appointments
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 max-w-xl">
            Find verified doctors, check availability and request appointments. Filter by specialty, area, fee, and date.
          </p>
        </div>

        <div className="flex gap-1 bg-surface-container-low border border-outline-variant/30 p-1 rounded-xl self-start md:self-auto">
          <button
            type="button"
            onClick={() => handleTabChange('find')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'find' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Search size={14} /> Find Doctors
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('my')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'my' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <History size={14} /> My Appointments
            {activeCount > 0 && (
              <span className="bg-red-500 text-white px-1.5 rounded-full text-[10px] font-black min-w-[16px] text-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─────────────── FIND DOCTORS TAB ─────────────────────────────────── */}
      {activeTab === 'find' && (
        <div className="space-y-4">
          {/* Search + Filter Bar */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by doctor name or specialization..."
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-sm text-on-surface outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFilters(v => !v)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold border transition-all ${
                    showFilters ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary bg-surface-container-low'
                  }`}
                >
                  <SlidersHorizontal size={14} />
                  Filters
                  {hasFilters && <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />}
                  <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 bg-surface-container-low transition-all"
                  >
                    <RefreshCw size={12} /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-outline-variant/20">
                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant block mb-1">City</label>
                  <select
                    value={filterCity}
                    onChange={e => setFilterCity(e.target.value)}
                    className="w-full px-2.5 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface outline-none focus:border-primary"
                  >
                    <option value="">All Cities</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant block mb-1">Specialty / Designation</label>
                  <select
                    value={filterDesignation}
                    onChange={e => setFilterDesignation(e.target.value)}
                    className="w-full px-2.5 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface outline-none focus:border-primary"
                  >
                    <option value="">All Specialties</option>
                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant block mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={filterArea}
                    onChange={e => setFilterArea(e.target.value)}
                    placeholder="e.g. Gulshan"
                    className="w-full px-2.5 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant block mb-1">Available on Date</label>
                  <input
                    type="date"
                    value={filterDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setFilterDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant block mb-1">Fee Range (৳)</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={filterMinFee}
                      onChange={e => setFilterMinFee(e.target.value)}
                      placeholder="Min"
                      className="w-1/2 px-2 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface outline-none focus:border-primary"
                    />
                    <input
                      type="number"
                      value={filterMaxFee}
                      onChange={e => setFilterMaxFee(e.target.value)}
                      placeholder="Max"
                      className="w-1/2 px-2 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {loadingDoctors ? (
            <div className="flex justify-center py-20"><Spinner size={32} /></div>
          ) : doctors.length === 0 ? (
            <div className="bg-surface-container-lowest border border-dashed border-outline-variant/40 rounded-xl p-16 text-center space-y-4">
              <Stethoscope className="w-12 h-12 text-primary mx-auto opacity-40" />
              <h4 className="font-bold text-on-surface">No doctors found</h4>
              <p className="text-xs text-on-surface-variant">Try adjusting your filters or search terms</p>
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="text-xs text-primary font-bold hover:underline">
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-on-surface-variant">
                  <span className="font-black text-on-surface">{doctors.length}</span> doctor{doctors.length !== 1 ? 's' : ''} available
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map(doc => (
                  <DoctorCard key={doc.doctorId} doctor={doc} onViewProfile={openProfile} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─────────────── MY APPOINTMENTS TAB ──────────────────────────────── */}
      {activeTab === 'my' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-on-surface flex items-center gap-2">
              <CalendarCheck size={18} className="text-primary" /> My Appointments
              {activeCount > 0 && (
                <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                  {activeCount} active
                </span>
              )}
            </h3>
            <button type="button" onClick={fetchMyAppointments} className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {loadingMy ? (
            <div className="flex justify-center py-16"><Spinner size={32} /></div>
          ) : myAppointments.length === 0 ? (
            <div className="bg-surface-container-lowest border border-dashed border-outline-variant/40 rounded-xl p-16 text-center space-y-4">
              <CalendarX className="w-12 h-12 text-primary mx-auto opacity-40" />
              <h4 className="font-bold text-on-surface">No appointments yet</h4>
              <p className="text-xs text-on-surface-variant">Find a doctor and book your first appointment</p>
              <button type="button" onClick={() => setActiveTab('find')} className="text-xs text-primary font-bold hover:underline">
                Browse Doctors →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myAppointments.map(appt => {
                const cfg = statusConfig[appt.status] || statusConfig.PENDING;
                const isPast = new Date(`${appt.appointmentDate}T23:59:59`) < new Date();
                return (
                  <div
                    key={appt.appointmentId}
                    className={`bg-surface-container-lowest border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      appt.status === 'CANCELLED' ? 'opacity-60 border-outline-variant/20' : 'border-outline-variant/30 hover:border-primary/30 hover:shadow-md'
                    }`}
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
                          <h4 className="font-bold text-on-surface">{appt.doctorName}</h4>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                        {(appt.designation || appt.specialization) && (
                          <p className="text-xs text-primary font-semibold">
                            {[appt.designation, appt.specialization].filter(Boolean).join(' · ')}
                          </p>
                        )}
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
                          <p className="text-[11px] text-on-surface-variant italic mt-0.5">"{appt.reason}"</p>
                        )}
                      </div>
                    </div>

                    {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && !isPast && (
                      <button
                        type="button"
                        onClick={() => handleCancel(appt.appointmentId)}
                        disabled={cancellingId === appt.appointmentId}
                        className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 bg-surface-container-low transition-all disabled:opacity-50 flex-shrink-0"
                      >
                        {cancellingId === appt.appointmentId ? <Loader2 size={13} className="animate-spin" /> : <CalendarX size={13} />}
                        Cancel
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────── DOCTOR PROFILE MODAL ─────────────────────────────── */}
      {isProfileOpen && selectedDoctor && (
        <Modal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} title="Doctor Profile" size="xl">
          <div className="space-y-5">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row gap-5 p-5 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-black text-2xl flex-shrink-0 shadow-md">
                {selectedDoctor.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <h2 className="text-xl font-black text-on-surface">{selectedDoctor.fullName}</h2>
                  <p className="text-sm font-bold text-primary">{selectedDoctor.designation}</p>
                  {selectedDoctor.specialization && (
                    <p className="text-xs text-on-surface-variant">{selectedDoctor.specialization}</p>
                  )}
                </div>
                <StarRating rating={selectedDoctor.rating} reviews={selectedDoctor.totalReviews} />
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    <BadgeDollarSign size={12} /> ৳{selectedDoctor.consultationFee} consultation fee
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    <Award size={12} /> {selectedDoctor.experienceYears} yrs experience
                  </span>
                  {(selectedDoctor.area || selectedDoctor.city) && (
                    <span className="flex items-center gap-1 text-xs font-bold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
                      <MapPin size={12} /> {[selectedDoctor.area, selectedDoctor.city].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedDoctor.qualifications && (
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 space-y-1.5">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <GraduationCap size={13} /> Qualifications
                  </h4>
                  <p className="text-sm text-on-surface font-medium">{selectedDoctor.qualifications}</p>
                </div>
              )}
              {selectedDoctor.languages && selectedDoctor.languages.length > 0 && (
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 space-y-1.5">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Languages size={13} /> Languages
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoctor.languages.map(lang => (
                      <span key={lang} className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">{lang}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedDoctor.bio && (
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 space-y-1.5">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-primary">About</h4>
                <p className="text-sm text-on-surface leading-relaxed">{selectedDoctor.bio}</p>
              </div>
            )}

            {/* Slots */}
            <div className="space-y-3">
              <h4 className="font-bold text-on-surface flex items-center gap-2">
                <Calendar size={16} className="text-primary" /> Clinic Locations & Schedules
              </h4>

              {selectedDoctor.slots.length === 0 ? (
                <div className="text-center py-6 px-4 bg-surface-container-low border border-dashed border-outline-variant/40 rounded-xl space-y-3">
                  <p className="text-xs text-on-surface-variant font-medium">
                    No custom clinic slots listed. You can still request a general consultation appointment.
                  </p>
                  <button
                    type="button"
                    onClick={() => openBooking(null)}
                    className="bg-primary text-on-primary text-xs font-bold py-2.5 px-5 rounded-lg hover:bg-primary/90 transition-all inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <CalendarCheck size={14} /> Request General Consultation
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedDoctor.slots.map(slot => {
                    const days = slot.dayOfWeek?.map(d => DAY_FULL[d]).join(', ') || 'All Days';
                    return (
                      <div key={slot.slotId} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 space-y-3 hover:border-primary/40 hover:shadow-sm transition-all">
                        <div>
                          <div className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                            <Building2 size={14} className="text-primary flex-shrink-0" /> {slot.locationName}
                          </div>
                          {slot.address && (
                            <div className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                              <MapPin size={10} className="flex-shrink-0" /> {slot.address}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
                            <Clock size={11} /> {fmt12h(slot.startTime)} – {fmt12h(slot.endTime)}
                          </span>
                          {slot.maxPatients && (
                            <span className="flex items-center gap-1 text-on-surface-variant bg-surface-container px-2 py-1 rounded-full font-medium">
                              <User size={11} /> Max {slot.maxPatients} patients
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          <span className="font-bold text-on-surface">Available: </span>{days}
                        </div>
                        <button
                          type="button"
                          onClick={() => openBooking(slot)}
                          className="w-full bg-primary text-on-primary text-xs font-bold py-2.5 px-4 rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
                        >
                          <CalendarCheck size={13} /> Book This Slot
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ─────────────── BOOKING MODAL ────────────────────────────────────── */}
      {isBookingOpen && bookingSlot && selectedDoctor && (
        <Modal
          isOpen={isBookingOpen}
          onClose={() => { setIsBookingOpen(false); setBookingSuccess(false); }}
          title={bookingSuccess ? 'Appointment Requested!' : 'Book Appointment'}
          size="md"
        >
          {bookingSuccess ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-[#10B981]" />
              </div>
              <div>
                <h3 className="font-black text-on-surface text-lg">Request Sent!</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Your appointment with <strong>{selectedDoctor.fullName}</strong> has been submitted. The doctor will confirm shortly.
                </p>
              </div>
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-4 text-left space-y-2.5">
                {[
                  ['Location', bookingSlot.locationName],
                  ['Date', new Date(bookingDate + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })],
                  ['Time', `${fmt12h(bookingStartTime)} – ${fmt12h(bookingEndTime)}`],
                  ['Consultation Fee', `৳${selectedDoctor.consultationFee}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">{label}</span>
                    <span className="font-bold text-on-surface">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <Button type="button" variant="secondary" onClick={() => { setIsBookingOpen(false); setBookingSuccess(false); }}>Close</Button>
                <Button type="button" onClick={() => { setIsBookingOpen(false); setBookingSuccess(false); setActiveTab('my'); }}>
                  View My Appointments
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Slot Summary */}
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/15 space-y-2 text-sm">
                <div className="font-bold text-primary flex items-center gap-2">
                  <Building2 size={14} /> {bookingSlot.locationName}
                </div>
                {bookingSlot.address && (
                  <div className="text-xs text-on-surface-variant flex items-center gap-1">
                    <MapPin size={10} /> {bookingSlot.address}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <Clock size={11} /> Slot: {fmt12h(bookingSlot.startTime)} – {fmt12h(bookingSlot.endTime)}
                </div>
                <div className="text-xs text-on-surface-variant">
                  <span className="font-bold text-on-surface">Regular days: </span>
                  {bookingSlot.dayOfWeek?.map(d => DAY_FULL[d]).join(', ') || 'All Days'}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1.5">
                  Appointment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setBookingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary transition-all"
                />
                {bookingDate && bookingSlot.dayOfWeek && !bookingSlot.dayOfWeek.includes(new Date(bookingDate + 'T00:00:00').getDay()) && (
                  <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                    ⚠ Doctor may not be at this location on {DAY_FULL[new Date(bookingDate + 'T00:00:00').getDay()]}s.
                  </p>
                )}
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1.5">Preferred Start Time</label>
                  <input
                    type="time"
                    value={bookingStartTime}
                    onChange={e => setBookingStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={bookingEndTime}
                    onChange={e => setBookingEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1.5">Reason for Visit</label>
                <textarea
                  value={bookingReason}
                  onChange={e => setBookingReason(e.target.value)}
                  rows={3}
                  placeholder="Briefly describe your symptoms or reason for the consultation..."
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary resize-none transition-all"
                />
              </div>

              {/* Fee notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs flex items-center gap-2">
                <BadgeDollarSign size={14} className="text-amber-600 flex-shrink-0" />
                <span className="text-amber-700">
                  Consultation fee: <strong>৳{selectedDoctor.consultationFee}</strong> · Payment collected at the clinic.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <Button type="button" variant="secondary" onClick={() => setIsBookingOpen(false)}>Cancel</Button>
                <Button
                  type="button"
                  loading={bookingLoading}
                  disabled={bookingLoading || !bookingDate}
                  onClick={handleBook}
                  icon={<CalendarCheck size={14} />}
                >
                  Confirm Request
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
