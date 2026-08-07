import React, { useState, useEffect } from 'react';
import { Card, Badge, Input, Spinner, EmptyState, StatCard } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { 
  Search, Building, MapPin, Package, AlertTriangle, DollarSign, 
  Clock, CheckCircle2, XCircle, FileText, ChevronDown, ChevronUp, 
  Filter, Plus, Trash2, Sparkles, AlertCircle, ArrowRight, RefreshCw, Check
} from 'lucide-react';

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

  // Search autocomplete debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        fetchDrugs();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchDrugs = async () => {
    setIsSearching(true);
    try {
      const res = await apiClient.get(`/drugs?search=${encodeURIComponent(searchQuery)}`);
      const rawList = res.data?.data || [];
      const mapped = rawList.map((d: any) => ({
        id: d.drugId || d.id,
        name: d.brandName,
        genericName: d.saltComposition || '',
        strength: d.strength || '',
        manufacturer: d.manufacturer || 'Generic'
      }));
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div className="animate-fade-in" style={{
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
        borderRadius: 'var(--radius-lg, 16px)',
        padding: '24px 28px',
        border: '1px solid rgba(14, 165, 233, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              background: 'var(--color-brand-500, #0ea5e9)',
              color: '#fff',
              borderRadius: '10px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <CheckCircle2 size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Find Medicines
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0, maxWidth: '700px' }}>
            Select a prescription or search medicines to compare stock availability, bioequivalent generic alternatives, and missing stock across partner pharmacies.
          </p>
        </div>

        <button 
          onClick={() => fetchPrescriptions()}
          className="button button-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px' }}
        >
          <RefreshCw size={16} />
          Sync Prescriptions
        </button>
      </div>

      {/* Control Panel: Prescription Selector & Search Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Prescription Selection Card */}
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: 'var(--color-brand-500)' }} />
              Select Prescription
            </label>
            {isLoadingPrescriptions && <Spinner />}
          </div>

          {prescriptions.length > 0 ? (
            <select
              value={selectedPrescriptionId}
              onChange={(e) => {
                const rx = prescriptions.find(p => p.prescriptionId === e.target.value);
                if (rx) handleSelectPrescription(rx);
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md, 8px)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Choose from your scanned prescriptions --</option>
              {prescriptions.map((rx) => (
                <option key={rx.prescriptionId} value={rx.prescriptionId}>
                  {rx.doctorName} ({rx.medicines?.length || 0} items) - {new Date(rx.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          ) : (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
              No digitized prescriptions found. You can add medicines using the search box.
            </div>
          )}

          {selectedPrescriptionId && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} style={{ color: '#f59e0b' }} />
              Active prescription loaded with {queryItems.length} prescribed items.
            </div>
          )}
        </Card>

        {/* Add Additional Medicines Search Card */}
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'visible' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} style={{ color: 'var(--color-brand-500)' }} />
            Search & Add Medicine
          </label>

          <div style={{ position: 'relative' }}>
            <Input
              placeholder="Search drug by brand or generic name (e.g. Napa, Ace, Seclo)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={16} />}
            />
            {isSearching && (
              <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                <Spinner />
              </div>
            )}

            {/* Dropdown Suggestions */}
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '6px',
                backgroundColor: 'var(--bg-elevated, #1e293b)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md, 8px)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                zIndex: 100,
                maxHeight: '260px',
                overflowY: 'auto'
              }}>
                {searchResults.map((drug) => (
                  <div
                    key={drug.id}
                    onClick={() => handleAddDrugToQuery(drug)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-default)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    className="dropdown-item-hover"
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{drug.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {drug.genericName} • {drug.strength}
                      </div>
                    </div>
                    <Badge variant="blue"><Plus size={12} /> Add</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

      </div>

      {/* Selected Medicines Chips Bar */}
      <Card style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Medicines to Search ({queryItems.length})
            </h3>
            {isMatching && <Spinner />}
          </div>

          {queryItems.length > 0 && (
            <button
              onClick={() => {
                setQueryItems([]);
                setSelectedPrescriptionId('');
                setPharmacyResults([]);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>

        {queryItems.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No medicines added yet. Select a prescription above or use the search bar to build your medicine list.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {queryItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '20px',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.84rem'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.brandName}</span>
                  {item.saltComposition && (
                    <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '0.75rem' }}>
                      ({item.saltComposition})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveQueryItem(idx)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Remove medicine"
                >
                  <XCircle size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Error state */}
      {error && <EmptyState icon={<AlertTriangle size={28} />} title="Error" description={error} />}

      {/* Main Results Section: Side-by-Side 2-Column Layout */}
      {pharmacyResults.length > 0 && !isMatching && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Header & Filter Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Pharmacy Results ({filteredPharmacies.length})
            </h2>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-md, 8px)', border: '1px solid var(--border-default)' }}>
              <button
                onClick={() => setFilterMode('ALL')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: filterMode === 'ALL' ? 'var(--color-brand-500, #0ea5e9)' : 'transparent',
                  color: filterMode === 'ALL' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                All Stores ({pharmacyResults.length})
              </button>
              <button
                onClick={() => setFilterMode('FULL')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: filterMode === 'FULL' ? 'var(--color-brand-500, #0ea5e9)' : 'transparent',
                  color: filterMode === 'FULL' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                100% Available
              </button>
              <button
                onClick={() => setFilterMode('ALTERNATIVES')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: filterMode === 'ALTERNATIVES' ? 'var(--color-brand-500, #0ea5e9)' : 'transparent',
                  color: filterMode === 'ALTERNATIVES' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                Has Alternatives
              </button>
            </div>
          </div>

          {/* Side-by-Side Grid Container */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(400px, 1.4fr)', gap: '24px', alignItems: 'start' }}>
            
            {/* LEFT COLUMN: List of Pharmacy Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredPharmacies.map((pharmacy) => {
                const isSelected = selectedPharmacy?.pharmacyId === pharmacy.pharmacyId;
                const directCount = pharmacy.summary.directMatchCount;
                const altCount = pharmacy.summary.alternativeMatchCount;
                const missingCount = pharmacy.summary.missingCount;

                return (
                  <Card
                    key={pharmacy.pharmacyId}
                    onClick={() => {
                      setSelectedPharmacyId(pharmacy.pharmacyId);
                      setActiveTab('matching');
                    }}
                    style={{
                      padding: '18px 20px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--color-brand-500, #0ea5e9)' : '1px solid var(--border-default)',
                      backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.06)' : 'var(--bg-elevated)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: isSelected ? '0 8px 20px -4px rgba(14, 165, 233, 0.25)' : 'none'
                    }}
                  >
                    {/* Top Store Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building size={18} style={{ color: 'var(--color-brand-500)' }} />
                          {pharmacy.storeName}
                        </h4>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <MapPin size={13} />
                          {pharmacy.streetAddress}, {pharmacy.city}
                        </div>
                      </div>

                      <Badge variant={pharmacy.summary.availabilityPercentage === 100 ? 'green' : pharmacy.summary.availabilityPercentage > 50 ? 'yellow' : 'red'}>
                        {pharmacy.summary.availabilityPercentage}% Available
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: '6px', width: '100%', background: 'var(--border-default)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                      <div 
                        style={{ 
                          width: `${(directCount / pharmacy.summary.totalRequested) * 100}%`, 
                          background: '#10b981', 
                          height: '100%' 
                        }} 
                        title={`${directCount} Direct Matches`}
                      />
                      <div 
                        style={{ 
                          width: `${(altCount / pharmacy.summary.totalRequested) * 100}%`, 
                          background: '#f59e0b', 
                          height: '100%' 
                        }} 
                        title={`${altCount} Alternatives Available`}
                      />
                      <div 
                        style={{ 
                          width: `${(missingCount / pharmacy.summary.totalRequested) * 100}%`, 
                          background: '#ef4444', 
                          height: '100%' 
                        }} 
                        title={`${missingCount} Missing`}
                      />
                    </div>

                    {/* Summary Breakdown Badges */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <CheckCircle2 size={12} /> {directCount} Exact Match
                      </span>

                      {altCount > 0 && (
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#f59e0b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Sparkles size={12} /> {altCount} Alternative
                        </span>
                      )}

                      {missingCount > 0 && (
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <XCircle size={12} /> {missingCount} Missing
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: isSelected ? 'var(--color-brand-500)' : 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span>{isSelected ? '✓ Selected Store' : 'Click to inspect breakdown'}</span>
                      <ArrowRight size={14} />
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* RIGHT COLUMN: Detailed Inventory Breakdown Card */}
            {selectedPharmacy ? (
              <Card style={{ padding: '24px', border: '1px solid var(--color-brand-500, #0ea5e9)', position: 'sticky', top: '24px' }}>
                
                {/* Detailed View Store Title Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-brand-500)', fontWeight: 800 }}>
                      Detailed Inventory Breakdown
                    </div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                      {selectedPharmacy.storeName}
                    </h3>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} />
                      {selectedPharmacy.streetAddress}, {selectedPharmacy.city}
                    </div>
                  </div>

                  <Badge variant={selectedPharmacy.summary.availabilityPercentage === 100 ? 'green' : 'yellow'}>
                    Overall: {selectedPharmacy.summary.availabilityPercentage}%
                  </Badge>
                </div>

                {/* Navigation Tabs (Matching / Alternatives / Missing) */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)', marginBottom: '20px', gap: '4px' }}>
                  <button
                    onClick={() => setActiveTab('matching')}
                    style={{
                      padding: '8px 14px',
                      border: 'none',
                      background: 'transparent',
                      borderBottom: activeTab === 'matching' ? '3px solid #10b981' : '3px solid transparent',
                      color: activeTab === 'matching' ? '#10b981' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle2 size={15} />
                    Matching ({selectedPharmacy.matching.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('alternatives')}
                    style={{
                      padding: '8px 14px',
                      border: 'none',
                      background: 'transparent',
                      borderBottom: activeTab === 'alternatives' ? '3px solid #f59e0b' : '3px solid transparent',
                      color: activeTab === 'alternatives' ? '#f59e0b' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Sparkles size={15} />
                    Alternatives ({selectedPharmacy.alternatives.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('missing')}
                    style={{
                      padding: '8px 14px',
                      border: 'none',
                      background: 'transparent',
                      borderBottom: activeTab === 'missing' ? '3px solid #ef4444' : '3px solid transparent',
                      color: activeTab === 'missing' ? '#ef4444' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <XCircle size={15} />
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedPharmacy.matching.map((item, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '14px 16px',
                              background: 'var(--bg-elevated)',
                              borderRadius: 'var(--radius-md, 8px)',
                              border: '1px solid var(--border-default)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '10px'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                                  {item.brandName}
                                </span>
                                <Badge variant="green">In Stock</Badge>
                              </div>
                              <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {item.saltComposition} • {item.strength} {item.manufacturer ? `• ${item.manufacturer}` : ''}
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Stock: <strong style={{ color: 'var(--text-primary)' }}>{item.quantity} units</strong>
                              </div>
                              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand-500)' }}>
                                {item.currentPrice !== null ? `৳${item.currentPrice}` : 'Price N/A'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Content 2: ALTERNATIVE MEDICINES & AVAILABLE BRANDS */}
                {activeTab === 'alternatives' && (
                  <div>
                    {selectedPharmacy.alternatives.length === 0 ? (
                      <EmptyState
                        icon={<CheckCircle2 size={24} />}
                        title="No Alternatives Needed or Available"
                        description="No requested items were replaced by generic alternatives at this pharmacy."
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {selectedPharmacy.alternatives.map((altItem, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '16px',
                              background: 'rgba(245, 158, 11, 0.05)',
                              borderRadius: 'var(--radius-md, 8px)',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}
                          >
                            {/* Requested out of stock label */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Requested Brand Out of Stock
                                </div>
                                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }}>
                                  {altItem.requestedBrand}
                                </h4>
                                <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
                                  Salt: <strong>{altItem.saltComposition}</strong>
                                </div>
                              </div>
                              <Badge variant="yellow">
                                {altItem.availableBrands.length} Alternative Brand{altItem.availableBrands.length > 1 ? 's' : ''}
                              </Badge>
                            </div>

                            <div className="divider" style={{ borderTopColor: 'rgba(245, 158, 11, 0.2)', margin: '0' }} />

                            {/* List of Available Brands at this pharmacy */}
                            <div>
                              <div style={{ fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                                Available Brands at {selectedPharmacy.storeName}:
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {altItem.availableBrands.map((brand, bIdx) => (
                                  <div
                                    key={bIdx}
                                    style={{
                                      padding: '10px 12px',
                                      background: 'var(--bg-elevated)',
                                      borderRadius: '6px',
                                      border: '1px solid var(--border-default)',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <div>
                                      <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                        {brand.brandName}
                                      </div>
                                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                        {brand.strength} {brand.manufacturer ? `• ${brand.manufacturer}` : ''} • <span style={{ color: '#10b981', fontWeight: 600 }}>{brand.quantity} in stock</span>
                                      </div>
                                    </div>

                                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-brand-500)' }}>
                                      {brand.currentPrice !== null ? `৳${brand.currentPrice}` : 'N/A'}
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
                      <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.875rem' }}>
                        🎉 Zero Missing Items! This store carries all requested medicines or generic substitutes.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedPharmacy.missing.map((item, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '12px 14px',
                              background: 'rgba(239, 68, 68, 0.06)',
                              borderRadius: '8px',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                {item.requestedBrand}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
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

              </Card>
            ) : (
              <Card style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Select a pharmacy on the left to inspect its detailed inventory breakdown.
              </Card>
            )}

          </div>

        </div>
      )}

      {/* Initial Empty State when no results */}
      {pharmacyResults.length === 0 && !isMatching && (
        <EmptyState
          icon={<Search size={32} />}
          title="Compare Pharmacy Inventories"
          description="Select a prescription or add medicines above to see real-time matching, generic alternatives, and missing items across partner pharmacies."
        />
      )}

    </div>
  );
};
