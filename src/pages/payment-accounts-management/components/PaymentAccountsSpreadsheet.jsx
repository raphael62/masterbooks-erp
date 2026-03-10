import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import PaymentAccountModal from './PaymentAccountModal';

const COLUMNS = [
  { key: 'account_code', label: 'Account Code', width: 'w-32' },
  { key: 'account_name', label: 'Account Name', width: 'w-48' },
  { key: 'account_type', label: 'Account Type', width: 'w-32' },
  { key: 'bank_name', label: 'Bank Name', width: 'w-36' },
  { key: 'account_number', label: 'Account Number', width: 'w-36' },
  { key: 'branch', label: 'Branch', width: 'w-32' },
  { key: 'currency', label: 'Currency', width: 'w-24' },
  { key: 'opening_balance', label: 'Opening Balance', width: 'w-36' },
  { key: 'current_balance', label: 'Current Balance', width: 'w-36' },
  { key: 'status', label: 'Status', width: 'w-24' },
];

const fmt = (n) => Number(n || 0)?.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PaymentAccountsSpreadsheet = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterPanelRef = useRef(null);
  const [filterCode, setFilterCode] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase?.from('payment_accounts')?.select('*')?.order('account_code');
      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error('Failed to fetch payment accounts:', err);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterPanelRef?.current && !filterPanelRef?.current?.contains(e?.target)) setShowFilterPanel(false);
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
    let data = [...accounts];
    if (filterCode) data = data?.filter(r => r?.account_code?.toLowerCase()?.includes(filterCode?.toLowerCase()));
    if (filterName) data = data?.filter(r => r?.account_name?.toLowerCase()?.includes(filterName?.toLowerCase()));
    if (filterType !== 'all') data = data?.filter(r => r?.account_type === filterType);
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
  }, [accounts, filterCode, filterName, filterType, filterStatus, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredData?.length / itemsPerPage));
  const paginatedData = filteredData?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const grandTotalOpening = filteredData?.reduce((s, r) => s + Number(r?.opening_balance || 0), 0);
  const grandTotalCurrent = filteredData?.reduce((s, r) => s + Number(r?.current_balance || 0), 0);

  const handleSort = (key) => setSortConfig(prev => ({ key, direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc' }));

  const handleSelectAll = () => {
    if (selectAll) { setSelectedRows([]); setSelectAll(false); }
    else { setSelectedRows(paginatedData?.map(r => r?.id)); setSelectAll(true); }
  };

  const handleSelectRow = (id) => setSelectedRows(prev => prev?.includes(id) ? prev?.filter(r => r !== id) : [...prev, id]);

  const handleDelete = async () => {
    const toDelete = selectedRows?.length > 0 ? selectedRows : (selectedRow ? [selectedRow] : []);
    if (!toDelete?.length) return;
    if (!window.confirm(`Delete ${toDelete?.length} record(s)?`)) return;
    try {
      const { error } = await supabase?.from('payment_accounts')?.delete()?.in('id', toDelete);
      if (error) throw error;
      setSelectedRows([]); setSelectedRow(null);
      fetchAccounts();
    } catch (err) { console.error('Delete failed:', err); }
  };

  const handleEdit = () => {
    const id = selectedRows?.[0] || selectedRow;
    if (!id) return;
    const item = accounts?.find(r => r?.id === id);
    if (item) { setEditItem(item); setShowModal(true); }
  };

  const handleExcel = () => {
    const headers = COLUMNS?.map(c => c?.label)?.join(',');
    const rows = filteredData?.map(r => COLUMNS?.map(c => `"${r?.[c?.key] ?? ''}"`)?.join(','))?.join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'payment_accounts.csv'; a?.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ colKey }) => {
    if (sortConfig?.key !== colKey) return <span className="ml-1 text-muted-foreground/40">↕</span>;
    return <span className="ml-1 text-primary">{sortConfig?.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Payment Accounts</span>
          <span className="text-xs text-muted-foreground">({filteredData?.length} records)</span>
        </div>
        <div className="flex items-center gap-2">
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-destructive/30 text-destructive rounded hover:bg-destructive/10 transition-colors disabled:opacity-40">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Delete
          </button>
          <button onClick={handleExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded hover:bg-accent transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Excel
          </button>
          <div className="relative" ref={filterPanelRef}>
            <button onClick={() => setShowFilterPanel(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-background border border-border rounded hover:bg-accent transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Search <span className="text-muted-foreground">(F3)</span>
            </button>
            {showFilterPanel && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-card border border-border rounded-lg shadow-lg z-50 p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Filter Accounts</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Account Code</label>
                    <input type="text" value={filterCode} onChange={e => { setFilterCode(e?.target?.value); setCurrentPage(1); }}
                      placeholder="Filter by code..." className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Account Name</label>
                    <input type="text" value={filterName} onChange={e => { setFilterName(e?.target?.value); setCurrentPage(1); }}
                      placeholder="Filter by name..." className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Account Type</label>
                    <select value={filterType} onChange={e => { setFilterType(e?.target?.value); setCurrentPage(1); }}
                      className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="all">All Types</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Mobile Money">Mobile Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <select value={filterStatus} onChange={e => { setFilterStatus(e?.target?.value); setCurrentPage(1); }}
                      className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <button onClick={() => { setFilterCode(''); setFilterName(''); setFilterType('all'); setFilterStatus('all'); setCurrentPage(1); }}
                    className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent transition-colors">Clear Filters</button>
                </div>
              </div>
            )}
          </div>
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
              <tr><td colSpan={COLUMNS?.length + 2} className="text-center py-12 text-muted-foreground">No payment accounts found</td></tr>
            ) : (
              paginatedData?.map((row, idx) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                const isSelected = selectedRows?.includes(row?.id);
                const isActive = selectedRow === row?.id;
                return (
                  <tr key={row?.id} onClick={() => setSelectedRow(row?.id)}
                    onDoubleClick={() => { setEditItem(row); setShowModal(true); }}
                    className={`border-b border-border cursor-pointer transition-colors ${
                      isActive ? 'bg-primary/10 border-l-2 border-l-primary' : isSelected ? 'bg-primary/5' :
                      idx % 2 === 0 ? 'bg-background hover:bg-muted/40' : 'bg-muted/20 hover:bg-muted/40'
                    }`}>
                    <td className="px-2 py-1.5 text-center border-r border-border text-muted-foreground tabular-nums">{globalIdx}</td>
                    <td className="px-2 py-1.5 text-center border-r border-border">
                      <input type="checkbox" checked={isSelected} onChange={() => handleSelectRow(row?.id)} onClick={e => e?.stopPropagation()} className="rounded" />
                    </td>
                    <td className="px-3 py-1.5 border-r border-border font-mono font-medium text-primary">{row?.account_code}</td>
                    <td className="px-3 py-1.5 border-r border-border font-medium text-foreground">{row?.account_name}</td>
                    <td className="px-3 py-1.5 border-r border-border">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        row?.account_type === 'Cash' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        row?.account_type === 'Bank'? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>{row?.account_type}</span>
                    </td>
                    <td className="px-3 py-1.5 border-r border-border text-muted-foreground">{row?.bank_name || '—'}</td>
                    <td className="px-3 py-1.5 border-r border-border font-mono">{row?.account_number || '—'}</td>
                    <td className="px-3 py-1.5 border-r border-border text-muted-foreground">{row?.branch || '—'}</td>
                    <td className="px-3 py-1.5 border-r border-border text-center font-medium">{row?.currency}</td>
                    <td className="px-3 py-1.5 border-r border-border tabular-nums text-right">{fmt(row?.opening_balance)}</td>
                    <td className="px-3 py-1.5 border-r border-border tabular-nums text-right font-semibold">{fmt(row?.current_balance)}</td>
                    <td className="px-3 py-1.5 border-r border-border">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        row?.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>{row?.status}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {filteredData?.length > 0 && (
            <tfoot className="sticky bottom-0 z-10">
              <tr className="bg-muted/80 border-t-2 border-border font-semibold">
                <td colSpan={8} className="px-3 py-2 text-right text-xs text-foreground border-r border-border">Grand Total</td>
                <td className="px-3 py-2 border-r border-border"></td>
                <td className="px-3 py-2 tabular-nums text-right text-xs text-foreground border-r border-border">{fmt(grandTotalOpening)}</td>
                <td className="px-3 py-2 tabular-nums text-right text-xs text-primary font-bold border-r border-border">{fmt(grandTotalCurrent)}</td>
                <td className="px-3 py-2 border-r border-border"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="px-2 py-1 text-xs border border-border rounded hover:bg-accent disabled:opacity-40">Prev</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs border border-border rounded hover:bg-accent disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {showModal && (
        <PaymentAccountModal key={editItem?.id ?? 'new'} item={editItem} onClose={() => { setShowModal(false); setEditItem(null); }} onSaved={() => { setShowModal(false); setEditItem(null); fetchAccounts(); }} />
      )}
    </div>
  );
};

export default PaymentAccountsSpreadsheet;
