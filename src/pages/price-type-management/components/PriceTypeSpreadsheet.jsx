import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import PriceTypeModal from './PriceTypeModal';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const COLUMNS = [
  { key: 'price_type_code', label: 'Price Type Code', width: 'w-36' },
  { key: 'price_type_name', label: 'Price Type Name', width: 'w-48' },
  { key: 'description', label: 'Description', width: 'w-64' },
  { key: 'discount_percent', label: 'Discount %', width: 'w-28' },
  { key: 'status', label: 'Status', width: 'w-24' },
];

const PriceTypeSpreadsheet = () => {
  const [priceTypes, setPriceTypes] = useState([]);
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
  const [filterCode, setFilterCode] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchPriceTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        ?.from('price_types')
        ?.select('*')
        ?.order('price_type_code');
      if (error) throw error;
      setPriceTypes(data || []);
    } catch (err) {
      console.error('Failed to fetch price types:', err);
      setPriceTypes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPriceTypes(); }, [fetchPriceTypes]);

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
    let data = [...priceTypes];
    if (filterCode) data = data?.filter(r => r?.price_type_code?.toLowerCase()?.includes(filterCode?.toLowerCase()));
    if (filterName) data = data?.filter(r => r?.price_type_name?.toLowerCase()?.includes(filterName?.toLowerCase()));
    if (filterStatus !== 'all') data = data?.filter(r => r?.status?.toLowerCase() === filterStatus?.toLowerCase());
    if (sortConfig?.key) {
      data?.sort((a, b) => {
        const aVal = a?.[sortConfig?.key] ?? '';
        const bVal = b?.[sortConfig?.key] ?? '';
        const cmp = String(aVal)?.localeCompare(String(bVal), undefined, { numeric: true });
        return sortConfig?.direction === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [priceTypes, filterCode, filterName, filterStatus, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredData?.length / itemsPerPage));
  const paginatedData = filteredData?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const activeCount = priceTypes?.filter(r => r?.status?.toLowerCase() === 'active')?.length;

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
      const { error } = await supabase?.from('price_types')?.delete()?.in('id', toDelete);
      if (error) throw error;
      setSelectedRows([]);
      setSelectedRow(null);
      fetchPriceTypes();
    } catch (err) { console.error('Delete failed:', err); }
  };

  const handleEdit = () => {
    const id = selectedRows?.[0] || selectedRow;
    if (!id) return;
    const item = priceTypes?.find(r => r?.id === id);
    if (item) { setEditItem(item); setShowModal(true); }
  };

  const handleExcel = () => {
    const headers = COLUMNS?.map(c => c?.label)?.join(',');
    const rows = filteredData?.map(r =>
      COLUMNS?.map(c => `"${r?.[c?.key] ?? ''}"`)?.join(',')
    )?.join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'price_types.csv'; a?.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ colKey }) => {
    if (sortConfig?.key !== colKey) return <span className="ml-1 text-muted-foreground/40">↕</span>;
    return <span className="ml-1 text-primary">{sortConfig?.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Price Types</span>
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
              <h4 className="text-sm font-semibold text-foreground mb-3">Filter Price Types</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Price Type Code</label>
                  <input
                    type="text" value={filterCode} onChange={e => { setFilterCode(e?.target?.value); setCurrentPage(1); }}
                    placeholder="Filter by code..."
                    className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Name</label>
                  <input
                    type="text" value={filterName} onChange={e => { setFilterName(e?.target?.value); setCurrentPage(1); }}
                    placeholder="Filter by name..."
                    className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    value={filterStatus} onChange={e => { setFilterStatus(e?.target?.value); setCurrentPage(1); }}
                    className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <button
                  onClick={() => { setFilterCode(''); setFilterName(''); setFilterStatus('all'); setCurrentPage(1); }}
                  className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent transition-colors"
                >Clear Filters</button>
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
                <th
                  key={col?.key}
                  onClick={() => handleSort(col?.key)}
                  className={`${col?.width} px-3 py-2 text-left border-r border-border font-semibold text-foreground cursor-pointer hover:bg-muted/80 select-none whitespace-nowrap`}
                >
                  {col?.label}<SortIcon colKey={col?.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={COLUMNS?.length + 2} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
            ) : paginatedData?.length === 0 ? (
              <tr><td colSpan={COLUMNS?.length + 2} className="text-center py-12 text-muted-foreground">No price types found</td></tr>
            ) : (
              paginatedData?.map((row, idx) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                const isSelected = selectedRows?.includes(row?.id);
                const isActive = selectedRow === row?.id;
                return (
                  <tr
                    key={row?.id}
                    onClick={() => setSelectedRow(row?.id)}
                    onDoubleClick={() => { setEditItem(row); setShowModal(true); }}
                    className={`border-b border-border cursor-pointer transition-colors ${
                      isActive ? 'bg-primary/10 border-l-2 border-l-primary' : isSelected ?'bg-primary/5' :
                      idx % 2 === 0 ? 'bg-background hover:bg-muted/40' : 'bg-muted/20 hover:bg-muted/40'
                    }`}
                  >
                    <td className="px-2 py-1.5 text-center border-r border-border text-muted-foreground tabular-nums">{globalIdx}</td>
                    <td className="px-2 py-1.5 text-center border-r border-border">
                      <input type="checkbox" checked={isSelected} onChange={() => handleSelectRow(row?.id)} onClick={e => e?.stopPropagation()} className="rounded" />
                    </td>
                    <td className="px-3 py-1.5 border-r border-border font-mono font-medium text-primary tabular-nums">{row?.price_type_code}</td>
                    <td className="px-3 py-1.5 border-r border-border font-medium text-foreground">{row?.price_type_name}</td>
                    <td className="px-3 py-1.5 border-r border-border text-muted-foreground truncate max-w-xs">{row?.description || '—'}</td>
                    <td className="px-3 py-1.5 border-r border-border tabular-nums text-right">{row?.discount_percent != null ? `${Number(row?.discount_percent)?.toFixed(2)}%` : '0.00%'}</td>
                    <td className="px-3 py-1.5 border-r border-border">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        row?.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>{row?.status}</span>
                    </td>
                  </tr>
                );
              })
            )}
            {/* Grand Total Row */}
            {!isLoading && filteredData?.length > 0 && (
              <tr className="bg-muted/50 border-t-2 border-border font-semibold">
                <td className="px-2 py-2 text-center border-r border-border text-muted-foreground" colSpan={2}></td>
                <td className="px-3 py-2 border-r border-border text-foreground" colSpan={3}>Grand Total: {filteredData?.length} price types ({activeCount} active)</td>
                <td className="px-3 py-2 border-r border-border tabular-nums text-right text-foreground"></td>
                <td className="px-3 py-2 border-r border-border"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page:</span>
          <select
            value={itemsPerPage}
            onChange={e => { setItemsPerPage(Number(e?.target?.value)); setCurrentPage(1); }}
            className="text-xs border border-border rounded px-1 py-0.5 bg-background"
          >
            {ITEMS_PER_PAGE_OPTIONS?.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 text-xs border border-border rounded disabled:opacity-40 hover:bg-accent">«</button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 text-xs border border-border rounded disabled:opacity-40 hover:bg-accent">‹</button>
          <span className="px-3 py-1 text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 text-xs border border-border rounded disabled:opacity-40 hover:bg-accent">›</button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 text-xs border border-border rounded disabled:opacity-40 hover:bg-accent">»</button>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Go to:</span>
          <input
            type="number" min={1} max={totalPages}
            onKeyDown={e => { if (e?.key === 'Enter') { const v = parseInt(e?.target?.value); if (v >= 1 && v <= totalPages) setCurrentPage(v); }}}
            className="w-14 text-xs border border-border rounded px-1 py-0.5 bg-background"
          />
        </div>
      </div>
      {/* Action Bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-muted/30">
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New <span className="opacity-70">(F2)</span>
        </button>
        <button
          onClick={handleEdit}
          disabled={!selectedRow && selectedRows?.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-background border border-border rounded hover:bg-accent disabled:opacity-40 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={!selectedRow && selectedRows?.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-background border border-border rounded hover:bg-destructive/10 hover:text-destructive hover:border-destructive disabled:opacity-40 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Delete
        </button>
        <div className="flex-1" />
        <button
          onClick={handleExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Excel
        </button>
      </div>
      {showModal && (
        <PriceTypeModal
          key={editItem?.id ?? 'new'}
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={() => { setShowModal(false); setEditItem(null); fetchPriceTypes(); }}
        />
      )}
    </div>
  );
};

export default PriceTypeSpreadsheet;
