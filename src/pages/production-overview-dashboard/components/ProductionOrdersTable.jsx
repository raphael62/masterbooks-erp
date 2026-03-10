import React, { useState, useCallback } from 'react';
import Icon from '../../../components/AppIcon';

const STATUS_COLORS = {
  'Planned': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'On Hold': 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const COLUMNS = [
  { key: 'order_no', label: 'Order No', sortable: true, width: 'w-28' },
  { key: 'product_name', label: 'Product Name', sortable: true, width: 'w-40' },
  { key: 'planned_qty', label: 'Planned Qty', sortable: true, width: 'w-24', align: 'right' },
  { key: 'actual_qty', label: 'Actual Qty', sortable: true, width: 'w-24', align: 'right' },
  { key: 'uom', label: 'UOM', sortable: false, width: 'w-16' },
  { key: 'start_date', label: 'Start Date', sortable: true, width: 'w-24' },
  { key: 'end_date', label: 'End Date', sortable: true, width: 'w-24' },
  { key: 'status', label: 'Status', sortable: true, width: 'w-28' },
  { key: 'location_name', label: 'Location', sortable: true, width: 'w-28' },
  { key: 'assigned_to', label: 'Assigned To', sortable: true, width: 'w-32' },
  { key: 'variance', label: 'Variance', sortable: true, width: 'w-20', align: 'right' },
  { key: 'total_cost', label: 'Total Cost', sortable: true, width: 'w-28', align: 'right' },
];

const PAGE_SIZE = 15;

const ProductionOrdersTable = ({ orders, isLoading, onNew, onEdit, onDelete, onExport }) => {
  const [selected, setSelected] = useState([]);
  const [sortKey, setSortKey] = useState('order_no');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ order_no: '', product: '', status: '', location: '', date_from: '', date_to: '' });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const applyFilters = useCallback((data) => {
    return data?.filter(o => {
      if (filters?.order_no && !o?.order_no?.toLowerCase()?.includes(filters?.order_no?.toLowerCase())) return false;
      if (filters?.product && !o?.product_name?.toLowerCase()?.includes(filters?.product?.toLowerCase())) return false;
      if (filters?.status && o?.status !== filters?.status) return false;
      if (filters?.location && !o?.location_name?.toLowerCase()?.includes(filters?.location?.toLowerCase())) return false;
      if (filters?.date_from && o?.start_date < filters?.date_from) return false;
      if (filters?.date_to && o?.start_date > filters?.date_to) return false;
      return true;
    });
  }, [filters]);

  const sorted = [...(applyFilters(orders) || [])]?.sort((a, b) => {
    const av = a?.[sortKey] ?? '';
    const bv = b?.[sortKey] ?? '';
    const cmp = typeof av === 'number' ? av - bv : String(av)?.localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted?.length / PAGE_SIZE));
  const paged = sorted?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totals = sorted?.reduce((acc, o) => ({
    planned_qty: acc?.planned_qty + (parseFloat(o?.planned_qty) || 0),
    actual_qty: acc?.actual_qty + (parseFloat(o?.actual_qty) || 0),
    total_cost: acc?.total_cost + (parseFloat(o?.total_cost) || 0),
  }), { planned_qty: 0, actual_qty: 0, total_cost: 0 });

  const toggleSelect = (id) => setSelected(prev => prev?.includes(id) ? prev?.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected?.length === paged?.length ? [] : paged?.map(o => o?.id));

  const formatDate = (d) => d ? new Date(d + 'T00:00:00')?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '-';
  const formatNum = (v) => v != null ? parseFloat(v)?.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '-';
  const formatGHS = (v) => v != null ? `GHS ${parseFloat(v)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';

  const selectedOrder = selected?.length === 1 ? orders?.find(o => o?.id === selected?.[0]) : null;

  const handleKeyDown = (e) => {
    if (e?.key === 'F2') { e?.preventDefault(); onNew?.(); }
    if (e?.key === 'F3') { e?.preventDefault(); setShowFilter(f => !f); }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Icon name="Plus" size={13} />
            New <span className="opacity-60 ml-0.5">(F2)</span>
          </button>
          <button
            onClick={() => selectedOrder && onEdit?.(selectedOrder)}
            disabled={!selectedOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-40"
          >
            <Icon name="Pencil" size={13} />
            Edit
          </button>
          <button
            onClick={() => selected?.length > 0 && onDelete?.(selected)}
            disabled={selected?.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            <Icon name="Trash2" size={13} />
            Delete
          </button>
          <button
            onClick={() => setShowFilter(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-colors ${
              showFilter ? 'bg-primary/10 border-primary text-primary' : 'border-border hover:bg-accent'
            }`}
          >
            <Icon name="Search" size={13} />
            Search <span className="opacity-60 ml-0.5">(F3)</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {selected?.length > 0 && (
            <span className="text-xs text-muted-foreground">{selected?.length} selected</span>
          )}
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <Icon name="FileSpreadsheet" size={13} />
            Excel
          </button>
        </div>
      </div>
      {/* Filter Panel */}
      {showFilter && (
        <div className="px-4 py-3 bg-muted/20 border-b border-border">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Order No</label>
              <input
                type="text"
                value={filters?.order_no}
                onChange={e => { setFilters(f => ({ ...f, order_no: e?.target?.value })); setPage(1); }}
                className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Search..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Product</label>
              <input
                type="text"
                value={filters?.product}
                onChange={e => { setFilters(f => ({ ...f, product: e?.target?.value })); setPage(1); }}
                className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Search..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select
                value={filters?.status}
                onChange={e => { setFilters(f => ({ ...f, status: e?.target?.value })); setPage(1); }}
                className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All</option>
                {['Planned', 'In Progress', 'Completed', 'On Hold']?.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Location</label>
              <input
                type="text"
                value={filters?.location}
                onChange={e => { setFilters(f => ({ ...f, location: e?.target?.value })); setPage(1); }}
                className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Search..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">From Date</label>
              <input
                type="date"
                value={filters?.date_from}
                onChange={e => { setFilters(f => ({ ...f, date_from: e?.target?.value })); setPage(1); }}
                className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">To Date</label>
              <input
                type="date"
                value={filters?.date_to}
                onChange={e => { setFilters(f => ({ ...f, date_to: e?.target?.value })); setPage(1); }}
                className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={() => { setFilters({ order_no: '', product: '', status: '', location: '', date_from: '', date_to: '' }); setPage(1); }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Icon name="X" size={11} /> Clear filters
            </button>
          </div>
        </div>
      )}
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-sans">
          <thead className="bg-primary/10 sticky top-0 z-10">
            <tr>
              <th className="w-8 px-2 py-2.5 text-center border-r border-border">
                <input type="checkbox" checked={paged?.length > 0 && selected?.length === paged?.length} onChange={toggleAll} className="rounded" />
              </th>
              <th className="w-8 px-2 py-2.5 text-center text-muted-foreground border-r border-border">#</th>
              {COLUMNS?.map(col => (
                <th
                  key={col?.key}
                  className={`px-3 py-2.5 text-left font-semibold text-foreground whitespace-nowrap border-r border-border last:border-r-0 ${col?.sortable ? 'cursor-pointer hover:bg-primary/20 select-none' : ''} ${col?.width}`}
                  onClick={() => col?.sortable && handleSort(col?.key)}
                >
                  <div className={`flex items-center gap-1 ${col?.align === 'right' ? 'justify-end' : ''}`}>
                    {col?.label}
                    {col?.sortable && (
                      <Icon
                        name={sortKey === col?.key ? (sortDir === 'asc' ? 'ChevronUp' : 'ChevronDown') : 'ChevronsUpDown'}
                        size={11}
                        className={sortKey === col?.key ? 'text-primary' : 'text-muted-foreground'}
                      />
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
                  <td colSpan={COLUMNS?.length + 2} className="px-3 py-2.5">
                    <div className="h-4 bg-muted animate-pulse rounded w-full" />
                  </td>
                </tr>
              ))
            ) : paged?.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS?.length + 2} className="px-4 py-12 text-center text-muted-foreground">
                  <Icon name="Factory" size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No production orders found</p>
                  <button onClick={onNew} className="mt-2 text-primary hover:underline text-xs">Create first order</button>
                </td>
              </tr>
            ) : (
              paged?.map((order, idx) => {
                const variance = (parseFloat(order?.actual_qty) || 0) - (parseFloat(order?.planned_qty) || 0);
                const isSelected = selected?.includes(order?.id);
                return (
                  <tr
                    key={order?.id}
                    className={`border-b border-border/50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-primary/10' : idx % 2 === 0 ? 'bg-background hover:bg-accent/50' : 'bg-muted/20 hover:bg-accent/50'
                    }`}
                    onClick={() => toggleSelect(order?.id)}
                    onDoubleClick={() => onEdit?.(order)}
                  >
                    <td className="w-8 px-2 py-2 text-center border-r border-border/50">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(order?.id)} onClick={e => e?.stopPropagation()} className="rounded" />
                    </td>
                    <td className="w-8 px-2 py-2 text-center text-muted-foreground border-r border-border/50 tabular-nums">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-primary whitespace-nowrap border-r border-border/50">{order?.order_no}</td>
                    <td className="px-3 py-2 text-foreground whitespace-nowrap border-r border-border/50">{order?.product_name}</td>
                    <td className="px-3 py-2 text-right tabular-nums border-r border-border/50">{formatNum(order?.planned_qty)}</td>
                    <td className="px-3 py-2 text-right tabular-nums border-r border-border/50">{formatNum(order?.actual_qty)}</td>
                    <td className="px-3 py-2 border-r border-border/50">{order?.uom || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap border-r border-border/50">{formatDate(order?.start_date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap border-r border-border/50">{formatDate(order?.end_date)}</td>
                    <td className="px-3 py-2 border-r border-border/50">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS?.[order?.status] || 'bg-muted text-muted-foreground'}`}>
                        {order?.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap border-r border-border/50">{order?.location_name || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap border-r border-border/50">{order?.assigned_to || '-'}</td>
                    <td className={`px-3 py-2 text-right tabular-nums font-medium border-r border-border/50 ${variance > 0 ? 'text-emerald-600' : variance < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {variance !== 0 ? (variance > 0 ? '+' : '') + formatNum(variance) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatGHS(order?.total_cost)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {!isLoading && sorted?.length > 0 && (
            <tfoot className="bg-primary/10 border-t-2 border-primary/20">
              <tr>
                <td colSpan={2} className="px-3 py-2.5 text-xs font-bold text-foreground border-r border-border">Grand Total</td>
                <td className="px-3 py-2.5 text-xs font-bold text-foreground border-r border-border" colSpan={1}></td>
                <td className="px-3 py-2.5 text-xs font-bold text-foreground text-right tabular-nums border-r border-border">{formatNum(totals?.planned_qty)}</td>
                <td className="px-3 py-2.5 text-xs font-bold text-foreground text-right tabular-nums border-r border-border">{formatNum(totals?.actual_qty)}</td>
                <td colSpan={7} className="border-r border-border"></td>
                <td className="px-3 py-2.5 text-xs font-bold text-foreground text-right tabular-nums border-r border-border">
                  {(totals?.actual_qty - totals?.planned_qty) !== 0 ? ((totals?.actual_qty - totals?.planned_qty) > 0 ? '+' : '') + formatNum(totals?.actual_qty - totals?.planned_qty) : '-'}
                </td>
                <td className="px-3 py-2.5 text-xs font-bold text-primary text-right tabular-nums">{formatGHS(totals?.total_cost)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted?.length)} of {sorted?.length} orders
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded hover:bg-accent disabled:opacity-40 transition-colors">
              <Icon name="ChevronsLeft" size={14} />
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-accent disabled:opacity-40 transition-colors">
              <Icon name="ChevronLeft" size={14} />
            </button>
            <span className="px-3 py-1 text-xs font-medium">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded hover:bg-accent disabled:opacity-40 transition-colors">
              <Icon name="ChevronRight" size={14} />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded hover:bg-accent disabled:opacity-40 transition-colors">
              <Icon name="ChevronsRight" size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionOrdersTable;
