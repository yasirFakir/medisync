import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, apiClient } from '@medisync/ui';
import { Check, X, RefreshCw } from 'lucide-react';

interface StockItem {
  drugId: string;
  brandName: string;
  saltComposition: string;
  strength: string;
  inStock: boolean;
  currentPrice: string;
}

export const InventoryPage: React.FC = () => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/inventory/my-stock');
      setStock(res.data.data || []);
    } catch (err) {
      console.error('Failed to load pharmacy stock list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const columns = [
    { key: 'brandName', label: 'Brand Name', width: '25%' },
    { key: 'saltComposition', label: 'Salt Composition', width: '35%' },
    { key: 'strength', label: 'Strength' },
    {
      key: 'currentPrice',
      label: 'Store Price',
      render: (val: any) => `৳${val}`
    },
    {
      key: 'inStock',
      label: 'Inventory Status',
      render: (val: any) => (
        <Badge variant={val ? 'green' : 'red'}>
          {val ? 'In Stock' : 'Out of Stock'}
        </Badge>
      )
    }
  ];

  return (
    <Card style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Store Inventory Stock list</h3>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={fetchStock}>
          Refresh Sync
        </Button>
      </div>

      <Table
        columns={columns}
        data={stock}
        loading={loading}
        keyExtractor={row => row.drugId}
      />
    </Card>
  );
};
