import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner, Input, formatDoctorName } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import {
  KeyRound, Search, Pill, Calculator, ShoppingCart, Check, X,
  Printer, ArrowRight, RefreshCw, AlertCircle, Calendar, FileText
} from 'lucide-react';

interface PrescriptionItem {
  brandName: string;
  saltComposition: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PrescriptionRecord {
  prescriptionId: string;
  doctorName?: string;
  createdAt: string;
  digitizedNotes?: string;
}

interface StockMatch {
  inventoryId: string;
  drugId: string;
  brandName: string;
  saltComposition: string;
  strength: string;
  currentPrice: number;
  costPrice: number;
  quantity: number;
  inStock: boolean;
  batchNumber?: string;
  expiryDate?: string;
}

interface CartItem {
  inventoryId: string;
  brandName: string;
  dosageStrength: string;
  batchNumber?: string;
  unitSellingPrice: number;
  unitCostPrice: number;
  quantity: number;
  durationDays: number;
  dosageSchedule: string;
  lineTotal: number;
}

// ─── Dose Calculator Helper (Pure Rule Engine) ──────────────────────────────
export function parseDosePerDay(scheduleStr: string): number {
  if (!scheduleStr) return 1;
  const parts = scheduleStr.split('+').map(s => parseFloat(s.trim()));
  const sum = parts.reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0);
  return sum > 0 ? sum : 1;
}

export function calculateRequiredQuantity(scheduleStr: string, durationDays: number): number {
  const dailyDose = parseDosePerDay(scheduleStr);
  return Math.ceil(dailyDose * Math.max(1, durationDays));
}

export const DispenserPage: React.FC = () => {
  // OTP Access Gate State
  const [otpInput, setOtpInput] = useState('');
  const [patientEmailInput, setPatientEmailInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [patientInfo, setPatientInfo] = useState<{ patientId: string; fullName: string; email: string } | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);

  // Prescription & Inventory Matching State
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionRecord | null>(null);
  const [myStock, setMyStock] = useState<StockMatch[]>([]);
  const [parsedMedicines, setParsedMedicines] = useState<PrescriptionItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

  // Billing Cart & POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BKASH' | 'NAGAD' | 'ROCKET'>('CASH');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [submittingSale, setSubmittingSale] = useState(false);

  // Receipt Modal State
  const [completedInvoice, setCompletedInvoice] = useState<any | null>(null);

  // Fetch Pharmacy's Stock for Matching
  const fetchMyStock = async () => {
    setLoadingStock(true);
    try {
      const res = await apiClient.get('/inventory/my-stock');
      const items = res.data.data || [];
      setMyStock(
        items.map((i: any) => ({
          inventoryId: i.inventoryId,
          drugId: i.drugId,
          brandName: i.brandName,
          saltComposition: i.saltComposition || '',
          strength: i.strength || '',
          currentPrice: Number(i.currentPrice || 0),
          costPrice: Number(i.costPrice || 0),
          quantity: Number(i.quantity || 0),
          inStock: i.inStock,
          batchNumber: i.batchNumber,
          expiryDate: i.expiryDate,
        }))
      );
    } catch (err) {
      console.error('Failed to load stock for matching', err);
    } finally {
      setLoadingStock(false);
    }
  };

  useEffect(() => {
    fetchMyStock();
    // Auto-fill and verify OTP if passed via URL parameter (e.g. from Dashboard)
    const params = new URLSearchParams(window.location.search);
    const urlOtp = params.get('otp');
    if (urlOtp && urlOtp.length === 6) {
      setOtpInput(urlOtp);
      apiClient.post('/pharmacy/verify-prescription-otp', { otp: urlOtp })
        .then(res => {
          const data = res.data.data;
          setPatientInfo(data.patient);
          setPrescriptions(data.prescriptions || []);
          setOtpSuccess(true);
          setIsManualOtcMode(false);
          if (data.prescriptions && data.prescriptions.length > 0) {
            selectPrescription(data.prescriptions[0]);
          }
        })
        .catch(() => {
          // Fallback gracefully to manual gate if token invalid
        });
    }
  }, []);

  // Default to Manual Sales Register Mode (true by default)
  const [isManualOtcMode, setIsManualOtcMode] = useState(true);
  const [showOtpModal, setShowOtpModal] = useState(false);

  // ─── OTP Gate Handler ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput) return;
    setVerifying(true);
    try {
      const res = await apiClient.post('/pharmacy/verify-prescription-otp', {
        otp: otpInput,
        patientEmail: patientEmailInput || undefined,
      });
      const data = res.data.data;
      setPatientInfo(data.patient);
      setPrescriptions(data.prescriptions || []);
      setOtpSuccess(true);
      setShowOtpModal(false);
      if (data.prescriptions && data.prescriptions.length > 0) {
        selectPrescription(data.prescriptions[0]);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to verify OTP token. Use demo shortcut 123456.');
    } finally {
      setVerifying(false);
    }
  };

  // ─── Select & Parse Prescription ───────────────────────────────────────────
  const selectPrescription = (rx: PrescriptionRecord) => {
    setSelectedPrescription(rx);
    let items: PrescriptionItem[] = [];
    if (rx.digitizedNotes) {
      try {
        const parsed = JSON.parse(rx.digitizedNotes);
        if (parsed.medicines) {
          items = parsed.medicines.map((m: any) => ({
            brandName: m.brand_name?.value || m.brandName || 'Medicine',
            saltComposition: m.strength?.value || m.saltComposition || '',
            dosage: m.dosage?.value || m.dosage || '1 tablet',
            frequency: m.frequency?.value || m.frequency || '1+0+1',
            duration: m.duration?.value || m.duration || '7 days',
          }));
        }
      } catch {
        // Raw text fallback
      }
    }
    setParsedMedicines(items);
  };

  // ─── Duration Preset Calculator Handler ────────────────────────────────────
  const handleAddPresetToCart = (stockItem: StockMatch, schedule: string, durationDays: number) => {
    const qty = calculateRequiredQuantity(schedule, durationDays);
    const lineTotal = Number((stockItem.currentPrice * qty).toFixed(2));

    setCart(prev => {
      const existingIdx = prev.findIndex(c => c.inventoryId === stockItem.inventoryId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += qty;
        updated[existingIdx].durationDays = durationDays;
        updated[existingIdx].lineTotal = Number((stockItem.currentPrice * updated[existingIdx].quantity).toFixed(2));
        return updated;
      }
      return [
        ...prev,
        {
          inventoryId: stockItem.inventoryId,
          brandName: stockItem.brandName,
          dosageStrength: stockItem.strength,
          batchNumber: stockItem.batchNumber,
          unitSellingPrice: stockItem.currentPrice,
          unitCostPrice: stockItem.costPrice,
          quantity: qty,
          durationDays,
          dosageSchedule: schedule,
          lineTotal,
        },
      ];
    });
  };

  // Cart Adjustments
  const updateCartQty = (inventoryId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(cart.filter(c => c.inventoryId !== inventoryId));
      return;
    }
    setCart(
      cart.map(c =>
        c.inventoryId === inventoryId
          ? { ...c, quantity: newQty, lineTotal: Number((c.unitSellingPrice * newQty).toFixed(2)) }
          : c
      )
    );
  };

  // Calculate Totals
  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const netTotal = Math.max(0, subtotal - (discountAmount || 0) + (taxAmount || 0));

  // ─── Finalize POS Sale ──────────────────────────────────────────────────────
  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;
    setSubmittingSale(true);
    try {
      const payload = {
        patientId: patientInfo?.patientId || undefined,
        prescriptionId: selectedPrescription?.prescriptionId || undefined,
        customerName: customerName || patientInfo?.fullName || 'Walk-in Customer',
        paymentMethod,
        discountAmount: Number(discountAmount || 0),
        taxAmount: Number(taxAmount || 0),
        items: cart.map(c => ({
          inventoryId: c.inventoryId,
          quantity: c.quantity,
          durationDays: c.durationDays,
          dosageSchedule: c.dosageSchedule,
        })),
      };

      const res = await apiClient.post('/pharmacy/sales', payload);
      setCompletedInvoice(res.data.data);
      setCart([]);
      fetchMyStock(); // Refresh stock in real time
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete transaction.');
    } finally {
      setSubmittingSale(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* ── Banner Header ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#825100] to-[#F59E0B] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-white/90 mb-1 flex items-center gap-1.5">
            <Pill size={15} /> Store Counter & Point of Sale
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            POS Sales Register
          </h1>
          <p className="text-xs text-white/90 mt-1">
            Instant Walk-In OTC sales counter. Select items from inventory, apply discounts, and issue invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {otpSuccess && patientInfo ? (
            <div className="bg-white/20 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/30 text-xs flex items-center gap-2">
              <div>
                <div className="font-bold">{patientInfo.fullName}</div>
                <div className="text-white/80 text-[11px]">Rx Loaded</div>
              </div>
              <button
                onClick={() => {
                  setOtpSuccess(false);
                  setPatientInfo(null);
                  setPrescriptions([]);
                  setSelectedPrescription(null);
                }}
                className="bg-white/20 hover:bg-white/30 p-1 rounded-lg transition-colors"
                title="Clear Prescription"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowOtpModal(true)}
              className="bg-white text-[#825100] hover:bg-white/90 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <KeyRound size={15} className="text-[#D97706]" />
              📋 Optional: Load Patient Rx (OTP)
            </button>
          )}
        </div>
      </div>

      {/* ── Optional Patient OTP Prescription Modal ────────────────────────────── */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                <KeyRound size={18} className="text-[#F59E0B]" />
                Optional: Load Patient Prescription
              </div>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Enter the patient's 6-digit OTP code to pull up their active prescription directly into the POS Sales Register.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">6-Digit OTP Code</label>
                <Input
                  type="text"
                  placeholder="e.g. 123456"
                  maxLength={6}
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Patient Email Address (Optional)</label>
                <Input
                  type="email"
                  placeholder="patient@example.com"
                  value={patientEmailInput}
                  onChange={e => setPatientEmailInput(e.target.value)}
                />
              </div>

              <div className="text-[11px] text-[#B45309] bg-[#FEF3C7] p-2.5 rounded-lg border border-[#FDE68A]">
                💡 <strong>Quick Demo Code:</strong> Enter <strong>123456</strong> to load prescription instantly.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  style={{ width: '100%', background: '#F59E0B', padding: '10px' }}
                  disabled={verifying}
                  icon={verifying ? <Spinner size={16} /> : <FileText size={16} />}
                >
                  {verifying ? 'Verifying & Loading...' : 'Load Rx into POS Cart'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Main POS Sales Register Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Prescription Viewer or Manual OTC Catalog (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Prescription Selector Tabs (Only in OTP mode) */}
            {!isManualOtcMode && prescriptions.length > 0 && (
              <Card style={{ padding: '16px' }}>
                <div className="text-xs font-bold text-gray-700 mb-2.5 flex items-center gap-1.5">
                  <FileText size={14} className="text-[#F59E0B]" />
                  Select Prescription ({prescriptions.length} Records Available)
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {prescriptions.map((rx, idx) => (
                    <button
                      key={rx.prescriptionId}
                      onClick={() => selectPrescription(rx)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                        selectedPrescription?.prescriptionId === rx.prescriptionId
                          ? 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Rx #{idx + 1} — {formatDoctorName(rx.doctorName, 'Prescribed Doctor')} ({new Date(rx.createdAt).toLocaleDateString()})
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Prescribed Items (Only in OTP mode) */}
            {!isManualOtcMode && (
              <Card style={{ padding: '20px' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Calculator size={18} className="text-[#F59E0B]" />
                    Prescribed Medicines & Duration Calculator
                  </h3>
                  <Badge variant="blue">Smart Rule Engine</Badge>
                </div>

                {parsedMedicines.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    No OCR digitized medicines found for this prescription. You can manually add drugs to cart from the stock catalog below.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {parsedMedicines.map((med, idx) => {
                      const stockMatch = myStock.find(
                        s =>
                          s.brandName.toLowerCase().includes(med.brandName.toLowerCase()) ||
                          med.brandName.toLowerCase().includes(s.brandName.toLowerCase())
                      );
                      const dailyDose = parseDosePerDay(med.frequency);

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-gray-200 bg-white hover:border-[#F59E0B]/50 transition-colors shadow-sm space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                            <div>
                              <div className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                                {med.brandName}
                                <span className="text-xs font-normal text-gray-500">({med.saltComposition})</span>
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                Prescribed Schedule: <strong>{med.frequency}</strong> ({dailyDose} pills/day) • Course: {med.duration}
                              </div>
                            </div>

                            <div>
                              {stockMatch ? (
                                <Badge variant={stockMatch.inStock && stockMatch.quantity > 0 ? 'green' : 'red'}>
                                  {stockMatch.inStock && stockMatch.quantity > 0
                                    ? `In Stock (${stockMatch.quantity} left) @ ৳${stockMatch.currentPrice}`
                                    : 'Out of Stock'}
                                </Badge>
                              ) : (
                                <Badge variant="yellow">Not Listed in Stock</Badge>
                              )}
                            </div>
                          </div>

                          {stockMatch && stockMatch.inStock && stockMatch.quantity > 0 && (
                            <div className="bg-gray-50 p-3 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-gray-700">Calculate Duration & Dispense:</span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {[1, 3, 7, 14, 30].map(days => {
                                  const calculatedQty = calculateRequiredQuantity(med.frequency, days);
                                  return (
                                    <button
                                      key={days}
                                      onClick={() => handleAddPresetToCart(stockMatch, med.frequency, days)}
                                      className="bg-white hover:bg-[#F59E0B] hover:text-white border border-gray-300 text-gray-700 font-bold px-2.5 py-1 rounded-lg transition-colors text-xs flex items-center gap-1"
                                    >
                                      {days}d ({calculatedQty} pills)
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}

          {/* Live Store Catalog Search & Multi-Batch Item Selector */}
          <Card style={{ padding: '20px' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Search size={15} className="text-[#F59E0B]" />
                Search Store Inventory ({myStock.length} SKUs / Batches Available)
              </h4>
            </div>

            {/* Live Search Input */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search stock by Brand Name, Salt Composition, Batch #..."
                value={stockSearchQuery}
                onChange={e => setStockSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl font-semibold text-xs bg-white focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            {/* Store Catalog Items List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl">
              {myStock
                .filter(
                  item =>
                    (item.brandName || '').toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
                    (item.saltComposition || '').toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
                    (item.batchNumber || '').toLowerCase().includes(stockSearchQuery.toLowerCase())
                )
                .map(item => {
                  return (
                    <div key={item.inventoryId} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50 text-xs">
                      <div>
                        <div className="font-extrabold text-gray-900 flex items-center gap-2">
                          {item.brandName} ({item.strength})
                          <Badge variant={item.quantity > 10 ? 'green' : item.quantity > 0 ? 'yellow' : 'red'}>
                            Stock: {item.quantity} units
                          </Badge>
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium">
                          {item.saltComposition || 'Generic'} • Batch: <strong>{item.batchNumber || 'DEFAULT'}</strong>
                          {item.expiryDate && (
                            <span className="text-amber-700 font-bold ml-2">
                              • Exp: {new Date(item.expiryDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-900">৳{item.currentPrice}</span>
                        <button
                          onClick={() => handleAddPresetToCart(item, '1+0+1', 1)}
                          className="bg-[#F59E0B] text-white hover:bg-[#D97706] font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm flex items-center gap-1"
                        >
                          + Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>

        {/* Right Column: Billing Cart & POS Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card style={{ padding: '20px', position: 'sticky', top: '80px' }}>
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart size={18} className="text-[#F59E0B]" />
                Active Billing Cart
              </h3>
              <Badge variant="yellow">{cart.length} Items Selected</Badge>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 space-y-2">
                <ShoppingCart size={32} className="mx-auto opacity-40 text-gray-400" />
                <div>Your dispensing cart is currently empty.</div>
                <div className="text-[11px]">Select duration presets from the prescription or search store catalog to add items.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cart Items List */}
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {cart.map(item => {
                    const stockMatch = myStock.find(s => s.inventoryId === item.inventoryId);
                    const isExceedingStock = stockMatch && item.quantity > stockMatch.quantity;

                    return (
                      <div
                        key={item.inventoryId}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-gray-900">{item.brandName} ({item.dosageStrength})</div>
                          <div className="text-[11px] text-gray-500">
                            ৳{item.unitSellingPrice} / unit • {item.durationDays} days supply
                          </div>
                          {isExceedingStock && (
                            <div className="text-[10px] text-amber-700 font-bold">
                              ⚠️ Selling {item.quantity} (Exceeds {stockMatch.quantity} in stock)
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => updateCartQty(item.inventoryId, Number(e.target.value))}
                            className="w-16 p-1 text-center font-bold border border-gray-300 rounded-lg text-xs"
                          />
                        <div className="font-extrabold text-gray-900 w-16 text-right">৳{item.lineTotal}</div>
                        <button
                          onClick={() => updateCartQty(item.inventoryId, 0)}
                          className="text-red-500 hover:text-[#D97706] p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

                {/* Customer & Checkout Form */}
                <div className="border-t border-gray-200 pt-4 space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Customer / Patient Name</label>
                    <Input
                      type="text"
                      placeholder="Walk-in Customer"
                      value={customerName || (patientInfo ? patientInfo.fullName : '')}
                      onChange={e => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Discount (৳)</label>
                      <Input
                        type="number"
                        min={0}
                        value={discountAmount}
                        onChange={e => setDiscountAmount(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value as any)}
                        className="w-full p-2 border border-gray-300 rounded-xl font-bold bg-white text-xs"
                      >
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="BKASH">bKash</option>
                        <option value="NAGAD">Nagad</option>
                        <option value="ROCKET">Rocket</option>
                      </select>
                    </div>
                  </div>

                  {/* Summary Totals */}
                  <div className="bg-gray-100 p-3.5 rounded-xl space-y-1.5 font-semibold text-gray-700">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>৳{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span>- ৳{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-extrabold text-gray-900 border-t border-gray-300 pt-2">
                      <span>Net Total:</span>
                      <span className="text-[#D97706]">৳{netTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    style={{ width: '100%', background: '#F59E0B', padding: '12px' }}
                    onClick={handleFinalizeSale}
                    disabled={submittingSale || cart.length === 0}
                    icon={submittingSale ? <Spinner size={16} /> : <Printer size={16} />}
                  >
                    {submittingSale ? 'Processing POS Checkout...' : 'Finalize Sale & Print Receipt'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Printable Invoice Receipt Modal ───────────────────────────────────── */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="text-center space-y-1 border-b border-dashed border-gray-300 pb-4">
              <h2 className="text-xl font-extrabold text-gray-900">MediSync Pharmacy</h2>
              <div className="text-xs text-gray-500 font-bold">Official POS Billing Receipt</div>
              <div className="text-[11px] text-gray-400">Invoice #{completedInvoice.invoiceNumber}</div>
            </div>

            <div className="text-xs space-y-1 text-gray-600 border-b border-gray-100 pb-3">
              <div><strong>Date:</strong> {new Date(completedInvoice.createdAt).toLocaleString()}</div>
              <div><strong>Customer:</strong> {completedInvoice.customerName || 'Walk-in'}</div>
              <div><strong>Payment Method:</strong> {completedInvoice.paymentMethod}</div>
            </div>

            {/* Itemized Table */}
            <div className="divide-y divide-gray-100 text-xs">
              <div className="font-bold text-gray-700 py-1.5 grid grid-cols-12">
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-4 text-right">Total</span>
              </div>
              {completedInvoice.items?.map((it: any, idx: number) => (
                <div key={idx} className="py-2 grid grid-cols-12 text-gray-800">
                  <span className="col-span-6 font-semibold">{it.brandName}</span>
                  <span className="col-span-2 text-center">{it.quantity}</span>
                  <span className="col-span-4 text-right font-bold">৳{it.lineTotal}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-gray-300 pt-3 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-gray-900 text-sm">
                <span>Net Amount Paid:</span>
                <span>৳{completedInvoice.netTotal}</span>
              </div>
            </div>

            <div className="text-[10px] text-center text-gray-400 pt-2 italic border-t border-gray-100">
              Thank you for choosing MediSync. Consult your physician for medical advice.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-[#F59E0B] text-white hover:bg-[#D97706] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer size={15} /> Print Thermal / PDF
              </button>
              <button
                onClick={() => setCompletedInvoice(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
