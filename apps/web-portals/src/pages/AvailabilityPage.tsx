import React, { useState, useEffect } from 'react';
import { Card, Badge, Input, Spinner, EmptyState, StatCard } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { Search, Building, MapPin, Package, AlertTriangle, DollarSign, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface DrugSearchResult {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  manufacturer: string;
}

interface PharmacyAvailability {
  pharmacyId: string;
  storeName: string;
  streetAddress: string;
  city: string;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  quantity: number;
  currentPrice: number | null;
  lastUpdated: string;
}

interface AvailabilitySummary {
  totalPharmacies: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  overallStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  lowestPrice: number | null;
  highestPrice: number | null;
  averagePrice: number | null;
}

interface AvailabilityResult {
  drug: {
    drugId: string;
    brandName: string;
    saltComposition: string;
  };
  summary: AvailabilitySummary;
  pharmacies: PharmacyAvailability[];
}

export const AvailabilityPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DrugSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedDrug, setSelectedDrug] = useState<DrugSearchResult | null>(null);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityResult | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [error, setError] = useState('');

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

  const handleSelectDrug = async (drug: DrugSearchResult) => {
    setSelectedDrug(drug);
    setSearchQuery('');
    setSearchResults([]);
    fetchAvailability(drug.id);
  };

  const fetchAvailability = async (drugId: string) => {
    setIsLoadingAvailability(true);
    setError('');
    setAvailabilityData(null);
    try {
      const res = await apiClient.get(`/availability/${drugId}`);
      setAvailabilityData(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch availability', err);
      setError('Failed to load stock availability data. Please try again.');
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const getStatusBadgeVariant = (status: string): 'green' | 'yellow' | 'red' => {
    switch (status) {
      case 'IN_STOCK': return 'green';
      case 'LOW_STOCK': return 'yellow';
      case 'OUT_OF_STOCK': return 'red';
      default: return 'red';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'IN_STOCK': return 'In Stock';
      case 'LOW_STOCK': return 'Low Stock';
      case 'OUT_OF_STOCK': return 'Out of Stock';
      default: return status;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Check Medicine Availability
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Find out which verified partner pharmacies have your medication in stock right now.
        </p>
      </div>

      {/* Search Bar */}
      <Card style={{ padding: '24px', overflow: 'visible' }}>
        <div style={{ position: 'relative' }}>
          <Input 
            placeholder="Search for a drug by name or active salt (e.g., Napa, Paracetamol, Moxacil)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={18} />}
          />
          {isSearching && (
            <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
              <Spinner />
            </div>
          )}
          
          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              zIndex: 50,
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {searchResults.map((drug) => (
                <div 
                  key={drug.id}
                  onClick={() => handleSelectDrug(drug)}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--border-default)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{drug.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {drug.genericName} • {drug.strength}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{drug.manufacturer}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Loading State */}
      {isLoadingAvailability && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Spinner />
        </div>
      )}

      {/* Error State */}
      {error && (
        <EmptyState icon={<AlertTriangle size={28} />} title="Error" description={error} />
      )}

      {/* Main Availability View */}
      {availabilityData && !isLoadingAvailability && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Selected Medicine Info Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {availabilityData.drug.brandName}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                {availabilityData.drug.saltComposition}
              </p>
            </div>
            <Badge variant={getStatusBadgeVariant(availabilityData.summary.overallStatus)}>
              Overall: {formatStatus(availabilityData.summary.overallStatus)}
            </Badge>
          </div>

          {/* Summary Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <StatCard 
              label="Total Stores" 
              value={availabilityData.summary.totalPharmacies}
              icon={<Building size={18} />}
            />
            <StatCard 
              label="In Stock Stores" 
              value={availabilityData.summary.inStock}
              icon={<CheckCircle2 size={18} />}
              color="var(--color-success)"
            />
            <StatCard 
              label="Low Stock Stores" 
              value={availabilityData.summary.lowStock}
              icon={<AlertTriangle size={18} />}
              color="#f59e0b"
            />
            <StatCard 
              label="Average Price" 
              value={availabilityData.summary.averagePrice !== null ? `৳${availabilityData.summary.averagePrice}` : 'N/A'}
              icon={<DollarSign size={18} />}
              color="var(--color-brand-400)"
            />
          </div>

          <div className="divider" />

          {/* Pharmacy Listings */}
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Pharmacy Stock Breakdown ({availabilityData.pharmacies.length})
          </h3>

          {availabilityData.pharmacies.length === 0 ? (
            <EmptyState
              icon={<Package size={28} />}
              title="No Pharmacy Inventory Registered"
              description="None of our partner pharmacies currently carry stock records for this drug."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {availabilityData.pharmacies.map((pharmacy) => (
                <Card 
                  key={pharmacy.pharmacyId}
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building size={16} style={{ color: 'var(--color-brand-400)' }} />
                      {pharmacy.storeName}
                    </h4>
                    <Badge variant={getStatusBadgeVariant(pharmacy.stockStatus)}>
                      {formatStatus(pharmacy.stockStatus)}
                    </Badge>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} />
                    {pharmacy.streetAddress}, {pharmacy.city}
                  </div>

                  <div className="divider" style={{ margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quantity Available</span>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {pharmacy.quantity} units
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Price per unit</span>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-brand-600)' }}>
                        {pharmacy.currentPrice !== null ? `৳${pharmacy.currentPrice}` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Clock size={12} />
                    Last updated: {new Date(pharmacy.lastUpdated).toLocaleDateString()}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial Empty State when no search selected */}
      {!selectedDrug && !isLoadingAvailability && (
        <EmptyState
          icon={<Search size={28} />}
          title="Search Medicine Inventory"
          description="Type a drug name in the search box above to check real-time stock levels across all partner pharmacies."
        />
      )}
    </div>
  );
};
