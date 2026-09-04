import React, { useState, useEffect } from 'react';
import { Card, Badge, Input, Spinner, EmptyState, Button, formatDoctorName } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { 
  Search, Building, MapPin, Package, AlertTriangle, DollarSign, 
  Clock, CheckCircle2, XCircle, FileText, ChevronDown, ChevronUp, ChevronRight,
  Filter, Plus, Trash2, Sparkles, AlertCircle, ArrowRight, RefreshCw, Check,
  Store, Pill, ShieldCheck, Tag, Navigation, Layers
} from 'lucide-react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface PrescriptionItem {
  prescriptionId: string;
  doctorName: string;
  createdAt: string;
  medicines: Array<{
    brandName: string;
    saltComposition?: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }>;
}

interface MedicineQueryItem {
  drugId?: string;
  brandName: string;
  saltComposition?: string;
  dosage?: string;
}

interface DrugSearchResult {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  manufacturer: string;
  price?: number;
}

interface MatchingMedicine {
  requestedBrand: string;
  drugId: string;
  brandName: string;
  saltComposition: string;
  strength: string;
  manufacturer: string | null;
  quantity: number;
  currentPrice: number | null;
}

interface AlternativeBrand {
  drugId: string;
  brandName: string;
  manufacturer: string | null;
  strength: string;
  quantity: number;
  currentPrice: number | null;
  isGeneric?: boolean;
}

interface AlternativeMedicine {
  requestedBrand: string;
  saltComposition: string;
  availableBrands: AlternativeBrand[];
}

interface MissingMedicine {
  requestedBrand: string;
  saltComposition: string;
}

interface PharmacyMatchResult {
  pharmacyId: string;
  storeName: string;
  streetAddress: string;
  city: string;
  summary: {
    totalRequested: number;
    directMatchCount: number;
    alternativeMatchCount: number;
    missingCount: number;
    availabilityPercentage: number;
    matchScore: number;
  };
  matching: MatchingMedicine[];
  alternatives: AlternativeMedicine[];
  missing: MissingMedicine[];
}

export const AvailabilityPage: React.FC = () => {
  // Prescription selection state
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string>('');
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(false);

  // Active query medicines list
  const [queryItems, setQueryItems] = useState<MedicineQueryItem[]>([]);

  // Drug search autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DrugSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Matching results state
  const [pharmacyResults, setPharmacyResults] = useState<PharmacyMatchResult[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState('');

  // UI state
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'matching' | 'alternatives' | 'missing'>('matching');
  const [filterMode, setFilterMode] = useState<'ALL' | 'FULL' | 'ALTERNATIVES'>('ALL');

  // Load user prescriptions on mount
  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setIsLoadingPrescriptions(true);
    try {
      const res = await apiClient.get('/prescriptions');
      const data = res.data?.data || [];
      const parsed: PrescriptionItem[] = data.map((p: any) => ({
        prescriptionId: p.prescriptionId,
        doctorName: p.doctorName || 'Prescription Document',
        createdAt: p.createdAt,
        medicines: typeof p.medicines === 'string' ? JSON.parse(p.medicines) : (p.medicines || [])
      }));
      setPrescriptions(parsed);
      
      // Auto-select first prescription if available
      if (parsed.length > 0 && queryItems.length === 0) {
        handleSelectPrescription(parsed[0]);
      }
    } catch (err) {
      console.error('Failed to load prescriptions', err);
    } finally {
      setIsLoadingPrescriptions(false);
    }
  };

  // Search autocomplete debouncing with exact match ranking
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        fetchDrugs();
      } else {
        setSearchResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchDrugs = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    try {
      let rawList: any[] = [];
      try {
        const res = await apiClient.get('/drugs', { params: { search: q } });
        rawList = Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.drugs || []);
      } catch {
        const res = await apiClient.get(`/drugs/search?q=${encodeURIComponent(q)}`);
        rawList = Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.drugs || []);
      }

      const mapped: DrugSearchResult[] = rawList.map((d: any) => ({
        id: d.drugId || d.id || d.drug_id,
        name: d.brandName || d.brand_name || 'Unknown',
        genericName: d.saltComposition || d.genericName || d.salt_composition || '',
        strength: d.strength || '',
        manufacturer: d.manufacturer || 'Generic',
        price: Number(d.estimatedPrice || d.price || d.estimated_price || 0)
      }));

      // Relevance sort: Exact brand match (#1), prefix match (#2), shorter brand names (#3)
      const qLower = q.toLowerCase();
      mapped.sort((a, b) => {
        const aBrand = a.name.toLowerCase();
        const bBrand = b.name.toLowerCase();

        const aExact = aBrand === qLower;
        const bExact = bBrand === qLower;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStarts = aBrand.startsWith(qLower);
        const bStarts = bBrand.startsWith(qLower);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        if (aStarts && bStarts && aBrand.length !== bBrand.length) {
          return aBrand.length - bBrand.length;
        }

        return aBrand.localeCompare(bBrand);
      });

      setSearchResults(mapped);
    } catch (err) {
      console.error('Failed to search drugs', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPrescription = (rx: PrescriptionItem) => {
    setSelectedPrescriptionId(rx.prescriptionId);
    const newItems: MedicineQueryItem[] = (rx.medicines || []).map(m => ({
      brandName: m.brandName,
      saltComposition: m.saltComposition || '',
      dosage: m.dosage || ''
    }));
    setQueryItems(newItems);
    if (newItems.length > 0) {
      executeMatchingSearch(newItems);
    }
  };

  const handleAddDrugToQuery = (drug: DrugSearchResult) => {
    const exists = queryItems.some(i => i.drugId === drug.id || i.brandName.toLowerCase() === drug.name.toLowerCase());
    if (!exists) {
      const updated = [
        ...queryItems,
        {
          drugId: drug.id,
          brandName: drug.name,
          saltComposition: drug.genericName,
          dosage: drug.strength
        }
      ];
      setQueryItems(updated);
      setSearchQuery('');
      setSearchResults([]);
      executeMatchingSearch(updated);
    }
  };

  const handleRemoveQueryItem = (index: number) => {
    const updated = queryItems.filter((_, idx) => idx !== index);
    setQueryItems(updated);
    if (updated.length > 0) {
      executeMatchingSearch(updated);
    } else {
      setPharmacyResults([]);
    }
  };

  const executeMatchingSearch = async (itemsToSearch: MedicineQueryItem[]) => {
    if (itemsToSearch.length === 0) return;
    setIsMatching(true);
    setError('');
    try {
      const res = await apiClient.post('/availability/search-prescription', {
        items: itemsToSearch
      });
      const results: PharmacyMatchResult[] = res.data?.data?.pharmacies || [];
      setPharmacyResults(results);
      if (results.length > 0) {
        setSelectedPharmacyId(results[0].pharmacyId);
      }
    } catch (err: any) {
      console.error('Failed to run prescription search', err);
      setError(err?.response?.data?.message || 'Failed to search pharmacy availability. Please try again.');
    } finally {
      setIsMatching(false);
    }
  };

  // Filtered pharmacies based on user filter pill
  const filteredPharmacies = pharmacyResults.filter(p => {
    if (filterMode === 'FULL') return p.summary.availabilityPercentage === 100;
    if (filterMode === 'ALTERNATIVES') return p.summary.alternativeMatchCount > 0;
    return true;
  });

  const selectedPharmacy = pharmacyResults.find(p => p.pharmacyId === selectedPharmacyId) || pharmacyResults[0];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto space-y-6">
      
      {/* ── Page Header Banner ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Active Selection</span>
            <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
            <span className="font-label-sm text-label-sm text-primary font-bold">Find Medicines & Store Stock</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-extrabold tracking-tight">
            Find medicines across pharmacies
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 max-w-2xl">
            Select a scanned prescription or search medicines to compare pharmacy stock availability, bioequivalent generic alternatives, and missing items in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={() => fetchPrescriptions()}
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
          >
            Sync Prescriptions
          </Button>
        </div>
      </div>

      {/* ── Top Control Bento Grid: Prescription Selector & Medicine Search ─────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Card 1: Prescription Selection (md:col-span-6) */}
        <div className="md:col-span-6 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-on-surface flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Select Scanned Prescription
            </label>
            {isLoadingPrescriptions && <Spinner size={14} />}
          </div>

          {prescriptions.length > 0 ? (
            <select
              value={selectedPrescriptionId}
              onChange={(e) => {
                const rx = prescriptions.find(p => p.prescriptionId === e.target.value);
                if (rx) handleSelectPrescription(rx);
              }}
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-semibold text-on-surface outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="">-- Choose from your scanned prescriptions --</option>
              {prescriptions.map((rx) => (
                <option key={rx.prescriptionId} value={rx.prescriptionId}>
                  {formatDoctorName(rx.doctorName)} ({rx.medicines?.length || 0} medicines) • {new Date(rx.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-xs text-on-surface-variant italic py-1">
              No scanned prescriptions found. You can add medicines using the search box.
            </div>
          )}

          {selectedPrescriptionId && (
            <div className="text-[11px] text-primary flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Loaded active prescription containing {queryItems.length} prescribed items.
            </div>
          )}
        </div>

        {/* Card 2: Live Medicine Search (md:col-span-6) */}
        <div className="md:col-span-6 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm space-y-3 relative overflow-visible">
          <label className="text-xs font-bold text-on-surface flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            Search & Add Medicine to Compare
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" style={{ top: '50%' }} />
            <input
              type="text"
              className="w-full pl-9 pr-8 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Search 21k+ medicines (e.g. Napa, Seclo, Ace, Metformin)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2" style={{ top: '50%' }}>
                <Spinner size={14} />
              </div>
            )}

            {/* Dropdown Suggestions */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                {searchResults.map((drug) => (
                  <div
                    key={drug.id}
                    onClick={() => handleAddDrugToQuery(drug)}
                    className="px-4 py-3 border-b border-outline-variant/20 hover:bg-surface-container-low cursor-pointer transition-colors flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-bold text-on-surface text-sm">{drug.name}</div>
                      <div className="text-[11px] text-on-surface-variant">
                        {drug.genericName} • {drug.strength} • By {drug.manufacturer}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {drug.price ? <span className="font-bold text-primary text-xs">৳{drug.price}</span> : null}
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-bold flex items-center gap-0.5">
                        <Plus size={10} /> Add
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Selected Query Medicines Chips Bar ───────────────────────────────── */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <Pill className="w-4 h-4 text-primary" />
              Medicines to Search ({queryItems.length})
            </h3>
            {isMatching && <Spinner size={14} />}
          </div>

          {queryItems.length > 0 && (
            <button
              onClick={() => {
                setQueryItems([]);
                setSelectedPrescriptionId('');
                setPharmacyResults([]);
              }}
              className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
            >
              <Trash2 size={12} /> Clear All
            </button>
          )}
        </div>

        {queryItems.length === 0 ? (
          <div className="py-6 text-center text-xs text-on-surface-variant border border-dashed border-outline-variant/40 rounded-lg">
            No medicines added yet. Choose a prescription above or use the search bar to build your medicine list.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {queryItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-surface-container-low border border-outline-variant/40 rounded-full px-3.5 py-1.5 flex items-center gap-2 text-xs shadow-sm"
              >
                <div>
                  <span className="font-bold text-on-surface">{item.brandName}</span>
                  {item.saltComposition && (
                    <span className="text-on-surface-variant ml-1.5 text-[11px]">
                      ({item.saltComposition})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveQueryItem(idx)}
                  className="text-on-surface-variant hover:text-red-500 transition-colors p-0.5 rounded-full"
                  title="Remove medicine"
                >
                  <XCircle size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && <EmptyState icon={<AlertTriangle size={28} />} title="Error" description={error} />}

      {/* ── Main Results Bento Section: 12-Column Grid ─────────────────────────── */}
      {pharmacyResults.length > 0 && !isMatching && (
        <div className="space-y-4">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Pharmacy Results ({filteredPharmacies.length})
            </h3>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-surface-container-high rounded-lg p-1 w-fit">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1 rounded-md font-label-sm text-xs transition-all ${
                  filterMode === 'ALL'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All Stores ({pharmacyResults.length})
              </button>
              <button
                onClick={() => setFilterMode('FULL')}
                className={`px-3 py-1 rounded-md font-label-sm text-xs transition-all ${
                  filterMode === 'FULL'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                100% Available
              </button>
              <button
                onClick={() => setFilterMode('ALTERNATIVES')}
                className={`px-3 py-1 rounded-md font-label-sm text-xs transition-all ${
                  filterMode === 'ALTERNATIVES'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Has Alternatives
              </button>
            </div>
          </div>

          {/* 12-Column Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: List of Pharmacy Cards (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-3.5">
              {filteredPharmacies.map((pharmacy) => {
                const isSelected = selectedPharmacy?.pharmacyId === pharmacy.pharmacyId;
                const directCount = pharmacy.summary.directMatchCount;
                const altCount = pharmacy.summary.alternativeMatchCount;
                const missingCount = pharmacy.summary.missingCount;

                return (
                  <div
                    key={pharmacy.pharmacyId}
                    onClick={() => {
                      setSelectedPharmacyId(pharmacy.pharmacyId);
                      setActiveTab('matching');
                    }}
                    className={`bg-surface-container-lowest rounded-xl p-5 border cursor-pointer transition-all duration-200 space-y-3 ${
                      isSelected
                        ? 'border-2 border-primary shadow-md ring-2 ring-primary/20 bg-primary/5'
                        : 'border-outline-variant/30 hover:border-outline-variant hover:shadow-sm'
                    }`}
                  >
                    {/* Top Store Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                          <Building className="w-4 h-4 text-primary" />
                          {pharmacy.storeName}
                        </h4>
                        <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <MapPin size={12} />
                          {pharmacy.streetAddress}, {pharmacy.city}
                        </div>
                      </div>

                      <Badge variant={pharmacy.summary.availabilityPercentage === 100 ? 'green' : pharmacy.summary.availabilityPercentage > 50 ? 'yellow' : 'red'}>
                        {pharmacy.summary.availabilityPercentage}% Available
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${(directCount / pharmacy.summary.totalRequested) * 100}%` }} 
                        className="bg-[#10B981] h-full"
                        title={`${directCount} Direct Matches`}
                      />
                      <div 
                        style={{ width: `${(altCount / pharmacy.summary.totalRequested) * 100}%` }} 
                        className="bg-[#F59E0B] h-full"
                        title={`${altCount} Alternatives Available`}
                      />
                      <div 
                        style={{ width: `${(missingCount / pharmacy.summary.totalRequested) * 100}%` }} 
                        className="bg-[#EF4444] h-full"
                        title={`${missingCount} Missing`}
                      />
                    </div>

                    {/* Summary Breakdown Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="bg-[#10B981]/10 text-[#047857] px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> {directCount} Exact Match
                      </span>

                      {altCount > 0 && (
                        <span className="bg-[#F59E0B]/10 text-[#B45309] px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                          <Sparkles size={12} /> {altCount} Alternative
                        </span>
                      )}

                      {missingCount > 0 && (
                        <span className="bg-[#EF4444]/10 text-[#B91C1C] px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                          <XCircle size={12} /> {missingCount} Missing
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-outline-variant/20">
                      <span className={isSelected ? 'text-primary' : 'text-on-surface-variant'}>
                        {isSelected ? '✓ Selected Store' : 'Click to inspect breakdown'}
                      </span>
                      <ChevronRight size={14} className={isSelected ? 'text-primary' : 'text-outline'} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT COLUMN: Detailed Inventory Breakdown Card (lg:col-span-7) */}
            {selectedPharmacy ? (
              <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-6 border-2 border-primary/40 shadow-lg sticky top-6 space-y-5">
                
                {/* Store Info Sticky Header */}
                <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b border-outline-variant/30">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-primary tracking-wider">
                      Detailed Inventory Breakdown
                    </div>
                    <h3 className="font-headline-md text-xl font-bold text-on-surface mt-0.5">
                      {selectedPharmacy.storeName}
                    </h3>
                    <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <MapPin size={12} />
                      {selectedPharmacy.streetAddress}, {selectedPharmacy.city}
                    </div>
                  </div>

                  <Badge variant={selectedPharmacy.summary.availabilityPercentage === 100 ? 'green' : 'yellow'}>
                    Overall: {selectedPharmacy.summary.availabilityPercentage}%
                  </Badge>
                </div>

                {/* 3 Navigation Tabs (Matching / Alternatives / Missing) */}
                <div className="flex border-b border-outline-variant/30 gap-2">
                  <button
                    onClick={() => setActiveTab('matching')}
                    className={`pb-2.5 px-3 font-label-md text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                      activeTab === 'matching'
                        ? 'border-[#10B981] text-[#10B981]'
                        : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    Matching ({selectedPharmacy.matching.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('alternatives')}
                    className={`pb-2.5 px-3 font-label-md text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                      activeTab === 'alternatives'
                        ? 'border-[#F59E0B] text-[#F59E0B]'
                        : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Sparkles size={14} />
                    Alternatives ({selectedPharmacy.alternatives.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('missing')}
                    className={`pb-2.5 px-3 font-label-md text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                      activeTab === 'missing'
                        ? 'border-[#EF4444] text-[#EF4444]'
                        : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <XCircle size={14} />
                    Missing ({selectedPharmacy.missing.length})
                  </button>
                </div>

                {/* Tab Content 1: MATCHING DIRECT MEDICINES */}
                {activeTab === 'matching' && (
                  <div>
                    {selectedPharmacy.matching.length === 0 ? (
                      <EmptyState
                        icon={<Package size={24} />}
                        title="No Direct Brand Matches"
                        description="This pharmacy does not carry exact brand matches for your requested list."
                      />
                    ) : (
                      <div className="space-y-3">
                        {selectedPharmacy.matching.map((item, i) => (
                          <div
                            key={i}
                            className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex justify-between items-center flex-wrap gap-2 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-on-surface">
                                  {item.brandName}
                                </span>
                                <Badge variant="green">In Stock</Badge>
                              </div>
                              <div className="text-on-surface-variant text-[11px] mt-1">
                                {item.saltComposition} • {item.strength} {item.manufacturer ? `• ${item.manufacturer}` : ''}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-[11px] text-outline">
                                Stock: <strong className="text-on-surface">{item.quantity} units</strong>
                              </div>
                              <div className="text-base font-extrabold text-primary">
                                {item.currentPrice !== null ? `৳${item.currentPrice}` : 'Price N/A'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Content 2: ALTERNATIVE MEDICINES & SHOW ALL AVAILABLE BRANDS */}
                {activeTab === 'alternatives' && (
                  <div>
                    {selectedPharmacy.alternatives.length === 0 ? (
                      <EmptyState
                        icon={<CheckCircle2 size={24} />}
                        title="No Alternatives Needed or Available"
                        description="No requested items were replaced by generic alternatives at this pharmacy."
                      />
                    ) : (
                      <div className="space-y-4">
                        {selectedPharmacy.alternatives.map((altItem, i) => (
                          <div
                            key={i}
                            className="bg-[#F59E0B]/5 p-4 rounded-xl border border-[#F59E0B]/30 space-y-3"
                          >
                            {/* Requested Out of Stock Brand Header */}
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="text-[10px] text-[#B45309] font-bold uppercase tracking-wider">
                                  Requested Brand Out of Stock
                                </div>
                                <h4 className="text-base font-bold text-on-surface mt-0.5">
                                  {altItem.requestedBrand}
                                </h4>
                                <div className="text-xs text-on-surface-variant mt-0.5">
                                  Generic Salt: <strong className="text-on-surface">{altItem.saltComposition}</strong>
                                </div>
                              </div>
                              <Badge variant="yellow">
                                {altItem.availableBrands.length} Alternative Brand{altItem.availableBrands.length > 1 ? 's' : ''} Available
                              </Badge>
                            </div>

                            <div className="border-t border-[#F59E0B]/20 pt-3 space-y-2">
                              <div className="text-xs font-bold text-on-surface flex items-center justify-between">
                                <span>All Available Alternative Brands at {selectedPharmacy.storeName}:</span>
                                <span className="text-[11px] text-on-surface-variant font-normal">
                                  Same active formulation
                                </span>
                              </div>

                              {/* LIST ALL AVAILABLE ALTERNATIVE BRANDS AT THIS PHARMACY */}
                              <div className="space-y-2">
                                {altItem.availableBrands.map((brand, bIdx) => (
                                  <div
                                    key={bIdx}
                                    className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30 flex justify-between items-center text-xs hover:border-primary/50 transition-colors"
                                  >
                                    <div className="space-y-0.5">
                                      <div className="font-bold text-on-surface text-sm flex items-center gap-1.5">
                                        {brand.brandName}
                                        <Badge variant={brand.isGeneric ? 'green' : 'purple'}>
                                          {brand.isGeneric ? 'Generic' : 'Brand'}
                                        </Badge>
                                      </div>
                                      <div className="text-[11px] text-on-surface-variant">
                                        {brand.strength} {brand.manufacturer ? `• By ${brand.manufacturer}` : ''}
                                      </div>
                                      <div className="text-[11px] text-[#10B981] font-semibold flex items-center gap-1">
                                        <CheckCircle2 size={11} /> {brand.quantity} units in stock
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <div className="text-xs font-label-sm text-on-surface-variant">Unit Price</div>
                                      <div className="text-base font-extrabold text-primary">
                                        {brand.currentPrice !== null ? `৳${brand.currentPrice}` : 'N/A'}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Content 3: MISSING MEDICINES */}
                {activeTab === 'missing' && (
                  <div>
                    {selectedPharmacy.missing.length === 0 ? (
                      <div className="p-4 text-center bg-[#10B981]/10 rounded-xl text-[#047857] font-bold text-xs">
                        🎉 Zero Missing Items! This store carries all requested medicines or generic substitutes.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedPharmacy.missing.map((item, i) => (
                          <div
                            key={i}
                            className="bg-[#EF4444]/5 p-3.5 rounded-xl border border-[#EF4444]/20 flex justify-between items-center text-xs"
                          >
                            <div>
                              <div className="font-bold text-on-surface text-sm">
                                {item.requestedBrand}
                              </div>
                              <div className="text-[11px] text-on-surface-variant mt-0.5">
                                Salt: {item.saltComposition}
                              </div>
                            </div>

                            <Badge variant="red">Completely Unavailable</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            ) : (
              <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-8 text-center text-xs text-on-surface-variant border border-outline-variant/30">
                Select a pharmacy on the left to inspect its detailed inventory breakdown.
              </div>
            )}

          </div>

        </div>
      )}

      {/* Initial Empty State when no results */}
      {pharmacyResults.length === 0 && !isMatching && (
        <div className="bg-surface-container-lowest rounded-xl p-10 border border-dashed border-outline-variant/40 text-center space-y-3">
          <Store className="w-10 h-10 text-primary mx-auto opacity-70" />
          <h4 className="text-base font-bold text-on-surface">Compare Pharmacy Stock & Find Medicines</h4>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Select a prescription or add medicines using the search bar above to calculate real-time availability, generic alternatives, and missing items across partner pharmacies.
          </p>
        </div>
      )}

    </div>
  );
};
