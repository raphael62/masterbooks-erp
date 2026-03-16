import React from 'react';
import Icon from '../../../components/AppIcon';

const fmtDate = (d) => d ? new Date(d)?.toLocaleDateString('en-GB') : '';
const fmtAmt = (v) => (parseFloat(v) || 0)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const EmptiesReceiveSpreadsheet = ({ rows, isLoading, selectedIds, onSelectAll, onSelectRow, onRowDoubleClick, onEditRow, sortConfig, onSort }) => {
  const SortIcon = ({ col }) => {
    if (sortConfig?.key !== col) return <Icon name="ChevronsUpDown" size={11} className="text-primary-foreground/50 ml-1" />;
    return sortConfig?.direction === 'asc'
      ? <Icon name="ChevronUp" size={11} className="text-primary-foreground ml-1" />
      : <Icon name="ChevronDown" size={11} className="text-primary-foreground ml-1" />;
  };

  const allSelected = rows?.length > 0 && selectedIds?.length === rows?.length;
  const thCls = 'px-3 py-2 text-left text-xs font-semibold text-primary-foreground whitespace-nowrap cursor-pointer select-none';
  const tdCls = 'px-3 py-1.5 text-xs text-foreground whitespace-nowrap';

  const columns = [
    { key: 'receive_no', label: 'Receive No', w: 'w-36' },
    { key: 'receive_date', label: 'Receive Date', w: 'w-28' },
    { key: 'customer_name', label: 'Customer Name', w: 'w-48' },
    { key: 'location_name', label: 'Location', w: 'w-36' },
    { key: 'total_items', label: 'Total Items', w: 'w-24' },
    { key: 'total_value', label: 'Total Value GHS', w: 'w-36' },
    { key: 'status', label: 'Status', w: 'w-24' },
  ];

  return (
    <div className="flex-1 overflow-auto border border-border rounded-lg">
      <table className="w-full border-collapse text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <thead className="sticky top-0 z-10">
          <tr className="bg-primary">
            <th className="px-2 py-2 text-center w-8">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className="w-3 h-3 rounded"
              />
            </th>
            <th className="px-2 py-2 text-center text-xs font-semibold text-primary-foreground w-10">#</th>
            {columns?.map(col => (
              <th key={col?.key} className={`${thCls} ${col?.w}`} onClick={() => onSort(col?.key)}>
                <span className="flex items-center">{col?.label}<SortIcon col={col?.key} /></span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 8 })?.map((_, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                {Array.from({ length: 9 })?.map((_, j) => (
                  <td key={j} className="px-3 py-2"><div className="h-3 bg-muted animate-pulse rounded" /></td>
                ))}
              </tr>
            ))
          ) : rows?.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-12 text-center text-xs text-muted-foreground">
                No empties receipts found. Press New (F2) to create one.
              </td>
            </tr>
          ) : (
            rows?.map((row, idx) => {
              const isSelected = selectedIds?.includes(row?.id);
              return (
                <tr
                  key={row?.id}
                  className={`border-b border-border/50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10' : idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                  } hover:bg-primary/5`}
                  onDoubleClick={() => onRowDoubleClick(row)}
                >
                  <td className="px-2 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectRow(row?.id)}
                      className="w-3 h-3 rounded"
                      onClick={e => e?.stopPropagation()}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center text-xs text-muted-foreground">{idx + 1}</td>
                  <td className={tdCls}><span className="font-mono text-primary text-xs">{row?.receive_no}</span></td>
                  <td className={tdCls}>{fmtDate(row?.receive_date)}</td>
                  <td className={tdCls + ' max-w-[192px] truncate'}>
                    {onEditRow ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEditRow(row); }}
                        className="text-left w-full truncate text-primary hover:underline focus:outline-none focus:underline"
                      >
                        {row?.customer_name || '—'}
                      </button>
                    ) : (
                      <span>{row?.customer_name || '—'}</span>
                    )}
                  </td>
                  <td className={tdCls}>{row?.location_name || '—'}</td>
                  <td className={tdCls + ' text-right tabular-nums'}>{row?.item_count || 0}</td>
                  <td className={tdCls + ' text-right tabular-nums font-medium'}>{fmtAmt(row?.total_value)}</td>
                  <td className={tdCls}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      row?.status === 'posted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700'
                    }`}>{row?.status || 'posted'}</span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmptiesReceiveSpreadsheet;
