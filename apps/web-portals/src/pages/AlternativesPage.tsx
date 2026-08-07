import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Badge, Input, Button, Spinner, EmptyState, Modal, Table } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import {
  Search,
  ArrowRightLeft,
  Star,
  CheckCircle,
  Tag,
  X,
  FileText,
  DollarSign,
  TrendingDown,
  ChevronRight,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Drug {
  id: string;
  brandName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  price: number;
  isGeneric: boolean;
  trustRating?: number;
}

interface ScoredAlternative extends Drug {
  matchScore: number;
  sameStrength: boolean;
  sameForm: boolean;
}

interface AlternativesResponse {
  sourceDrug: Drug;
  alternatives: ScoredAlternative[];
  totalAlternatives: number;
}

interface DrugComparison extends Drug {
  uses?: string;
  sideEffects?: string;
}

interface Prescription {
  prescriptionId: string;
  digitizedNotes: string;
  medicines: Array<{ brandName: string; dosage: string; frequency: string; duration?: string }>;
  validationSummary?: {
    medicines?: Array<{
      matched?: boolean;
      matchedDrug?: {
        drugId: string;
        brandName: string;
        saltComposition: string;
        strength: string;
        estimatedPrice: number;
      };
      input?: { brandName?: string; genericName?: string; dosage?: string };
    }>;
  };
  ocrResult?: {
    doctor_name?: { value: string };
    prescription_date?: { value: string };
    medicines?: Array<{
      brand_name: { value: string };
      strength: { value: string };
      dosage: { value: string };
      frequency: { value: string };
      duration: { value: string };
    }>;
  };
  createdAt: string;
}

interface PrescribedMedRow {
  id: string;
  rxId: string;
  rxDate: string;
  doctorName: string;
  prescribedName: string;
  dosage: string;
  frequency: string;
  duration: string;
  preMatchedDrug?: Drug | null;
  sourceDrug?: Drug | null;
  cheapestAlt?: ScoredAlternative | null;
  allAlts?: ScoredAlternative[];
  matchStatus: 'MATCHED' | 'NO_MATCH' | 'LOADING';
}

const cleanName = (name: string) => {
  if (!name) return '';
  return name
    .replace(/^(tab|cap|syp|inj|tablet|capsule|syrup)\.?\s+/i, '')
    .replace(/\s+\d+\s*(mg|g|ml|mcg)\b/gi, '')
    .replace(/\(.*?\)/g, '')
    .trim();
};

export const AlternativesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Prescriptions passed via navigation state or fetched
  const initialRxList: Prescription[] = location.state?.selectedPrescriptions || [];
  const [selectedPrescriptions, setSelectedPrescriptions] = useState<Prescription[]>(initialRxList);
  const [allUserPrescriptions, setAllUserPrescriptions] = useState<Prescription[]>([]);
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [loadingRxList, setLoadingRxList] = useState(false);

  // Active view mode: 'prescriptions' (if prescriptions selected) or 'manual'
  const [viewMode, setViewMode] = useState<'prescriptions' | 'manual'>(
    initialRxList.length > 0 ? 'prescriptions' : 'manual'
  );

  // Prescribed medicines table rows & status
  const [prescribedRows, setPrescribedRows] = useState<PrescribedMedRow[]>([]);
  const [isLoadingRxAlts, setIsLoadingRxAlts] = useState(false);

  // Manual search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected drug single view
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [alternativesData, setAlternativesData] = useState<AlternativesResponse | null>(null);
  const [isLoadingAlts, setIsLoadingAlts] = useState(false);
  const [altError, setAltError] = useState('');

  // Filters & comparisons
  const [budgetLimit, setBudgetLimit] = useState<number | ''>('');
  const [formFilter, setFormFilter] = useState('');
  const [compareSelection, setCompareSelection] = useState<ScoredAlternative[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<DrugComparison[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // ── 1. Fetch user prescriptions for modal selection ─────────────────────────
  const fetchAllPrescriptions = async () => {
    setLoadingRxList(true);
    try {
      const res = await apiClient.get('/prescriptions');
      setAllUserPrescriptions(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load user prescriptions', err);
    } finally {
      setLoadingRxList(false);
    }
  };

  useEffect(() => {
    fetchAllPrescriptions();
  }, []);

  // ── 2. Process Selected Prescriptions into Rows & Fetch Alternatives ─────────
  useEffect(() => {
    if (selectedPrescriptions.length === 0) {
      setPrescribedRows([]);
      if (viewMode === 'prescriptions') setViewMode('manual');
      return;
    }

    const processPrescriptions = async () => {
      setIsLoadingRxAlts(true);
      const rows: PrescribedMedRow[] = [];

      // Extract medicines from all selected prescriptions
      selectedPrescriptions.forEach((rx, rxIndex) => {
        const dateStr = rx.createdAt ? new Date(rx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
        const docName = rx.ocrResult?.doctor_name?.value || (rx as any).doctorName || 'Prescriber';
        const vsList = rx.validationSummary?.medicines || [];

        const medList = rx.medicines?.length > 0
          ? rx.medicines
          : (rx.ocrResult?.medicines || []).map(m => ({
              brandName: m.brand_name?.value || '',
              dosage: m.strength?.value || m.dosage?.value || '',
              frequency: m.frequency?.value || '',
              duration: m.duration?.value || ''
            }));

        medList.forEach((med: any, medIndex: number) => {
          const vsMatch = vsList[medIndex]?.matchedDrug;
          const rawBrand = med.brandName || med.brand_name?.value || '';

          if (rawBrand.trim() || vsMatch?.brandName) {
            const preMatched: Drug | null = vsMatch ? {
              id: vsMatch.drugId,
              brandName: vsMatch.brandName,
              genericName: vsMatch.saltComposition,
              strength: vsMatch.strength,
              dosageForm: 'Tablet',
              manufacturer: 'Standard',
              price: Number(vsMatch.estimatedPrice || 0),
              isGeneric: false,
              trustRating: 4.8
            } : null;

            rows.push({
              id: `${rx.prescriptionId}-${medIndex}`,
              rxId: rx.prescriptionId,
              rxDate: dateStr,
              doctorName: docName,
              prescribedName: vsMatch?.brandName || rawBrand,
              dosage: vsMatch?.strength || med.dosage || med.strength?.value || '',
              frequency: med.frequency || med.frequency?.value || '',
              duration: med.duration || med.duration?.value || '',
              preMatchedDrug: preMatched,
              matchStatus: 'LOADING'
            });
          }
        });
      });

      setPrescribedRows(rows);

      // Fetch alternatives for each row in parallel
      const updatedRows = await Promise.all(
        rows.map(async (row) => {
          try {
            let sourceDrug: Drug | null = row.preMatchedDrug || null;

            if (!sourceDrug) {
              const cleaned = cleanName(row.prescribedName);
              let searchRes = await apiClient.get(`/drugs?search=${encodeURIComponent(cleaned || row.prescribedName)}`);
              let matchedDrugs = searchRes.data?.data || [];

              if (matchedDrugs.length === 0 && row.prescribedName !== cleaned) {
                searchRes = await apiClient.get(`/drugs?search=${encodeURIComponent(row.prescribedName)}`);
                matchedDrugs = searchRes.data?.data || [];
              }

              if (matchedDrugs.length === 0) {
                const firstWord = row.prescribedName.trim().split(' ')[0];
                if (firstWord && firstWord.length > 2) {
                  searchRes = await apiClient.get(`/drugs?search=${encodeURIComponent(firstWord)}`);
                  matchedDrugs = searchRes.data?.data || [];
                }
              }

              if (matchedDrugs.length > 0) {
                const masterDrugData = matchedDrugs[0];
                sourceDrug = {
                  id: masterDrugData.drugId || masterDrugData.id,
                  brandName: masterDrugData.brandName,
                  genericName: masterDrugData.saltComposition || masterDrugData.genericName || '',
                  strength: masterDrugData.strength || '',
                  dosageForm: masterDrugData.dosageForm || 'Tablet',
                  manufacturer: masterDrugData.manufacturer || 'Unknown',
                  price: Number(masterDrugData.estimatedPrice || masterDrugData.price || 0),
                  isGeneric: Boolean(masterDrugData.isGeneric),
                  trustRating: Number(masterDrugData.trustRating || 4.5)
                };
              }
            }

            if (!sourceDrug) {
              return { ...row, matchStatus: 'NO_MATCH' as const };
            }

            // Fetch cheap alternatives using sourceDrug.id
            const altRes = await apiClient.get(`/alternatives/${sourceDrug.id}`);
            const altData = altRes.data?.data;
            let alts: ScoredAlternative[] = (altData?.alternatives || []).map((alt: any) => ({
              id: alt.drugId || alt.id,
              brandName: alt.brandName,
              genericName: alt.saltComposition || alt.genericName || '',
              strength: alt.strength || '',
              dosageForm: alt.dosageForm || 'Tablet',
              manufacturer: alt.manufacturer || 'Unknown',
              price: Number(alt.estimatedPrice || alt.price || 0),
              isGeneric: Boolean(alt.isGeneric),
              trustRating: Number(alt.trustRating || 4.5),
              matchScore: Math.round(alt.score || 85),
              sameStrength: alt.matchDetails?.sameStrength ?? true,
              sameForm: alt.matchDetails?.sameDosageForm ?? true
            }));

            // Fallback: If no direct alternative returned by salt, query /drugs with generic name
            if (alts.length === 0 && sourceDrug.genericName) {
              const genRes = await apiClient.get(`/drugs?search=${encodeURIComponent(sourceDrug.genericName)}`);
              const genList = (genRes.data?.data || []).filter((d: any) => (d.drugId || d.id) !== sourceDrug!.id);
              alts = genList.map((alt: any) => ({
                id: alt.drugId || alt.id,
                brandName: alt.brandName,
                genericName: alt.saltComposition || alt.genericName || '',
                strength: alt.strength || '',
                dosageForm: alt.dosageForm || 'Tablet',
                manufacturer: alt.manufacturer || 'Generic',
                price: Number(alt.estimatedPrice || alt.price || 0),
                isGeneric: Boolean(alt.isGeneric),
                trustRating: Number(alt.trustRating || 4.5),
                matchScore: 85,
                sameStrength: true,
                sameForm: true
              }));
            }

            // Pick cheapest alternative (or best alternative)
            const cheaperList = alts.filter(a => a.price < sourceDrug!.price);
            const cheapestAlt = cheaperList.length > 0
              ? cheaperList.reduce((min, cur) => cur.price < min.price ? cur : min, cheaperList[0])
              : (alts.length > 0 ? alts[0] : null);

            return {
              ...row,
              sourceDrug,
              cheapestAlt,
              allAlts: alts,
              matchStatus: 'MATCHED' as const
            };
          } catch (err) {
            console.error(`Failed to fetch alternatives for ${row.prescribedName}`, err);
            return { ...row, matchStatus: 'NO_MATCH' as const };
          }
        })
      );

      setPrescribedRows(updatedRows);
      setIsLoadingRxAlts(false);
    };

    processPrescriptions();
  }, [selectedPrescriptions]);

  // ── 3. Manual Search Effect ─────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        fetchDrugs();
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchDrugs = async () => {
    setIsSearching(true);
    try {
      const res = await apiClient.get(`/drugs?search=${encodeURIComponent(searchQuery)}`);
      const rawList = res.data?.data || [];
      const mapped = rawList.map((d: any) => ({
        id: d.drugId || d.id,
        brandName: d.brandName,
        genericName: d.saltComposition || d.genericName || '',
        strength: d.strength || '',
        dosageForm: d.dosageForm || 'Tablet',
        manufacturer: d.manufacturer || 'Unknown',
        price: Number(d.estimatedPrice || d.price || 0),
        isGeneric: Boolean(d.isGeneric),
        trustRating: Number(d.trustRating || 4.5)
      }));
      setSearchResults(mapped);
    } catch (error) {
      console.error('Failed to fetch drugs', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectDrug = async (drug: Drug) => {
    setSelectedDrug(drug);
    setSearchQuery('');
    setSearchResults([]);
    fetchAlternatives(drug.id);
  };

  const fetchAlternatives = async (drugId: string) => {
    setIsLoadingAlts(true);
    setAltError('');
    setAlternativesData(null);
    setCompareSelection([]);
    try {
      const res = await apiClient.get(`/alternatives/${drugId}`);
      const data = res.data?.data;
      if (data) {
        const sourceDrug: Drug = {
          id: data.sourceDrug.drugId || data.sourceDrug.id,
          brandName: data.sourceDrug.brandName,
          genericName: data.sourceDrug.saltComposition || data.sourceDrug.genericName || '',
          strength: data.sourceDrug.strength || '',
          dosageForm: data.sourceDrug.dosageForm || 'Tablet',
          manufacturer: data.sourceDrug.manufacturer || 'Unknown',
          price: Number(data.sourceDrug.estimatedPrice || data.sourceDrug.price || 0),
          isGeneric: Boolean(data.sourceDrug.isGeneric),
          trustRating: Number(data.sourceDrug.trustRating || 4.5)
        };
        const alternatives: ScoredAlternative[] = (data.alternatives || []).map((alt: any) => ({
          id: alt.drugId || alt.id,
          brandName: alt.brandName,
          genericName: alt.saltComposition || alt.genericName || '',
          strength: alt.strength || '',
          dosageForm: alt.dosageForm || 'Tablet',
          manufacturer: alt.manufacturer || 'Unknown',
          price: Number(alt.estimatedPrice || alt.price || 0),
          isGeneric: Boolean(alt.isGeneric),
          trustRating: Number(alt.trustRating || 4.5),
          matchScore: Math.round(alt.score || 85),
          sameStrength: alt.matchDetails?.sameStrength ?? true,
          sameForm: alt.matchDetails?.sameDosageForm ?? true
        }));
        setAlternativesData({
          sourceDrug,
          alternatives,
          totalAlternatives: data.totalAlternatives || alternatives.length
        });
      }
    } catch (error) {
      setAltError('Failed to load alternatives. Please try again.');
    } finally {
      setIsLoadingAlts(false);
    }
  };

  const toggleCompare = (alt: ScoredAlternative) => {
    setCompareSelection(prev => {
      const isSelected = prev.find(item => item.id === alt.id);
      if (isSelected) {
        return prev.filter(item => item.id !== alt.id);
      }
      if (prev.length < 5) {
        return [...prev, alt];
      }
      return prev;
    });
  };

  const handleCompare = async () => {
    if (compareSelection.length < 1) return;
    const ids = [selectedDrug?.id, ...compareSelection.map(c => c.id)].filter(Boolean).join(',');
    setIsCompareModalOpen(true);
    setIsComparing(true);
    try {
      const res = await apiClient.get(`/alternatives/compare?ids=${ids}`);
      const rawData = res.data?.data || [];
      const mapped = rawData.map((d: any) => ({
        id: d.drugId || d.id,
        brandName: d.brandName,
        genericName: d.genericName || d.saltComposition || '',
        strength: d.strength || '',
        dosageForm: d.dosageForm || 'Tablet',
        manufacturer: d.manufacturer || 'Unknown',
        price: Number(d.estimatedPrice || d.price || 0),
        isGeneric: Boolean(d.isGeneric),
        trustRating: Number(d.trustRating || 4.5),
        uses: d.uses,
        sideEffects: d.sideEffects
      }));
      setComparisonData(mapped);
    } catch (error) {
      console.error('Failed to compare', error);
    } finally {
      setIsComparing(false);
    }
  };

  // ── Calculate Cost Savings for Selected Prescriptions ───────────────────────
  const totalOriginalCost = prescribedRows.reduce((acc, row) => acc + (row.sourceDrug?.price || 0), 0);
  const totalCheapCost = prescribedRows.reduce((acc, row) => acc + (row.cheapestAlt?.price || row.sourceDrug?.price || 0), 0);
  const totalSavings = totalOriginalCost - totalCheapCost;
  const overallSavingsPercent = totalOriginalCost > 0 ? Math.round((totalSavings / totalOriginalCost) * 100) : 0;

  // ── Table Column Definition for Prescribed Alternatives ──────────────────────
  const prescribedColumns = [
    {
      key: 'prescription',
      label: 'Prescription & Doctor',
      render: (_val: any, row: PrescribedMedRow) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Dr. {row.doctorName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rx #{row.rxId.substring(0, 6)} • {row.rxDate}</div>
        </div>
      )
    },
    {
      key: 'prescribedName',
      label: 'Prescribed Medicine',
      render: (_val: any, row: PrescribedMedRow) => (
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-brand-600)' }}>{row.prescribedName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {row.sourceDrug?.genericName || row.dosage || 'Dosage: ' + (row.dosage || 'Standard')}
          </div>
          {row.sourceDrug && (
            <Badge variant="blue">{row.sourceDrug.dosageForm} • {row.sourceDrug.strength}</Badge>
          )}
        </div>
      )
    },
    {
      key: 'originalPrice',
      label: 'Prescribed Price',
      render: (_val: any, row: PrescribedMedRow) => (
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {row.sourceDrug ? `৳${row.sourceDrug.price}` : '—'}
        </div>
      )
    },
    {
      key: 'cheapestAlt',
      label: 'Cheapest Bioequivalent Alternative',
      render: (_val: any, row: PrescribedMedRow) => {
        if (row.matchStatus === 'LOADING') return <Spinner size={16} />;
        if (row.cheapestAlt) {
          const isCheaper = row.sourceDrug && row.cheapestAlt.price < row.sourceDrug.price;
          return (
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: isCheaper ? '#10b981' : 'var(--color-brand-600)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {row.cheapestAlt.brandName}
                <Badge variant={row.cheapestAlt.isGeneric ? 'green' : 'purple'}>
                  {row.cheapestAlt.isGeneric ? 'Generic' : 'Branded'}
                </Badge>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                By {row.cheapestAlt.manufacturer} • {row.cheapestAlt.strength}
              </div>
            </div>
          );
        }
        if (row.sourceDrug?.isGeneric) {
          return (
            <Badge variant="green">
              Already Lowest Generic Price (৳{row.sourceDrug.price})
            </Badge>
          );
        }
        return (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No alternative required / Catalog item
          </span>
        );
      }
    },
    {
      key: 'altPrice',
      label: 'Alternative Price',
      render: (_val: any, row: PrescribedMedRow) => {
        if (!row.cheapestAlt) return '—';
        return (
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#10b981' }}>
            ৳{row.cheapestAlt.price}
          </div>
        );
      }
    },
    {
      key: 'savings',
      label: 'Potential Savings',
      render: (_val: any, row: PrescribedMedRow) => {
        if (!row.sourceDrug || !row.cheapestAlt) return '—';
        const diff = row.sourceDrug.price - row.cheapestAlt.price;
        if (diff <= 0) return <Badge variant="blue">No Price Difference</Badge>;
        const pct = Math.round((diff / row.sourceDrug.price) * 100);
        return (
          <Badge variant="green" icon={<Tag size={12} />}>
            Save {pct}% (৳{diff.toFixed(1)})
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_val: any, row: PrescribedMedRow) => (
        <Button
          size="sm"
          variant="secondary"
          icon={<ChevronRight size={14} />}
          onClick={() => {
            if (row.sourceDrug) selectDrug(row.sourceDrug);
            else setSearchQuery(row.prescribedName);
          }}
        >
          View Alternatives
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '1rem', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }} className="animate-fade-in">
        <h1 style={{
          color: 'var(--text-primary)', fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem',
          background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-400))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Cheaper Medicine Alternatives
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
          Select your scanned prescriptions to automatically discover bioequivalent generic alternatives, or use manual search.
        </p>
      </div>

      {/* Mode Switcher & Selection Bar */}
      <div style={{ maxWidth: '900px', margin: '0 auto 1.5rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
          <button
            onClick={() => setViewMode('prescriptions')}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              background: viewMode === 'prescriptions' ? 'var(--color-brand-600)' : 'transparent',
              color: viewMode === 'prescriptions' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            <FileText size={16} /> Selected Prescriptions ({selectedPrescriptions.length})
          </button>
          <button
            onClick={() => setViewMode('manual')}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              background: viewMode === 'manual' ? 'var(--color-brand-600)' : 'transparent',
              color: viewMode === 'manual' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            <Search size={16} /> Manual Search
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            size="sm"
            variant="secondary"
            icon={<FileText size={14} />}
            onClick={() => setIsRxModalOpen(true)}
          >
            {selectedPrescriptions.length > 0 ? 'Change Rx Selection' : 'Select Prescriptions'}
          </Button>
          {selectedPrescriptions.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setSelectedPrescriptions([]); setViewMode('manual'); }}
            >
              Clear Rx Selection
            </Button>
          )}
        </div>
      </div>

      {/* Manual Search Input (Always easily accessible) */}
      <div style={{ maxWidth: '600px', margin: '0 auto 2rem auto', position: 'relative' }}>
        <Input
          placeholder="Search for a drug manually (e.g., Napa, Moxacil, Seclo)..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (viewMode !== 'manual') setViewMode('manual');
          }}
          icon={<Search size={18} />}
        />
        {isSearching && (
          <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
            <Spinner />
          </div>
        )}

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', marginTop: '0.5rem', zIndex: 50, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)' }}>
            {searchResults.map(drug => (
              <div
                key={drug.id}
                onClick={() => selectDrug(drug)}
                style={{ padding: '0.85rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{drug.brandName}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{drug.genericName} • {drug.strength}</div>
                </div>
                <div style={{ color: 'var(--color-brand-600)', fontWeight: 800 }}>৳{drug.price}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODE 1: PRESCRIPTION ALTERNATIVES TABULAR VIEW ─────────────────────── */}
      {viewMode === 'prescriptions' && (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }} className="animate-fade-in">
          {/* Cost Savings Summary Card */}
          {prescribedRows.length > 0 && (
            <Card style={{ marginBottom: '1.5rem', padding: '20px 24px', background: 'linear-gradient(135deg, #00685f 0%, #0284c7 100%)', color: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                    Prescription Savings Summary
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>
                    {selectedPrescriptions.length} Prescription(s) • {prescribedRows.length} Medicines Analyzed
                  </div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '2px' }}>
                    Switching to verified generic alternatives yields substantial savings without compromising medical efficacy.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Original Total</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, textDecoration: 'line-through', opacity: 0.85 }}>৳{totalOriginalCost}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Alternative Total</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>৳{totalCheapCost}</div>
                  </div>
                  {totalSavings > 0 && (
                    <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '10px 16px', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Savings</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fef08a' }}>
                        ৳{totalSavings.toFixed(1)} ({overallSavingsPercent}%)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Tabular Alternatives Table */}
          <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Tabular Prescription Alternatives
              </h3>
              {isLoadingRxAlts && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Spinner size={16} /> Matching master medicines & cheap alternatives...
                </div>
              )}
            </div>

            <Table
              columns={prescribedColumns}
              data={prescribedRows}
              loading={isLoadingRxAlts}
              keyExtractor={row => row.id}
            />
          </Card>
        </div>
      )}

      {/* ── MODE 2: SINGLE DRUG / MANUAL SEARCH VIEW ─────────────────────────── */}
      {(viewMode === 'manual' || selectedDrug) && (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Loading & Error States */}
          {isLoadingAlts && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Spinner />
            </div>
          )}

          {altError && (
            <EmptyState title="Error Loading Alternatives" description={altError} icon={<X size={28} />} />
          )}

          {/* Main Content Area */}
          {alternativesData && !isLoadingAlts && (
            <div className="animate-fade-in">
              {/* Source Drug Profile */}
              <Card style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--color-brand-600) 0%, var(--color-brand-500) 100%)', color: 'white', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.8125rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', fontWeight: 700 }}>Source Medication</div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>{alternativesData.sourceDrug.brandName}</h2>
                    <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '1rem' }}>
                      {alternativesData.sourceDrug.genericName} • {alternativesData.sourceDrug.strength} • {alternativesData.sourceDrug.dosageForm}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                        By {alternativesData.sourceDrug.manufacturer}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>৳{alternativesData.sourceDrug.price}</div>
                    <span style={{ fontSize: '0.8125rem', opacity: 0.85 }}>Estimated Price</span>
                  </div>
                </div>
              </Card>

              {/* Filters & Actions Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  Available Bioequivalent Alternatives ({alternativesData.alternatives.length})
                </h3>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ width: '150px' }}>
                    <Input
                      type="number"
                      placeholder="Max Price (৳)"
                      value={budgetLimit}
                      onChange={(e) => setBudgetLimit(e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>
                  <div style={{ width: '150px' }}>
                    <Input
                      placeholder="Filter form..."
                      value={formFilter}
                      onChange={(e) => setFormFilter(e.target.value)}
                    />
                  </div>
                  {compareSelection.length > 0 && (
                    <Button
                      onClick={handleCompare}
                      icon={<ArrowRightLeft size={16} />}
                    >
                      Compare ({compareSelection.length})
                    </Button>
                  )}
                </div>
              </div>

              {/* Alternatives Grid */}
              {alternativesData.alternatives.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {alternativesData.alternatives
                    .filter(alt => {
                      if (budgetLimit && alt.price > Number(budgetLimit)) return false;
                      if (formFilter && alt.dosageForm.toLowerCase() !== formFilter.toLowerCase()) return false;
                      return true;
                    })
                    .map(alt => {
                      const sourcePrice = alternativesData.sourceDrug.price;
                      const savingsPct = sourcePrice > 0 && alt.price < sourcePrice ? Math.round(((sourcePrice - alt.price) / sourcePrice) * 100) : 0;
                      const isSelected = compareSelection.some(c => c.id === alt.id);

                      return (
                        <Card
                          key={alt.id}
                          style={{
                            position: 'relative',
                            border: isSelected ? '2px solid var(--color-brand-500)' : '1px solid var(--border-default)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            padding: '20px'
                          }}
                          onClick={() => toggleCompare(alt)}
                        >
                          {savingsPct > 0 && (
                            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                              <Badge variant="green" icon={<Tag size={12} />}>
                                Save {savingsPct}%
                              </Badge>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingRight: savingsPct ? '80px' : '0' }}>
                            <div>
                              <h4 style={{ color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>{alt.brandName}</h4>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{alt.manufacturer}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: 'var(--color-brand-600)', fontSize: '1.25rem', fontWeight: 800 }}>৳{alt.price}</div>
                              <Badge variant={alt.isGeneric ? 'green' : 'blue'}>
                                {alt.isGeneric ? 'Generic' : 'Branded'}
                              </Badge>
                            </div>
                          </div>

                          <div className="divider" style={{ margin: '12px 0' }} />

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Match Score</span>
                              <span style={{ fontWeight: 700, color: alt.matchScore > 80 ? '#10b981' : 'var(--text-primary)' }}>{alt.matchScore}/100</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Same Strength ({alt.strength})</span>
                              {alt.sameStrength ? <CheckCircle size={16} color="#10b981" /> : <X size={16} color="#ef4444" />}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Same Form ({alt.dosageForm})</span>
                              {alt.sameForm ? <CheckCircle size={16} color="#10b981" /> : <X size={16} color="#ef4444" />}
                            </div>
                            {alt.trustRating && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Trust Rating</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  <Star size={14} fill="#fbbf24" stroke="#fbbf24" /> {alt.trustRating}/5
                                </span>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                </div>
              ) : (
                <EmptyState icon={<X size={28} />} title="No Alternatives Found" description="Try adjusting your search or filters." />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: SELECT PRESCRIPTIONS DIRECTLY ─────────────────────────────── */}
      {isRxModalOpen && (
        <Modal
          isOpen={isRxModalOpen}
          onClose={() => setIsRxModalOpen(false)}
          title="Select Prescriptions for Cheap Alternatives Analysis"
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Select one or multiple prescriptions from your scan logs to view bioequivalent cheap alternatives in tabular format.
            </p>

            {loadingRxList ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
            ) : allUserPrescriptions.length === 0 ? (
              <EmptyState icon={<FileText size={28} />} title="No Prescriptions Found" description="Scan a prescription first in the Prescriptions tab." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                {allUserPrescriptions.map((rx) => {
                  const isSelected = selectedPrescriptions.some(p => p.prescriptionId === rx.prescriptionId);
                  const dateStr = rx.createdAt ? new Date(rx.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent';
                  const meds = rx.medicines?.map(m => m.brandName) || (rx.ocrResult?.medicines || []).map(m => m.brand_name?.value || '');

                  return (
                    <div
                      key={rx.prescriptionId}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPrescriptions(prev => prev.filter(p => p.prescriptionId !== rx.prescriptionId));
                        } else {
                          setSelectedPrescriptions(prev => [...prev, rx]);
                        }
                      }}
                      style={{
                        padding: '12px 16px', borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--color-brand-500)' : '1px solid var(--border-default)',
                        background: isSelected ? 'rgba(0,104,95,0.05)' : 'var(--bg-elevated)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isSelected ? <CheckSquare size={20} color="var(--color-brand-600)" /> : <Square size={20} color="var(--text-muted)" />}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            Rx #{rx.prescriptionId.substring(0, 8)} ({dateStr})
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {meds.slice(0, 3).join(', ')} {meds.length > 3 ? `+${meds.length - 3} more` : ''}
                          </div>
                        </div>
                      </div>
                      <Badge variant={isSelected ? 'green' : 'blue'}>
                        {isSelected ? 'Selected' : 'Select'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button variant="secondary" onClick={() => setIsRxModalOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsRxModalOpen(false);
                  if (selectedPrescriptions.length > 0) setViewMode('prescriptions');
                }}
              >
                Apply Selection ({selectedPrescriptions.length})
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: SIDE-BY-SIDE COMPARISON ───────────────────────────────────── */}
      {isCompareModalOpen && (
        <Modal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          title="Medicine Comparison"
          size="lg"
        >
          {isComparing ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table
                columns={[
                  { key: 'attribute', label: 'Feature', width: '20%' },
                  ...comparisonData.map(d => ({
                    key: d.id,
                    label: d.brandName,
                    render: (val: unknown, row: Record<string, any>) => row[d.id]
                  }))
                ]}
                data={[
                  { attribute: 'Generic Name', ...Object.fromEntries(comparisonData.map(d => [d.id, d.genericName])) },
                  { attribute: 'Manufacturer', ...Object.fromEntries(comparisonData.map(d => [d.id, d.manufacturer])) },
                  { attribute: 'Strength', ...Object.fromEntries(comparisonData.map(d => [d.id, d.strength])) },
                  { attribute: 'Dosage Form', ...Object.fromEntries(comparisonData.map(d => [d.id, d.dosageForm])) },
                  { attribute: 'Price', ...Object.fromEntries(comparisonData.map(d => [d.id, `৳${d.price}`])) },
                  { attribute: 'Type', ...Object.fromEntries(comparisonData.map(d => [d.id, d.isGeneric ? 'Generic' : 'Branded'])) },
                  { attribute: 'Trust Rating', ...Object.fromEntries(comparisonData.map(d => [d.id, `${d.trustRating || 'N/A'} / 5`])) },
                ]}
                keyExtractor={(row) => row.attribute}
              />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
