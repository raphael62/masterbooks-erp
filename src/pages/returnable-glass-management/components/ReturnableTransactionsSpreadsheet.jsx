import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import ReturnProcessingModal from './ReturnProcessingModal';

const ITEMS_PER_PAGE = 20;

const MOCK_TRANSACTIONS = [
  { id: 't1', customer_name: 'Kwame Asante Stores', item_name: 'Standard Bottle 33cl', item_type: 'Bottle', quantity_given: 240, quantity_returned: 120, balance: 120, deposit_amount: 60.00, transaction_date: '2026-02-15', status: 'partial_return' },
  { id: 't2', customer_name: 'Ama Boateng Enterprises', item_name: 'Plastic Crate 24-slot', item_type: 'Crate', quantity_given: 30, quantity_returned: 0, balance: 30, deposit_amount: 240.00, transaction_date: '2026-02-18', status: 'outstanding' },
  { id: 't3', customer_name: 'Kofi Mensah Trading', item_name: 'Standard Bottle 50cl', item_type: 'Bottle', quantity_given: 144, quantity_returned: 144, balance: 0, deposit_amount: 0.00, transaction_date: '2026-02-10', status: 'fully_returned' },
  { id: 't4', customer_name: 'Abena Osei Distributors', item_name: 'Metal Keg 30L', item_type: 'Keg', quantity_given: 10, quantity_returned: 3, balance: 7, deposit_amount: 315.00, transaction_date: '2026-02-20', status: 'partial_return' },
  { id: 't5', customer_name: 'Kwame Asante Stores', item_name: 'Plastic Crate 12-slot', item_type: 'Crate', quantity_given: 50, quantity_returned: 50, balance: 0, deposit_amount: 0.00, transaction_date: '2026-01-28', status: 'fully_returned' },
  { id: 't6', customer_name: 'Yaw Darko Supplies', item_name: 'Standard Bottle 33cl', item_type: 'Bottle', quantity_given: 480, quantity_returned: 200, balance: 280, deposit_amount: 140.00, transaction_date: '2026-02-22', status: 'partial_return' },
  { id: 't7', customer_name: 'Efua Asare Traders', item_name: 'Plastic Crate 24-slot', item_type: 'Crate', quantity_given: 20, quantity_returned: 0, balance: 20, deposit_amount: 160.00, transaction_date: '2026-02-25', status: 'outstanding' },
  { id: 't8', customer_name: 'Kofi Mensah Trading', item_name: 'Metal Keg 50L', item_type: 'Keg', quantity_given: 5, quantity_returned: 5, balance: 0, deposit_amount: 0.00, transaction_date: '2026-01-15', status: 'fully_returned' },
];

const STATUS_CONFIG = {
  outstanding: { label: 'Outstanding', cls: 'bg-orange-100 text-orange-700' },
  partial_return: { label: 'Partial Return', cls: 'bg-yellow-100 text-yellow-700' },
  fully_returned: { label: 'Fully Returned', cls: 'bg-emerald-100 text-emerald-700' },
};

const TYPE_COLORS = {
  Bottle: 'bg-blue-100 text-blue-700',
  Crate: 'bg-amber-100 text-amber-700',
  Keg: 'bg-purple-100 text-purple-700',
};

const ReturnableTransactionsSpreadsheet = ({ filters, onRefreshNeeded }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'transaction_date', direction: 'desc' });
  const [selectedRow, setSelectedRow] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase?.from('returnable_transactions')?.select('*')?.order('transaction_date', { ascending: false });
      if (error) throw error;
      setTransactions(data?.length > 0 ? data : MOCK_TRANSACTIONS);
    } catch {
      setTransactions(MOCK_TRANSACTIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filters?.customer) list = list?.filter(t => t?.customer_name?.toLowerCase()?.includes(filters?.customer?.toLowerCase()));
    if (filters?.itemType) list = list?.filter(t => t?.item_type === filters?.itemType);
    if (filters?.status && filters?.status !== 'all') list = list?.filter(t => t?.status === filters?.status);
    if (filters?.dateFrom) list = list?.filter(t => t?.transaction_date >= filters?.dateFrom);
    if (filters?.dateTo) list = list?.filter(t => t?.transaction_date <= filters?.dateTo);
    if (sortConfig?.key) {
      list = list?.sort((a, b) => {
        const av = a?.[sortConfig?.key]; const bv = b?.[sortConfig?.key];
        if (typeof av === 'number') return sortConfig?.direction === 'asc' ? av - bv : bv - av;
        return sortConfig?.direction === 'asc' ? String(av || '')?.localeCompare(String(bv || '')) : String(bv || '')?.localeCompare(String(av || ''));
      });
    }
    return list;
  }, [transactions, filters, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filtered?.length / ITEMS_PER_PAGE));
  const paginated = filtered?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const grandTotalDeposit = filtered?.reduce((s, t) => s + parseFloat(t?.deposit_amount || 0), 0);
  const grandTotalBalance = filtered?.reduce((s, t) => s + parseInt(t?.balance || 0), 0);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc' }));
    setCurrentPage(1);
  };

  const getSortIcon = (key) => sortConfig?.key === key ? (sortConfig?.direction === 'asc' ? '▲' : '▼') : '▼';

  const handleProcessReturn = (t) => {
    setReturnTarget(t);
    setShowReturnModal(true);
  };

  const cols = [
    { key: 'customer_name', label: 'Customer Name', w: 'w-40' },
    { key: 'item_type', label: 'Item Type', w: 'w-20' },
    { key: 'item_name', label: 'Item', w: 'w-40' },
    { key: 'quantity_given', label: 'Qty Given', w: 'w-20', num: true },
    { key: 'quantity_returned', label: 'Qty Returned', w: 'w-24', num: true },
    { key: 'balance', label: 'Balance', w: 'w-20', num: true },
    { key: 'deposit_amount', label: 'Deposit (GHS)', w: 'w-28', num: true },
    { key: 'transaction_date', label: 'Date', w: 'w-24' },
    { key: 'status', label: 'Status', w: 'w-28' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Records count */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-b border-gray-200">
        <span className="text-xs text-gray-500">{filtered?.length} records</span>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="w-6 h-6 text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-40">«</button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-6 h-6 text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-40">‹</button>
          <span className="text-xs text-gray-500 px-1">{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-6 h-6 text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-40">›</button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="w-6 h-6 text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-40">»</button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><span className="text-xs text-gray-400">Loading transactions...</span></div>
        ) : (
          <table className="w-full border-collapse text-xs" style={{ minWidth: '900px' }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-1 py-1.5 w-8 text-center text-gray-500">#</th>
                {cols?.map(col => (
                  <th key={col?.key} className={`border border-gray-300 px-2 py-1.5 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 whitespace-nowrap select-none ${col?.w}`} onClick={() => handleSort(col?.key)}>
                    <span className="flex items-center gap-1">{col?.label}<span className="text-gray-400 text-xs">{getSortIcon(col?.key)}</span></span>
                  </th>
                ))}
                <th className="border border-gray-300 px-2 py-1.5 text-center font-medium text-gray-700 w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated?.length === 0 ? (
                <tr><td colSpan={cols?.length + 2} className="text-center py-12 text-gray-400">No transactions found</td></tr>
              ) : (
                paginated?.map((t, idx) => {
                  const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const isActive = selectedRow?.id === t?.id;
                  const statusCfg = STATUS_CONFIG?.[t?.status] || STATUS_CONFIG?.outstanding;
                  return (
                    <tr key={t?.id} onClick={() => setSelectedRow(t)} className="cursor-pointer transition-colors"
                      style={{ backgroundColor: isActive ? 'color-mix(in srgb, var(--color-primary) 8%, white)' : idx % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                      <td className="border border-gray-200 px-1 py-0.5 text-center text-gray-400">{rowNum}</td>
                      <td className="border border-gray-200 px-2 py-0.5 font-medium text-gray-800">{t?.customer_name}</td>
                      <td className="border border-gray-200 px-2 py-0.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_COLORS?.[t?.item_type] || 'bg-gray-100 text-gray-600'}`}>{t?.item_type}</span>
                      </td>
                      <td className="border border-gray-200 px-2 py-0.5 text-gray-700">{t?.item_name}</td>
                      <td className="border border-gray-200 px-2 py-0.5 text-right font-sans tabular-nums text-gray-700">{parseInt(t?.quantity_given || 0)?.toLocaleString()}</td>
                      <td className="border border-gray-200 px-2 py-0.5 text-right font-sans tabular-nums text-emerald-700">{parseInt(t?.quantity_returned || 0)?.toLocaleString()}</td>
                      <td className="border border-gray-200 px-2 py-0.5 text-right font-sans tabular-nums">
                        <span className={parseInt(t?.balance) > 0 ? 'text-orange-600 font-semibold' : 'text-gray-500'}>{parseInt(t?.balance || 0)?.toLocaleString()}</span>
                      </td>
                      <td className="border border-gray-200 px-2 py-0.5 text-right font-sans tabular-nums text-gray-700">{parseFloat(t?.deposit_amount || 0)?.toFixed(2)}</td>
                      <td className="border border-gray-200 px-2 py-0.5 text-gray-600">{t?.transaction_date}</td>
                      <td className="border border-gray-200 px-2 py-0.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${statusCfg?.cls}`}>{statusCfg?.label}</span>
                      </td>
                      <td className="border border-gray-200 px-2 py-0.5 text-center">
                        {t?.balance > 0 && (
                          <button
                            onClick={e => { e?.stopPropagation(); handleProcessReturn(t); }}
                            className="px-2 py-0.5 text-xs font-medium text-white rounded transition-colors"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                          >Return</button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filtered?.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={6} className="border border-gray-300 px-2 py-1.5 text-right text-xs font-bold text-gray-700">Grand Total</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right text-xs font-bold font-sans tabular-nums text-orange-700">{grandTotalBalance?.toLocaleString()}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right text-xs font-bold font-sans tabular-nums text-gray-800">{grandTotalDeposit?.toFixed(2)}</td>
                  <td colSpan={3} className="border border-gray-300 px-2 py-1.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      <ReturnProcessingModal
        isOpen={showReturnModal}
        transaction={returnTarget}
        onClose={() => setShowReturnModal(false)}
        onSuccess={() => { setShowReturnModal(false); fetchTransactions(); }}
      />
    </div>
  );
};

export default ReturnableTransactionsSpreadsheet;