import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

const ITEMS_PER_PAGE = 22;

const MOCK_MOVEMENTS = [
  { id: 'm1', movement_date: '2026-03-01', product_code: 'P001', product_name: 'Malta Guinness 33cl', location: 'Main Warehouse', transaction_type: 'receipt', quantity: 500, unit_cost: 85.00, reference_no: 'GRN-2026-001', reason: 'Purchase Order PO-2026-045', created_by: 'Admin' },
  { id: 'm2', movement_date: '2026-03-01', product_code: 'P002', product_name: 'Coca-Cola 50cl PET', location: 'Main Warehouse', transaction_type: 'issue', quantity: -120, unit_cost: 72.00, reference_no: 'SO-2026-112', reason: 'Sales Order fulfillment', created_by: 'Kwame A.' },
  { id: 'm3', movement_date: '2026-02-28', product_code: 'P004', product_name: 'Indomie Chicken 70g', location: 'Branch Store A', transaction_type: 'transfer', quantity: 200, unit_cost: 45.00, reference_no: 'TRF-2026-018', reason: 'Stock replenishment to branch', created_by: 'Ama B.' },
  { id: 'm4', movement_date: '2026-02-28', product_code: 'P005', product_name: 'Peak Milk 170g Tin', location: 'Main Warehouse', transaction_type: 'adjustment', quantity: -15, unit_cost: 120.00, reference_no: 'ADJ-2026-007', reason: 'Damaged goods write-off', created_by: 'Admin' },
  { id: 'm5', movement_date: '2026-02-27', product_code: 'P003', product_name: 'Fanta Orange 33cl', location: 'Main Warehouse', transaction_type: 'receipt', quantity: 300, unit_cost: 68.00, reference_no: 'GRN-2026-002', reason: 'Purchase Order PO-2026-046', created_by: 'Admin' },
  { id: 'm6', movement_date: '2026-02-27', product_code: 'P009', product_name: 'Sprite 50cl PET', location: 'Branch Store B', transaction_type: 'issue', quantity: -80, unit_cost: 70.00, reference_no: 'SO-2026-113', reason: 'Sales Order fulfillment', created_by: 'Kofi M.' },
  { id: 'm7', movement_date: '2026-02-26', product_code: 'P006', product_name: 'Milo 400g Tin', location: 'Main Warehouse', transaction_type: 'adjustment', quantity: 10, unit_cost: 95.00, reference_no: 'ADJ-2026-008', reason: 'Stock count correction', created_by: 'Admin' },
  { id: 'm8', movement_date: '2026-02-26', product_code: 'P007', product_name: 'Omo Washing Powder 1kg', location: 'Main Warehouse', transaction_type: 'transfer', quantity: -50, unit_cost: 55.00, reference_no: 'TRF-2026-019', reason: 'Transfer to Branch Store A', created_by: 'Ama B.' },
  { id: 'm9', movement_date: '2026-02-25', product_code: 'P008', product_name: 'Cowbell Sachet Milk', location: 'Main Warehouse', transaction_type: 'receipt', quantity: 1000, unit_cost: 38.00, reference_no: 'GRN-2026-003', reason: 'Purchase Order PO-2026-047', created_by: 'Admin' },
  { id: 'm10', movement_date: '2026-02-25', product_code: 'P001', product_name: 'Malta Guinness 33cl', location: 'Branch Store A', transaction_type: 'issue', quantity: -60, unit_cost: 85.00, reference_no: 'SO-2026-114', reason: 'Sales Order fulfillment', created_by: 'Yaw D.' },
  { id: 'm11', movement_date: '2026-02-24', product_code: 'P010', product_name: 'Pringles Original 165g', location: 'Main Warehouse', transaction_type: 'adjustment', quantity: -5, unit_cost: 180.00, reference_no: 'ADJ-2026-009', reason: 'Expired goods disposal', created_by: 'Admin' },
  { id: 'm12', movement_date: '2026-02-24', product_code: 'P002', product_name: 'Coca-Cola 50cl PET', location: 'Branch Store B', transaction_type: 'transfer', quantity: 150, unit_cost: 72.00, reference_no: 'TRF-2026-020', reason: 'Stock replenishment', created_by: 'Ama B.' },
];

const TYPE_CONFIG = {
  receipt: { label: 'Receipt', cls: 'bg-emerald-100 text-emerald-700' },
  issue: { label: 'Issue', cls: 'bg-red-100 text-red-700' },
  transfer: { label: 'Transfer', cls: 'bg-blue-100 text-blue-700' },
  adjustment: { label: 'Adjustment', cls: 'bg-orange-100 text-orange-700' },
};

const LOCATIONS = ['Main Warehouse', 'Branch Store A', 'Branch Store B', 'Cold Storage'];

const StockMovementsSpreadsheet = ({ filters }) => {
  const [movements, setMovements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'movement_date', direction: 'desc' });
  const [selectedRow, setSelectedRow] = useState(null);

  const fetchMovements = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase?.from('stock_movements')?.select('*')?.order('movement_date', { ascending: false });
      if (error) throw error;
      setMovements(data?.length > 0 ? data : MOCK_MOVEMENTS);
    } catch {
      setMovements(MOCK_MOVEMENTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  const filtered = useMemo(() => {
    let list = [...movements];
    if (filters?.product) list = list?.filter(m => m?.product_name?.toLowerCase()?.includes(filters?.product?.toLowerCase()) || m?.product_code?.toLowerCase()?.includes(filters?.product?.toLowerCase()));
    if (filters?.location) list = list?.filter(m => m?.location === filters?.location);
    if (filters?.transactionType) list = list?.filter(m => m?.transaction_type === filters?.transactionType);
    if (filters?.dateFrom) list = list?.filter(m => m?.movement_date >= filters?.dateFrom);
    if (filters?.dateTo) list = list?.filter(m => m?.movement_date <= filters?.dateTo);
    if (filters?.user) list = list?.filter(m => m?.created_by?.toLowerCase()?.includes(filters?.user?.toLowerCase()));
    if (sortConfig?.key) {
      list = list?.sort((a, b) => {
        const av = a?.[sortConfig?.key]; const bv = b?.[sortConfig?.key];
        if (typeof av === 'number') return sortConfig?.direction === 'asc' ? av - bv : bv - av;
        return sortConfig?.direction === 'asc' ? String(av || '')?.localeCompare(String(bv || '')) : String(bv || '')?.localeCompare(String(av || ''));
      });
    }
    return list;
  }, [movements, filters, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filtered?.length / ITEMS_PER_PAGE));
  const paginated = filtered?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const summaryByType = useMemo(() => {
    return Object.keys(TYPE_CONFIG)?.map(type => ({
      type,
      count: filtered?.filter(m => m?.transaction_type === type)?.length,
      totalQty: filtered?.filter(m => m?.transaction_type === type)?.reduce((s, m) => s + Math.abs(parseInt(m?.quantity || 0)), 0),
    }));
  }, [filtered]);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc' }));
    setCurrentPage(1);
  };

  const getSortIcon = (key) => sortConfig?.key === key ? (sortConfig?.direction === 'asc' ? '▲' : '▼') : <span className="text-muted-foreground/40">▼</span>;

  const cols = [
    { key: 'movement_date', label: 'Date', w: 'w-24' },
    { key: 'product_code', label: 'Product Code', w: 'w-24' },
    { key: 'product_name', label: 'Product Name', w: 'w-44' },
    { key: 'location', label: 'Location', w: 'w-32' },
    { key: 'transaction_type', label: 'Transaction Type', w: 'w-28' },
    { key: 'quantity', label: 'Quantity', w: 'w-20', num: true },
    { key: 'unit_cost', label: 'Unit Cost', w: 'w-24', num: true },
    { key: 'reference_no', label: 'Reference No', w: 'w-32' },
    { key: 'reason', label: 'Reason', w: 'w-48' },
    { key: 'created_by', label: 'User', w: 'w-24' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Pagination + count */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-background border-b border-border">
        <span className="text-xs text-muted-foreground">{filtered?.length} records</span>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="w-6 h-6 text-xs text-muted-foreground hover:bg-accent rounded disabled:opacity-40">«</button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-6 h-6 text-xs text-muted-foreground hover:bg-accent rounded disabled:opacity-40">‹</button>
          <span className="text-xs text-muted-foreground px-1">{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-6 h-6 text-xs text-muted-foreground hover:bg-accent rounded disabled:opacity-40">›</button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="w-6 h-6 text-xs text-muted-foreground hover:bg-accent rounded disabled:opacity-40">»</button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><span className="text-xs text-gray-400">Loading movements...</span></div>
        ) : (
          <table className="w-full border-collapse text-xs" style={{ minWidth: '1200px' }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-primary/10">
                <th className="border border-border px-1 py-1.5 w-8 text-center text-muted-foreground">#</th>
                {cols?.map(col => (
                  <th key={col?.key} className={`border border-border px-2 py-1.5 text-left font-medium text-foreground cursor-pointer hover:bg-primary/20 whitespace-nowrap select-none ${col?.w}`} onClick={() => handleSort(col?.key)}>
                    <span className="flex items-center gap-1">{col?.label}<span className="text-xs">{getSortIcon(col?.key)}</span></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated?.length === 0 ? (
                <tr><td colSpan={cols?.length + 1} className="text-center py-12 text-muted-foreground">No movements found</td></tr>
              ) : (
                paginated?.map((m, idx) => {
                  const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const isActive = selectedRow?.id === m?.id;
                  const typeCfg = TYPE_CONFIG?.[m?.transaction_type] || { label: m?.transaction_type, cls: 'bg-gray-100 text-gray-600' };
                  const isNegative = parseInt(m?.quantity) < 0;
                  return (
                    <tr key={m?.id} onClick={() => setSelectedRow(m)} className="cursor-pointer transition-colors"
                      style={{ backgroundColor: isActive ? 'color-mix(in srgb, var(--color-primary) 8%, white)' : idx % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                      <td className="border border-border px-1 py-0.5 text-center text-muted-foreground">{rowNum}</td>
                      <td className="border border-border px-2 py-0.5 text-muted-foreground">{m?.movement_date}</td>
                      <td className="border border-border px-2 py-0.5 font-medium font-sans tabular-nums" style={{ color: 'var(--color-primary)' }}>{m?.product_code}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{m?.product_name}</td>
                      <td className="border border-border px-2 py-0.5 text-muted-foreground">{m?.location}</td>
                      <td className="border border-border px-2 py-0.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${typeCfg?.cls}`}>{typeCfg?.label}</span>
                      </td>
                      <td className={`border border-border px-2 py-0.5 text-right font-sans tabular-nums font-semibold ${isNegative ? 'text-red-600' : 'text-emerald-700'}`}>
                        {isNegative ? '' : '+'}{parseInt(m?.quantity || 0)?.toLocaleString()}
                      </td>
                      <td className="border border-border px-2 py-0.5 text-right font-sans tabular-nums text-foreground">
                        {parseFloat(m?.unit_cost || 0)?.toFixed(2)}
                      </td>
                      <td className="border border-border px-2 py-0.5">
                        <span className="cursor-pointer hover:underline" style={{ color: 'var(--color-primary)' }}>{m?.reference_no}</span>
                      </td>
                      <td className="border border-border px-2 py-0.5 text-muted-foreground max-w-xs truncate">{m?.reason}</td>
                      <td className="border border-border px-2 py-0.5 text-muted-foreground">{m?.created_by}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary Panel */}
      <div className="px-4 py-2 bg-muted/30 border-t border-border">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs font-semibold text-foreground">Summary:</span>
          {summaryByType?.map(s => (
            <div key={s?.type} className="flex items-center gap-1.5">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_CONFIG?.[s?.type]?.cls}`}>{TYPE_CONFIG?.[s?.type]?.label}</span>
              <span className="text-xs text-gray-600">{s?.count} txns / {s?.totalQty?.toLocaleString()} units</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockMovementsSpreadsheet;