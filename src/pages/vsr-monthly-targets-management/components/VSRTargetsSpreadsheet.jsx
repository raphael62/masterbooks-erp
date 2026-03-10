import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import VSRTargetModal from './VSRTargetModal';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const COLUMNS = [
  { key: 'executive_code', label: 'Exec Code', width: 'w-28' },
  { key: 'executive_name', label: 'Executive Name', width: 'w-44' },
  { key: 'year', label: 'Year', width: 'w-20' },
  { key: 'month', label: 'Month', width: 'w-24' },
  { key: 'product_code', label: 'Product Code', width: 'w-28' },
  { key: 'product_name', label: 'Product Name', width: 'w-44' },
  { key: 'target_qty_cases', label: 'Target Cases', width: 'w-28' },
  { key: 'target_qty_bottles', label: 'Target Bottles', width: 'w-28' },
  { key: 'target_value', label: 'Target Value GHS', width: 'w-36' },
];

const VSRTargetsSpreadsheet = () => {
  const [targets, setTargets] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterPanelRef = useRef(null);
  const [filterExec, setFilterExec] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterProduct, setFilterProduct] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [targetsRes, execRes, prodRes] = await Promise.all([
        supabase?.from('vsr_monthly_targets')?.select('*')?.order('executive_code')?.order('year')?.order('month')?.order('product_code'),
        supabase?.from('business_executives')?.select('exec_code, full_name')?.eq('sales_rep_type', 'VSR')?.order('exec_code'),
        supabase?.from('products')?.select('product_code, product_name')?.order('product_code'),
      ]);
      if (targetsRes?.error) throw targetsRes?.error;
      setTargets(targetsRes?.data || []);
      setExecutives(execRes?.data || []);
      setProducts(prodRes?.data || []);
    } catch (err) {
      console.error('Failed to fetch VSR targets:', err);
      setTargets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterPanelRef?.current && !filterPanelRef?.current?.contains(e?.target)) {
        setShowFilterPanel(false);
      }
    };
    if (showFilterPanel) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterPanel]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e?.key === 'F3') { e?.preventDefault(); setShowFilterPanel(prev => !prev); }
      if (e?.key === 'F2') { e?.preventDefault(); setEditItem(null); setShowModal(true); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredData = useMemo(() => {
    let data = [...targets];
    if (filterExec) data = data?.filter(r => r?.executive_code === filterExec);
    if (filterYear) data = data?.filter(r => String(r?.year) === String(filterYear));
    if (filterMonth) data = data?.filter(r => String(r?.month) === String(filterMonth));
    if (filterProduct) data = data?.filter(r => r?.product_code === filterProduct);
    if (sortConfig?.key) {
      data?.sort((a, b) => {
        const aVal = a?.[sortConfig?.key] ?? '';
        const bVal = b?.[sortConfig?.key] ?? '';
        const cmp = String(aVal)?.localeCompare(String(bVal), undefined, { numeric: true });
        return sortConfig?.direction === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [targets, filterExec, filterYear, filterMonth, filterProduct, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredData?.length / itemsPerPage));
  const paginatedData = filteredData?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const grandTotalCases = filteredData?.reduce((s, r) => s + (Number(r?.target_qty_cases) || 0), 0);
  const grandTotalBottles = filteredData?.reduce((s, r) => s + (Number(r?.target_qty_bottles) || 0), 0);
  const grandTotalValue = filteredData?.reduce((s, r) => s + (Number(r?.target_value) || 0), 0);

  const fmt = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })?.format(n || 0);
  const fmtInt = (n) => new Intl.NumberFormat('en-US')?.format(n || 0);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const handleSelectAll = () => {
    if (selectAll) { setSelectedRows([]); setSelectAll(false); }
    else { setSelectedRows(paginatedData?.map(r => r?.id)); setSelectAll(true); }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => prev?.includes(id) ? prev?.filter(r => r !== id) : [...prev, id]);
  };

  const handleDelete = async () => {
    const toDelete = selectedRows?.length > 0 ? selectedRows : (selectedRow ? [selectedRow] : []);
    if (!toDelete?.length) return;
    if (!window.confirm(`Delete ${toDelete?.length} record(s)?`)) return;
    try {
      const { error } = await supabase?.from('vsr_monthly_targets')?.delete()?.in('id', toDelete);
      if (error) throw error;
      setSelectedRows([]); setSelectedRow(null);
      fetchData();
    } catch (err) { console.error('Delete failed:', err); }
  };

  const handleEdit = () => {
    const id = selectedRows?.[0] || selectedRow;
    if (!id) return;
    const item = targets?.find(r => r?.id === id);
    if (item) { setEditItem(item); setShowModal(true); }
  };

  const handleDownloadTemplate = () => {
    const headers = 'executive_code,executive_name,year,month,product_code,product_name,target_qty_cases,target_qty_bottles,target_value_ghs';
    const sample = 'VSR001,John Doe,2025,1,PRD001,Mineral Water 500ml,100,1200,5000.00';
    const blob = new Blob([`${headers}\n${sample}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'vsr_monthly_targets_template.csv'; a?.click();
    URL.revokeObjectURL(url);
  };

  const handleExcel = () => {
    const headers = COLUMNS?.map(c => c?.label)?.join(',');
    const rows = filteredData?.map(r =>
      COLUMNS?.map(c => {
        const val = c?.key === 'month' ? MONTH_NAMES?.[r?.month] || r?.month : (r?.[c?.key] ?? '');
        return `"${val}"`;
      })?.join(',')
    )?.join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'vsr_monthly_targets.csv'; a?.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ colKey }) => {
    if (sortConfig?.key !== colKey) return <span className="ml-1 text-muted-foreground/40">↕</span>;
    return <span className="ml-1 text-primary">{sortConfig?.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const uniqueYears = useMemo(() => [...new Set(targets?.map(t => t?.year))]?.sort((a, b) => b - a), [targets]);

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">VSR Monthly Targets</span>
          <span className="text-xs text-muted-foreground">({filteredData?.length} records)</span>
        </div>
        <div className="relative" ref={filterPanelRef}>
          <button
            onClick={() => setShowFilterPanel(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-background border border-border rounded hover:bg-accent transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search <span className="text-muted-foreground">(F3)</span>
          </button>
          {showFilterPanel && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-card border border-border rounded-lg shadow-lg z-50 p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Filter Targets</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Executive</label>
                  <select value={filterExec} onChange={e => { setFilterExec(e?.target?.value); setCurrentPage(1); }}
                    className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">All Executives</option>
                    {executives?.map(ex => <option key={ex?.exec_code} value={ex?.exec_code}>{ex?.exec_code} — {ex?.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Year</label>
                  <select value={filterYear} onChange={e => { setFilterYear(e?.target?.value); setCurrentPage(1); }}
                    className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">All Years</option>
                    {uniqueYears?.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Month</label>
                  <select value={filterMonth} onChange={e => { setFilterMonth(e?.target?.value); setCurrentPage(1); }}
                    className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">All Months</option>
                    {MONTHS?.slice(1)?.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Product</label>
                  <select value={filterProduct} onChange={e => { setFilterProduct(e?.target?.value); setCurrentPage(1); }}
                    className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">All Products</option>
                    {products?.map(p => <option key={p?.product_code} value={p?.product_code}>{p?.product_code} — {p?.product_name}</option>)}
                  </select>
                </div>
                <button onClick={() => { setFilterExec(''); setFilterYear(''); setFilterMonth(''); setFilterProduct(''); setCurrentPage(1); }}
                  className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent transition-colors">Clear Filters</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs font-sans border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/60 border-b border-border">
              <th className="w-10 px-2 py-2 text-center border-r border-border text-muted-foreground font-medium">#</th>
              <th className="w-10 px-2 py-2 text-center border-r border-border">
                <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="rounded" />
              </th>
              {COLUMNS?.map(col => (
                <th key={col?.key} onClick={() => handleSort(col?.key)}
                  className={`${col?.width} px-3 py-2 text-left border-r border-border font-semibold text-foreground cursor-pointer hover:bg-muted/80 select-none whitespace-nowrap`}>
                  {col?.label}<SortIcon colKey={col?.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={COLUMNS?.length + 2} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
            ) : paginatedData?.length === 0 ? (
              <tr><td colSpan={COLUMNS?.length + 2} className="text-center py-12 text-muted-foreground">No VSR targets found</td></tr>
            ) : (
              paginatedData?.map((row, idx) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                const isSelected = selectedRows?.includes(row?.id) || selectedRow === row?.id;
                return (
                  <tr key={row?.id}
                    onClick={() => setSelectedRow(row?.id)}
                    className={`border-b border-border cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/10' : idx % 2 === 0 ? 'bg-background hover:bg-accent/40' : 'bg-muted/20 hover:bg-accent/40'
                    }`}>
                    <td className="px-2 py-1.5 text-center border-r border-border text-muted-foreground tabular-nums">{globalIdx}</td>
                    <td className="px-2 py-1.5 text-center border-r border-border">
                      <input type="checkbox" checked={selectedRows?.includes(row?.id)} onChange={() => handleSelectRow(row?.id)} onClick={e => e?.stopPropagation()} className="rounded" />
                    </td>
                    <td className="px-3 py-1.5 border-r border-border font-mono text-xs">{row?.executive_code}</td>
                    <td className="px-3 py-1.5 border-r border-border">{row?.executive_name}</td>
                    <td className="px-3 py-1.5 border-r border-border tabular-nums">{row?.year}</td>
                    <td className="px-3 py-1.5 border-r border-border">{MONTHS?.[row?.month] || row?.month}</td>
                    <td className="px-3 py-1.5 border-r border-border font-mono text-xs">{row?.product_code}</td>
                    <td className="px-3 py-1.5 border-r border-border">{row?.product_name}</td>
                    <td className="px-3 py-1.5 border-r border-border tabular-nums text-right">{fmtInt(row?.target_qty_cases)}</td>
                    <td className="px-3 py-1.5 border-r border-border tabular-nums text-right">{fmtInt(row?.target_qty_bottles)}</td>
                    <td className="px-3 py-1.5 border-r border-border tabular-nums text-right">{fmt(row?.target_value)}</td>
                  </tr>
                );
              })
            )}
            {/* Grand Total Row */}
            {!isLoading && filteredData?.length > 0 && (
              <tr className="bg-primary/5 border-t-2 border-primary/20 font-semibold sticky bottom-0">
                <td className="px-2 py-2 text-center border-r border-border"></td>
                <td className="px-2 py-2 text-center border-r border-border"></td>
                <td colSpan={6} className="px-3 py-2 border-r border-border text-xs font-bold text-foreground">GRAND TOTAL</td>
                <td className="px-3 py-2 border-r border-border tabular-nums text-right text-xs font-bold">{fmtInt(grandTotalCases)}</td>
                <td className="px-3 py-2 border-r border-border tabular-nums text-right text-xs font-bold">{fmtInt(grandTotalBottles)}</td>
                <td className="px-3 py-2 border-r border-border tabular-nums text-right text-xs font-bold text-primary">{fmt(grandTotalValue)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page:</span>
          <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e?.target?.value)); setCurrentPage(1); }}
            className="text-xs border border-border rounded px-1.5 py-1 bg-background">
            {ITEMS_PER_PAGE_OPTIONS?.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">
            {filteredData?.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, filteredData?.length)} of ${filteredData?.length}` : '0 records'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 text-xs border border-border rounded hover:bg-accent disabled:opacity-40">«</button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 text-xs border border-border rounded hover:bg-accent disabled:opacity-40">‹</button>
          <span className="px-3 py-1 text-xs">{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 text-xs border border-border rounded hover:bg-accent disabled:opacity-40">›</button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 text-xs border border-border rounded hover:bg-accent disabled:opacity-40">»</button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-card">
        <button onClick={() => { setEditItem(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New <span className="text-primary-foreground/70">(F2)</span>
        </button>
        <button onClick={handleEdit} disabled={!selectedRow && selectedRows?.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded hover:bg-accent transition-colors disabled:opacity-40">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Edit
        </button>
        <button onClick={handleDelete} disabled={!selectedRow && selectedRows?.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Delete
        </button>
        <div className="flex-1" />
        <button onClick={handleDownloadTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded hover:bg-accent transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download Template
        </button>
        <button onClick={handleExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Excel
        </button>
      </div>

      {showModal && (
        <VSRTargetModal
          key={editItem?.id ?? 'new'}
          editItem={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={() => { setShowModal(false); setEditItem(null); fetchData(); }}
        />
      )}
    </div>
  );
};

export default VSRTargetsSpreadsheet;
