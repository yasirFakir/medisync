import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Spinner, Badge } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import {
  ClipboardEdit, Search, Plus, Trash2, Check, ArrowRight, Store, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MasterDrug {
  drugId: string;
  brandName: string;
  saltComposition: string;
  strength: string;
  estimatedPrice: number;
}

interface StagedStockItem {
  drugId: string;
  brandName: string;
  strength: string;
  price: number;
  costPrice: number;
  quantity: number;
  batchNumber: string;
  expiryDate: string;
  rackLocation: string;
  supplierName: string;
}

export const UpdateStockPage: React.FC = () => {
  const navigate = useNavigate();

  // Search Master DB State
  const [masterDrugs, setMasterDrugs] = useState<MasterDrug[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingDrugs, setLoadingDrugs] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<MasterDrug | null>(null);

  // Staged Item Form State
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(100);
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [rackLocation, setRackLocation] = useState('Rack A-1');
  const [supplierName, setSupplierName] = useState('');

  // Bulk Staging List
  const [stagedList, setStagedList] = useState<StagedStockItem[]>([]);
  const [submittingBulk, setSubmittingBulk] = useState(false);

  // Search Master Drug Database
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMasterDrugs([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingDrugs(true);
      try {
        const res = await apiClient.get('/drugs/search', { params: { q: searchQuery.trim() } });
        const data = res.data.data;
        const items = Array.isArray(data) ? data : (data?.drugs || []);
        if (items.length > 0) {
          setMasterDrugs(items);
        } else {
          // Fallback to /drugs?search=
          const fallbackRes = await apiClient.get('/drugs', { params: { search: searchQuery.trim() } });
          setMasterDrugs(fallbackRes.data.data || []);
        }
      } catch (err) {
        // Fallback to /drugs?search=
        try {
          const fallbackRes = await apiClient.get('/drugs', { params: { search: searchQuery.trim() } });
          setMasterDrugs(fallbackRes.data.data || []);
        } catch {
          console.error('Failed to search master drugs', err);
        }
      } finally {
        setLoadingDrugs(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectDrug = (drug: MasterDrug) => {
    setSelectedDrug(drug);
    setSellingPrice(Number(drug.estimatedPrice || 0));
    setCostPrice(Number((drug.estimatedPrice * 0.7).toFixed(2))); // Default 30% margin recommendation
    setMasterDrugs([]);
  };

  // Add Item to Staging List
  const handleStageItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrug) return;

    setStagedList(prev => [
      ...prev,
      {
        drugId: selectedDrug.drugId,
        brandName: selectedDrug.brandName,
        strength: selectedDrug.strength,
        price: Number(sellingPrice),
        costPrice: Number(costPrice),
        quantity: Number(quantity),
        batchNumber: batchNumber || `BATCH-${Date.now().toString().slice(-4)}`,
        expiryDate: expiryDate || '',
        rackLocation: rackLocation || 'A-1',
        supplierName: supplierName || '',
      },
    ]);

    // Reset Form
    setSelectedDrug(null);
    setSearchQuery('');
    setBatchNumber('');
  };

  const handleRemoveStaged = (index: number) => {
    setStagedList(stagedList.filter((_, idx) => idx !== index));
  };

  // Bulk Submit to API
  const handleSubmitBulk = async () => {
    if (stagedList.length === 0) return;
    setSubmittingBulk(true);
    try {
      await apiClient.post('/inventory/bulk-update', {
        items: stagedList.map(item => ({
          drugId: item.drugId,
          price: item.price,
          costPrice: item.costPrice,
          quantity: item.quantity,
          inStock: item.quantity > 0,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate || undefined,
          rackLocation: item.rackLocation,
          supplierName: item.supplierName,
        })),
      });

      alert(`Successfully added / restocked ${stagedList.length} items to your store inventory!`);
      navigate('/inventory');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update store inventory');
    } finally {
      setSubmittingBulk(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      {/* ── Banner ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#825100] to-[#F59E0B] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-white/90 mb-1 flex items-center gap-1.5">
            <ClipboardEdit size={15} /> Store Inventory Entry Form
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Restock & Add Inventory
          </h1>
          <p className="text-xs text-white/90 mt-1">
            Search master drug database, set unit costs, selling prices, batch codes, and submit batch stock entries.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<Store size={14} />}
          onClick={() => navigate('/inventory')}
          style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
        >
          View Inventory Catalog
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7">
          <Card style={{ padding: '24px' }}>
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Search size={18} className="text-[#F59E0B]" />
              Search Drug
            </h3>

            {/* Drug Search Input */}
            <div className="relative mb-4">
              <Input
                type="text"
                placeholder="Search brand name or salt (e.g. Napa, Seclo, Paracetamol)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {loadingDrugs && (
                <div className="absolute right-3 top-3">
                  <Spinner size={16} />
                </div>
              )}

              {/* Master Drug Dropdown */}
              {masterDrugs.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl max-h-60 overflow-y-auto z-30 divide-y divide-gray-100">
                  {masterDrugs.map(drug => (
                    <button
                      key={drug.drugId}
                      type="button"
                      onClick={() => handleSelectDrug(drug)}
                      className="w-full p-3 text-left hover:bg-[#FEF3C7] text-xs flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-bold text-gray-900">{drug.brandName} ({drug.strength})</div>
                        <div className="text-gray-500">{drug.saltComposition}</div>
                      </div>
                      <span className="font-bold text-[#D97706]">MRP: ৳{drug.estimatedPrice}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Drug Batch Form */}
            {selectedDrug ? (
              <form onSubmit={handleStageItem} className="space-y-4 border-t border-gray-200 pt-4 text-xs">
                <div className="bg-[#FEF3C7] p-3 rounded-xl border border-[#FDE68A] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#92400E] text-sm">{selectedDrug.brandName}</div>
                    <div className="text-gray-600">{selectedDrug.saltComposition} • Strength: {selectedDrug.strength}</div>
                  </div>
                  <Badge variant="yellow">Selected</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Selling Price (MRP ৳)</label>
                    <Input
                      type="number"
                      step={0.1}
                      value={sellingPrice}
                      onChange={e => setSellingPrice(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Cost Price (Purchase ৳)</label>
                    <Input
                      type="number"
                      step={0.1}
                      value={costPrice}
                      onChange={e => setCostPrice(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Stock Quantity (Units)</label>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={e => setQuantity(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Batch Number</label>
                    <Input
                      type="text"
                      placeholder="e.g. BATCH-2026-X"
                      value={batchNumber}
                      onChange={e => setBatchNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Expiry Date</label>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={e => setExpiryDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Rack Location</label>
                    <Input
                      type="text"
                      placeholder="e.g. Rack B-04"
                      value={rackLocation}
                      onChange={e => setRackLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Supplier / Distributor Name</label>
                  <Input
                    type="text"
                    placeholder="e.g. Beximco Pharma, Square, Incepta"
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  style={{ width: '100%', background: '#F59E0B' }}
                  icon={<Plus size={16} />}
                >
                  + Add to Batch Staging Queue
                </Button>
              </form>
            ) : (
              <div className="text-center py-8 text-xs text-gray-400">
                Please search and click a drug from the dropdown above to configure pricing and stock.
              </div>
            )}
          </Card>
        </div>

        {/* Staged Queue Column (5 cols) */}
        <div className="lg:col-span-5">
          <Card style={{ padding: '24px', position: 'sticky', top: '80px' }}>
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Layers size={18} className="text-[#F59E0B]" />
                Staged Batch Queue ({stagedList.length})
              </h3>
              <Badge variant="yellow">Ready to Sync</Badge>
            </div>

            {stagedList.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 space-y-2">
                <Layers size={32} className="mx-auto opacity-40 text-gray-400" />
                <div>No staged items in queue.</div>
                <div className="text-[11px]">Search master drugs on the left and stage them before submitting.</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {stagedList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-gray-900">{item.brandName} ({item.strength})</div>
                        <div className="text-[11px] text-gray-500">
                          Qty: <strong>{item.quantity}</strong> • Sell: ৳{item.price} • Cost: ৳{item.costPrice}
                        </div>
                        <div className="text-[10px] text-gray-400">Batch: {item.batchNumber} • Exp: {item.expiryDate || 'N/A'}</div>
                      </div>

                      <button
                        onClick={() => handleRemoveStaged(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="primary"
                  style={{ width: '100%', background: '#F59E0B', padding: '12px' }}
                  onClick={handleSubmitBulk}
                  disabled={submittingBulk}
                  icon={submittingBulk ? <Spinner size={16} /> : <Check size={16} />}
                >
                  {submittingBulk ? 'Syncing to Inventory...' : `Submit All (${stagedList.length} Items)`}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
