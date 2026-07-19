import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Input, apiClient } from '@medisync/ui';
import { Search } from 'lucide-react';

interface Drug {
  drugId: string;
  brandName: string;
  saltComposition: string;
  strength: string;
  estimatedPrice: string;
  isGeneric: boolean;
  trustRating: string;
}

export const DrugsPage: React.FC = () => {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDrugs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/drugs', { params: { search: query } });
      setDrugs(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch drug catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, [query]);

  const columns = [
    { key: 'brandName', label: 'Brand Name', width: '25%' },
    { key: 'saltComposition', label: 'Salt Composition', width: '35%' },
    { key: 'strength', label: 'Strength' },
    {
      key: 'isGeneric',
      label: 'Classification',
      render: (val: any) => (
        <Badge variant={val ? 'green' : 'blue'}>
          {val ? 'Generic' : 'Branded'}
        </Badge>
      )
    },
    {
      key: 'estimatedPrice',
      label: 'Avg price',
      render: (val: any) => `৳${val}`
    }
  ];

  return (
    <Card style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Master Drug Catalogue</h3>
        <div style={{ width: '280px' }}>
          <Input
            placeholder="Search drug or composition..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={drugs}
        loading={loading}
        keyExtractor={row => row.drugId}
      />
    </Card>
  );
};
