import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import Icon from '../../../components/AppIcon';

const COLUMNS = [
  { key: 'payment_no', label: 'Payment No', width: 'w-36' },
  { key: 'payment_date', label: 'Payment Date', width: 'w-28' },
  { key: 'supplier_name', label: 'Supplier Name', width: 'w-44' },
  { key: 'payment_account', label: 'Payment Account', width: 'w-36' },
  { key: 'cheque_ref_no', label: 'Cheque/Ref No', width: 'w-32' },
  { key: 'total_amount', label: 'Total Amount', width: 'w-28' },
  { key: 'allocated_amount', label: 'Allocated Amt', width: 'w-28' },
  { key: 'status', label: 'Status', width: 'w-24' },
];

const ITEMS_PER_PAGE = 22;

const SupplierPaymentsSpreadsheet = ({ onNew, onEdit }) => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterPanelRef = useRef(null);

  const [filterPaymentNo, setFilterPaymentNo] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [vendors, setVendors] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        ?.from('supplier_payments')
        ?.select('*')
        ?.order('payment_date', { ascending: false });

      if (filterPaymentNo) query = query?.ilike('payment_no', `%${filterPaymentNo}%`);
      if (filterSupplier) query = query?.eq('supplier_id', filterSupplier);
      if (filterAccount) query = query?.ilike('payment_account', `%${filterAccount}%`);
      if (filterDateFrom) query = query?.gte('payment_date', filterDateFrom);
      if (filterDateTo) query = query?.lte('payment_date', filterDateTo);

      const { data, error } = await query;
      if (error) throw error;

      const supplierIds = [...new Set((data || []).map(p => p?.supplier_id).filter(Boolean))];
      let vendorMap = {};
      if (supplierIds?.length > 0) {
        const { data: vd } = await supabase?.from('vendors')?.select('id, vendor_name')?.in('id', supplierIds);
        (vd || [])?.forEach(v => { vendorMap[v.id] = v?.vendor_name; });
      }

      setPayments((data || [])?.map(p => ({
        ...p,
        supplier_name: vendorMap?.[p?.supplier_id] || p?.supplier_name || '',
      })));
    } catch (err) {
      console.error('Error fetching supplier payments:', err);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterPaymentNo, filterSupplier, filterAccount, filterDateFrom, filterDateTo]);

  const fetchLookups = useCallback(async () => {
    const results = await Promise.all([
      supabase?.from('vendors')?.select('id, vendor_name')?.eq('status', 'active')?.order('vendor_name'),
      supabase?.from('payment_accounts')?.select('id, account_name')?.order('account_name'),
    ]);
    const vd = results[0]?.data || [];
    const pa = results[1]?.data || [];
    setVendors(vd);
    setPaymentAccounts(pa);
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchLookups();
  }, [fetchPayments, fetchLookups]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterPanelRef?.current && !filterPanelRef?.current?.contains(e?.target)) {
        setShowFilterPanel(false);
      }
    };
    if (showFilterPanel) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterPanel]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedPayments = [...payments]?.sort((a, b) => {
    if (!sortConfig?.key) return 0;
    const aVal = a?.[sortConfig?.key] ?? '';
    const bVal = b?.[sortConfig?.key] ?? '';
    const cmp = String(aVal)?.localeCompare(String(bVal), undefined, { numeric: true });
    return sortConfig?.direction === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sortedPayments?.length / ITEMS_PER_PAGE));
  const paginatedPayments = sortedPayments?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const grandTotal = payments?.reduce((s, p) => s + (parseFloat(p?.total_amount) || 0), 0);
  const grandAllocated = payments?.reduce((s, p) => s + (parseFloat(p?.allocated_amount) || 0), 0);

  const handleSelectAll = (e) => {
    setSelectAll(e?.target?.checked);
    setSelectedRows(e?.target?.checked ? paginatedPayments?.map(p => p?.id) : []);
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev?.includes(id) ? prev?.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    if (!selectedRow && selectedRows?.length === 0) return;
    const ids = selectedRows?.length > 0 ? selectedRows : [selectedRow];
    if (!window.confirm(`Delete ${ids?.length} payment(s)?`)) return;
    await supabase?.from('supplier_payments')?.delete()?.in('id', ids);
    setSelectedRows([]);
    setSelectedRow(null);
    fetchPayments();
  };

  const handleApplyFilter = () => {
    setCurrentPage(1);
    fetchPayments();
    setShowFilterPanel(false);
  };

  const handleClearFilter = () => {
    setFilterPaymentNo('');
    setFilterSupplier('');
    setFilterAccount('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setCurrentPage(1);
    setShowFilterPanel(false);
  };

  const fmtAmt = (v) => (parseFloat(v) || 0)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d)?.toLocaleDateString('en-GB') : '';

  const STATUS_COLORS = {
    posted: 'bg-emerald-100 text-emerald-700',
    partial: 'bg-amber-100 text-amber-700',
    unallocated: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const inputCls = 'h-7 px-2 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full';

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Supplier Payments</span>
          <span className="text-xs text-muted-foreground">({payments?.length} records)</span>
        </div>
        <div className="relative" ref={filterPanelRef}>
          <button
            onClick={() => setShowFilterPanel(v => !v)}
            className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium border border-border rounded bg-background hover:bg-accent transition-colors"
          >
            <Icon name="Search" size={13} />
            Search (F3)
          </button>
          {showFilterPanel && (
            <div className="absolute right-0 top-9 z-50 bg-card border border-border rounded-lg shadow-xl p-4 w-80">
              <h4 className="text-xs font-semibold text-foreground mb-3">Filter Payments</h4>
              <div className="space-y-2.5">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Payment No</label>
                  <input className={inputCls} value={filterPaymentNo} onChange={e => setFilterPaymentNo(e?.target?.value)} placeholder="PAY-..." />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Supplier</label>
                  <select className={inputCls} value={filterSupplier} onChange={e => setFilterSupplier(e?.target?.value)}>
                    <option value="">All Suppliers</option>
                    {vendors?.map(v => <option key={v?.id} value={v?.id}>{v?.vendor_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Payment Account</label>
                  <select className={inputCls} value={filterAccount} onChange={e => setFilterAccount(e?.target?.value)}>
                    <option value="">All Accounts</option>
                    {paymentAccounts?.map(a => <option key={a?.id} value={a?.account_name}>{a?.account_name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Date From</label>
                    <input type="date" className={inputCls} value={filterDateFrom} onChange={e => setFilterDateFrom(e?.target?.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Date To</label>
                    <input type="date" className={inputCls} value={filterDateTo} onChange={e => setFilterDateTo(e?.target?.value)} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleApplyFilter} className="flex-1 h-7 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90">Apply</button>
                <button onClick={handleClearFilter} className="flex-1 h-7 text-xs font-medium border border-border rounded hover:bg-accent">Clear</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs font-sans border-collapse min-w-max">
          <thead className="sticky top-0 z-10">
            <tr className="bg-primary text-primary-foreground">
              <th className="w-8 px-2 py-1.5 text-center border-r border-primary/20">
                <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="w-3 h-3" />
              </th>
              <th className="w-8 px-2 py-1.5 text-center border-r border-primary/20 text-xs">#</th>
              {COLUMNS?.map(col => (
                <th
                  key={col?.key}
                  className={`${col?.width} px-2 py-1.5 text-left font-semibold border-r border-primary/20 cursor-pointer hover:bg-primary/80 select-none whitespace-nowrap`}
                  onClick={() => handleSort(col?.key)}
                >
                  <div className="flex items-center gap-1">
                    {col?.label}
                    {sortConfig?.key === col?.key && (
                      <Icon name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={11} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 })?.map((_, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td colSpan={COLUMNS?.length + 2} className="px-2 py-1.5">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                  </td>
                </tr>
              ))
            ) : paginatedPayments?.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS?.length + 2} className="text-center py-12 text-muted-foreground">
                  No payments found. Click New (F2) to add a payment.
                </td>
              </tr>
            ) : (
              paginatedPayments?.map((payment, idx) => {
                const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                const isSelected = selectedRow === payment?.id;
                const isChecked = selectedRows?.includes(payment?.id);
                const statusColor = STATUS_COLORS?.[payment?.status] || STATUS_COLORS?.unallocated;
                return (
                  <tr
                    key={payment?.id}
                    className={`border-b border-border/50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/10 border-primary/30' :
                      idx % 2 === 0 ? 'bg-background hover:bg-muted/30' : 'bg-muted/10 hover:bg-muted/30'
                    }`}
                    onClick={() => setSelectedRow(payment?.id)}
                    onDoubleClick={() => onEdit?.(payment)}
                  >
                    <td className="w-8 px-2 py-1 text-center border-r border-border/30">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSelectRow(payment?.id)}
                        onClick={e => e?.stopPropagation()}
                        className="w-3 h-3"
                      />
                    </td>
                    <td className="w-8 px-2 py-1 text-center text-muted-foreground border-r border-border/30 tabular-nums">{rowNum}</td>
                    <td className="px-2 py-1 border-r border-border/30 font-mono font-medium text-primary whitespace-nowrap">{payment?.payment_no}</td>
                    <td className="px-2 py-1 border-r border-border/30 tabular-nums whitespace-nowrap">{fmtDate(payment?.payment_date)}</td>
                    <td className="px-2 py-1 border-r border-border/30 whitespace-nowrap">{payment?.supplier_name}</td>
                    <td className="px-2 py-1 border-r border-border/30 whitespace-nowrap">{payment?.payment_account}</td>
                    <td className="px-2 py-1 border-r border-border/30 font-mono whitespace-nowrap">{payment?.cheque_ref_no || '—'}</td>
                    <td className="px-2 py-1 border-r border-border/30 text-right tabular-nums whitespace-nowrap">{fmtAmt(payment?.total_amount)}</td>
                    <td className="px-2 py-1 border-r border-border/30 text-right tabular-nums whitespace-nowrap">{fmtAmt(payment?.allocated_amount)}</td>
                    <td className="px-2 py-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${statusColor}`}>
                        {payment?.status || 'unallocated'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {payments?.length > 0 && (
            <tfoot className="sticky bottom-0">
              <tr className="bg-primary/10 border-t-2 border-primary/30 font-semibold">
                <td colSpan={6} className="px-2 py-1.5 text-xs text-foreground">Grand Total</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-xs">{fmtAmt(grandTotal)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-xs">{fmtAmt(grandAllocated)}</td>
                <td className="px-2 py-1.5 text-xs text-muted-foreground">
                  Unalloc: {fmtAmt(grandTotal - grandAllocated)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-muted/20 flex-shrink-0">
          <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-6 px-2 text-xs border border-border rounded disabled:opacity-40 hover:bg-accent">
              <Icon name="ChevronLeft" size={12} />
            </button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-6 px-2 text-xs border border-border rounded disabled:opacity-40 hover:bg-accent">
              <Icon name="ChevronRight" size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-muted/30 flex-shrink-0">
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          <Icon name="Plus" size={13} /> New (F2)
        </button>
        <button
          onClick={() => selectedRow && onEdit?.(payments?.find(p => p?.id === selectedRow))}
          disabled={!selectedRow}
          className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium border border-border rounded hover:bg-accent disabled:opacity-40 transition-colors"
        >
          <Icon name="Pencil" size={13} /> Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={!selectedRow && selectedRows?.length === 0}
          className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-40 transition-colors"
        >
          <Icon name="Trash2" size={13} /> Delete
        </button>
        <div className="flex-1" />
        <button className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium border border-border rounded hover:bg-accent transition-colors">
          <Icon name="Printer" size={13} /> Print
        </button>
        <button className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium border border-border rounded hover:bg-accent transition-colors">
          <Icon name="FileSpreadsheet" size={13} /> Excel
        </button>
      </div>
    </div>
  );
};

export default SupplierPaymentsSpreadsheet;
