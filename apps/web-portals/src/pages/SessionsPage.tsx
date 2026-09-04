import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Modal, Spinner } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import {
  Calendar, Eye, Search, User, ClipboardList, AlertTriangle,
  CheckCircle2, Clock, FolderOpen, RefreshCw, Activity, Users, CalendarClock, Bell
} from 'lucide-react';

interface Session {
  recordId: string;
  patientId: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  diagnosis: string;
  observations: string;
  sessionDate?: string;
  createdAt?: string;
  followUpDate?: string;
}

const today = new Date();
today.setHours(0, 0, 0, 0);

const getFollowUpStatus = (dateStr?: string): 'overdue' | 'today' | 'upcoming' | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = d.getTime() - today.getTime();
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  return 'upcoming';
};

const fmtDate = (str?: string) => {
  if (!str) return 'N/A';
  return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const SessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'followup' | 'overdue'>('all');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/ehr/records/my-sessions');
      setSessions(res.data.data || []);
    } catch (err) {
      console.error('Failed to load session logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const uniquePatients = new Set(sessions.map(s => s.patientId)).size;
    const withFollowUp = sessions.filter(s => !!s.followUpDate);
    const overdue = withFollowUp.filter(s => getFollowUpStatus(s.followUpDate) === 'overdue');
    const dueToday = withFollowUp.filter(s => getFollowUpStatus(s.followUpDate) === 'today');
    const upcoming = withFollowUp.filter(s => getFollowUpStatus(s.followUpDate) === 'upcoming');
    return { total: sessions.length, uniquePatients, overdue: overdue.length, dueToday: dueToday.length, upcoming: upcoming.length };
  }, [sessions]);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...sessions];
    if (filter === 'followup') list = list.filter(s => !!s.followUpDate && getFollowUpStatus(s.followUpDate) !== 'overdue');
    if (filter === 'overdue') list = list.filter(s => getFollowUpStatus(s.followUpDate) === 'overdue');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.patientName?.toLowerCase().includes(q) ||
        s.diagnosis?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [sessions, filter, search]);

  const handleOpenEHR = (patientId: string) => {
    if (!patientId) return;
    navigate(`/ehr/${patientId}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Clinical Session Logs</h2>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '2px' }}>
            Your complete clinical history, follow-up tracker, and patient visit ledger
          </p>
        </div>
        <button
          type="button"
          onClick={fetchSessions}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', background: '#00685f', color: '#fff',
            fontWeight: 700, fontSize: '0.8125rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Total Sessions', value: stats.total, icon: <Activity size={18} />, color: '#00685f', bg: '#f0fdf4' },
          { label: 'Unique Patients', value: stats.uniquePatients, icon: <Users size={18} />, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Upcoming Follow-ups', value: stats.upcoming, icon: <CalendarClock size={18} />, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Due Today', value: stats.dueToday, icon: <Bell size={18} />, color: '#d97706', bg: '#fffbeb', pulse: stats.dueToday > 0 },
          { label: 'Overdue Follow-ups', value: stats.overdue, icon: <AlertTriangle size={18} />, color: '#dc2626', bg: '#fef2f2', pulse: stats.overdue > 0 },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: stat.bg,
              border: `1px solid ${stat.color}25`,
              borderRadius: '12px',
              padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '6px',
            }}
          >
            <div style={{ color: stat.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {stat.icon}
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>
              {loading ? '—' : stat.value}
              {(stat as any).pulse && stat.value > 0 && (
                <span style={{
                  display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                  background: stat.color, marginLeft: '8px', verticalAlign: 'middle',
                  animation: 'pulse 1.5s infinite',
                }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters + Search ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '240px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by patient or diagnosis…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px',
              border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8125rem',
              color: '#0f172a', outline: 'none', boxSizing: 'border-box',
              background: '#ffffff',
            }}
          />
        </div>

        {[
          { key: 'all', label: 'All Sessions' },
          { key: 'followup', label: '🗓 Follow-up Pending' },
          { key: 'overdue', label: '⚠️ Overdue' },
        ].map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key as any)}
            style={{
              padding: '8px 14px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px',
              border: filter === f.key ? '1px solid #00685f' : '1px solid #e2e8f0',
              background: filter === f.key ? '#00685f' : '#ffffff',
              color: filter === f.key ? '#ffffff' : '#475569',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {f.label}
          </button>
        ))}

        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginLeft: 'auto' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Session Cards ────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          padding: '64px 24px', border: '2px dashed #e2e8f0', borderRadius: '16px', textAlign: 'center',
        }}>
          <ClipboardList size={40} color="#cbd5e1" />
          <div style={{ fontWeight: 700, color: '#94a3b8', fontSize: '1rem' }}>
            {search || filter !== 'all' ? 'No sessions match this filter.' : 'No clinical sessions recorded yet.'}
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.8125rem', maxWidth: '320px' }}>
            Sessions appear here after you add Clinical Notes from a patient's EHR record page.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(session => {
            const followUpStatus = getFollowUpStatus(session.followUpDate);
            const sessionDt = session.sessionDate || session.createdAt;

            const followUpColors: Record<string, { bg: string; text: string; label: string }> = {
              overdue: { bg: '#fef2f2', text: '#dc2626', label: '⚠️ Overdue' },
              today:   { bg: '#fffbeb', text: '#d97706', label: '🔔 Due Today' },
              upcoming:{ bg: '#f0fdf4', text: '#16a34a', label: '🗓 Upcoming' },
            };
            const fuCfg = followUpStatus ? followUpColors[followUpStatus] : null;

            return (
              <div
                key={session.recordId}
                style={{
                  background: '#ffffff',
                  border: followUpStatus === 'overdue' ? '1px solid #fecaca' : '1px solid #e2e8f0',
                  borderLeft: followUpStatus === 'overdue' ? '4px solid #dc2626'
                    : followUpStatus === 'today' ? '4px solid #f59e0b'
                    : '4px solid #00685f',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  display: 'flex', flexDirection: 'column', gap: '10px',
                  boxShadow: followUpStatus === 'overdue' ? '0 2px 8px rgba(220,38,38,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.2s',
                }}
              >
                {/* Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '10px',
                      background: 'rgba(0,104,95,0.10)', color: '#00685f',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <User size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0f172a' }}>
                        {session.patientName || session.doctorName || 'Clinical Record'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                        <Calendar size={11} />
                        {fmtDate(sessionDt)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {fuCfg && (
                      <span style={{
                        padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700,
                        background: fuCfg.bg, color: fuCfg.text, border: `1px solid ${fuCfg.text}30`,
                      }}>
                        {fuCfg.label}
                      </span>
                    )}
                    <span style={{
                      padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700,
                      background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                    }}>
                      Clinical Note
                    </span>
                  </div>
                </div>

                {/* Diagnosis */}
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>
                    Diagnosis
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                    {session.diagnosis}
                  </div>
                </div>

                {/* Observations preview */}
                {session.observations && (
                  <div style={{
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
                    padding: '10px 14px', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.55,
                    maxHeight: '56px', overflow: 'hidden', position: 'relative',
                  }}>
                    {session.observations}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: '24px',
                      background: 'linear-gradient(transparent, #f8fafc)',
                    }} />
                  </div>
                )}

                {/* Follow-up Date */}
                {session.followUpDate && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '0.78rem', fontWeight: 700,
                    color: followUpStatus === 'overdue' ? '#dc2626' : followUpStatus === 'today' ? '#d97706' : '#16a34a',
                  }}>
                    <Clock size={13} />
                    Follow-up: {fmtDate(session.followUpDate)}
                    {followUpStatus === 'overdue' && ` — ${Math.round((today.getTime() - new Date(session.followUpDate).getTime()) / 86400000)} day(s) overdue`}
                    {followUpStatus === 'today' && ' — Scheduled Today'}
                    {followUpStatus === 'upcoming' && ` — In ${Math.round((new Date(session.followUpDate).getTime() - today.getTime()) / 86400000)} day(s)`}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedSession(session)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '7px 12px', fontSize: '0.78rem', fontWeight: 700,
                      borderRadius: '7px', border: '1px solid #e2e8f0',
                      background: '#ffffff', color: '#334155', cursor: 'pointer',
                    }}
                  >
                    <Eye size={13} /> Full Notes
                  </button>
                  {session.patientId && (
                    <button
                      type="button"
                      onClick={() => handleOpenEHR(session.patientId)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '7px 12px', fontSize: '0.78rem', fontWeight: 700,
                        borderRadius: '7px', border: 'none',
                        background: '#00685f', color: '#ffffff', cursor: 'pointer',
                      }}
                    >
                      <FolderOpen size={13} /> Open Patient Records
                    </button>
                  )}
                  {followUpStatus === 'overdue' && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '7px 12px', fontSize: '0.78rem', fontWeight: 700,
                      borderRadius: '7px', background: '#fef2f2', color: '#dc2626',
                      border: '1px solid #fecaca',
                    }}>
                      <AlertTriangle size={13} /> Follow-up Overdue — Contact Patient
                    </span>
                  )}
                  {followUpStatus === 'today' && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '7px 12px', fontSize: '0.78rem', fontWeight: 700,
                      borderRadius: '7px', background: '#fffbeb', color: '#d97706',
                      border: '1px solid #fde68a',
                    }}>
                      <Bell size={13} /> Follow-up Due Today
                    </span>
                  )}
                  {followUpStatus === 'upcoming' && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '7px 12px', fontSize: '0.78rem', fontWeight: 700,
                      borderRadius: '7px', background: '#f0fdf4', color: '#16a34a',
                      border: '1px solid #bbf7d0',
                    }}>
                      <CheckCircle2 size={13} /> Follow-up Scheduled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Full Notes Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title="Clinical Session — Full Record"
        size="md"
      >
        {selectedSession && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#f0fdf4', padding: '14px 16px', borderRadius: '10px',
              border: '1px solid #bbf7d0',
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>Patient</div>
                <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {selectedSession.patientName || 'Clinical Record'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>Session Date</div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {fmtDate(selectedSession.sessionDate || selectedSession.createdAt)}
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Diagnosis / Reason of Visit
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedSession.diagnosis}
              </div>
            </div>

            {/* Observations */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                Clinical Observations & Treatment Advice
              </div>
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                padding: '14px 16px', borderRadius: '10px',
                fontSize: '0.875rem', color: '#1e293b', whiteSpace: 'pre-line', lineHeight: 1.65,
              }}>
                {selectedSession.observations}
              </div>
            </div>

            {/* Follow-up */}
            {selectedSession.followUpDate && (() => {
              const status = getFollowUpStatus(selectedSession.followUpDate);
              const colors = {
                overdue: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
                today:   { bg: '#fffbeb', border: '#fde68a', text: '#d97706' },
                upcoming:{ bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
              };
              const c = colors[status!] || colors.upcoming;
              return (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: c.bg, border: `1px solid ${c.border}`,
                  padding: '12px 14px', borderRadius: '10px',
                  color: c.text, fontWeight: 700, fontSize: '0.8125rem',
                }}>
                  <Calendar size={14} />
                  <span>
                    Follow-up Scheduled: {fmtDate(selectedSession.followUpDate)}
                    {status === 'overdue' && ' — OVERDUE'}
                    {status === 'today' && ' — DUE TODAY'}
                  </span>
                </div>
              );
            })()}

            {/* Action */}
            {selectedSession.patientId && (
              <button
                type="button"
                onClick={() => { setSelectedSession(null); handleOpenEHR(selectedSession.patientId); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '11px', fontSize: '0.875rem', fontWeight: 700,
                  background: '#00685f', color: '#ffffff', border: 'none',
                  borderRadius: '10px', cursor: 'pointer',
                }}
              >
                <FolderOpen size={16} /> Open Full Patient Records (EHR)
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* ── Pulse animation ──────────────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
};
