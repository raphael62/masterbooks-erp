import React from 'react';


const SupplierStatementFilters = ({
  suppliers,
  filterSupplier,
  setFilterSupplier,
  filterTxType,
  setFilterTxType,
  filterDateFrom,
  setFilterDateFrom,
  filterDateTo,
  setFilterDateTo,
  onApply,
  onReset,
  panelRef
}) => {
  const inputCls = 'w-full h-7 px-2 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary';
  const labelCls = 'block text-xs font-medium text-muted-foreground mb-1';

  return (
    <div
      ref={panelRef}
      className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg p-4 w-80"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">Filter Statement</span>
        <button onClick={onReset} className="text-xs text-muted-foreground hover:text-foreground">
          Reset
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Supplier</label>
          <select
            value={filterSupplier}
            onChange={e => setFilterSupplier(e?.target?.value)}
            className={inputCls}
          >
            <option value="">All Suppliers</option>
            {suppliers?.map(s => (
              <option key={s?.id} value={s?.id}>{s?.vendor_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Transaction Type</label>
          <select
            value={filterTxType}
            onChange={e => setFilterTxType(e?.target?.value)}
            className={inputCls}
          >
            <option value="">All Types</option>
            <option value="purchase_invoice">Invoice</option>
            <option value="payment">Payment</option>
            <option value="credit_note">Credit Note</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Date From</label>
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e?.target?.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Date To</label>
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e?.target?.value)} className={inputCls} />
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={onApply}
          className="flex-1 h-7 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          Apply
        </button>
        <button
          onClick={onReset}
          className="flex-1 h-7 text-xs font-medium border border-border rounded hover:bg-accent transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default SupplierStatementFilters;
