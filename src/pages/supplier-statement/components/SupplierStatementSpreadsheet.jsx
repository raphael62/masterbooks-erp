import React from 'react';
import Icon from '../../../components/AppIcon';

const TX_TYPE_CONFIG = {
  purchase_invoice: { label: 'Invoice', color: 'bg-blue-100 text-blue-700' },
  payment: { label: 'Payment', color: 'bg-emerald-100 text-emerald-700' },
  credit_note: { label: 'Credit Note', color: 'bg-orange-100 text-orange-700' },
};

const fmt = (v) =>
  v !== null && v !== undefined && v !== 0
    ? parseFloat(v)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '';

const fmtBal = (v) =>
  parseFloat(v || 0)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SupplierStatementSpreadsheet = ({ rows, isLoading, sortConfig, onSort, grandTotals }) => {
  const SortIcon = ({ col }) => {
    if (sortConfig?.key !== col) return <Icon name="ChevronsUpDown" size={12} className="text-muted-foreground/50 ml-1" />;
    return sortConfig?.direction === 'asc'
      ? <Icon name="ChevronUp" size={12} className="text-primary ml-1" />
      : <Icon name="ChevronDown" size={12} className="text-primary ml-1" />;
  };

  const thCls = 'px-3 py-2 text-left text-xs font-semibold text-primary-foreground whitespace-nowrap cursor-pointer select-none';
  const tdCls = 'px-3 py-1.5 text-xs text-foreground whitespace-nowrap';
  const numTdCls = 'px-3 py-1.5 text-xs text-foreground whitespace-nowrap text-right font-tabular-nums';

  return (
    <div className="flex-1 overflow-auto border border-border rounded-lg">
      <table className="w-full border-collapse text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <thead className="sticky top-0 z-10">
          <tr className="bg-primary">
            <th className="px-2 py-2 text-center text-xs font-semibold text-primary-foreground w-10">#</th>
            {[
              { key: 'transaction_date', label: 'Date', w: 'w-24' },
              { key: 'reference_no', label: 'Reference No', w: 'w-32' },
              { key: 'transaction_type', label: 'Transaction Type', w: 'w-36' },
              { key: 'description', label: 'Description', w: 'w-48' },
              { key: 'invoice_amount', label: 'Invoice Amount', w: 'w-32' },
              { key: 'payment_amount', label: 'Payment Amount', w: 'w-32' },
              { key: 'credit_note_amount', label: 'Credit Note Amt', w: 'w-32' },
              { key: 'running_balance', label: 'Running Balance', w: 'w-32' },
            ]?.map(col => (
              <th
                key={col?.key}
                className={`${thCls} ${col?.w}`}
                onClick={() => onSort(col?.key)}
              >
                <span className="flex items-center">
                  {col?.label}
                  <SortIcon col={col?.key} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 8 })?.map((_, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                {Array.from({ length: 9 })?.map((_, j) => (
                  <td key={j} className="px-3 py-2">
                    <div className="h-3 bg-muted animate-pulse rounded" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows?.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-8 text-center text-xs text-muted-foreground">
                No transactions found. Select a supplier and date range to view statement.
              </td>
            </tr>
          ) : (
            rows?.map((row, idx) => {
              const txCfg = TX_TYPE_CONFIG?.[row?.transaction_type] || { label: row?.transaction_type, color: 'bg-gray-100 text-gray-700' };
              const isEven = idx % 2 === 0;
              return (
                <tr key={row?.id || idx} className={`${isEven ? 'bg-background' : 'bg-muted/20'} hover:bg-primary/5 transition-colors`}>
                  <td className="px-2 py-1.5 text-center text-xs text-muted-foreground">{idx + 1}</td>
                  <td className={tdCls}>{row?.transaction_date}</td>
                  <td className={tdCls}>
                    <span className="font-mono text-xs">{row?.reference_no || '—'}</span>
                  </td>
                  <td className={tdCls}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${txCfg?.color}`}>
                      {txCfg?.label}
                    </span>
                  </td>
                  <td className={tdCls + ' max-w-[180px] truncate'}>{row?.description || '—'}</td>
                  <td className={numTdCls}>{fmt(row?.invoice_amount)}</td>
                  <td className={numTdCls}>{fmt(row?.payment_amount)}</td>
                  <td className={numTdCls}>{fmt(row?.credit_note_amount)}</td>
                  <td className={`${numTdCls} font-semibold ${parseFloat(row?.running_balance) > 0 ? 'text-red-600' : parseFloat(row?.running_balance) < 0 ? 'text-emerald-600' : ''}`}>
                    {fmtBal(row?.running_balance)}
                  </td>
                </tr>
              );
            })
          )}
          {!isLoading && rows?.length > 0 && (
            <tr className="bg-primary/10 border-t-2 border-primary/30 font-semibold">
              <td className="px-2 py-2 text-center text-xs font-bold text-foreground" colSpan={5}>Grand Total</td>
              <td className={numTdCls + ' font-bold'}>{fmt(grandTotals?.invoice_amount)}</td>
              <td className={numTdCls + ' font-bold'}>{fmt(grandTotals?.payment_amount)}</td>
              <td className={numTdCls + ' font-bold'}>{fmt(grandTotals?.credit_note_amount)}</td>
              <td className={`${numTdCls} font-bold ${parseFloat(grandTotals?.closing_balance) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {fmtBal(grandTotals?.closing_balance)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SupplierStatementSpreadsheet;
