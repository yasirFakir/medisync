import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Badge, Spinner, EmptyState } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { 
  Search, Building, MapPin, Phone, Mail, ShieldCheck, AlertTriangle, 
  CheckCircle2, XCircle, Filter, RefreshCw
} from 'lucide-react';

interface PharmacyAdminItem {
  pharmacyId: string;
  storeName: string;
  licenseNumber: string;
  streetAddress: string;
  city: string;
  isVerified: boolean;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
}

export const AdminPharmaciesView: React.FC = () => {
  const [pharmacies, setPharmacies] = useState<PharmacyAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      let isVerifiedParam: string | undefined = undefined;
      if (statusFilter === 'PENDING') isVerifiedParam = 'false';
      if (statusFilter === 'VERIFIED') isVerifiedParam = 'true';

      const res = await apiClient.get('/admin/pharmacies', {
        params: {
          search: search.trim() || undefined,
          isVerified: isVerifiedParam,
        },
      });
      setPharmacies(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error('Failed to load admin pharmacies list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPharmacies();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleToggleVerification = async (pharmacyId: string, currentStatus: boolean) => {
    setUpdatingId(pharmacyId);
    try {
      const newStatus = !currentStatus;
      await apiClient.patch(`/admin/pharmacies/${pharmacyId}/verify`, {
        isVerified: newStatus,
      });
      setPharmacies(prev =>
        prev.map(p => (p.pharmacyId === pharmacyId ? { ...p, isVerified: newStatus } : p))
      );
    } catch (err) {
      console.error('Failed to update verification status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = pharmacies.filter(p => !p.isVerified).length;
  const verifiedCount = pharmacies.filter(p => p.isVerified).length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* ── Admin Pharmacy Header ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-white/80 mb-1 flex items-center gap-1.5">
            <ShieldCheck size={14} /> Compliance & Licensing Portal
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Pharmacy Verification & Onboarding
          </h1>
          <p className="text-xs text-white/90 mt-1 max-w-xl">
            Review drug licenses, store coordinates, and grant official partner status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">Pending Review</div>
            <div className="text-xl font-black text-amber-300">{pendingCount} Stores</div>
          </div>
        </div>
      </div>

      {/* ── Filter Controls ─────────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" style={{ top: '50%' }} />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 outline-none transition-all"
            placeholder="Search by store name, license number, or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-[#8b5cf6] text-white shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Pharmacies ({pharmacies.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle size={13} />
            Pending Verification
          </button>
          <button
            onClick={() => setStatusFilter('VERIFIED')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'VERIFIED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <ShieldCheck size={13} />
            Verified Only
          </button>

          <button
            onClick={fetchPharmacies}
            className="p-2.5 bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-on-surface rounded-lg"
            title="Refresh List"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Pharmacies Directory Table ───────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : pharmacies.length === 0 ? (
        <EmptyState
          icon={<Building size={32} />}
          title="No Pharmacies Found"
          description="No pharmacy records match your current filter parameters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pharmacies.map(pharmacy => (
            <div
              key={pharmacy.pharmacyId}
              className={`bg-surface-container-lowest rounded-2xl p-5 border shadow-sm flex flex-col justify-between space-y-4 transition-all ${
                pharmacy.isVerified ? 'border-outline-variant/30' : 'border-amber-300/80 bg-amber-50/20'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#8b5cf6]" />
                      {pharmacy.storeName}
                    </h3>
                    <div className="text-[11px] font-mono font-bold text-on-surface-variant mt-0.5">
                      Lic: <span className="text-[#8b5cf6]">{pharmacy.licenseNumber}</span>
                    </div>
                  </div>

                  <Badge
                    variant={pharmacy.isVerified ? 'green' : 'yellow'}
                    icon={pharmacy.isVerified ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                  >
                    {pharmacy.isVerified ? 'Verified' : 'Pending Verification'}
                  </Badge>
                </div>

                <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-on-surface font-medium">
                    <MapPin size={13} className="text-[#8b5cf6]" />
                    <span>{pharmacy.streetAddress}, {pharmacy.city}</span>
                  </div>
                  {pharmacy.user && (
                    <>
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <Mail size={13} />
                        <span>Owner: {pharmacy.user.fullName} ({pharmacy.user.email})</span>
                      </div>
                      {pharmacy.user.phoneNumber && (
                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                          <Phone size={13} />
                          <span>{pharmacy.user.phoneNumber}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant">
                  Registered {new Date(pharmacy.createdAt).toLocaleDateString()}
                </span>

                <button
                  type="button"
                  disabled={updatingId === pharmacy.pharmacyId}
                  onClick={() => handleToggleVerification(pharmacy.pharmacyId, pharmacy.isVerified)}
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 ${
                    pharmacy.isVerified
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {updatingId === pharmacy.pharmacyId ? (
                    <Spinner size={14} />
                  ) : pharmacy.isVerified ? (
                    <>
                      <XCircle size={14} />
                      Revoke Verification
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Approve & Verify
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
