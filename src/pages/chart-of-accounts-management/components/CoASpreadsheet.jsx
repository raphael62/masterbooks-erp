import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';

const ACCOUNT_TYPES = ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Cost of Goods Sold', 'Expenses'];

const TYPE_COLORS = {
  'Assets': 'bg-blue-50 dark:bg-blue-950/30',
  'Liabilities': 'bg-red-50 dark:bg-red-950/30',
  'Equity': 'bg-purple-50 dark:bg-purple-950/30',
  'Revenue': 'bg-green-50 dark:bg-green-950/30',
  'Cost of Goods Sold': 'bg-orange-50 dark:bg-orange-950/30',
  'Expenses': 'bg-yellow-50 dark:bg-yellow-950/30',
};

const TYPE_BADGE_COLORS = {
  'Assets': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'Liabilities': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  'Equity': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'Revenue': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'Cost of Goods Sold': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'Expenses': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
};

const fmt = (n) => Number(n || 0)?.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CoASpreadsheet = ({ onNew, onEdit, refreshKey }) => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'account_code', direction: 'asc' });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [collapsedTypes, setCollapsedTypes] = useState({});
  const filterPanelRef = useRef(null);

  const [filterCode, setFilterCode] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSubType, setFilterSubType] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase?.from('chart_of_accounts')?.select('*')?.order('account_code', { ascending: true });
      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error('Failed to fetch chart of accounts:', err);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts, refreshKey]);

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
      if (e?.key === 'F2') { e?.preventDefault(); onNew?.(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNew]);

  const subTypes = useMemo(() => {
    const types = new Set(accounts?.map(a => a?.sub_type).filter(Boolean));
    return Array.from(types)?.sort();
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    let data = [...accounts];
    if (filterCode) data = data?.filter(r => r?.account_code?.toLowerCase()?.includes(filterCode?.toLowerCase()));
    if (filterName) data = data?.filter(r => r?.account_name?.toLowerCase()?.includes(filterName?.toLowerCase()));
    if (filterType !== 'all') data = data?.filter(r => r?.account_type === filterType);
    if (filterSubType !== 'all') data = data?.filter(r => r?.sub_type === filterSubType);
    if (filterActive !== 'all') data = data?.filter(r => String(r?.is_active) === filterActive);
    if (sortConfig?.key) {
      data?.sort((a, b) => {
        const aVal = a?.[sortConfig?.key] ?? '';
        const bVal = b?.[sortConfig?.key] ?? '';
        const cmp = String(aVal)?.localeCompare(String(bVal), undefined, { numeric: true });
        return sortConfig?.direction === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [accounts, filterCode, filterName, filterType, filterSubType, filterActive, sortConfig]);

  const groupedByType = useMemo(() => {
    const groups = {};
    ACCOUNT_TYPES?.forEach(type => {
      groups[type] = filteredAccounts?.filter(a => a?.account_type === type);
    });
    return groups;
  }, [filteredAccounts]);

  const grandTotals = useMemo(() => {
    const totals = {};
    ACCOUNT_TYPES?.forEach(type => {
      const rows = groupedByType?.[type] || [];
      totals[type] = {
        opening: rows?.reduce((s, r) => s + Number(r?.opening_balance || 0), 0),
        current: rows?.reduce((s, r) => s + Number(r?.current_balance || 0), 0),
        count: rows?.length,
      };
    });
    return totals;
  }, [groupedByType]);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const toggleCollapse = (type) => {
    setCollapsedTypes(prev => ({ ...prev, [type]: !prev?.[type] }));
  };

  const handleSelectAll = () => {
    if (selectAll) { setSelectedRows([]); setSelectAll(false); }
    else { setSelectedRows(filteredAccounts?.map(r => r?.id)); setSelectAll(true); }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => prev?.includes(id) ? prev?.filter(r => r !== id) : [...prev, id]);
  };

  const handleDelete = async () => {
    const toDelete = selectedRows?.length > 0 ? selectedRows : (selectedRow ? [selectedRow] : []);
    if (!toDelete?.length) return;
    if (!window.confirm(`Delete ${toDelete?.length} account(s)?`)) return;
    try {
      const { error } = await supabase?.from('chart_of_accounts')?.delete()?.in('id', toDelete);
      if (error) throw error;
      setSelectedRows([]); setSelectedRow(null);
      fetchAccounts();
    } catch (err) { console.error('Delete failed:', err); }
  };

  const handleEdit = () => {
    const id = selectedRows?.[0] || selectedRow;
    if (!id) return;
    const item = accounts?.find(r => r?.id === id);
    if (item) onEdit?.(item);
  };

  const handleToggleActive = async (account, e) => {
    e?.stopPropagation();
    try {
      const { error } = await supabase?.from('chart_of_accounts')?.update({ is_active: !account?.is_active })?.eq('id', account?.id);
      if (error) throw error;
      fetchAccounts();
    } catch (err) { console.error('Toggle active failed:', err); }
  };

  const handleExcel = () => {
    const headers = ['Account Code', 'Account Name', 'Type', 'Sub Type', 'Is Header', 'Currency', 'Opening Balance GHS', 'Current Balance GHS', 'Active', 'Description'];
    const rows = filteredAccounts?.map(r => [
      r?.account_code, r?.account_name, r?.account_type, r?.sub_type || '',
      r?.is_header ? 'Yes' : 'No', r?.currency, r?.opening_balance, r?.current_balance,
      r?.is_active ? 'Active' : 'Inactive', r?.description || ''
    ]?.map(v => `"${v ?? ''}"`)?.join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'chart_of_accounts.csv'; a?.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt?.target?.result;
      const lines = text?.split('\n')?.filter(Boolean);
      const headers = lines?.[0]?.split(',')?.map(h => h?.replace(/"/g, '')?.trim()?.toLowerCase()?.replace(/ /g, '_'));
      const records = lines?.slice(1)?.map(line => {
        const vals = line?.split(',')?.map(v => v?.replace(/"/g, '')?.trim());
        const obj = {};
        headers?.forEach((h, i) => { obj[h] = vals?.[i] || ''; });
        return obj;
      })?.filter(r => r?.account_code);
      if (!records?.length) return;
      try {
        const inserts = records?.map(r => ({
          account_code: r?.account_code,
          account_name: r?.account_name || '',
          account_type: r?.account_type || 'Expenses',
          sub_type: r?.sub_type || null,
          is_header: r?.is_header === 'Yes' || r?.is_header === 'true',
          currency: r?.currency || 'GHS',
          opening_balance: parseFloat(r?.opening_balance_ghs || r?.opening_balance || 0),
          current_balance: parseFloat(r?.current_balance_ghs || r?.current_balance || 0),
          is_active: r?.active !== 'Inactive' && r?.active !== 'false',
          description: r?.description || null,
        }));
        const { error } = await supabase?.from('chart_of_accounts')?.upsert(inserts, { onConflict: 'account_code' });
        if (error) throw error;
        fetchAccounts();
        alert(`Imported ${inserts?.length} accounts successfully.`);
      } catch (err) {
        console.error('Import failed:', err);
        alert('Import failed: ' + err?.message);
      }
    };
    reader?.readAsText(file);
    e.target.value = '';
  };

  const SortIcon = ({ colKey }) => {
    if (sortConfig?.key !== colKey) return <span className="ml-1 text-muted-foreground/40">↕</span>;
    return <span className="ml-1 text-primary">{sortConfig?.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const clearFilters = () => {
    setFilterCode(''); setFilterName(''); setFilterType('all');
    setFilterSubType('all'); setFilterActive('all');
  };

  let rowCounter = 0;

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Chart of Accounts</span>
          <span className="text-xs text-muted-foreground">({filteredAccounts?.length} accounts)</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={onNew}
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
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded hover:bg-accent transition-colors cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>
          <button onClick={handleExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded hover:bg-accent transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Excel
          </button>
          <div className="relative" ref={filterPanelRef}>
            <button onClick={() => setShowFilterPanel(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded transition-colors ${
                filterCode || filterName || filterType !== 'all' || filterSubType !== 'all' || filterActive !== 'all' ?'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:bg-accent'
              }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Search <span className="text-muted-foreground">(F3)</span>
            </button>
            {showFilterPanel && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-card border border-border rounded-lg shadow-lg z-50 p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Filter Accounts</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Account Code</label>
                    <input type="text" value={filterCode} onChange={e => setFilterCode(e?.target?.value)}
                      placeholder="Filter by code..." className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Account Name</label>
                    <input type="text" value={filterName} onChange={e => setFilterName(e?.target?.value)}
                      placeholder="Filter by name..." className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Account Type</label>
                    <select value={filterType} onChange={e => setFilterType(e?.target?.value)}
                      className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="all">All Types</option>
                      {ACCOUNT_TYPES?.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Sub Type</label>
                    <select value={filterSubType} onChange={e => setFilterSubType(e?.target?.value)}
                      className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="all">All Sub Types</option>
                      {subTypes?.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Active Status</label>
                    <select value={filterActive} onChange={e => setFilterActive(e?.target?.value)}
                      className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="all">All</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <button onClick={clearFilters}
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
              <th onClick={() => handleSort('account_code')} className="w-28 px-3 py-2 text-left border-r border-border font-semibold text-foreground cursor-pointer hover:bg-muted/80 select-none whitespace-nowrap">
                Account Code<SortIcon colKey="account_code" />
              </th>
              <th onClick={() => handleSort('account_name')} className="min-w-48 px-3 py-2 text-left border-r border-border font-semibold text-foreground cursor-pointer hover:bg-muted/80 select-none whitespace-nowrap">
                Account Name<SortIcon colKey="account_name" />
              </th>
              <th onClick={() => handleSort('account_type')} className="w-36 px-3 py-2 text-left border-r border-border font-semibold text-foreground cursor-pointer hover:bg-muted/80 select-none whitespace-nowrap">
                Type<SortIcon colKey="account_type" />
              </th>
              <th onClick={() => handleSort('sub_type')} className="w-36 px-3 py-2 text-left border-r border-border font-semibold text-foreground cursor-pointer hover:bg-muted/80 select-none whitespace-nowrap">
                Sub Type<SortIcon colKey="sub_type" />
              </th>
              <th onClick={() => handleSort('opening_balance')} className="w-36 px-3 py-2 text-right border-r border-border font-semibold text-foreground cursor-pointer hover:bg-muted/80 select-none whitespace-nowrap">
                Opening Bal GHS<SortIcon colKey="opening_balance" />
              </th>
              <th onClick={() => handleSort('current_balance')} className="w-36 px-3 py-2 text-right border-r border-border font-semibold text-foreground cursor-pointer hover:bg-muted/80 select-none whitespace-nowrap">
                Current Bal GHS<SortIcon colKey="current_balance" />
              </th>
              <th className="w-20 px-3 py-2 text-center border-r border-border font-semibold text-foreground whitespace-nowrap">Active</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">Loading accounts...</td></tr>
            ) : (
              ACCOUNT_TYPES?.map(type => {
                const typeRows = groupedByType?.[type] || [];
                const isCollapsed = collapsedTypes?.[type];
                const totals = grandTotals?.[type];
                if (typeRows?.length === 0 && filterType !== 'all' && filterType !== type) return null;
                return (
                  <React.Fragment key={type}>
                    {/* Type Group Header */}
                    <tr
                      className={`border-b-2 border-border cursor-pointer select-none ${TYPE_COLORS?.[type]}`}
                      onClick={() => toggleCollapse(type)}
                    >
                      <td colSpan={2} className="px-2 py-2 text-center border-r border-border">
                        <span className="text-muted-foreground">{isCollapsed ? '▶' : '▼'}</span>
                      </td>
                      <td colSpan={4} className="px-3 py-2 border-r border-border">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <span className="font-bold text-foreground text-sm">{type}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${TYPE_BADGE_COLORS?.[type]}`}>{typeRows?.length} accounts</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right border-r border-border font-bold text-foreground tabular-nums">{fmt(totals?.opening)}</td>
                      <td className="px-3 py-2 text-right border-r border-border font-bold text-foreground tabular-nums">{fmt(totals?.current)}</td>
                      <td className="px-3 py-2 text-center border-r border-border"></td>
                    </tr>
                    {/* Account Rows */}
                    {!isCollapsed && typeRows?.map((row, idx) => {
                      rowCounter++;
                      const globalIdx = rowCounter;
                      const isSelected = selectedRows?.includes(row?.id);
                      const isActive = selectedRow === row?.id;
                      const isHeader = row?.is_header;
                      return (
                        <tr key={row?.id}
                          onClick={() => setSelectedRow(row?.id)}
                          onDoubleClick={() => onEdit?.(row)}
                          className={`border-b border-border cursor-pointer transition-colors ${
                            isActive ? 'bg-primary/10 border-l-2 border-l-primary' : isSelected ?'bg-primary/5' :
                            idx % 2 === 0 ? 'bg-background hover:bg-muted/40' : 'bg-muted/20 hover:bg-muted/40'
                          }`}
                        >
                          <td className="px-2 py-1.5 text-center border-r border-border text-muted-foreground tabular-nums">{globalIdx}</td>
                          <td className="px-2 py-1.5 text-center border-r border-border">
                            <input type="checkbox" checked={isSelected} onChange={() => handleSelectRow(row?.id)} onClick={e => e?.stopPropagation()} className="rounded" />
                          </td>
                          <td className="px-3 py-1.5 border-r border-border tabular-nums">
                            <span className={`font-mono ${isHeader ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>{row?.account_code}</span>
                          </td>
                          <td className="px-3 py-1.5 border-r border-border">
                            <div className="flex items-center gap-1.5">
                              {isHeader && (
                                <svg className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                              )}
                              {!isHeader && <span className="w-3.5 flex-shrink-0" />}
                              <span className={`${isHeader ? 'font-bold text-foreground' : 'text-foreground'} truncate max-w-xs`}>{row?.account_name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-1.5 border-r border-border">
                            <span className={`px-1.5 py-0.5 text-xs rounded ${TYPE_BADGE_COLORS?.[row?.account_type]}`}>{row?.account_type}</span>
                          </td>
                          <td className="px-3 py-1.5 border-r border-border text-muted-foreground">{row?.sub_type || '—'}</td>
                          <td className="px-3 py-1.5 border-r border-border text-right tabular-nums text-foreground">{fmt(row?.opening_balance)}</td>
                          <td className="px-3 py-1.5 border-r border-border text-right tabular-nums font-medium text-foreground">{fmt(row?.current_balance)}</td>
                          <td className="px-3 py-1.5 border-r border-border text-center">
                            <button
                              onClick={(e) => handleToggleActive(row, e)}
                              className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${
                                row?.is_active ? 'bg-green-500' : 'bg-muted'
                              }`}
                            >
                              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                row?.is_active ? 'translate-x-4' : 'translate-x-0.5'
                              }`} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
          {/* Grand Total Footer */}
          {!isLoading && filteredAccounts?.length > 0 && (
            <tfoot className="sticky bottom-0 z-10">
              <tr className="bg-muted border-t-2 border-border">
                <td colSpan={6} className="px-3 py-2 border-r border-border font-bold text-foreground text-sm">GRAND TOTAL ({filteredAccounts?.length} accounts)</td>
                <td className="px-3 py-2 text-right border-r border-border font-bold text-foreground tabular-nums">
                  GHS {fmt(filteredAccounts?.reduce((s, r) => s + Number(r?.opening_balance || 0), 0))}
                </td>
                <td className="px-3 py-2 text-right border-r border-border font-bold text-foreground tabular-nums">
                  GHS {fmt(filteredAccounts?.reduce((s, r) => s + Number(r?.current_balance || 0), 0))}
                </td>
                <td className="px-3 py-2 border-r border-border"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default CoASpreadsheet;
