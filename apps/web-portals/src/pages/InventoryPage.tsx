import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Input, Spinner } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import {
  Store, Search, Filter, RefreshCw, Plus, Edit2, Trash2, Check, X,
  AlertTriangle, Calendar, Layers, Tag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StockItem {
  inventoryId: string;
  drugId: string;
  brandName: string;
  saltComposition: string;
  strength: string;
  dosageForm?: string;
  inStock: boolean;
  quantity: number;
  currentPrice: number;
  costPrice?: number;
  batchNumber?: string;
  expiryDate?: string;
  rackLocation?: string;
  supplierName?: string;
  lastUpdated: string;
}

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'LOW_STOCK' | 'EXPIRING_SOON'>('ALL');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    price: number;
    costPrice: number;
    quantity: number;
    batchNumber: string;
    expiryDate: string;
    rackLocation: string;
  }>({
    price: 0,
    costPrice: 0,
    quantity: 0,
    batchNumber: '',
    expiryDate: '',
    rackLocation: '',
  });

  const fetchStock = async () => {
    setLoading(true);
    try {
      let endpoint = '/inventory/my-stock';
      if (filterMode === 'LOW_STOCK') endpoint = '/inventory/low-stock';
      if (filterMode === 'EXPIRING_SOON') endpoint = '/inventory/expiring-soon';

      const res = await apiClient.get(endpoint);
      const data = (res.data.data || []).map((i: any) => ({
        ...i,
        currentPrice: Number(i.currentPrice || 0),
        costPrice: Number(i.costPrice || 0),
        quantity: Number(i.quantity || 0),
      }));
      setStock(data);
    } catch (err) {
      console.error('Failed to load pharmacy stock list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [filterMode]);

  // Start inline editing
  const handleStartEdit = (item: StockItem) => {
    setEditingId(item.inventoryId);
    setEditForm({
      price: item.currentPrice,
      costPrice: item.costPrice || 0,
      quantity: item.quantity,
      batchNumber: item.batchNumber || '',
      expiryDate: item.expiryDate ? item.expiryDate.substring(0, 10) : '',
      rackLocation: item.rackLocation || '',
    });
  };

  // Save inline edit
  const handleSaveEdit = async (drugId: string) => {
    try {
      await apiClient.post('/inventory/update', {
        drugId,
        price: editForm.price,
        costPrice: editForm.costPrice,
        quantity: editForm.quantity,
        inStock: editForm.quantity > 0,
        batchNumber: editForm.batchNumber,
        expiryDate: editForm.expiryDate || undefined,
        rackLocation: editForm.rackLocation,
      });
      setEditingId(null);
      fetchStock();
    } catch (err) {
      alert('Failed to update stock item');
    }
  };

  // Delete item
  const handleDeleteItem = async (inventoryId: string) => {
    if (!confirm('Are you sure you want to remove this drug from inventory?')) return;
    try {
      await apiClient.delete(`/inventory/${inventoryId}`);
      setStock(stock.filter(s => s.inventoryId !== inventoryId));
    } catch (err) {
      alert('Failed to delete inventory item');
    }
  };

  // Search filter
  const filteredStock = stock.filter(
    s =>
      (s.brandName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.saltComposition || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.batchNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#825100] to-[#F59E0B] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-white/90 mb-1 flex items-center gap-1.5">
            <Store size={15} /> Store Inventory & Stock Catalog
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Inventory Maintenance
          </h1>
          <p className="text-xs text-white/90 mt-1">
            Maintain stock quantities, batch numbers, cost prices, selling prices, rack locations, and expiry dates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => navigate('/update-stock')}
            style={{ background: '#fff', color: '#825100', fontWeight: 'bold' }}
          >
            + Restock / Add Drug
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={fetchStock}
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Main Inventory Table Card ────────────────────────────────────────── */}
      <Card style={{ padding: '24px' }}>
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Brand Name, Salt, Batch..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl font-semibold text-xs bg-white"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                filterMode === 'ALL'
                  ? 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              All Stock ({stock.length})
            </button>
            <button
              onClick={() => setFilterMode('LOW_STOCK')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                filterMode === 'LOW_STOCK'
                  ? 'bg-red-100 text-red-700 border-red-300'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              ⚠️ Low Stock / Out
            </button>
            <button
              onClick={() => setFilterMode('EXPIRING_SOON')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                filterMode === 'EXPIRING_SOON'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              ⌛ Expiring Soon (&lt;30d)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                <th className="py-3 px-3">Brand Name / Generic</th>
                <th className="py-3 px-3">Strength</th>
                <th className="py-3 px-3">Batch #</th>
                <th className="py-3 px-3">Rack</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-center">Qty / Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8">
                    <Spinner size={24} />
                  </td>
                </tr>
              ) : filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    No medication inventory found matching current search/filter.
                  </td>
                </tr>
              ) : (
                filteredStock.map(item => {
                  const isEditing = editingId === item.inventoryId;

                  return (
                    <tr key={item.inventoryId} className="hover:bg-gray-50/80 transition-colors">
                      {/* Brand Name & Generic */}
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-gray-900">{item.brandName}</div>
                        <div className="text-[11px] text-gray-500 font-normal">{item.saltComposition}</div>
                      </td>

                      {/* Strength */}
                      <td className="py-3 px-3 font-bold text-gray-700">{item.strength}</td>

                      {/* Batch # */}
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.batchNumber}
                            onChange={e => setEditForm({ ...editForm, batchNumber: e.target.value })}
                            className="w-20 p-1 border rounded text-xs font-bold"
                          />
                        ) : (
                          <span className="text-gray-600">{item.batchNumber || 'N/A'}</span>
                        )}
                      </td>

                      {/* Rack Location */}
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.rackLocation}
                            onChange={e => setEditForm({ ...editForm, rackLocation: e.target.value })}
                            className="w-16 p-1 border rounded text-xs font-bold"
                          />
                        ) : (
                          <span className="text-gray-600">{item.rackLocation || 'A-1'}</span>
                        )}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editForm.expiryDate}
                            onChange={e => setEditForm({ ...editForm, expiryDate: e.target.value })}
                            className="p-1 border rounded text-xs font-bold"
                          />
                        ) : (
                          <span className={item.expiryDate ? 'text-amber-700 font-bold' : 'text-gray-400'}>
                            {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                          </span>
                        )}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={editForm.costPrice}
                            onChange={e => setEditForm({ ...editForm, costPrice: Number(e.target.value) })}
                            className="w-16 p-1 text-right border rounded text-xs font-bold"
                          />
                        ) : (
                          <span className="text-gray-500">৳{item.costPrice || 0}</span>
                        )}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={editForm.price}
                            onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })}
                            className="w-16 p-1 text-right border rounded text-xs font-extrabold text-[#D97706]"
                          />
                        ) : (
                          <span className="font-extrabold text-gray-900">৳{item.currentPrice}</span>
                        )}
                      </td>

                      {/* Quantity & Status */}
                      <td className="py-3 px-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            value={editForm.quantity}
                            onChange={e => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                            className="w-16 p-1 text-center border rounded text-xs font-bold"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-extrabold text-gray-900">{item.quantity} units</span>
                            <Badge variant={item.quantity > 10 ? 'green' : item.quantity > 0 ? 'yellow' : 'red'}>
                              {item.quantity > 10 ? 'In Stock' : item.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                            </Badge>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveEdit(item.drugId)}
                              className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors"
                              title="Save Changes"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 bg-gray-100 text-gray-700 hover:bg-[#F59E0B] hover:text-white rounded-lg transition-colors"
                              title="Edit Stock Item"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.inventoryId)}
                              className="p-1.5 bg-gray-100 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
