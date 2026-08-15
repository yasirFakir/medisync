import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Input, Spinner } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import {
  BookOpen, DollarSign, TrendingUp, ShoppingBag, Search, Filter,
  Printer, RefreshCw, Calendar, ArrowUpRight, CheckCircle2, ChevronRight
} from 'lucide-react';

interface SaleRecord {
  saleId: string;
  invoiceNumber: string;
  customerName?: string;
  patientName?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  netTotal: number;
  costTotal: number;
  profit: number;
  paymentMethod: string;
  createdAt: string;
  itemCount: number;
}

export const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    today: { revenue: number; cost: number; profit: number; orders: number };
    month: { revenue: number; cost: number; profit: number; orders: number };
  }>({
    today: { revenue: 0, cost: 0, profit: 0, orders: 0 },
    month: { revenue: 0, cost: 0, profit: 0, orders: 0 },
  });

  const [analytics, setAnalytics] = useState<{
    topSelling: Array<{ medicineName: string; totalQuantity: number; totalRevenue: number }>;
    paymentBreakdown: Array<{ paymentMethod: string; count: number; total: number }>;
  }>({ topSelling: [], paymentBreakdown: [] });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Receipt Modal
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const [salesRes, summaryRes, analyticsRes] = await Promise.all([
        apiClient.get('/pharmacy/sales', {
          params: {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            paymentMethod: paymentFilter || undefined,
          },
        }),
        apiClient.get('/pharmacy/sales/summary'),
        apiClient.get('/pharmacy/sales/analytics'),
      ]);

      setSales(salesRes.data.data || []);
      if (summaryRes.data.data) setSummary(summaryRes.data.data);
      if (analyticsRes.data.data) setAnalytics(analyticsRes.data.data);
    } catch (err) {
      console.error('Failed to load sales data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [startDate, endDate, paymentFilter]);

  // View Receipt Detail
  const handleViewReceipt = async (saleId: string) => {
    setLoadingDetail(true);
    try {
      const res = await apiClient.get(`/pharmacy/sales/${saleId}`);
      setSelectedSaleDetail(res.data.data);
    } catch (err) {
      console.error('Failed to fetch sale detail', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Filtered sales
  const filteredSales = sales.filter(s =>
    (s.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.patientName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* ── Banner ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#825100] to-[#F59E0B] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-white/90 mb-1 flex items-center gap-1.5">
            <BookOpen size={15} /> Financial Ledger & POS Analytics
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Sales & Accounting Ledger
          </h1>
          <p className="text-xs text-white/90 mt-1">
            Track daily/monthly revenue, net profit margins, itemized invoice history, and top-selling drugs.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} />}
          onClick={fetchSalesData}
          style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
        >
          Refresh Ledger
        </Button>
      </div>

      {/* ── Summary Stat Cards Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card style={{ padding: '20px' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Today's Revenue</span>
            <div className="p-2 bg-[#FEF3C7] text-[#D97706] rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 mt-2">
            ৳{summary.today.revenue.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {summary.today.orders} completed sales today
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Monthly Revenue</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 mt-2">
            ৳{summary.month.revenue.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {summary.month.orders} orders this month
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Monthly Gross Profit</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            ৳{summary.month.profit.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Revenue minus cost of goods sold
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Top Selling Drug</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="text-base font-extrabold text-gray-900 mt-2 truncate">
            {analytics.topSelling[0]?.medicineName || 'N/A'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {analytics.topSelling[0]?.totalQuantity || 0} units sold
          </div>
        </Card>
      </div>

      {/* ── Transaction Table Card ────────────────────────────────────────────── */}
      <Card style={{ padding: '24px' }}>
        {/* Filters Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={18} className="text-[#F59E0B]" />
            Sales Transactions History ({filteredSales.length})
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search Invoice / Customer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-xl w-48 font-semibold bg-white"
              />
            </div>

            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-xl font-bold bg-white"
            >
              <option value="">All Payment Modes</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
            </select>
          </div>
        </div>

        {/* Sales Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Date / Time</th>
                <th className="py-3 px-3">Items</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-right">Net Total</th>
                <th className="py-3 px-3 text-right">Gross Profit</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <Spinner size={24} />
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    No sales transactions matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.saleId} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-gray-900">{sale.invoiceNumber}</td>
                    <td className="py-3 px-3">{sale.customerName || sale.patientName || 'Walk-in'}</td>
                    <td className="py-3 px-3 text-gray-500">{new Date(sale.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-3">{sale.itemCount || 1} items</td>
                    <td className="py-3 px-3">
                      <Badge variant={sale.paymentMethod === 'CASH' ? 'yellow' : 'blue'}>
                        {sale.paymentMethod}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-gray-900">
                      ৳{Number(sale.netTotal).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-emerald-600">
                      +৳{Number(sale.profit || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleViewReceipt(sale.saleId)}
                        className="bg-gray-100 hover:bg-[#F59E0B] hover:text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Receipt View & Reprint Modal ─────────────────────────────────────── */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="text-center space-y-1 border-b border-dashed border-gray-300 pb-4">
              <h2 className="text-xl font-extrabold text-gray-900">{selectedSaleDetail.storeName || 'MediSync Pharmacy'}</h2>
              <div className="text-xs text-gray-500 font-bold">{selectedSaleDetail.streetAddress}, {selectedSaleDetail.city}</div>
              <div className="text-[11px] text-gray-400">Invoice #{selectedSaleDetail.invoiceNumber}</div>
            </div>

            <div className="text-xs space-y-1 text-gray-600 border-b border-gray-100 pb-3">
              <div><strong>Date:</strong> {new Date(selectedSaleDetail.createdAt).toLocaleString()}</div>
              <div><strong>Customer:</strong> {selectedSaleDetail.customerName || selectedSaleDetail.patientName || 'Walk-in'}</div>
              <div><strong>Payment:</strong> {selectedSaleDetail.paymentMethod}</div>
            </div>

            <div className="divide-y divide-gray-100 text-xs">
              <div className="font-bold text-gray-700 py-1.5 grid grid-cols-12">
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-4 text-right">Total</span>
              </div>
              {selectedSaleDetail.items?.map((it: any, idx: number) => (
                <div key={idx} className="py-2 grid grid-cols-12 text-gray-800">
                  <span className="col-span-6 font-semibold">{it.medicineName}</span>
                  <span className="col-span-2 text-center">{it.quantity}</span>
                  <span className="col-span-4 text-right font-bold">৳{it.lineTotal}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-gray-900 text-sm">
                <span>Net Total:</span>
                <span>৳{selectedSaleDetail.netTotal}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-[#F59E0B] text-white hover:bg-[#D97706] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer size={15} /> Reprint Receipt
              </button>
              <button
                onClick={() => setSelectedSaleDetail(null)}
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
