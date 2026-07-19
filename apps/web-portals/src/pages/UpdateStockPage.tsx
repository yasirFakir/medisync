import React, { useState } from 'react';
import { Card, Input, Button, Badge } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { Save, CheckCircle, AlertTriangle } from 'lucide-react';

interface Drug {
  drugId: string;
  brandName: string;
  saltComposition: string;
  strength: string;
}

export const UpdateStockPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [price, setPrice] = useState('');
  const [inStock, setInStock] = useState(true);
  
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSelectedDrug(null);
    try {
      const res = await apiClient.get('/drugs', { params: { search: searchQuery } });
      setDrugs(res.data.data || []);
    } catch (err) {
      console.error('Failed to search master drug catalog', err);
    } finally {
      setSearching(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrug || !price) return;

    setSaving(true);
    setSuccess(false);
    setError('');

    try {
      await apiClient.post('/inventory/update', {
        drugId: selectedDrug.drugId,
        inStock,
        price: parseFloat(price)
      });
      setSuccess(true);
      setSelectedDrug(null);
      setPrice('');
      setSearchQuery('');
      setDrugs([]);
    } catch (err) {
      setError('Failed to post stock status updates.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px', alignItems: 'start' }}>
      <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Search Drug Catalogue</h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Search catalog brands or salts, select the target ID, and post matching prices.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <Input
            placeholder="e.g. Paracetamol"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <Button type="submit" loading={searching}>Search</Button>
        </form>

        <div className="divider" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
          {drugs.length === 0 ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No query results found.</span>
          ) : (
            drugs.map(drug => (
              <div
                key={drug.drugId}
                onClick={() => setSelectedDrug(drug)}
                style={{
                  padding: '12px 16px',
                  background: selectedDrug?.drugId === drug.drugId ? 'rgba(245,158,11,0.08)' : 'var(--bg-surface)',
                  border: selectedDrug?.drugId === drug.drugId ? '1px solid var(--color-brand-500)' : '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{drug.brandName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{drug.saltComposition} • {drug.strength}</div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Post Stock Update</h3>

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', fontSize: '0.8125rem', marginBottom: '20px' }}>
            <CheckCircle size={16} />
            Stock status synchronized successfully!
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '0.8125rem', marginBottom: '20px' }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {selectedDrug ? (
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SELECTED TARGET</div>
              <h4 style={{ fontWeight: 700, fontSize: '1rem', marginTop: '2px' }}>{selectedDrug.brandName}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selectedDrug.saltComposition} • {selectedDrug.strength}</p>
            </div>

            <Input
              label="Store Price (৳ BDT)"
              type="number"
              step="0.01"
              placeholder="e.g. 2.50"
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="inStockCheck"
                checked={inStock}
                onChange={e => setInStock(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-brand-500)' }}
              />
              <label htmlFor="inStockCheck" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Mark as In Stock</label>
            </div>

            <Button type="submit" loading={saving} style={{ width: '100%', marginTop: '10px' }}>
              Save Stock Status
            </Button>
          </form>
        ) : (
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Select a drug from the search query results on the left to edit stock status values.</span>
        )}
      </Card>
    </div>
  );
};
