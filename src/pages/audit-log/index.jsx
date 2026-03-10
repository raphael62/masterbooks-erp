import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import AuditFilters from './components/AuditFilters';
import ChangesViewer from './components/ChangesViewer';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const ACTION_BADGE = {
  INSERT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showFilters, setShowFilters] = useState(false);
  const [sortCol, setSortCol] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [jumpPage, setJumpPage] = useState('');
  const filterRef = useRef(null);

  const [filters, setFilters] = useState({
    userEmail: '',
    action: '',
    tableName: '',
    recordId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const activeFilterCount = Object.values(appliedFilters)?.filter(v => v !== '')?.length;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase?.from('audit_logs')?.select('*', { count: 'exact' })?.order(sortCol, { ascending: sortDir === 'asc' })?.range((page - 1) * pageSize, page * pageSize - 1);

      if (appliedFilters?.userEmail) query = query?.ilike('user_email', `%${appliedFilters?.userEmail}%`);
      if (appliedFilters?.action) query = query?.eq('action', appliedFilters?.action);
      if (appliedFilters?.tableName) query = query?.eq('table_name', appliedFilters?.tableName);
      if (appliedFilters?.recordId) query = query?.ilike('record_id', `%${appliedFilters?.recordId}%`);
      if (appliedFilters?.dateFrom) query = query?.gte('created_at', appliedFilters?.dateFrom);
      if (appliedFilters?.dateTo) query = query?.lte('created_at', appliedFilters?.dateTo + 'T23:59:59');

      const { data, count, error } = await query;
      if (error) throw error;
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortCol, sortDir, appliedFilters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Close filter panel on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (filterRef?.current && !filterRef?.current?.contains(e?.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // F3 keyboard shortcut
  useEffect(() => {
    const handleKey = (e) => {
      if (e?.key === 'F3') { e?.preventDefault(); setShowFilters(prev => !prev); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPage(1);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setPage(1);
  };

  const handleClearFilters = () => {
    const empty = { userEmail: '', action: '', tableName: '', recordId: '', dateFrom: '', dateTo: '' };
    setFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    return new Date(ts)?.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const exportToCSV = () => {
    const headers = ['ID', 'User Email', 'Action', 'Table', 'Record ID', 'Timestamp', 'Changed Fields'];
    const rows = logs?.map(log => [
      log?.id,
      log?.user_email || '',
      log?.action,
      log?.table_name,
      log?.record_id || '',
      formatTimestamp(log?.created_at),
      log?.changed_fields ? JSON.stringify(log?.changed_fields) : ''
    ]);
    const csv = [headers, ...rows]?.map(r => r?.map(v => `"${String(v)?.replace(/"/g, '""')}"`)?.join(','))?.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
    a?.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }) => (
    <Icon
      name={sortCol === col ? (sortDir === 'asc' ? 'ChevronUp' : 'ChevronDown') : 'ChevronsUpDown'}
      size={12}
      className={sortCol === col ? 'text-primary' : 'text-muted-foreground'}
    />
  );

  return (
    <AppLayout>
      <div className="p-6">
        <BreadcrumbNavigation />

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Audit Log</h1>
          <p className="text-muted-foreground">View and filter system audit trail and change history</p>
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon name="ClipboardList" size={18} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Audit Log</h2>
                    <p className="text-xs text-muted-foreground">
                      {loading ? 'Loading...' : `${totalCount?.toLocaleString()} records`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Filter Button */}
                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setShowFilters(prev => !prev)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        activeFilterCount > 0
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon name="Search" size={14} />
                      Search (F3)
                      {activeFilterCount > 0 && (
                        <span className="ml-1 w-4 h-4 rounded-full bg-primary-foreground/20 text-xs flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                    {showFilters && (
                      <AuditFilters
                        filters={filters}
                        onChange={setFilters}
                        onApply={handleApplyFilters}
                        onClear={handleClearFilters}
                        onClose={() => setShowFilters(false)}
                      />
                    )}
                  </div>

                  {/* Export */}
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <Icon name="Download" size={14} />
                    Export
                  </button>

                  {/* Refresh */}
                  <button
                    onClick={fetchLogs}
                    className="p-2 border border-border rounded-lg hover:bg-accent transition-colors"
                    title="Refresh"
                  >
                    <Icon name="RefreshCw" size={14} className={loading ? 'animate-spin text-primary' : 'text-muted-foreground'} />
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {activeFilterCount > 0 && (
                <div className="px-5 py-2 border-b border-border bg-muted/30 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Active filters:</span>
                  {appliedFilters?.action && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">Action: {appliedFilters?.action}</span>
                  )}
                  {appliedFilters?.tableName && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">Table: {appliedFilters?.tableName}</span>
                  )}
                  {appliedFilters?.userEmail && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">User: {appliedFilters?.userEmail}</span>
                  )}
                  {appliedFilters?.dateFrom && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">From: {appliedFilters?.dateFrom}</span>
                  )}
                  {appliedFilters?.dateTo && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">To: {appliedFilters?.dateTo}</span>
                  )}
                  <button onClick={handleClearFilters} className="text-xs text-muted-foreground hover:text-foreground ml-auto">
                    Clear all
                  </button>
                </div>
              )}

              {/* Spreadsheet Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-sans">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="w-10 px-3 py-3 text-center text-xs font-semibold text-muted-foreground border-r border-border">#</th>
                      {[
                        { key: 'user_email', label: 'User' },
                        { key: 'action', label: 'Action' },
                        { key: 'table_name', label: 'Table' },
                        { key: 'record_id', label: 'Record ID' },
                        { key: 'created_at', label: 'Timestamp' },
                      ]?.map(col => (
                        <th
                          key={col?.key}
                          onClick={() => handleSort(col?.key)}
                          className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none"
                        >
                          <div className="flex items-center gap-1">
                            {col?.label}
                            <SortIcon col={col?.key} />
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Changes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      Array.from({ length: 10 })?.map((_, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                          {Array.from({ length: 7 })?.map((_, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-3 bg-muted rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : logs?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                              <Icon name="ClipboardList" size={24} className="text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">No audit records found</p>
                            <p className="text-xs text-muted-foreground">Actions on tracked tables will appear here</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      logs?.map((log, idx) => (
                        <tr
                          key={log?.id}
                          className={`hover:bg-accent/30 transition-colors ${
                            idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                          }`}
                        >
                          <td className="w-10 px-3 py-3 text-center text-xs text-muted-foreground tabular-nums border-r border-border">
                            {(page - 1) * pageSize + idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Icon name="User" size={12} className="text-primary" />
                              </div>
                              <span className="text-xs text-foreground truncate max-w-[140px]">
                                {log?.user_email || <span className="text-muted-foreground italic">System</span>}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              ACTION_BADGE?.[log?.action] || 'bg-muted text-muted-foreground'
                            }`}>
                              {log?.action}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-foreground">{log?.table_name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-muted-foreground truncate max-w-[100px] block" title={log?.record_id}>
                              {log?.record_id ? log?.record_id?.substring(0, 8) + '...' : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                              {formatTimestamp(log?.created_at)}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[220px]">
                            <ChangesViewer
                              action={log?.action}
                              changedFields={log?.changed_fields}
                              oldData={log?.old_data}
                              newData={log?.new_data}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalCount > 0 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      Showing {Math.min((page - 1) * pageSize + 1, totalCount)}–{Math.min(page * pageSize, totalCount)} of {totalCount?.toLocaleString()}
                    </span>
                    <select
                      value={pageSize}
                      onChange={e => { setPageSize(Number(e?.target?.value)); setPage(1); }}
                      className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground focus:outline-none"
                    >
                      {PAGE_SIZE_OPTIONS?.map(s => <option key={s} value={s}>{s} / page</option>)}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-40 transition-colors"
                    >
                      <Icon name="ChevronsLeft" size={14} className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-40 transition-colors"
                    >
                      <Icon name="ChevronLeft" size={14} className="text-muted-foreground" />
                    </button>

                    <div className="flex items-center gap-1 mx-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let p;
                        if (totalPages <= 5) p = i + 1;
                        else if (page <= 3) p = i + 1;
                        else if (page >= totalPages - 2) p = totalPages - 4 + i;
                        else p = page - 2 + i;
                        return (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-7 h-7 text-xs rounded border transition-colors ${
                              p === page
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-border hover:bg-accent text-foreground'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-40 transition-colors"
                    >
                      <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-40 transition-colors"
                    >
                      <Icon name="ChevronsRight" size={14} className="text-muted-foreground" />
                    </button>

                    {/* Jump to page */}
                    <div className="flex items-center gap-1 ml-2">
                      <span className="text-xs text-muted-foreground">Go to</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={jumpPage}
                        onChange={e => setJumpPage(e?.target?.value)}
                        onKeyDown={e => {
                          if (e?.key === 'Enter') {
                            let p = Math.max(1, Math.min(totalPages, Number(jumpPage)));
                            setPage(p);
                            setJumpPage('');
                          }
                        }}
                        className="w-12 text-xs border border-border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="#"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AuditLog;
