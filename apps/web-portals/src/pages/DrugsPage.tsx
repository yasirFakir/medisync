import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Input, Spinner, EmptyState, Modal } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { 
  Search, Pill, Plus, Edit3, Trash2, ChevronLeft, ChevronRight, ShieldCheck, DollarSign, RefreshCw, CheckCircle2
} from 'lucide-react';

interface Drug {
  drugId: string;
  brandName: string;
  saltComposition: string;
  strength: string;
  dosageForm?: string;
  manufacturer?: string;
  estimatedPrice: string | number;
  isGeneric: boolean;
  trustRating?: string | number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const DrugsPage: React.FC = () => {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Form Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [brandName, setBrandName] = useState('');
  const [saltComposition, setSaltComposition] = useState('');
  const [strength, setStrength] = useState('');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [manufacturer, setManufacturer] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [isGeneric, setIsGeneric] = useState(false);

  const fetchDrugs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/drugs', {
        params: {
          search: query.trim() || undefined,
          page,
          limit: 15,
        },
      });
      setDrugs(Array.isArray(res.data?.data) ? res.data.data : []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch drug catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDrugs();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, page]);

  const handleOpenAddModal = () => {
    setEditingDrug(null);
    setBrandName('');
    setSaltComposition('');
    setStrength('');
    setDosageForm('Tablet');
    setManufacturer('');
    setEstimatedPrice('');
    setIsGeneric(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (drug: Drug) => {
    setEditingDrug(drug);
    setBrandName(drug.brandName);
    setSaltComposition(drug.saltComposition);
    setStrength(drug.strength);
    setDosageForm(drug.dosageForm || 'Tablet');
    setManufacturer(drug.manufacturer || '');
    setEstimatedPrice(String(drug.estimatedPrice));
    setIsGeneric(drug.isGeneric);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !saltComposition.trim() || !strength.trim() || !estimatedPrice) {
      setFormError('Please fill in Brand Name, Salt Composition, Strength, and Price.');
      return;
    }

    const payload = {
      brandName: brandName.trim(),
      saltComposition: saltComposition.trim(),
      strength: strength.trim(),
      dosageForm: dosageForm.trim() || 'Tablet',
      manufacturer: manufacturer.trim() || undefined,
      estimatedPrice: parseFloat(estimatedPrice),
      isGeneric,
    };

    setSaving(true);
    setFormError('');

    try {
      if (editingDrug) {
        // Edit mode
        await apiClient.put(`/drugs/${editingDrug.drugId}`, payload);
      } else {
        // Create mode
        await apiClient.post('/drugs', payload);
      }
      setIsModalOpen(false);
      fetchDrugs();
    } catch (err: any) {
      console.error('Failed to save drug:', err);
      setFormError(err?.response?.data?.message || 'Failed to save medicine. Check for duplicates.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDrug = async (drugId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the master catalog?`)) return;
    try {
      await apiClient.delete(`/drugs/${drugId}`);
      setDrugs(prev => prev.filter(d => d.drugId !== drugId));
    } catch (err) {
      console.error('Failed to delete drug:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#00685f] to-[#004d46] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-white/80 mb-1 flex items-center gap-1.5">
            <Pill size={14} /> Pharmaceutical Repository
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Master Drug Catalog Management
          </h1>
          <p className="text-xs text-white/90 mt-1 max-w-xl">
            Maintain national brand names, active generic compositions, strengths, and standard retail prices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="bg-white text-[#00685f] hover:bg-white/90 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} /> Add New Medicine
          </button>
        </div>
      </div>

      {/* ── Search & Actions Bar ─────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" style={{ top: '50%' }} />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:border-[#00685f] focus:ring-2 focus:ring-[#00685f]/20 outline-none transition-all"
            placeholder="Search by brand name, salt composition, or manufacturer..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDrugs}
            className="p-2.5 bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-on-surface rounded-lg"
            title="Refresh Catalog"
          >
            <RefreshCw size={15} />
          </button>

          <div className="text-xs text-on-surface-variant font-medium">
            Showing <strong className="text-on-surface">{drugs.length}</strong> of <strong className="text-on-surface">{pagination.total}</strong> drugs
          </div>
        </div>
      </div>

      {/* ── Drug Cards Grid ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : drugs.length === 0 ? (
        <EmptyState
          icon={<Pill size={32} />}
          title="No Medicines Found"
          description="No drug entries match your current search query."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drugs.map(drug => (
            <div
              key={drug.drugId}
              className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex flex-col justify-between space-y-3 hover:border-[#00685f]/40 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-on-surface flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-[#00685f]" />
                      {drug.brandName}
                    </h3>
                    <div className="text-xs font-semibold text-[#00685f] mt-0.5">
                      {drug.strength} {drug.dosageForm ? `• ${drug.dosageForm}` : ''}
                    </div>
                  </div>

                  <Badge variant={drug.isGeneric ? 'green' : 'blue'}>
                    {drug.isGeneric ? 'Generic' : 'Branded'}
                  </Badge>
                </div>

                <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 text-xs space-y-1">
                  <div>
                    <strong className="text-on-surface">Active Salt:</strong> {drug.saltComposition}
                  </div>
                  {drug.manufacturer && (
                    <div className="text-on-surface-variant">
                      <strong>Manufacturer:</strong> {drug.manufacturer}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <div className="text-base font-extrabold text-[#00685f]">
                  ৳{drug.estimatedPrice} <span className="text-[10px] font-normal text-on-surface-variant">/ unit</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(drug)}
                    className="bg-[#00685f]/10 text-[#00685f] hover:bg-[#00685f]/20 font-bold text-xs p-2 rounded-lg transition-all"
                    title="Edit Medicine"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteDrug(drug.drugId, drug.brandName)}
                    className="bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs p-2 rounded-lg transition-all"
                    title="Delete Medicine"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination Controls ─────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-4">
          <Button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            icon={<ChevronLeft size={16} />}
            size="sm"
            variant="secondary"
          >
            Previous
          </Button>
          <span className="text-xs font-semibold text-on-surface-variant">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
            icon={<ChevronRight size={16} />}
            size="sm"
            variant="secondary"
          >
            Next
          </Button>
        </div>
      )}

      {/* ── Form Modal: Add / Edit Drug ────────────────────────────────────── */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingDrug ? `Edit Medicine: ${editingDrug.brandName}` : 'Add New Medicine to Catalog'}
          size="md"
        >
          <form onSubmit={handleSaveDrug} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Brand Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Napa, Seclo, Moxacil"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:border-[#00685f]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Strength *</label>
                <input
                  type="text"
                  placeholder="e.g. 500mg, 20mg, 5ml"
                  value={strength}
                  onChange={e => setStrength(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:border-[#00685f]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface block mb-1">Active Salt Composition *</label>
              <input
                type="text"
                placeholder="e.g. Paracetamol, Omeprazole, Amoxicillin"
                value={saltComposition}
                onChange={e => setSaltComposition(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:border-[#00685f]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Dosage Form</label>
                <select
                  value={dosageForm}
                  onChange={e => setDosageForm(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:border-[#00685f]"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Ointment">Ointment</option>
                  <option value="Drop">Drop</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Estimated Price (৳) *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.50"
                  value={estimatedPrice}
                  onChange={e => setEstimatedPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:border-[#00685f]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface block mb-1">Manufacturer</label>
              <input
                type="text"
                placeholder="e.g. Square Pharmaceuticals, Beximco, Incepta"
                value={manufacturer}
                onChange={e => setManufacturer(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:border-[#00685f]"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isGeneric}
                onChange={e => setIsGeneric(e.target.checked)}
                className="accent-[#00685f] w-4 h-4 rounded"
              />
              Is Generic Drug (Unbranded Active Compound)
            </label>

            <div className="flex gap-2 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-1/2 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-1/2 py-2.5 bg-[#00685f] text-white rounded-xl text-xs font-bold hover:bg-[#00524b] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {saving ? <Spinner size={14} /> : editingDrug ? 'Update Medicine' : 'Add Medicine'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
