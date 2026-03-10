import React from 'react';

const SupplierStatementHeader = ({ supplier, dateFrom, dateTo, openingBalance, closingBalance, totalTransactions }) => {
  const fmt = (v) => `GHS ${parseFloat(v || 0)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (!supplier) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">{supplier?.vendor_name}</h2>
          {supplier?.vendor_code && (
            <p className="text-xs text-muted-foreground mt-0.5">Code: {supplier?.vendor_code}</p>
          )}
          {(dateFrom || dateTo) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Period: {dateFrom || '—'} to {dateTo || '—'}
            </p>
          )}
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Opening Balance</p>
            <p className="text-sm font-semibold text-foreground">{fmt(openingBalance)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="text-sm font-semibold text-foreground">{totalTransactions}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Closing Balance</p>
            <p className={`text-sm font-bold ${parseFloat(closingBalance) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {fmt(closingBalance)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierStatementHeader;
