import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner, EmptyState, Modal } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { 
  Activity, ShieldAlert, AlertTriangle, CheckCircle2, Clock, MessageSquareText, Eye, RefreshCw, User
} from 'lucide-react';

interface TriageSessionLog {
  sessionId: string;
  patientId: string;
  symptoms: any;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  aiResponse: string;
  recommendedAction: string;
  createdAt: string;
  patient?: {
    fullName: string;
    email: string;
  };
}

export const AdminTriageLogsPage: React.FC = () => {
  const [sessions, setSessions] = useState<TriageSessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [selectedSession, setSelectedSession] = useState<TriageSessionLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTriageLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/triage-logs', {
        params: {
          urgencyLevel: urgencyFilter !== 'ALL' ? urgencyFilter : undefined,
        },
      });
      setSessions(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error('Failed to load triage logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriageLogs();
  }, [urgencyFilter]);

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL': return <Badge variant="red" icon={<AlertTriangle size={12} />}>CRITICAL URGENCY</Badge>;
      case 'HIGH': return <Badge variant="red" icon={<ShieldAlert size={12} />}>HIGH URGENCY</Badge>;
      case 'MEDIUM': return <Badge variant="yellow" icon={<Clock size={12} />}>MEDIUM URGENCY</Badge>;
      default: return <Badge variant="green" icon={<CheckCircle2 size={12} />}>LOW URGENCY</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#00685f] to-[#004d46] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-white/80 mb-1 flex items-center gap-1.5">
            <Activity size={14} /> AI Safety & Quality Control
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            AI Triage Session Oversight
          </h1>
          <p className="text-xs text-white/90 mt-1 max-w-xl">
            Audit automated diagnostic recommendations, symptom evaluations, and urgency assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">Audited Sessions</div>
            <div className="text-xl font-black text-[#FEF08A]">{sessions.length} Logs</div>
          </div>
        </div>
      </div>

      {/* ── Filters Bar ───────────────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <span className="text-xs font-bold text-on-surface-variant mr-2">Filter by Urgency:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((level) => (
            <button
              key={level}
              onClick={() => setUrgencyFilter(level)}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
                urgencyFilter === level
                  ? 'bg-[#00685f] text-white shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {level === 'ALL' ? 'All Sessions' : level}
            </button>
          ))}
        </div>

        <button
          onClick={fetchTriageLogs}
          className="p-2.5 bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-on-surface rounded-lg flex items-center gap-1.5 text-xs font-bold"
          title="Refresh Logs"
        >
          <RefreshCw size={15} /> Refresh Audit Logs
        </button>
      </div>

      {/* ── Triage Logs Grid ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<MessageSquareText size={32} />}
          title="No Triage Session Logs"
          description="No AI triage evaluations match your current urgency level filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <div
              key={session.sessionId}
              className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#00685f]/40 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                    <User size={14} className="text-[#00685f]" />
                    <span>{session.patient?.fullName || 'Anonymous Patient'}</span>
                  </div>

                  {getUrgencyBadge(session.urgencyLevel)}
                </div>

                <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 space-y-1.5 text-xs">
                  <div className="font-bold text-on-surface">Submitted Symptoms:</div>
                  <div className="text-on-surface-variant line-clamp-2 italic">
                    "{typeof session.symptoms === 'string' ? session.symptoms : JSON.stringify(session.symptoms)}"
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <strong className="text-on-surface">AI Recommendation Summary:</strong>
                  <p className="text-on-surface-variant line-clamp-3 text-[11px] leading-relaxed">
                    {session.recommendedAction || session.aiResponse}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                <span className="text-on-surface-variant text-[11px]">
                  {new Date(session.createdAt).toLocaleString()}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSession(session);
                    setIsModalOpen(true);
                  }}
                  className="bg-[#00685f]/10 text-[#00685f] hover:bg-[#00685f]/20 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                >
                  <Eye size={14} /> Full Log Detail
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: Detailed Triage Log Audit ─────────────────────────────────── */}
      {isModalOpen && selectedSession && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="AI Diagnostic Audit Detail"
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <div className="font-bold text-sm text-on-surface">
                  Patient: {selectedSession.patient?.fullName || 'Patient'}
                </div>
                <div className="text-on-surface-variant">{selectedSession.patient?.email}</div>
              </div>
              {getUrgencyBadge(selectedSession.urgencyLevel)}
            </div>

            <div className="space-y-1">
              <strong className="text-on-surface uppercase text-[10px] tracking-wider text-on-surface-variant block">
                Recorded Symptoms
              </strong>
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-on-surface font-medium">
                {typeof selectedSession.symptoms === 'string' ? selectedSession.symptoms : JSON.stringify(selectedSession.symptoms, null, 2)}
              </div>
            </div>

            <div className="space-y-1">
              <strong className="text-on-surface uppercase text-[10px] tracking-wider text-on-surface-variant block">
                Full AI Reasoning & Guidance
              </strong>
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 text-on-surface leading-relaxed whitespace-pre-line font-mono text-[11px]">
                {selectedSession.aiResponse}
              </div>
            </div>

            {selectedSession.recommendedAction && (
              <div className="space-y-1">
                <strong className="text-on-surface uppercase text-[10px] tracking-wider text-on-surface-variant block">
                  Recommended Action
                </strong>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 font-semibold">
                  {selectedSession.recommendedAction}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
