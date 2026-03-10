import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const STATUS_COLORS = {
  Draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
};

const IssueMaterialsSpreadsheet = ({
  issues, isLoading, onNew, onEdit, onConfirm, onCancel, onDelete, onExport
}) => {
  const [selected, setSelected] = useState([]);
  const [sortCol, setSortCol] = useState('issue_date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    issueNo: '', productionOrder: '', location: '', status: '', dateFrom: '', dateTo: ''
  });

  const fmt = (n) => Number(n || 0)?.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const filtered = useMemo(() => {
    let data = [...(issues || [])];
    if (filters?.issueNo) data = data?.filter(r => r?.issue_no?.toLowerCase()?.includes(filters?.issueNo?.toLowerCase()));
    if (filters?.productionOrder) data = data?.filter(r => r?.production_order_no?.toLowerCase()?.includes(filters?.productionOrder?.toLowerCase()));
    if (filters?.location) data = data?.filter(r => r?.from_location_name?.toLowerCase()?.includes(filters?.location?.toLowerCase()));
    if (filters?.status) data = data?.filter(r => r?.status === filters?.status);
    if (filters?.dateFrom) data = data?.filter(r => r?.issue_date >= filters?.dateFrom);
    if (filters?.dateTo) data = data?.filter(r => r?.issue_date <= filters?.dateTo);
    data?.sort((a, b) => {
      let av = a?.[sortCol] ?? '', bv = b?.[sortCol] ?? '';
      if (typeof av === 'string') av = av?.toLowerCase();
      if (typeof bv === 'string') bv = bv?.toLowerCase();
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return data;
  }, [issues, filters, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered?.length / pageSize));
  const paginated = filtered?.slice((page - 1) * pageSize, page * pageSize);

  const grandTotalCost = useMemo(() => filtered?.reduce((s, r) => s + (parseFloat(r?.total_cost) || 0), 0), [filtered]);
  const grandTotalItems = useMemo(() => filtered?.reduce((s, r) => s + (parseInt(r?.total_items_issued) || 0), 0), [filtered]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const toggleSelect = (id) => setSelected(prev => prev?.includes(id) ? prev?.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected?.length === paginated?.length ? [] : paginated?.map(r => r?.id));

  const SortIcon = ({ col }) => (
    <Icon name={sortCol === col ? (sortDir === 'asc' ? 'ChevronUp' : 'ChevronDown') : 'ChevronsUpDown'}
      size={12} className="ml-1 opacity-60" />
  );

  const cols = [
    { key: 'issue_no', label: 'Issue No', w: 'w-36' },
    { key: 'production_order_no', label: 'Production Order No', w: 'w-36' },
    { key: 'product_being_produced', label: 'Product Being Produced', w: 'w-44' },
    { key: 'issue_date', label: 'Issue Date', w: 'w-24' },
    { key: 'from_location_name', label: 'Location', w: 'w-28' },
    { key: 'issued_by', label: 'Issued By', w: 'w-28' },
    { key: 'total_items_issued', label: 'Total Items', w: 'w-20', numeric: true },
    { key: 'total_cost', label: 'Total Cost', w: 'w-28', numeric: true },
    { key: 'status', label: 'Status', w: 'w-24' }
  ];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
        <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Icon name="Table" size={15} className="text-primary" />
          Material Issues
          <span className="ml-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-semibold">{filtered?.length}</span>
        </span>
        <button
          onClick={() => setShowFilter(f => !f)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
            showFilter ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'
          }`}
        >
          <Icon name="Search" size={13} />
          Search (F3)
        </button>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="px-4 py-3 border-b border-border bg-muted/20 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Issue No</label>
            <input className="w-full h-7 px-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={filters?.issueNo} onChange={e => { setFilters(f => ({...f, issueNo: e?.target?.value})); setPage(1); }} placeholder="ISS-..." />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Production Order</label>
            <input className="w-full h-7 px-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={filters?.productionOrder} onChange={e => { setFilters(f => ({...f, productionOrder: e?.target?.value})); setPage(1); }} placeholder="PO-..." />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Location</label>
            <input className="w-full h-7 px-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={filters?.location} onChange={e => { setFilters(f => ({...f, location: e?.target?.value})); setPage(1); }} placeholder="Location..." />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <select className="w-full h-7 px-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={filters?.status} onChange={e => { setFilters(f => ({...f, status: e?.target?.value})); setPage(1); }}>
              <option value="">All</option>
              <option>Draft</option>
              <option>Confirmed</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date From</label>
            <input type="date" className="w-full h-7 px-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={filters?.dateFrom} onChange={e => { setFilters(f => ({...f, dateFrom: e?.target?.value})); setPage(1); }} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date To</label>
            <input type="date" className="w-full h-7 px-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={filters?.dateTo} onChange={e => { setFilters(f => ({...f, dateTo: e?.target?.value})); setPage(1); }} />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-sans">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="w-8 px-2 py-2 text-center">
                <input type="checkbox" className="w-3.5 h-3.5 rounded"
                  checked={selected?.length === paginated?.length && paginated?.length > 0}
                  onChange={toggleAll} />
              </th>
              <th className="w-8 px-2 py-2 text-center text-muted-foreground">#</th>
              {cols?.map(c => (
                <th key={c?.key} className={`${c?.w} px-2 py-2 text-left font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap`}
                  onClick={() => handleSort(c?.key)}>
                  <span className="flex items-center">{c?.label}<SortIcon col={c?.key} /></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({length: 5})?.map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({length: 11})?.map((_, j) => (
                    <td key={j} className="px-2 py-2"><div className="h-3 bg-muted rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : paginated?.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-muted-foreground">
                  <Icon name="ClipboardList" size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No material issues found</p>
                  <p className="text-xs mt-1">Click New (F2) to create the first issue</p>
                </td>
              </tr>
            ) : (
              paginated?.map((issue, idx) => (
                <tr key={issue?.id}
                  className={`border-b border-border cursor-pointer transition-colors ${
                    selected?.includes(issue?.id) ? 'bg-primary/5' : idx % 2 === 0 ? 'bg-background hover:bg-muted/30' : 'bg-muted/10 hover:bg-muted/30'
                  }`}
                  onDoubleClick={() => onEdit?.(issue)}
                >
                  <td className="px-2 py-1.5 text-center">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded"
                      checked={selected?.includes(issue?.id)}
                      onChange={() => toggleSelect(issue?.id)}
                      onClick={e => e?.stopPropagation()} />
                  </td>
                  <td className="px-2 py-1.5 text-center text-muted-foreground tabular-nums">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-2 py-1.5 font-mono font-medium text-primary whitespace-nowrap">{issue?.issue_no}</td>
                  <td className="px-2 py-1.5 font-medium whitespace-nowrap">{issue?.production_order_no || '—'}</td>
                  <td className="px-2 py-1.5 truncate max-w-[176px]">{issue?.product_being_produced || '—'}</td>
                  <td className="px-2 py-1.5 tabular-nums whitespace-nowrap">{issue?.issue_date || '—'}</td>
                  <td className="px-2 py-1.5 truncate max-w-[112px]">{issue?.from_location_name || '—'}</td>
                  <td className="px-2 py-1.5 truncate max-w-[112px]">{issue?.issued_by || '—'}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{issue?.total_items_issued ?? 0}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-medium">{fmt(issue?.total_cost)}</td>
                  <td className="px-2 py-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS?.[issue?.status] || STATUS_COLORS?.Draft}`}>
                      {issue?.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!isLoading && filtered?.length > 0 && (
            <tfoot>
              <tr className="bg-muted/50 border-t-2 border-border font-semibold">
                <td colSpan={8} className="px-2 py-2 text-xs text-muted-foreground">Grand Total ({filtered?.length} issues)</td>
                <td className="px-2 py-2 text-right tabular-nums text-xs">{grandTotalItems}</td>
                <td className="px-2 py-2 text-right tabular-nums text-xs text-primary">{fmt(grandTotalCost)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border">
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages} ({filtered?.length} records)</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="p-1 rounded hover:bg-accent disabled:opacity-40"><Icon name="ChevronsLeft" size={14} /></button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-accent disabled:opacity-40"><Icon name="ChevronLeft" size={14} /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded hover:bg-accent disabled:opacity-40"><Icon name="ChevronRight" size={14} /></button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1 rounded hover:bg-accent disabled:opacity-40"><Icon name="ChevronsRight" size={14} /></button>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border bg-muted/20 flex-wrap">
        <button onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Icon name="Plus" size={13} />New (F2)
        </button>
        <button
          onClick={() => selected?.length === 1 && onEdit?.(issues?.find(r => r?.id === selected?.[0]))}
          disabled={selected?.length !== 1}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent disabled:opacity-40 transition-colors">
          <Icon name="Edit2" size={13} />Edit
        </button>
        <button
          onClick={() => {
            const issue = issues?.find(r => r?.id === selected?.[0]);
            if (selected?.length === 1 && issue?.status === 'Draft') onConfirm?.(issue);
          }}
          disabled={selected?.length !== 1 || issues?.find(r => r?.id === selected?.[0])?.status !== 'Draft'}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-green-300 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-40 transition-colors">
          <Icon name="CheckCircle" size={13} />Confirm
        </button>
        <button
          onClick={() => {
            const issue = issues?.find(r => r?.id === selected?.[0]);
            if (selected?.length === 1 && issue?.status === 'Draft') onCancel?.(issue);
          }}
          disabled={selected?.length !== 1 || issues?.find(r => r?.id === selected?.[0])?.status !== 'Draft'}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 disabled:opacity-40 transition-colors">
          <Icon name="XCircle" size={13} />Cancel
        </button>
        <button
          onClick={() => selected?.length > 0 && onDelete?.(selected)}
          disabled={selected?.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors">
          <Icon name="Trash2" size={13} />Delete
        </button>
        <div className="ml-auto">
          <button onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent transition-colors">
            <Icon name="Download" size={13} />Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueMaterialsSpreadsheet;
