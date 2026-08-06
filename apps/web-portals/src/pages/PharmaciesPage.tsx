import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Badge, Spinner, EmptyState, Modal, StatCard } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { Search, Building, MapPin, Phone, Mail, ShieldCheck, ChevronLeft, ChevronRight, Store } from 'lucide-react';

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

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const PharmaciesPage: React.FC = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 12, total: 0, totalPages: 1 });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPharmacies();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCity, verifiedOnly, page]);

  const fetchPharmacies = async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '/pharmacies';
      let params: Record<string, any> = { page, limit: 12 };

      if (searchQuery.trim()) {
        endpoint = '/pharmacies/search';
        params.q = searchQuery.trim();
      } else {
        if (selectedCity) params.city = selectedCity;
        if (verifiedOnly) params.verified = 'true';
      }

      const res = await apiClient.get(endpoint, { params });
      setPharmacies(res.data?.data || []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch pharmacies', err);
      setError('Failed to load pharmacies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Controls */}
      <Card style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Partner Pharmacy Directory
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Browse and inspect verified healthcare partner locations across Bangladesh.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 2, minWidth: '240px' }}>
              <Input
                placeholder="Search pharmacy by store name, address, or city..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                icon={<Search size={16} />}
              />
            </div>

            <div style={{ width: '160px' }}>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">All Cities</option>
                <option value="Dhaka">Dhaka</option>
                <option value="Chittagong">Chittagong</option>
                <option value="Sylhet">Sylhet</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => {
                  setVerifiedOnly(e.target.checked);
                  setPage(1);
                }}
                style={{ accentColor: 'var(--color-brand-500)', width: 16, height: 16 }}
              />
              Verified Only
            </label>
          </div>
        </div>
      </Card>

      {/* Directory Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Spinner />
        </div>
      ) : error ? (
        <EmptyState icon={<Store size={28} />} title="Error" description={error} />
      ) : pharmacies.length === 0 ? (
        <EmptyState
          icon={<Store size={28} />}
          title="No Pharmacies Found"
          description="No partner pharmacies match your current filter criteria."
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {pharmacies.map((pharmacy) => (
              <Card
                key={pharmacy.pharmacyId}
                className="animate-fade-in"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                onClick={() => handlePharmacyClick(pharmacy.pharmacyId)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <Building size={18} style={{ color: 'var(--color-brand-400)' }} />
                    {pharmacy.storeName}
                  </h3>
                  <Badge variant={pharmacy.isVerified ? 'green' : 'yellow'} icon={pharmacy.isVerified ? <ShieldCheck size={12} /> : undefined}>
                    {pharmacy.isVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>

                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{pharmacy.streetAddress}, {pharmacy.city}</span>
                  </div>
                  {pharmacy.contactPhone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{pharmacy.contactPhone}</span>
                    </div>
                  )}
                  {pharmacy.contactEmail && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{pharmacy.contactEmail}</span>
                    </div>
                  )}
                </div>

                <div className="divider" style={{ margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>License: {pharmacy.licenseNumber}</span>
                  <span style={{ color: 'var(--color-brand-500)', fontWeight: 600 }}>View Stock →</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
              <Button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                icon={<ChevronLeft size={16} />}
              >
                Previous
              </Button>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                icon={<ChevronRight size={16} />}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Pharmacy Detail Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPharmacy(null);
          }}
          title={selectedPharmacy ? selectedPharmacy.storeName : 'Pharmacy Details'}
        >
          {loadingDetail || !selectedPharmacy ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
              <Spinner />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge variant={selectedPharmacy.isVerified ? 'green' : 'yellow'} icon={selectedPharmacy.isVerified ? <ShieldCheck size={12} /> : undefined}>
                  {selectedPharmacy.isVerified ? 'Verified Partner' : 'Pending Verification'}
                </Badge>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>License: {selectedPharmacy.licenseNumber}</span>
              </div>

              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} style={{ color: 'var(--color-brand-400)' }} />
                  <strong style={{ color: 'var(--text-primary)' }}>Address:</strong> {selectedPharmacy.streetAddress}, {selectedPharmacy.city}
                </div>
                {selectedPharmacy.contactPhone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={16} style={{ color: 'var(--color-brand-400)' }} />
                    <strong style={{ color: 'var(--text-primary)' }}>Phone:</strong> {selectedPharmacy.contactPhone}
                  </div>
                )}
                {selectedPharmacy.contactEmail && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} style={{ color: 'var(--color-brand-400)' }} />
                    <strong style={{ color: 'var(--text-primary)' }}>Email:</strong> {selectedPharmacy.contactEmail}
                  </div>
                )}
              </div>

              {selectedPharmacy.stockSummary && (
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
                    Inventory Overview
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
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
