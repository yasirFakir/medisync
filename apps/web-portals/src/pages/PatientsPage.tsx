import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Badge, Spinner } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import {
  Search, KeyRound, User, Phone, Mail, Calendar, ShieldCheck,
  Stethoscope, FileText, ArrowRight, Activity, Plus, Filter,
  Users, RefreshCw, LayoutGrid, List
} from 'lucide-react';

interface Patient {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  createdAt: string;
  totalAppointments?: number;
  lastDiagnosis?: string | null;
}

export const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const navigate = useNavigate();

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users', { params: { role: 'PATIENT', search: query } });
      setPatients(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error('Failed to load patients directory', err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(fetchPatients, 300);
    return () => clearTimeout(timer);
  }, [fetchPatients]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* ── Top Header Banner ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#00685f] to-[#008378] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-white/80 mb-1">
            <Users size={14} /> Clinical Directory & Record Index
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Patient Directory</h1>
          <p className="text-xs text-white/90 mt-1 max-w-2xl">
            Inspect registered patient profiles, review historical diagnoses, and seamlessly access complete EHR clinical records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchPatients}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
          >
            <RefreshCw size={14} /> Refresh Directory
          </button>
        </div>
      </div>

      {/* ── Stat Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Total Patients</div>
            <div className="text-2xl font-black text-on-surface mt-0.5">{patients.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#00685f]/10 text-[#00685f] flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">With EHR History</div>
            <div className="text-2xl font-black text-on-surface mt-0.5">
              {patients.filter(p => p.lastDiagnosis || (p.totalAppointments ?? 0) > 0).length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity size={20} />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Verified Registrations</div>
            <div className="text-2xl font-black text-on-surface mt-0.5">{patients.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* ── Search & Toolbar Controls ──────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
          <input
            type="text"
            placeholder="Search directory by patient name, email, phone..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-[#00685f] transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant font-bold mr-1">View Mode:</span>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg border transition-all ${
              viewMode === 'grid'
                ? 'bg-[#00685f] text-white border-[#00685f]'
                : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
            }`}
            title="Grid View"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg border transition-all ${
              viewMode === 'table'
                ? 'bg-[#00685f] text-white border-[#00685f]'
                : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
            }`}
            title="Table View"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ── Patient List Display ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : patients.length === 0 ? (
        <div className="bg-surface-container-lowest border border-dashed border-outline-variant/40 rounded-2xl p-16 text-center space-y-3">
          <User className="w-12 h-12 text-[#00685f] mx-auto opacity-40" />
          <h3 className="font-bold text-on-surface text-base">No patient records found</h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            {query ? 'No matching patient profiles found for your search term.' : 'No registered patients are currently in the database directory.'}
          </p>
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs font-bold text-[#00685f] hover:underline pt-2 inline-block"
            >
              Clear Search Query
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View ────────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map(patient => {
            const initials = patient.fullName
              .split(' ')
              .map(n => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={patient.id}
                className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#00685f]/40 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00685f] to-[#008378] text-white font-black text-base flex items-center justify-center flex-shrink-0 shadow-sm">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-on-surface group-hover:text-[#00685f] transition-colors truncate">
                          {patient.fullName}
                        </h3>
                        <p className="text-[11px] text-on-surface-variant font-mono truncate">ID: {patient.id.substring(0, 8)}</p>
                      </div>
                    </div>
                    <Badge variant="blue">Patient</Badge>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 text-xs">
                    <div className="flex items-center gap-2 text-on-surface-variant truncate">
                      <Mail size={12} className="text-[#00685f] flex-shrink-0" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Phone size={12} className="text-[#00685f] flex-shrink-0" />
                      <span>{patient.phoneNumber || 'Phone not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Calendar size={12} className="text-[#00685f] flex-shrink-0" />
                      <span>Member since {new Date(patient.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Last Diagnosis / Medical Badge */}
                  {patient.lastDiagnosis ? (
                    <div className="bg-[#00685f]/5 border border-[#00685f]/15 rounded-xl p-2.5 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00685f] block">Recent Diagnosis</span>
                      <p className="font-semibold text-on-surface text-xs mt-0.5 line-clamp-1">{patient.lastDiagnosis}</p>
                    </div>
                  ) : (
                    <div className="text-[11px] text-on-surface-variant/70 italic px-1">
                      No recent diagnosis logs recorded
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-outline-variant/20 flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/ehr/${patient.id}`)}
                    className="flex-1 bg-[#00685f] text-white text-xs font-bold py-2 px-3 rounded-xl hover:bg-[#00524b] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <FileText size={13} /> View EHR Records
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/ehr/${patient.id}`)}
                    className="px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container transition-all"
                    title="Direct View"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table View ───────────────────────────────────────────────────────── */
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Patient Name</th>
                  <th className="py-3.5 px-4">Email Coordinate</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Last Clinical Notes</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">EHR Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                {patients.map(p => (
                  <tr key={p.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#00685f]/10 text-[#00685f] font-black text-xs flex items-center justify-center">
                        {p.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div>{p.fullName}</div>
                        <div className="text-[10px] font-mono text-on-surface-variant">ID: {p.id.substring(0, 8)}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">{p.email}</td>
                    <td className="py-3.5 px-4 text-on-surface-variant">{p.phoneNumber || '—'}</td>
                    <td className="py-3.5 px-4">
                      {p.lastDiagnosis ? (
                        <span className="bg-[#00685f]/10 text-[#00685f] font-bold px-2 py-0.5 rounded text-[11px]">
                          {p.lastDiagnosis}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/60 italic text-[11px]">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/ehr/${p.id}`)}
                        className="inline-flex items-center gap-1 bg-[#00685f] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#00524b] transition-all shadow-sm"
                      >
                        <FileText size={12} /> View EHR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
