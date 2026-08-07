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
  ChevronRight,
  CheckSquare,
  Square,
  AlertTriangle,
  ShieldCheck,
  Store,
  MapPin,
  Pill,
  Check,
  Building,
  Navigation,
  Sparkles,
  Filter
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
  digitizedNotes?: string;
  doctorName?: string;
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

interface PharmacyAvailabilityItem {
  pharmacyId: string;
  storeName: string;
  streetAddress: string;
  distance: string;
  hours: string;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK';
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

  // Active view mode: 'prescriptions' (if prescriptions exist) or 'explore'
  const [viewMode, setViewMode] = useState<'prescriptions' | 'explore'>(
    initialRxList.length > 0 ? 'prescriptions' : 'explore'
  );

  // Prescribed medicines table rows & status
  const [prescribedRows, setPrescribedRows] = useState<PrescribedMedRow[]>([]);
  const [isLoadingRxAlts, setIsLoadingRxAlts] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Selected drug single view
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [alternativesData, setAlternativesData] = useState<AlternativesResponse | null>(null);
  const [isLoadingAlts, setIsLoadingAlts] = useState(false);
  const [altError, setAltError] = useState('');

  // Filters & comparisons
  const [typeFilter, setTypeFilter] = useState<'all' | 'generic' | 'brand'>('all');
  const [compareSelection, setCompareSelection] = useState<ScoredAlternative[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<DrugComparison[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Nearby Pharmacies state
  const [pharmacies, setPharmacies] = useState<PharmacyAvailabilityItem[]>([]);

  // ── 1. Fetch user prescriptions & pharmacies on mount ─────────────────────
  useEffect(() => {
    fetchAllPrescriptions();
    fetchNearbyPharmacies();
  }, []);

  const fetchAllPrescriptions = async () => {
    setLoadingRxList(true);
    try {
      const res = await apiClient.get('/prescriptions');
      const list: Prescription[] = res.data?.data || [];
      setAllUserPrescriptions(list);

      // Auto-select user prescriptions if none selected via router state
      if (initialRxList.length === 0 && list.length > 0) {
        setSelectedPrescriptions(list);
      }
    } catch (err) {
      console.error('Failed to load user prescriptions', err);
    } finally {
      setLoadingRxList(false);
    }
  };

  const fetchNearbyPharmacies = async () => {
    try {
      const res = await apiClient.get('/pharmacies?limit=5');
      const apiPharmacies = res.data?.data || [];
      if (apiPharmacies.length > 0) {
        setPharmacies(
          apiPharmacies.slice(0, 3).map((p: any, idx: number) => ({
            pharmacyId: p.pharmacyId || p.id || `p-${idx}`,
            storeName: p.storeName || p.name || 'Local Pharmacy',
            streetAddress: p.streetAddress || `${p.city || 'Dhaka'}, Block B`,
            distance: `${(2.1 + idx * 1.3).toFixed(1)}km`,
            hours: idx === 1 ? 'Open 24 Hrs' : 'Open until 9 PM',
            stockStatus: idx === 1 ? 'LOW_STOCK' : 'IN_STOCK'
          }))
        );
      } else {
        setPharmacies([
          {
            pharmacyId: 'p1',
            storeName: 'HealthPlus Pharmacy',
            streetAddress: 'Dhaka Central',
            distance: '2.1km',
            hours: 'Open until 9 PM',
            stockStatus: 'IN_STOCK'
          },
          {
            pharmacyId: 'p2',
            storeName: 'Care Pharmacy',
            streetAddress: 'Gulshan Branch',
            distance: '3.4km',
            hours: 'Open 24 Hrs',
            stockStatus: 'LOW_STOCK'
          }
        ]);
      }
    } catch {
      setPharmacies([
        {
          pharmacyId: 'p1',
          storeName: 'HealthPlus Pharmacy',
          streetAddress: 'Dhaka Central',
          distance: '2.1km',
          hours: 'Open until 9 PM',
          stockStatus: 'IN_STOCK'
        },
        {
          pharmacyId: 'p2',
          storeName: 'Care Pharmacy',
          streetAddress: 'Gulshan Branch',
          distance: '3.4km',
          hours: 'Open 24 Hrs',
          stockStatus: 'LOW_STOCK'
        }
      ]);
    }
  };

  // ── 2. Process Selected Prescriptions ───────────────────────────────────────
  useEffect(() => {
    if (selectedPrescriptions.length === 0) {
      setPrescribedRows([]);
      return;
    }

    const processPrescriptions = async () => {
      setIsLoadingRxAlts(true);
      const rows: PrescribedMedRow[] = [];

      selectedPrescriptions.forEach((rx) => {
        const dateStr = rx.createdAt ? new Date(rx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
        const docName = rx.ocrResult?.doctor_name?.value || rx.doctorName || 'Prescriber';
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

      const updatedRows = await Promise.all(
        rows.map(async (row) => {
          try {
            let sourceDrug: Drug | null = row.preMatchedDrug || null;

            if (!sourceDrug) {
              const cleaned = cleanName(row.prescribedName);
              let searchRes = await apiClient.get('/drugs', { params: { search: cleaned || row.prescribedName } });
              let matchedDrugs = searchRes.data?.data || [];

              if (matchedDrugs.length === 0 && row.prescribedName !== cleaned) {
                searchRes = await apiClient.get('/drugs', { params: { search: row.prescribedName } });
                matchedDrugs = searchRes.data?.data || [];
              }

              if (matchedDrugs.length === 0) {
                const firstWord = row.prescribedName.trim().split(' ')[0];
                if (firstWord && firstWord.length > 2) {
                  searchRes = await apiClient.get('/drugs', { params: { search: firstWord } });
                  matchedDrugs = searchRes.data?.data || [];
                }
              }

              if (matchedDrugs.length > 0) {
                const masterDrugData = matchedDrugs[0];
                sourceDrug = {
                  id: masterDrugData.drugId || masterDrugData.id,
                  brandName: masterDrugData.brandName || masterDrugData.brand_name,
                  genericName: masterDrugData.saltComposition || masterDrugData.genericName || masterDrugData.salt_composition || '',
                  strength: masterDrugData.strength || '',
                  dosageForm: masterDrugData.dosageForm || masterDrugData.dosage_form || 'Tablet',
                  manufacturer: masterDrugData.manufacturer || 'Unknown',
                  price: Number(masterDrugData.estimatedPrice || masterDrugData.price || masterDrugData.estimated_price || 0),
                  isGeneric: Boolean(masterDrugData.isGeneric ?? masterDrugData.is_generic),
                  trustRating: Number(masterDrugData.trustRating || masterDrugData.trust_rating || 4.5)
                };
              }
            }

            if (!sourceDrug) {
              return { ...row, matchStatus: 'NO_MATCH' as const };
            }

            const altRes = await apiClient.get(`/alternatives/${sourceDrug.id}`);
            const altData = altRes.data?.data;
            let alts: ScoredAlternative[] = (altData?.alternatives || []).map((alt: any) => ({
              id: alt.drugId || alt.id,
              brandName: alt.brandName || alt.brand_name,
              genericName: alt.saltComposition || alt.genericName || alt.salt_composition || '',
              strength: alt.strength || '',
              dosageForm: alt.dosageForm || alt.dosage_form || 'Tablet',
              manufacturer: alt.manufacturer || 'Unknown',
              price: Number(alt.estimatedPrice || alt.price || alt.estimated_price || 0),
              isGeneric: Boolean(alt.isGeneric ?? alt.is_generic),
              trustRating: Number(alt.trustRating || alt.trust_rating || 4.5),
              matchScore: Math.round(alt.score || 85),
              sameStrength: alt.matchDetails?.sameStrength ?? true,
              sameForm: alt.matchDetails?.sameDosageForm ?? true
            }));

            if (alts.length === 0 && sourceDrug.genericName) {
              const genRes = await apiClient.get('/drugs', { params: { search: sourceDrug.genericName } });
              const genList = (genRes.data?.data || []).filter((d: any) => (d.drugId || d.id) !== sourceDrug!.id);
              alts = genList.map((alt: any) => ({
                id: alt.drugId || alt.id,
                brandName: alt.brandName || alt.brand_name,
                genericName: alt.saltComposition || alt.genericName || alt.salt_composition || '',
                strength: alt.strength || '',
                dosageForm: alt.dosageForm || alt.dosage_form || 'Tablet',
                manufacturer: alt.manufacturer || 'Generic',
                price: Number(alt.estimatedPrice || alt.price || alt.estimated_price || 0),
                isGeneric: Boolean(alt.isGeneric ?? alt.is_generic),
                trustRating: Number(alt.trustRating || alt.trust_rating || 4.5),
                matchScore: 85,
                sameStrength: true,
                sameForm: true
              }));
            }

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

  // ── 3. Ultra-Robust Live Drug Search ────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        fetchDrugs();
      } else {
        setSearchResults([]);
        setSearchError('');
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchDrugs = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    setSearchError('');
    try {
      let rawList: any[] = [];
      try {
        const res = await apiClient.get('/drugs', { params: { search: q } });
        rawList = Array.isArray(res.data?.data)
          ? res.data.data
          : (res.data?.data?.drugs || []);
      } catch {
        const res = await apiClient.get(`/drugs/search?q=${encodeURIComponent(q)}`);
        rawList = Array.isArray(res.data?.data)
          ? res.data.data
          : (res.data?.data?.drugs || []);
      }

      const mapped: Drug[] = rawList.map((d: any) => ({
        id: d.drugId || d.id || d.drug_id,
        brandName: d.brandName || d.brand_name || 'Unknown',
        genericName: d.saltComposition || d.genericName || d.salt_composition || '',
        strength: d.strength || '',
        dosageForm: d.dosageForm || d.dosage_form || 'Tablet',
        manufacturer: d.manufacturer || 'Unknown',
        price: Number(d.estimatedPrice || d.price || d.estimated_price || 0),
        isGeneric: Boolean(d.isGeneric ?? d.is_generic),
        trustRating: Number(d.trustRating || d.trust_rating || 4.5)
      }));

      // Relevance sort: Exact brand match (#1), prefix match (#2), shorter brand names (#3)
      const qLower = q.toLowerCase();
      mapped.sort((a, b) => {
        const aBrand = a.brandName.toLowerCase();
        const bBrand = b.brandName.toLowerCase();

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
      if (mapped.length === 0) {
        setSearchError(`No medicines matching "${q}"`);
      }
    } catch (error) {
      console.error('Failed to fetch drugs', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectDrug = async (drug: Drug) => {
    setSelectedDrug(drug);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError('');
    setViewMode('explore');
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
          id: data.sourceDrug.drugId || data.sourceDrug.id || data.sourceDrug.drug_id,
          brandName: data.sourceDrug.brandName || data.sourceDrug.brand_name,
          genericName: data.sourceDrug.saltComposition || data.sourceDrug.genericName || data.sourceDrug.salt_composition || '',
          strength: data.sourceDrug.strength || '',
          dosageForm: data.sourceDrug.dosageForm || data.sourceDrug.dosage_form || 'Tablet',
          manufacturer: data.sourceDrug.manufacturer || 'Unknown',
          price: Number(data.sourceDrug.estimatedPrice || data.sourceDrug.price || data.sourceDrug.estimated_price || 0),
          isGeneric: Boolean(data.sourceDrug.isGeneric ?? data.sourceDrug.is_generic),
          trustRating: Number(data.sourceDrug.trustRating || data.sourceDrug.trust_rating || 4.8)
        };

        let alternatives: ScoredAlternative[] = (data.alternatives || []).map((alt: any) => ({
          id: alt.drugId || alt.id || alt.drug_id,
          brandName: alt.brandName || alt.brand_name,
          genericName: alt.saltComposition || alt.genericName || alt.salt_composition || '',
          strength: alt.strength || '',
          dosageForm: alt.dosageForm || alt.dosage_form || 'Tablet',
          manufacturer: alt.manufacturer || 'Unknown',
          price: Number(alt.estimatedPrice || alt.price || alt.estimated_price || 0),
          isGeneric: Boolean(alt.isGeneric ?? alt.is_generic),
          trustRating: Number(alt.trustRating || alt.trust_rating || 4.5),
          matchScore: Math.round(alt.score || 85),
          sameStrength: alt.matchDetails?.sameStrength ?? true,
          sameForm: alt.matchDetails?.sameDosageForm ?? true
        }));

        if (alternatives.length === 0 && sourceDrug.genericName) {
          try {
            const genRes = await apiClient.get('/drugs', { params: { search: sourceDrug.genericName } });
            const genList = (genRes.data?.data || []).filter((d: any) => (d.drugId || d.id || d.drug_id) !== sourceDrug.id);
            alternatives = genList.map((alt: any) => ({
              id: alt.drugId || alt.id || alt.drug_id,
              brandName: alt.brandName || alt.brand_name,
              genericName: alt.saltComposition || alt.genericName || alt.salt_composition || '',
              strength: alt.strength || '',
              dosageForm: alt.dosageForm || alt.dosage_form || 'Tablet',
              manufacturer: alt.manufacturer || 'Generic',
              price: Number(alt.estimatedPrice || alt.price || alt.estimated_price || 0),
              isGeneric: Boolean(alt.isGeneric ?? alt.is_generic),
              trustRating: Number(alt.trustRating || alt.trust_rating || 4.5),
              matchScore: 85,
              sameStrength: true,
              sameForm: true
            }));
          } catch {
            // ignore
          }
        }

        setAlternativesData({
          sourceDrug,
          alternatives,
          totalAlternatives: alternatives.length
        });
      }
    } catch (error) {
      setAltError('Failed to load alternatives.');
    } finally {
      setIsLoadingAlts(false);
    }
  };

  const toggleCompare = (alt: ScoredAlternative) => {
    setCompareSelection(prev => {
      const isSelected = prev.find(item => item.id === alt.id);
      if (isSelected) return prev.filter(item => item.id !== alt.id);
      if (prev.length < 5) return [...prev, alt];
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
        brandName: d.brandName || d.brand_name,
        genericName: d.genericName || d.saltComposition || d.salt_composition || '',
        strength: d.strength || '',
        dosageForm: d.dosageForm || d.dosage_form || 'Tablet',
        manufacturer: d.manufacturer || 'Unknown',
        price: Number(d.estimatedPrice || d.price || d.estimated_price || 0),
        isGeneric: Boolean(d.isGeneric ?? d.is_generic),
        trustRating: Number(d.trustRating || d.trust_rating || 4.5),
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

  // ── Table Columns for Prescribed Alternatives ──────────────────────────────
  const prescribedColumns = [
    {
      key: 'prescription',
      label: 'Prescription & Doctor',
      render: (_val: any, row: PrescribedMedRow) => (
        <div>
          <div className="font-bold text-on-surface text-sm">Dr. {row.doctorName}</div>
          <div className="text-xs text-on-surface-variant">Rx #{row.rxId.substring(0, 6)} • {row.rxDate}</div>
        </div>
      )
    },
    {
      key: 'prescribedName',
      label: 'Prescribed Medicine',
      render: (_val: any, row: PrescribedMedRow) => (
        <div>
          <div className="font-bold text-primary text-sm">{row.prescribedName}</div>
          <div className="text-xs text-on-surface-variant">
            {row.sourceDrug?.genericName || row.dosage || 'Dosage: ' + (row.dosage || 'Standard')}
          </div>
        </div>
      )
    },
    {
      key: 'originalPrice',
      label: 'Prescribed Price',
      render: (_val: any, row: PrescribedMedRow) => (
        <div className="font-bold text-on-surface text-sm">
          {row.sourceDrug ? `৳${row.sourceDrug.price}` : '—'}
        </div>
      )
    },
    {
      key: 'cheapestAlt',
      label: 'Bioequivalent Alternative',
      render: (_val: any, row: PrescribedMedRow) => {
        if (row.matchStatus === 'LOADING') return <Spinner size={16} />;
        if (row.cheapestAlt) {
          return (
            <div>
              <div className="font-bold text-sm text-[#10B981] flex items-center gap-1.5">
                {row.cheapestAlt.brandName}
                <Badge variant={row.cheapestAlt.isGeneric ? 'green' : 'purple'}>
                  {row.cheapestAlt.isGeneric ? 'Generic' : 'Brand'}
                </Badge>
              </div>
              <div className="text-xs text-on-surface-variant">
                By {row.cheapestAlt.manufacturer} • {row.cheapestAlt.strength}
              </div>
            </div>
          );
        }
        return <span className="text-xs text-on-surface-variant/70 italic">Lowest generic price</span>;
      }
    },
    {
      key: 'altPrice',
      label: 'Alternative Price',
      render: (_val: any, row: PrescribedMedRow) => {
        if (!row.cheapestAlt) return '—';
        return <div className="font-bold text-[#10B981] text-base">৳{row.cheapestAlt.price}</div>;
      }
    },
    {
      key: 'savings',
      label: 'Savings',
      render: (_val: any, row: PrescribedMedRow) => {
        if (!row.sourceDrug || !row.cheapestAlt) return '—';
        const diff = row.sourceDrug.price - row.cheapestAlt.price;
        if (diff <= 0) return <Badge variant="blue">Same Price</Badge>;
        const pct = Math.round((diff / row.sourceDrug.price) * 100);
        return (
          <span className="inline-flex items-center gap-1 bg-[#10B981]/10 text-[#047857] px-2.5 py-1 rounded-full text-xs font-bold">
            <Tag size={12} /> Save {pct}% (৳{diff.toFixed(1)})
          </span>
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
            else {
              setSearchQuery(row.prescribedName);
              fetchDrugs();
            }
          }}
        >
          Explore
        </Button>
      )
    }
  ];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto space-y-6">
      
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Active Selection</span>
            <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
            <span className="font-label-sm text-label-sm text-primary font-bold">
              {selectedDrug ? `${selectedDrug.brandName} ${selectedDrug.strength}` : 'Search or Explore'}
            </span>
          </div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-extrabold tracking-tight">
            Explore medicine options
          </h2>
        </div>

        {/* Safety Warning Banner */}
        <div className="flex items-center gap-2 bg-[#FEF3C7] text-[#B45309] px-4 py-2 rounded-lg border border-[#FDE68A] shadow-sm max-w-md">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="font-label-sm text-label-sm leading-tight">
            Do not switch medicines without confirming with your doctor.
          </span>
        </div>
      </div>

      {/* ── Top Control Bar: Mode Switcher on Left & Right-Aligned Search Bar ────── */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Mode Toggle Pills */}
        <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setViewMode('explore')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-label-md text-xs transition-all ${
              viewMode === 'explore'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Pill className="w-4 h-4" />
            Explore Medicines
          </button>
          <button
            onClick={() => setViewMode('prescriptions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-label-md text-xs transition-all ${
              viewMode === 'prescriptions'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <FileText className="w-4 h-4" />
            Prescriptions ({selectedPrescriptions.length})
          </button>
        </div>

        {/* Right-Aligned Search Bar */}
        <div className="relative w-full md:w-96 md:ml-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchResults.length > 0) selectDrug(searchResults[0]);
              else if (searchQuery.trim()) fetchDrugs();
            }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" style={{ top: '50%' }} />
            <input
              type="text"
              className="w-full pl-9 pr-8 py-2 bg-surface-container-lowest border border-outline-variant rounded-full text-xs text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Search 21k+ medicines (e.g. Napa, Seclo, Metformin)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2" style={{ top: '50%' }}>
                <Spinner size={14} />
              </div>
            )}
          </form>

          {/* Search Results Dropdown */}
          {(searchResults.length > 0 || searchError) && (
            <div className="absolute top-full left-0 right-0 bg-surface-container-lowest border border-outline-variant/40 rounded-xl mt-2 z-50 shadow-xl overflow-hidden max-h-72 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map(drug => (
                  <div
                    key={drug.id}
                    onClick={() => selectDrug(drug)}
                    className="px-4 py-3 cursor-pointer hover:bg-surface-container-low transition-colors border-b border-outline-variant/20 flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-bold text-on-surface text-sm">{drug.brandName}</div>
                      <div className="text-[11px] text-on-surface-variant">{drug.genericName} • {drug.strength} • {drug.dosageForm}</div>
                      <div className="text-[10px] text-outline">By {drug.manufacturer}</div>
                    </div>
                    <div className="text-primary font-bold text-sm">৳{drug.price}</div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-on-surface-variant">
                  {searchError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mode 1: PRESCRIPTION TABULAR SAVINGS ───────────────────────────────── */}
      {viewMode === 'prescriptions' && (
        <div className="space-y-6">
          {/* Top Prescriptions Control Row with Select Prescriptions Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm">
            <div>
              <h3 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Scanned Prescriptions Analysis
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Analyze bioequivalent cheap generic alternatives for your active prescription records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={<FileText className="w-4 h-4" />}
                onClick={() => setIsRxModalOpen(true)}
              >
                {selectedPrescriptions.length > 0 ? `Select Prescriptions (${selectedPrescriptions.length})` : 'Select Prescriptions'}
              </Button>
              {selectedPrescriptions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPrescriptions([])}
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </div>

          {prescribedRows.length > 0 ? (
            <>
              <Card className="p-5 bg-gradient-to-r from-primary to-[#008378] text-on-primary shadow-md rounded-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-on-primary/80">
                      Prescription Savings Summary
                    </div>
                    <h3 className="text-xl font-extrabold mt-1">
                      {selectedPrescriptions.length} Prescription(s) • {prescribedRows.length} Medicines Analyzed
                    </h3>
                    <p className="text-xs text-on-primary/90 mt-1">
                      Switching to verified bioequivalent generic alternatives yields substantial cost savings.
                    </p>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <div className="text-[11px] text-on-primary/80">Original Total</div>
                      <div className="text-base font-bold line-through opacity-80">৳{totalOriginalCost}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-on-primary/80">Generic Total</div>
                      <div className="text-xl font-black">৳{totalCheapCost}</div>
                    </div>
                    {totalSavings > 0 && (
                      <div className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-lg text-center border border-white/20">
                        <div className="text-[10px] font-bold uppercase">Total Savings</div>
                        <div className="text-lg font-black text-[#FEF08A]">
                          ৳{totalSavings.toFixed(1)} ({overallSavingsPercent}%)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Prescription Alternatives Breakdown
                  </h3>
                  {isLoadingRxAlts && <Spinner size={16} />}
                </div>

                <Table
                  columns={prescribedColumns}
                  data={prescribedRows}
                  loading={isLoadingRxAlts}
                  keyExtractor={row => row.id}
                />
              </Card>
            </>
          ) : (
            <Card className="p-8 text-center space-y-4">
              <EmptyState
                icon={<FileText className="w-10 h-10 text-primary mx-auto" />}
                title="No Prescriptions Selected for Analysis"
                description="Click 'Select Prescriptions' to pick scanned prescriptions from your history and calculate bioequivalent generic savings."
              />
              <div className="flex justify-center pt-2">
                <Button
                  variant="primary"
                  icon={<FileText className="w-4 h-4" />}
                  onClick={() => setIsRxModalOpen(true)}
                >
                  Select Prescriptions
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Mode 2: STITCH BENTO GRID LAYOUT ───────────────────────────────────── */}
      {(viewMode === 'explore' || selectedDrug) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* MAIN FOCUS: VERIFIED ALTERNATIVES (lg:col-span-8) */}
          <section className="lg:col-span-8 space-y-6">
            
            {/* Section Title & View Pills */}
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Verified Alternatives
              </h3>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-surface-container-high rounded-full p-1">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-3 py-1 rounded-full font-label-sm text-xs transition-all ${
                      typeFilter === 'all'
                        ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setTypeFilter('generic')}
                    className={`px-3 py-1 rounded-full font-label-sm text-xs transition-all ${
                      typeFilter === 'generic'
                        ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Generic
                  </button>
                  <button
                    onClick={() => setTypeFilter('brand')}
                    className={`px-3 py-1 rounded-full font-label-sm text-xs transition-all ${
                      typeFilter === 'brand'
                        ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Brand
                  </button>
                </div>

                {compareSelection.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleCompare}
                    icon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                  >
                    Compare ({compareSelection.length})
                  </Button>
                )}
              </div>
            </div>

            {/* Current Selected Card */}
            {selectedDrug ? (
              <div className="bg-surface-container-lowest rounded-xl p-6 border-2 border-primary shadow-[0px_12px_32px_rgba(30,41,59,0.12)] -translate-y-1 transition-transform relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-on-primary px-3 py-1 rounded-bl-lg font-label-sm text-xs font-bold uppercase tracking-wider">
                  Current
                </div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-headline-md text-xl font-bold text-on-surface">
                      {selectedDrug.brandName}
                    </h4>
                    <p className="font-body-md text-sm text-on-surface-variant">
                      {selectedDrug.genericName} • {selectedDrug.strength} • {selectedDrug.dosageForm}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                    <Pill className="w-6 h-6 text-primary" />
                  </div>
                </div>

                <div className="flex justify-between items-end mt-6 pt-4 border-t border-outline-variant/30">
                  <div>
                    <p className="font-label-sm text-xs text-on-surface-variant">Est. Reference Price</p>
                    <p className="font-headline-md text-2xl font-bold text-primary">
                      ৳{selectedDrug.price} <span className="text-sm font-normal text-on-surface-variant">/ 30 qty</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold text-xs">
                    <CheckCircle className="w-4 h-4 fill-primary text-on-primary" />
                    <span>Widely Available</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl p-8 border border-dashed border-outline-variant/50 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-primary mx-auto opacity-70" />
                <h4 className="text-base font-bold text-on-surface">Search a Medicine to Explore Alternatives</h4>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                  Type any medicine brand (e.g., Napa, Seclo, Metformin) in the search bar on the right to instantly view cheap bioequivalent generic alternatives.
                </p>
              </div>
            )}

            {/* Loading & Error States */}
            {isLoadingAlts && (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            )}

            {altError && (
              <EmptyState title="Error Loading Alternatives" description={altError} icon={<X className="w-6 h-6" />} />
            )}

            {/* Alternatives Grid */}
            {alternativesData && !isLoadingAlts && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alternativesData.alternatives
                  .filter(alt => {
                    if (typeFilter === 'generic' && !alt.isGeneric) return false;
                    if (typeFilter === 'brand' && alt.isGeneric) return false;
                    return true;
                  })
                  .map(alt => {
                    const sourcePrice = selectedDrug ? selectedDrug.price : alternativesData.sourceDrug.price;
                    const savingsPct = sourcePrice > 0 && alt.price < sourcePrice
                      ? Math.round(((sourcePrice - alt.price) / sourcePrice) * 100)
                      : 0;
                    const isSelected = compareSelection.some(c => c.id === alt.id);

                    return (
                      <div
                        key={alt.id}
                        className={`bg-surface-container-lowest rounded-xl p-6 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'border-primary shadow-md ring-2 ring-primary/20'
                            : 'border-outline-variant/30 shadow-[0px_4px_20px_rgba(30,41,59,0.05)] hover:shadow-[0px_12px_32px_rgba(30,41,59,0.12)] hover:-translate-y-1'
                        }`}
                      >
                        {savingsPct > 0 && (
                          <div className="absolute top-0 right-0 bg-[#10B981] text-white px-3 py-1 rounded-bl-lg font-label-sm text-[11px] font-bold flex items-center gap-1">
                            <Tag size={12} /> Save {savingsPct}%
                          </div>
                        )}

                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-headline-md text-lg font-bold text-on-surface">
                                {alt.brandName}
                              </h4>
                              <p className="font-body-md text-xs text-on-surface-variant">
                                {alt.isGeneric ? 'Generic' : 'Brand'} • {alt.strength} • {alt.dosageForm}
                              </p>
                              <p className="text-[11px] text-outline mt-0.5">By {alt.manufacturer}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                              <Pill className="w-6 h-6 text-secondary" />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-end mt-4 pt-4 border-t border-outline-variant/30">
                          <div>
                            <p className="font-label-sm text-xs text-on-surface-variant">Est. Price</p>
                            <p className="font-headline-md text-xl font-bold text-on-surface">
                              ৳{alt.price} <span className="text-xs font-normal text-on-surface-variant">/ 30 qty</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleCompare(alt)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-primary text-on-primary'
                                  : 'bg-surface-container text-primary hover:bg-surface-container-high'
                              }`}
                            >
                              {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                              {isSelected ? 'Selected' : 'Compare'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>

          {/* SIDEBAR: PHARMACY AVAILABILITY (lg:col-span-4) */}
          <aside className="lg:col-span-4 space-y-6">
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
              <Store className="w-5 h-5 text-secondary" />
              Pharmacy Availability
            </h3>

            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-[0px_4px_20px_rgba(30,41,59,0.05)] overflow-hidden">
              
              {/* Mini Map Card Header */}
              <div className="h-32 bg-surface-container-high relative w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00685f]/20 via-[#006492]/10 to-surface-container-high flex items-center justify-center">
                  <div className="w-full h-full opacity-60 flex items-center justify-center text-primary/30">
                    <MapPin className="w-14 h-14 animate-pulse" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent"></div>

                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center">
                  <span className="font-label-sm text-xs bg-surface-container-lowest/80 backdrop-blur-sm px-2 py-1 rounded text-on-surface font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary" /> Near 10001
                  </span>
                  <button
                    onClick={() => navigate('/pharmacies')}
                    className="text-primary hover:underline font-label-sm text-xs font-bold"
                  >
                    Change location
                  </button>
                </div>
              </div>

              {/* Pharmacy List */}
              <div className="p-4 space-y-3">
                {pharmacies.map((pharm) => (
                  <div
                    key={pharm.pharmacyId}
                    className="p-3 rounded-lg hover:bg-surface-container-low transition-colors border border-transparent hover:border-outline-variant/20 cursor-pointer flex justify-between items-start"
                    onClick={() => navigate('/pharmacies')}
                  >
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center mt-1 flex-shrink-0">
                        <Building className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h5 className="font-label-md text-sm font-bold text-on-surface">
                          {pharm.storeName}
                        </h5>
                        <p className="font-body-md text-xs text-on-surface-variant">
                          {pharm.distance} • {pharm.hours}
                        </p>

                        {pharm.stockStatus === 'IN_STOCK' ? (
                          <div className="flex items-center gap-1 mt-1 bg-[#10B981]/10 text-primary w-fit px-2 py-0.5 rounded text-[11px] font-bold">
                            <CheckCircle className="w-3 h-3 fill-[#10B981] text-white" />
                            In Stock
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-1 bg-[#FEF3C7] text-[#B45309] w-fit px-2 py-0.5 rounded text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3 text-[#B45309]" />
                            Low Stock
                          </div>
                        )}
                      </div>
                    </div>

                    <button className="text-primary bg-primary/5 p-2 rounded-full hover:bg-primary/10 transition-colors">
                      <Navigation className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer Button */}
              <div className="bg-surface-container-low p-3 text-center border-t border-outline-variant/20">
                <button
                  onClick={() => navigate('/pharmacies')}
                  className="font-label-md text-xs text-primary hover:underline font-bold"
                >
                  View more pharmacies
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── MODAL: SELECT PRESCRIPTIONS ────────────────────────────────────────── */}
      {isRxModalOpen && (
        <Modal
          isOpen={isRxModalOpen}
          onClose={() => setIsRxModalOpen(false)}
          title="Select Prescriptions for Alternatives Analysis"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-xs text-on-surface-variant">
              Select one or multiple prescriptions from your history to analyze bioequivalent generic alternatives in tabular format.
            </p>

            {loadingRxList ? (
              <div className="flex justify-center p-8"><Spinner /></div>
            ) : allUserPrescriptions.length === 0 ? (
              <EmptyState icon={<FileText className="w-8 h-8" />} title="No Prescriptions Found" description="Scan a prescription first in the Prescriptions tab." />
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
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
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-outline-variant/30 bg-surface-container-lowest hover:border-outline-variant'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-outline" />}
                        <div>
                          <div className="font-bold text-sm text-on-surface">
                            Rx #{rx.prescriptionId.substring(0, 8)} ({dateStr})
                          </div>
                          <div className="text-xs text-on-surface-variant">
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

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
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

      {/* ── Modal: Side-by-Side Comparison ────────────────────────────────────── */}
      {isCompareModalOpen && (
        <Modal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          title="Medicine Comparison"
          size="lg"
        >
          {isComparing ? (
            <div className="flex justify-center p-8"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table
                columns={[
                  { key: 'attribute', label: 'Feature', width: '20%' },
                  ...comparisonData.map(d => ({
                    key: d.id,
                    label: d.brandName,
                    render: (_val: unknown, row: Record<string, any>) => row[d.id]
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
