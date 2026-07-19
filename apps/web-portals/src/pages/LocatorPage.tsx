import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Input, Button, Badge, Spinner, EmptyState } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { Search, MapPin, Sparkles, Building, Star } from 'lucide-react';

interface PharmacyStock {
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

export const LocatorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('saltComposition') || '');
  const [city, setCity] = useState('Dhaka');
  const [loading, setLoading] = useState(false);
  const [pharmacies, setPharmacies] = useState<PharmacyStock[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchLocations = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);

    try {
      const res = await apiClient.get('/inventory/locate', {
        params: {
          saltComposition: query.trim(),
          city
        }
      });
      
      const rawData = res.data.data || [];
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
      setPharmacies(calculated);
    } catch (err) {
      console.error('Failed to locate pharmacies', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('saltComposition')) {
      fetchLocations();
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLocations();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <Card style={{ padding: '20px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '220px' }}>
            <Input
              placeholder="Enter active salt or brand name (e.g. Paracetamol)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>

          <div style={{ width: '160px' }}>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 16px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            >
              <option value="Dhaka">Dhaka</option>
              <option value="Chittagong">Chittagong</option>
              <option value="Sylhet">Sylhet</option>
              <option value="Rajshahi">Rajshahi</option>
            </select>
          </div>

          <Button type="submit" disabled={loading || !query.trim()} icon={<MapPin size={16} />}>
            Search Inventory
          </Button>
        </form>
      </Card>

      <div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}><Spinner size={32} /></div>
        ) : !hasSearched ? (
          <EmptyState
            icon={<Search size={28} />}
            title="Search Medicine Inventory"
            description="Enter a generic salt composition or brand name above to locate verified pharmacies."
          />
        ) : pharmacies.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={28} />}
            title="No Matching Pharmacy Found"
            description="We couldn't locate any local pharmacy stocking this specific medicine format."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {pharmacies.map((item, index) => (
              <Card key={index} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building size={16} style={{ color: 'var(--color-brand-400)' }} />
                      {item.storeName}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <MapPin size={12} />
                      {item.streetAddress}, {item.city}
                    </span>
                  </div>

                  {item.score && (
                    <div style={{
                      background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-500))',
                      borderRadius: 'var(--radius-md)',
                      padding: '4px 8px',
                      textAlign: 'center',
                      color: '#fff'
                    }}>
                      <div style={{ fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase' }}>SCORE</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800 }}>{item.score}</div>
                    </div>
                  )}
                </div>

                <div className="divider" />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{item.brandName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.saltComposition} • {item.strength}</div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800 }}>৳{item.currentPrice}</div>
                    <Badge variant={item.inStock ? 'green' : 'red'}>
                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <Star size={14} style={{ fill: '#fbbf24', stroke: '#fbbf24' }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.trustRating}</span>
                  <span>• Verified Pharmacy Partner</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
