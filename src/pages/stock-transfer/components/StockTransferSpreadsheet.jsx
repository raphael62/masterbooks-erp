import React from 'react';
import Icon from '../../../components/AppIcon';

const COLUMNS = [
  { key: 'transfer_no', label: 'Transfer No', w: 'w-36' },
  { key: 'transfer_date', label: 'Date', w: 'w-28' },
  { key: 'from_location_name', label: 'From', w: 'w-36' },
  { key: 'to_location_name', label: 'To', w: 'w-36' },
  { key: 'item_count', label: 'Lines', w: 'w-16' },
  { key: 'status', label: 'Status', w: 'w-24' },
];

const StockTransferSpreadsheet = ({ rows, isLoading, selectedIds, onSelectAll, onSelectRow, onRowDoubleClick, onEditRow, sortConfig, onSort }) => {
  const allSelected = rows?.length > 0 && selectedIds?.length === rows?.length;
  const thCls = 'px-2 py-1.5 text-left text-xs font-semibold bg-muted/50 border-b border-border';
  const tdCls = 'px-2 py-1.5 text-xs border-b border-border';

  return (
    <div className="bg-card border border-border rounded-lg overflow-auto flex-1 min-h-0">
      <table className="w-full border-collapse text-xs" style={{ minWidth: '500px' }}>
        <thead>
          <tr>
            <th className="w-10 px-1 py-1.5 border-b border-border">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className="w-3 h-3"
                style={{ accentColor: 'var(--color-primary)' }}
              />
            </th>
            <th className="w-10 px-1 py-1.5 border-b border-border text-center text-muted-foreground">#</th>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className={`${thCls} cursor-pointer hover:bg-muted/70 ${col.key === 'transfer_no' ? 'font-mono' : ''}`}
                onClick={() => onSort?.(col.key)}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <td className={tdCls} colSpan={COLUMNS.length + 2}><div className="h-5 bg-muted animate-pulse rounded" /></td>
              </tr>
            ))
          ) : !rows?.length ? (
            <tr><td colSpan={COLUMNS.length + 2} className={`${tdCls} py-8 text-center text-muted-foreground`}>No transfers. Click New to create one.</td></tr>
          ) : (
            rows.map((row, idx) => {
              const isSelected = selectedIds?.includes(row?.id);
              return (
                <tr
                  key={row?.id}
                  onClick={() => onSelectRow?.(row?.id)}
                  onDoubleClick={() => onEditRow?.(row)}
                  className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/10' : ''} hover:bg-muted/30`}
                >
                  <td className="px-1 py-1.5" onClick={e => e?.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectRow?.(row?.id)}
                      className="w-3 h-3"
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                  </td>
                  <td className={`${tdCls} text-center text-muted-foreground`}>{idx + 1}</td>
                  <td className={tdCls}>
                    <button
                      type="button"
                      onClick={e => { e?.stopPropagation(); onEditRow?.(row); }}
                      className="text-left font-mono text-primary hover:underline focus:outline-none"
                    >
                      {row?.transfer_no || '—'}
                    </button>
                  </td>
                  <td className={tdCls}>{row?.transfer_date || '—'}</td>
                  <td className={tdCls}>{row?.from_location_name || '—'}</td>
                  <td className={tdCls}>{row?.to_location_name || '—'}</td>
                  <td className={tdCls}>{row?.item_count ?? '—'}</td>
                  <td className={tdCls}>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${row?.status === 'posted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                      {row?.status || 'draft'}
                    </span>
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

export default StockTransferSpreadsheet;
