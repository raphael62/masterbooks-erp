import React from 'react';
import Icon from '../../../components/AppIcon';

const EmptiesReceiveSearchPanel = ({ filters, onFilterChange, onSearch, onClose, customers, locations }) => {
  const inputCls = 'h-7 px-2 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full';
  const labelCls = 'block text-xs text-muted-foreground mb-0.5';

  return (
    <div className="absolute top-full left-0 mt-1 z-30 bg-card border border-border rounded-lg shadow-xl p-4 w-96">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Icon name="Search" size={13} className="text-primary" /> Search Filters
        </h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="X" size={14} />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Receive No</label>
          <input
            className={inputCls}
            placeholder="e.g. ERC-2026-03-08-001"
            value={filters?.receive_no || ''}
            onChange={e => onFilterChange('receive_no', e?.target?.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Customer</label>
          <select className={inputCls} value={filters?.customer_id || ''} onChange={e => onFilterChange('customer_id', e?.target?.value)}>
            <option value="">All Customers</option>
            {customers?.map(c => <option key={c?.id} value={c?.id}>{c?.customer_name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Location</label>
          <select className={inputCls} value={filters?.location_id || ''} onChange={e => onFilterChange('location_id', e?.target?.value)}>
            <option value="">All Locations</option>
            {locations?.map(l => <option key={l?.id} value={l?.id}>{l?.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Date From</label>
            <input type="date" className={inputCls} value={filters?.date_from || ''} onChange={e => onFilterChange('date_from', e?.target?.value)} />
          </div>
          <div>
            <label className={labelCls}>Date To</label>
            <input type="date" className={inputCls} value={filters?.date_to || ''} onChange={e => onFilterChange('date_to', e?.target?.value)} />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onSearch}
            className="flex-1 h-7 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
          >
            <Icon name="Search" size={12} /> Search
          </button>
          <button
            onClick={() => { onFilterChange('_reset', true); onSearch(); }}
            className="h-7 px-3 text-xs border border-border rounded hover:bg-accent transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmptiesReceiveSearchPanel;
