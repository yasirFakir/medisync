import React, { useState, useEffect } from 'react';
import { Card, Badge, Input, Button, Spinner, EmptyState, Modal, Table } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { Search, ArrowRightLeft, Star, CheckCircle, Tag, X } from 'lucide-react';

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

export const AlternativesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [alternativesData, setAlternativesData] = useState<AlternativesResponse | null>(null);
  const [isLoadingAlts, setIsLoadingAlts] = useState(false);
  const [altError, setAltError] = useState('');
  
  const [budgetLimit, setBudgetLimit] = useState<number | ''>('');
  const [formFilter, setFormFilter] = useState('');
  
  const [compareSelection, setCompareSelection] = useState<ScoredAlternative[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<DrugComparison[]>([]);
  const [isComparing, setIsComparing] = useState(false);

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

  const filteredAlternatives = alternativesData?.alternatives.filter(alt => {
    if (budgetLimit && alt.price > Number(budgetLimit)) return false;
    if (formFilter && alt.dosageForm.toLowerCase() !== formFilter.toLowerCase()) return false;
    return true;
  });

  const getSavingsPercentage = (sourcePrice: number, altPrice: number) => {
    if (altPrice >= sourcePrice || sourcePrice === 0) return null;
    const savings = ((sourcePrice - altPrice) / sourcePrice) * 100;
    return Math.round(savings);
  };

  const comparisonColumns = [
    { key: 'attribute', label: 'Feature', width: '20%' },
    ...comparisonData.map(d => ({
      key: d.id,
      label: d.brandName,
      render: (val: unknown, row: Record<string, any>) => row[d.id]
    }))
  ];

  const comparisonRows = [
    { attribute: 'Generic Name', ...Object.fromEntries(comparisonData.map(d => [d.id, d.genericName])) },
    { attribute: 'Manufacturer', ...Object.fromEntries(comparisonData.map(d => [d.id, d.manufacturer])) },
    { attribute: 'Strength', ...Object.fromEntries(comparisonData.map(d => [d.id, d.strength])) },
    { attribute: 'Dosage Form', ...Object.fromEntries(comparisonData.map(d => [d.id, d.dosageForm])) },
    { attribute: 'Price', ...Object.fromEntries(comparisonData.map(d => [d.id, `৳${d.price}`])) },
    { attribute: 'Type', ...Object.fromEntries(comparisonData.map(d => [d.id, d.isGeneric ? 'Generic' : 'Branded'])) },
    { attribute: 'Trust Rating', ...Object.fromEntries(comparisonData.map(d => [d.id, `${d.trustRating || 'N/A'} / 5`])) },
  ];

  return (
    <div style={{ padding: '1rem', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }} className="animate-fade-in">
        <h1 style={{ color: 'var(--text-primary)', fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-400))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Find Cheaper Medicine Alternatives
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          Search for your prescribed medicine to discover medically bioequivalent, cost-effective generic alternatives.
        </p>
      </div>

      {/* Search Section */}
      <div style={{ maxWidth: '600px', margin: '0 auto 2.5rem auto', position: 'relative' }}>
        <Input
          placeholder="Search for a drug (e.g., Napa, Moxacil)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search size={18} />}
        />
        {isSearching && (
          <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
            <Spinner />
          </div>
        )}

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', marginTop: '0.5rem', zIndex: 10, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            {searchResults.map(drug => (
              <div 
                key={drug.id} 
                onClick={() => selectDrug(drug)}
                style={{ padding: '1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{drug.brandName}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{drug.genericName} • {drug.strength}</div>
                </div>
                <div style={{ color: 'var(--color-brand-600)', fontWeight: 'bold' }}>৳{drug.price}</div>
              </div>
            ))}
          </div>
        )}
      </div>

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
              Available Bioequivalent Alternatives ({filteredAlternatives?.length || 0})
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
          {filteredAlternatives && filteredAlternatives.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {filteredAlternatives.map(alt => {
                const savings = getSavingsPercentage(alternativesData.sourceDrug.price, alt.price);
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
                    {savings !== null && savings > 0 && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        <Badge variant="green" icon={<Tag size={12} />}>
                          Save {savings}%
                        </Badge>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingRight: savings ? '80px' : '0' }}>
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
            <EmptyState icon={<X size={28} />} title="No Alternatives Found" description="Try adjusting your filters or max price." />
          )}
        </div>
      )}

      {/* Comparison Modal */}
      {isCompareModalOpen && (
        <Modal 
          isOpen={isCompareModalOpen} 
          onClose={() => setIsCompareModalOpen(false)}
          title="Medicine Comparison"
        >
          {isComparing ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table 
                columns={comparisonColumns} 
                data={comparisonRows} 
                keyExtractor={(row) => row.attribute}
              />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
