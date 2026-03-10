import React from 'react';
import Icon from '../../../components/AppIcon';

const ITEM_TYPE_CONFIG = {
  Bottles: { color: 'bg-blue-100 text-blue-700' },
  Crates: { color: 'bg-purple-100 text-purple-700' },
  Kegs: { color: 'bg-amber-100 text-amber-700' },
};

const fmtNum = (v) =>
  v !== null && v !== undefined && v !== 0
    ? parseFloat(v)?.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : '';

const fmtAmt = (v) =>
  parseFloat(v || 0)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const EmptiesStatementSpreadsheet = ({ rows, isLoading, sortConfig, onSort, grandTotals }) => {
  const SortIcon = ({ col }) => {
    if (sortConfig?.key !== col) return <Icon name="ChevronsUpDown" size={12} className="text-muted-foreground/50 ml-1" />;
    return sortConfig?.direction === 'asc'
      ? <Icon name="ChevronUp" size={12} className="text-primary ml-1" />
      : <Icon name="ChevronDown" size={12} className="text-primary ml-1" />;
  };

  const thCls = 'px-3 py-2 text-left text-xs font-semibold text-primary-foreground whitespace-nowrap cursor-pointer select-none';
  const tdCls = 'px-3 py-1.5 text-xs text-foreground whitespace-nowrap';
  const numTdCls = 'px-3 py-1.5 text-xs text-foreground whitespace-nowrap text-right';

  const columns = [
    { key: 'invoice_date', label: 'Date', w: 'w-24' },
    { key: 'invoice_no', label: 'Invoice No', w: 'w-32' },
    { key: 'item_type', label: 'Item Type', w: 'w-28' },
    { key: 'item_name', label: 'Item Name', w: 'w-40' },
    { key: 'qty_issued', label: 'Qty Issued', w: 'w-24' },
    { key: 'qty_returned', label: 'Qty Returned', w: 'w-28' },
    { key: 'running_balance', label: 'Running Balance', w: 'w-32' },
    { key: 'unit_deposit', label: 'Unit Deposit', w: 'w-28' },
    { key: 'total_deposit_value', label: 'Total Deposit Value', w: 'w-36' },
  ];

  return (
    <div className="flex-1 overflow-auto border border-border rounded-lg">
      <table className="w-full border-collapse text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <thead className="sticky top-0 z-10">
          <tr className="bg-primary">
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
                {Array.from({ length: 10 })?.map((_, j) => (
                  <td key={j} className="px-3 py-2"><div className="h-3 bg-muted animate-pulse rounded" /></td>
                ))}
              </tr>
            ))
          ) : rows?.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-3 py-8 text-center text-xs text-muted-foreground">
                No empties transactions found. Select a supplier and date range to view statement.
              </td>
            </tr>
          ) : (
            rows?.map((row, idx) => {
              const typeCfg = ITEM_TYPE_CONFIG?.[row?.item_type] || { color: 'bg-gray-100 text-gray-700' };
              return (
                <tr key={row?.id || idx} className={`${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-primary/5 transition-colors`}>
                  <td className="px-2 py-1.5 text-center text-xs text-muted-foreground">{idx + 1}</td>
                  <td className={tdCls}>{row?.invoice_date}</td>
                  <td className={tdCls}><span className="font-mono text-xs">{row?.invoice_no || '—'}</span></td>
                  <td className={tdCls}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeCfg?.color}`}>
                      {row?.item_type || '—'}
                    </span>
                  </td>
                  <td className={tdCls + ' max-w-[160px] truncate'}>{row?.item_name || '—'}</td>
                  <td className={numTdCls}>{fmtNum(row?.qty_issued)}</td>
                  <td className={numTdCls}>{fmtNum(row?.qty_returned)}</td>
                  <td className={`${numTdCls} font-semibold ${parseFloat(row?.running_balance) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {fmtNum(row?.running_balance)}
                  </td>
                  <td className={numTdCls}>{fmtAmt(row?.unit_deposit)}</td>
                  <td className={`${numTdCls} font-medium`}>{fmtAmt(row?.total_deposit_value)}</td>
                </tr>
              );
            })
          )}
          {!isLoading && rows?.length > 0 && (
            <tr className="bg-primary/10 border-t-2 border-primary/30 font-semibold">
              <td className="px-2 py-2 text-center text-xs font-bold text-foreground" colSpan={5}>Grand Total</td>
              <td className={numTdCls + ' font-bold'}>{fmtNum(grandTotals?.qty_issued)}</td>
              <td className={numTdCls + ' font-bold'}>{fmtNum(grandTotals?.qty_returned)}</td>
              <td className={`${numTdCls} font-bold ${parseFloat(grandTotals?.closing_balance) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {fmtNum(grandTotals?.closing_balance)}
              </td>
              <td className={numTdCls + ' font-bold'}></td>
              <td className={numTdCls + ' font-bold'}>{fmtAmt(grandTotals?.total_deposit_value)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmptiesStatementSpreadsheet;
