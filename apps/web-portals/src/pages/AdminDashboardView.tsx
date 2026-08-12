import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Spinner } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { 
  Users, Store, AlertTriangle, Pill, ChevronRight, LayoutDashboard, ShieldCheck
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalPharmacies: number;
  unverifiedPharmacies: number;
  totalDrugs: number;
}

export const AdminDashboardView: React.FC<{ user: any; navigate: ReturnType<typeof useNavigate> }> = ({ user, navigate }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/admin/stats');
        setStats(res.data?.data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* ── Admin Header Banner ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-white/80 mb-1 flex items-center gap-1.5">
            <ShieldCheck size={14} /> System Administrator
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome, {user.fullName || 'Admin'}
          </h1>
          <p className="text-xs text-white/90 mt-1 max-w-xl">
            Platform oversight and management dashboard.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button
             onClick={() => navigate('/pharmacies')}
             className="bg-white text-[#8b5cf6] font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
           >
             <AlertTriangle size={15} /> Pending Verifications ({stats?.unverifiedPharmacies || 0})
           </button>
        </div>
      </div>

      {/* ── Stat Metric Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-[#8b5cf6]/30 transition-all cursor-pointer" onClick={() => navigate('/users')}>
          <div>
            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Total Users</div>
            <div className="text-2xl font-black text-on-surface mt-0.5">{stats?.totalUsers || 0}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 text-[#8b5cf6] flex items-center justify-center font-bold">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-[#8b5cf6]/30 transition-all cursor-pointer" onClick={() => navigate('/pharmacies')}>
          <div>
            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Total Pharmacies</div>
            <div className="text-2xl font-black text-on-surface mt-0.5">{stats?.totalPharmacies || 0}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Store size={20} />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-amber-400 transition-all cursor-pointer" onClick={() => navigate('/pharmacies')}>
          <div>
            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Unverified Pharmacies</div>
            <div className="text-2xl font-black text-amber-600 mt-0.5">{stats?.unverifiedPharmacies || 0}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-[#8b5cf6]/30 transition-all cursor-pointer" onClick={() => navigate('/drugs')}>
          <div>
            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Total Medicines</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{stats?.totalDrugs || 0}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Pill size={20} />
          </div>
        </div>
      </div>
      
      {/* ── Additional Admin Modules Overview ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
         <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
           <h3 className="font-bold text-lg text-on-surface flex items-center gap-2 mb-4">
             <LayoutDashboard className="w-5 h-5 text-[#8b5cf6]" />
             Quick Actions
           </h3>
           <div className="space-y-3">
             <button onClick={() => navigate('/users')} className="w-full text-left bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 hover:border-[#8b5cf6]/50 transition-all flex items-center justify-between">
               <div>
                 <div className="font-bold text-sm text-on-surface">Manage Platform Users</div>
                 <div className="text-xs text-on-surface-variant">Change roles, suspend accounts, view details</div>
               </div>
               <ChevronRight size={18} className="text-[#8b5cf6]" />
             </button>
             <button onClick={() => navigate('/drugs')} className="w-full text-left bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 hover:border-[#8b5cf6]/50 transition-all flex items-center justify-between">
               <div>
                 <div className="font-bold text-sm text-on-surface">Update Master Drug Catalog</div>
                 <div className="text-xs text-on-surface-variant">Add new medicines, edit pricing & generic alternatives</div>
               </div>
               <ChevronRight size={18} className="text-[#8b5cf6]" />
             </button>
             <button onClick={() => navigate('/pharmacies')} className="w-full text-left bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 hover:border-[#8b5cf6]/50 transition-all flex items-center justify-between">
               <div>
                 <div className="font-bold text-sm text-on-surface">Verify Pharmacy Registrations</div>
                 <div className="text-xs text-on-surface-variant">Review licenses and approve new partners</div>
               </div>
               <ChevronRight size={18} className="text-[#8b5cf6]" />
             </button>
           </div>
         </div>
      </div>

    </div>
  );
};
