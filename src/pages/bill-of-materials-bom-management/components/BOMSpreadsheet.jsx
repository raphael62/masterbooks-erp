import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const STATUS_COLORS = {
  Draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
};

const BOMSpreadsheet = ({
  boms, isLoading, onNew, onEdit, onClone, onActivate, onArchive, onDelete, onExport
}) => {
  const [selected, setSelected] = useState([]);
  const [sortCol, setSortCol] = useState('bom_code');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ bomCode: '', product: '', version: '', status: '', dateFrom: '', dateTo: '' });

  const fmt = (n) => Number(n || 0)?.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const filtered = useMemo(() => {
    let data = [...(boms || [])];
    if (filters?.bomCode) data = data?.filter(b => b?.bom_code?.toLowerCase()?.includes(filters?.bomCode?.toLowerCase()));
    if (filters?.product) data = data?.filter(b => b?.product_name?.toLowerCase()?.includes(filters?.product?.toLowerCase()));
    if (filters?.version) data = data?.filter(b => b?.version?.includes(filters?.version));
    if (filters?.status) data = data?.filter(b => b?.status === filters?.status);
    if (filters?.dateFrom) data = data?.filter(b => b?.effective_date >= filters?.dateFrom);
    if (filters?.dateTo) data = data?.filter(b => b?.effective_date <= filters?.dateTo);
    data?.sort((a, b) => {
      let av = a?.[sortCol] ?? '', bv = b?.[sortCol] ?? '';
      if (typeof av === 'string') av = av?.toLowerCase();
      if (typeof bv === 'string') bv = bv?.toLowerCase();
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return data;
  }, [boms, filters, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered?.length / pageSize));
  const paginated = filtered?.slice((page - 1) * pageSize, page * pageSize);

  const totals = useMemo(() => ({
    material: filtered?.reduce((s, b) => s + (parseFloat(b?.total_material_cost) || 0), 0),
    labor: filtered?.reduce((s, b) => s + (parseFloat(b?.labor_cost) || 0), 0),
    overhead: filtered?.reduce((s, b) => s + (parseFloat(b?.overhead_cost) || 0), 0),
    total: filtered?.reduce((s, b) => s + (parseFloat(b?.total_cost) || 0), 0)
  }), [filtered]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const toggleSelect = (id) => setSelected(prev => prev?.includes(id) ? prev?.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected?.length === paginated?.length ? [] : paginated?.map(b => b?.id));

  const SortIcon = ({ col }) => (
    <Icon name={sortCol === col ? (sortDir === 'asc' ? 'ChevronUp' : 'ChevronDown') : 'ChevronsUpDown'}
      size={12} className="ml-1 opacity-60" />
  );

  const cols = [
    { key: 'bom_code', label: 'BOM Code', w: 'w-28' },
    { key: 'product_name', label: 'Product Name', w: 'w-40' },
    { key: 'version', label: 'Version', w: 'w-16' },
    { key: 'effective_date', label: 'Eff. Date', w: 'w-24' },
    { key: 'expiry_date', label: 'Exp. Date', w: 'w-24' },
    { key: 'total_material_cost', label: 'Material Cost', w: 'w-28', numeric: true },
    { key: 'labor_cost', label: 'Labor Cost', w: 'w-24', numeric: true },
    { key: 'overhead_cost', label: 'Overhead Cost', w: 'w-28', numeric: true },
    { key: 'total_cost', label: 'Total Cost', w: 'w-24', numeric: true },
    { key: 'status', label: 'Status', w: 'w-20' }
  ];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Icon name="Table" size={15} className="text-primary" />
            Bill of Materials
            <span className="ml-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-semibold">{filtered?.length}</span>
          </span>
        </div>
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
            <label className="text-xs text-muted-foreground mb-1 block">BOM Code</label>
            <input className="w-full h-7 px-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={filters?.bomCode} onChange={e => { setFilters(f => ({...f, bomCode: e?.target?.value})); setPage(1); }} placeholder="BOM-..." />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Product</label>
            <input className="w-full h-7 px-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={filters?.product} onChange={e => { setFilters(f => ({...f, product: e?.target?.value})); setPage(1); }} placeholder="Product name" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Version</label>
            <input className="w-full h-7 px-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={filters?.version} onChange={e => { setFilters(f => ({...f, version: e?.target?.value})); setPage(1); }} placeholder="1.0" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <select className="w-full h-7 px-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={filters?.status} onChange={e => { setFilters(f => ({...f, status: e?.target?.value})); setPage(1); }}>
              <option value="">All</option>
              <option>Draft</option>
              <option>Active</option>
              <option>Archived</option>
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
                <input type="checkbox" className="w-3.5 h-3.5 rounded" checked={selected?.length === paginated?.length && paginated?.length > 0} onChange={toggleAll} />
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
                  {Array.from({length: 12})?.map((_, j) => (
                    <td key={j} className="px-2 py-2"><div className="h-3 bg-muted rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : paginated?.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-12 text-muted-foreground">
                  <Icon name="FileText" size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No BOMs found</p>
                </td>
              </tr>
            ) : (
              paginated?.map((bom, idx) => (
                <tr key={bom?.id}
                  className={`border-b border-border cursor-pointer transition-colors ${
                    selected?.includes(bom?.id) ? 'bg-primary/5' : idx % 2 === 0 ? 'bg-background hover:bg-muted/30' : 'bg-muted/10 hover:bg-muted/30'
                  }`}
                  onDoubleClick={() => onEdit?.(bom)}
                >
                  <td className="px-2 py-1.5 text-center">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded" checked={selected?.includes(bom?.id)} onChange={() => toggleSelect(bom?.id)} onClick={e => e?.stopPropagation()} />
                  </td>
                  <td className="px-2 py-1.5 text-center text-muted-foreground tabular-nums">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-2 py-1.5 font-mono font-medium text-primary">{bom?.bom_code}</td>
                  <td className="px-2 py-1.5 font-medium text-foreground truncate max-w-[160px]">{bom?.product_name}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums">{bom?.version}</td>
                  <td className="px-2 py-1.5 tabular-nums">{bom?.effective_date || '—'}</td>
                  <td className="px-2 py-1.5 tabular-nums">{bom?.expiry_date || '—'}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmt(bom?.total_material_cost)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmt(bom?.labor_cost)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmt(bom?.overhead_cost)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-semibold">{fmt(bom?.total_cost)}</td>
                  <td className="px-2 py-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS?.[bom?.status] || STATUS_COLORS?.Draft}`}>
                      {bom?.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!isLoading && filtered?.length > 0 && (
            <tfoot>
              <tr className="bg-muted/50 border-t-2 border-border font-semibold">
                <td colSpan={7} className="px-2 py-2 text-xs text-muted-foreground">Grand Total ({filtered?.length} BOMs)</td>
                <td className="px-2 py-2 text-right tabular-nums text-xs">{fmt(totals?.material)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-xs">{fmt(totals?.labor)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-xs">{fmt(totals?.overhead)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-xs text-primary">{fmt(totals?.total)}</td>
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
        <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Icon name="Plus" size={13} />New (F2)
        </button>
        <button onClick={() => selected?.length === 1 && onEdit?.(boms?.find(b => b?.id === selected?.[0]))}
          disabled={selected?.length !== 1}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent disabled:opacity-40 transition-colors">
          <Icon name="Edit2" size={13} />Edit
        </button>
        <button onClick={() => selected?.length === 1 && onClone?.(boms?.find(b => b?.id === selected?.[0]))}
          disabled={selected?.length !== 1}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent disabled:opacity-40 transition-colors">
          <Icon name="Copy" size={13} />Clone
        </button>
        <button onClick={() => selected?.length > 0 && onActivate?.(selected)}
          disabled={selected?.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-green-300 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-40 transition-colors">
          <Icon name="CheckCircle" size={13} />Activate
        </button>
        <button onClick={() => selected?.length > 0 && onArchive?.(selected)}
          disabled={selected?.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent disabled:opacity-40 transition-colors">
          <Icon name="Archive" size={13} />Archive
        </button>
        <button onClick={() => selected?.length > 0 && onDelete?.(selected)}
          disabled={selected?.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors">
          <Icon name="Trash2" size={13} />Delete
        </button>
        <div className="flex-1" />
        <button onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent transition-colors">
          <Icon name="Download" size={13} />Excel
        </button>
      </div>
    </div>
  );
};

export default BOMSpreadsheet;
