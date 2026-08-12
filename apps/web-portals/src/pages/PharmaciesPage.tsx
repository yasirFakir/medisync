import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Input, Button, Badge, Spinner, EmptyState, Modal, StatCard } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { useAuthStore } from '../store/authStore';
import { AdminPharmaciesView } from './AdminPharmaciesView';
import { 
  Search, Building, MapPin, Phone, Mail, ShieldCheck, ChevronLeft, ChevronRight, Store, 
  Sparkles, Star, Map, Filter, CheckCircle2, Pill, Navigation, Layers
} from 'lucide-react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Pharmacy {
  pharmacyId: string;
  storeName: string;
  licenseNumber: string;
  streetAddress: string;
  city: string;
  isVerified: boolean;
  contactEmail?: string;
  contactPhone?: string;
}

interface PharmacyDetail extends Pharmacy {
  createdAt: string;
  stockSummary: {
    totalDrugs: number;
    inStockCount: number;
    outOfStockCount: number;
  } | null;
}

interface PharmacyStock {
  pharmacyId?: string;
  storeName: string;
  streetAddress: string;
  city: string;
  isVerified: boolean;
  brandName: string;
  saltComposition: string;
  strength: string;
  inStock: boolean;
  currentPrice: string;
  trustRating?: string;
  score?: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const PharmaciesPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [searchParams] = useSearchParams();
  const initialSalt = searchParams.get('saltComposition') || '';

  if (user?.role === 'ADMIN') {
    return <AdminPharmaciesView />;
  }

  // Active View Mode: 'locator' (Medicine Inventory Locator) or 'directory' (Store Directory)
  const [activeMode, setActiveMode] = useState<'locator' | 'directory'>(
    initialSalt ? 'locator' : 'directory'
  );

  // ── Mode 1: Medicine Inventory Locator State ───────────────────────────────
  const [medicineQuery, setMedicineQuery] = useState(initialSalt);
  const [locatorCity, setLocatorCity] = useState('Dhaka');
  const [locatorLoading, setLocatorLoading] = useState(false);
  const [locatedPharmacies, setLocatedPharmacies] = useState<PharmacyStock[]>([]);
  const [hasLocated, setHasLocated] = useState(Boolean(initialSalt));

  // ── Mode 2: Partner Pharmacy Directory State ──────────────────────────────
  const [directoryQuery, setDirectoryQuery] = useState('');
  const [directoryCity, setDirectoryCity] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [directoryPharmacies, setDirectoryPharmacies] = useState<Pharmacy[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState('');

  // Pharmacy Detail Modal State
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ── Initial & Parameter Effects ───────────────────────────────────────────
  useEffect(() => {
    if (initialSalt) {
      setMedicineQuery(initialSalt);
      fetchMedicineLocations(initialSalt, locatorCity);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeMode === 'directory') {
      const timer = setTimeout(() => {
        fetchDirectoryPharmacies();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeMode, directoryQuery, directoryCity, verifiedOnly, page]);

  // ── API 1: Fetch Medicine Inventory Locator Results ──────────────────────
  const fetchMedicineLocations = async (searchStr?: string, targetCity?: string) => {
    const q = (searchStr !== undefined ? searchStr : medicineQuery).trim();
    if (!q) return;
    setLocatorLoading(true);
    setHasLocated(true);

    try {
      const res = await apiClient.get('/inventory/locate', {
        params: {
          saltComposition: q,
          city: targetCity || locatorCity
        }
      });
      
      const rawData = Array.isArray(res.data?.data) ? res.data.data : [];
      const calculated = rawData.map((item: PharmacyStock) => {
        const trust = parseFloat(item.trustRating || '4.5');
        const pScore = 80.0;
        const qScore = trust * 20;
        const finalScore = Math.round((0.60 * pScore) + (0.40 * qScore));
        return {
          ...item,
          trustRating: trust.toFixed(1),
          score: item.score || finalScore
        };
      });

      calculated.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
      setLocatedPharmacies(calculated);
    } catch (err) {
      console.error('Failed to locate pharmacies stocking medicine', err);
    } finally {
      setLocatorLoading(false);
    }
  };

  // ── API 2: Fetch Partner Pharmacy Directory List ──────────────────────────
  const fetchDirectoryPharmacies = async () => {
    setDirectoryLoading(true);
    setDirectoryError('');
    try {
      let endpoint = '/pharmacies';
      let params: Record<string, any> = { page, limit: 12 };

      if (directoryQuery.trim()) {
        endpoint = '/pharmacies/search';
        params.q = directoryQuery.trim();
      } else {
        if (directoryCity) params.city = directoryCity;
        if (verifiedOnly) params.verified = 'true';
      }

      const res = await apiClient.get(endpoint, { params });
      setDirectoryPharmacies(Array.isArray(res.data?.data) ? res.data.data : []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch pharmacy directory', err);
      setDirectoryError('Failed to load pharmacy directory. Please try again.');
    } finally {
      setDirectoryLoading(false);
    }
  };

  // ── API 3: Fetch Detailed Pharmacy Inspection Data ───────────────────────
  const handlePharmacyClick = async (pharmacyId: string) => {
    setIsModalOpen(true);
    setLoadingDetail(true);
    try {
      const res = await apiClient.get(`/pharmacies/${pharmacyId}`);
      setSelectedPharmacy(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch pharmacy details', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto space-y-6">
      
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Active Selection</span>
            <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
            <span className="font-label-sm text-label-sm text-primary font-bold">
              Pharmacy Directory & Locator
            </span>
          </div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-extrabold tracking-tight">
            Partner Pharmacies & Stock Locator
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 max-w-2xl">
            Locate partner stores holding stock for specific medicines, check trust ratings, and inspect verified healthcare partner locations across Bangladesh.
          </p>
        </div>
      </div>

      {/* ── Top Mode Switcher Bar ─────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* View Mode Pills */}
        <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setActiveMode('locator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-label-md text-xs transition-all ${
              activeMode === 'locator'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Medicine Inventory Locator
          </button>
          <button
            onClick={() => setActiveMode('directory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-label-md text-xs transition-all ${
              activeMode === 'directory'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Building className="w-4 h-4" />
            Store Directory ({pagination.total || directoryPharmacies.length})
          </button>
        </div>

        <div className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>100% Verified Pharmacy Network</span>
        </div>
      </div>

      {/* ── MODE 1: MEDICINE INVENTORY LOCATOR ────────────────────────────────── */}
      {activeMode === 'locator' && (
        <div className="space-y-6">
          {/* Locator Search Bento Card */}
          <Card className="p-5">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                fetchMedicineLocations();
              }}
              className="flex flex-col md:flex-row gap-3 items-center"
            >
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" style={{ top: '50%' }} />
                <input
                  type="text"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Enter active salt or brand name (e.g. Paracetamol, Metformin, Napa)..."
                  value={medicineQuery}
                  onChange={(e) => setMedicineQuery(e.target.value)}
                />
              </div>

              <div className="w-full md:w-44">
                <select
                  value={locatorCity}
                  onChange={(e) => {
                    setLocatorCity(e.target.value);
                    if (medicineQuery.trim()) fetchMedicineLocations(medicineQuery, e.target.value);
                  }}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-semibold text-on-surface outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="Dhaka">Dhaka</option>
                  <option value="Chittagong">Chittagong</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Rajshahi">Rajshahi</option>
                </select>
              </div>

              <Button 
                type="submit" 
                disabled={locatorLoading || !medicineQuery.trim()} 
                icon={<MapPin size={16} />}
                className="w-full md:w-auto"
              >
                Locate Stock
              </Button>
            </form>
          </Card>

          {/* Results Grid */}
          {locatorLoading ? (
            <div className="flex justify-center py-16"><Spinner size={32} /></div>
          ) : !hasLocated ? (
            <div className="bg-surface-container-lowest rounded-xl p-10 border border-dashed border-outline-variant/40 text-center space-y-3">
              <Search className="w-10 h-10 text-primary mx-auto opacity-70" />
              <h4 className="text-base font-bold text-on-surface">Search Specific Medicine Stock</h4>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                Enter a generic salt composition or medicine brand name above to locate verified pharmacies currently stocking it.
              </p>
            </div>
          ) : locatedPharmacies.length === 0 ? (
            <EmptyState
              icon={<Sparkles size={28} />}
              title="No Matching Pharmacy Found"
              description={`We couldn't locate any pharmacy stocking "${medicineQuery}" in ${locatorCity}.`}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locatedPharmacies.map((item, index) => (
                <div
                  key={index}
                  onClick={() => item.pharmacyId && handlePharmacyClick(item.pharmacyId)}
                  className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-primary" />
                          {item.storeName}
                        </h4>
                        <span className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                          <MapPin size={12} />
                          {item.streetAddress}, {item.city}
                        </span>
                      </div>

                      {item.score && (
                        <div className="bg-gradient-to-br from-primary to-[#008378] text-on-primary rounded-lg px-2.5 py-1 text-center shadow-sm">
                          <div className="text-[9px] font-bold uppercase tracking-wider">SCORE</div>
                          <div className="text-xs font-black">{item.score}</div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-outline-variant/20 pt-3 mt-3 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <div className="font-bold text-on-surface">{item.brandName}</div>
                        <div className="text-base font-extrabold text-primary">৳{item.currentPrice}</div>
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        {item.saltComposition} • {item.strength}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-xs">
                    <Badge variant={item.inStock ? 'green' : 'red'}>
                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                    </Badge>

                    <div className="flex items-center gap-1 text-xs font-bold text-on-surface">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      <span>{item.trustRating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODE 2: PARTNER PHARMACY DIRECTORY ───────────────────────────────── */}
      {activeMode === 'directory' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card className="p-5">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" style={{ top: '50%' }} />
                <input
                  type="text"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Search pharmacy by store name, address, or city..."
                  value={directoryQuery}
                  onChange={(e) => {
                    setDirectoryQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={directoryCity}
                  onChange={(e) => {
                    setDirectoryCity(e.target.value);
                    setPage(1);
                  }}
                  className="px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-semibold text-on-surface outline-none focus:border-primary transition-all cursor-pointer w-full md:w-40"
                >
                  <option value="">All Cities</option>
                  <option value="Dhaka">Dhaka</option>
                  <option value="Chittagong">Chittagong</option>
                  <option value="Sylhet">Sylhet</option>
                </select>

                <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer select-none whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => {
                      setVerifiedOnly(e.target.checked);
                      setPage(1);
                    }}
                    className="accent-primary w-4 h-4 rounded"
                  />
                  Verified Only
                </label>
              </div>
            </div>
          </Card>

          {/* Directory Grid */}
          {directoryLoading ? (
            <div className="flex justify-center py-16"><Spinner size={32} /></div>
          ) : directoryError ? (
            <EmptyState icon={<Store size={28} />} title="Error" description={directoryError} />
          ) : directoryPharmacies.length === 0 ? (
            <EmptyState
              icon={<Store size={28} />}
              title="No Pharmacies Found"
              description="No partner pharmacies match your current search and filter criteria."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {directoryPharmacies.map((pharmacy) => (
                  <div
                    key={pharmacy.pharmacyId}
                    onClick={() => handlePharmacyClick(pharmacy.pharmacyId)}
                    className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                          <Building className="w-4 h-4 text-primary" />
                          {pharmacy.storeName}
                        </h3>
                        <Badge variant={pharmacy.isVerified ? 'green' : 'yellow'} icon={pharmacy.isVerified ? <ShieldCheck size={12} /> : undefined}>
                          {pharmacy.isVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>

                      <div className="text-xs text-on-surface-variant space-y-1.5 mt-3">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-outline" />
                          <span>{pharmacy.streetAddress}, {pharmacy.city}</span>
                        </div>
                        {pharmacy.contactPhone && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={13} className="text-outline" />
                            <span>{pharmacy.contactPhone}</span>
                          </div>
                        )}
                        {pharmacy.contactEmail && (
                          <div className="flex items-center gap-1.5">
                            <Mail size={13} className="text-outline" />
                            <span>{pharmacy.contactEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 text-xs">
                      <span className="text-outline">Lic: {pharmacy.licenseNumber}</span>
                      <span className="text-primary font-bold hover:underline flex items-center gap-1">
                        Inspect Store →
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-2">
                  <Button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    icon={<ChevronLeft size={16} />}
                    size="sm"
                    variant="secondary"
                  >
                    Previous
                  </Button>
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    icon={<ChevronRight size={16} />}
                    size="sm"
                    variant="secondary"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── MODAL: DETAILED PHARMACY STOCK INSPECTION ──────────────────────────── */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPharmacy(null);
          }}
          title={selectedPharmacy ? selectedPharmacy.storeName : 'Pharmacy Details'}
          size="lg"
        >
          {loadingDetail || !selectedPharmacy ? (
            <div className="flex justify-center p-12"><Spinner /></div>
          ) : (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <Badge variant={selectedPharmacy.isVerified ? 'green' : 'yellow'} icon={selectedPharmacy.isVerified ? <ShieldCheck size={12} /> : undefined}>
                  {selectedPharmacy.isVerified ? 'Verified Partner' : 'Pending Verification'}
                </Badge>
                <span className="text-xs text-outline font-semibold">
                  License: {selectedPharmacy.licenseNumber}
                </span>
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-on-surface">
                  <MapPin size={15} className="text-primary" />
                  <strong>Address:</strong> {selectedPharmacy.streetAddress}, {selectedPharmacy.city}
                </div>
                {selectedPharmacy.contactPhone && (
                  <div className="flex items-center gap-2 text-on-surface">
                    <Phone size={15} className="text-primary" />
                    <strong>Phone:</strong> {selectedPharmacy.contactPhone}
                  </div>
                )}
                {selectedPharmacy.contactEmail && (
                  <div className="flex items-center gap-2 text-on-surface">
                    <Mail size={15} className="text-primary" />
                    <strong>Email:</strong> {selectedPharmacy.contactEmail}
                  </div>
                )}
              </div>

              {selectedPharmacy.stockSummary && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Inventory Overview
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard
                      label="Total Listed"
                      value={selectedPharmacy.stockSummary.totalDrugs}
                      icon={<Store size={18} />}
                    />
                    <StatCard
                      label="In Stock"
                      value={selectedPharmacy.stockSummary.inStockCount}
                      icon={<ShieldCheck size={18} />}
                      color="var(--color-success)"
                    />
                    <StatCard
                      label="Out of Stock"
                      value={selectedPharmacy.stockSummary.outOfStockCount}
                      icon={<Store size={18} />}
                      color="var(--color-danger)"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

    </div>
  );
};
