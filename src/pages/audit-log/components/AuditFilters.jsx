import React from 'react';
import Icon from '../../../components/AppIcon';

const ACTION_TYPES = ['INSERT', 'UPDATE', 'DELETE'];
const TABLE_OPTIONS = [
  'companies', 'locations', 'products', 'customers', 'vendors',
  'purchase_orders', 'purchase_invoices', 'returnable_transactions', 'stock_movements'
];

const AuditFilters = ({ filters, onChange, onApply, onClear, onClose }) => {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="absolute right-0 top-full mt-2 z-30 w-80 bg-card border border-border rounded-xl shadow-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filter Audit Log</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
          <Icon name="X" size={14} className="text-muted-foreground" />
        </button>
      </div>
      {/* User Email */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">User Email</label>
        <input
          type="text"
          value={filters?.userEmail || ''}
          onChange={e => handleChange('userEmail', e?.target?.value)}
          placeholder="Search by email..."
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {/* Action Type */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Action Type</label>
        <div className="flex gap-2">
          {ACTION_TYPES?.map(action => (
            <button
              key={action}
              onClick={() => handleChange('action', filters?.action === action ? '' : action)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                filters?.action === action
                  ? action === 'INSERT' ? 'bg-green-500 text-white border-green-500'
                    : action === 'UPDATE'? 'bg-blue-500 text-white border-blue-500' :'bg-red-500 text-white border-red-500' :'border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>
      {/* Table */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Table</label>
        <select
          value={filters?.tableName || ''}
          onChange={e => handleChange('tableName', e?.target?.value)}
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Tables</option>
          {TABLE_OPTIONS?.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {/* Record ID */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Record ID</label>
        <input
          type="text"
          value={filters?.recordId || ''}
          onChange={e => handleChange('recordId', e?.target?.value)}
          placeholder="UUID or partial match..."
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {/* Date Range */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">From Date</label>
          <input
            type="date"
            value={filters?.dateFrom || ''}
            onChange={e => handleChange('dateFrom', e?.target?.value)}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">To Date</label>
          <input
            type="date"
            value={filters?.dateTo || ''}
            onChange={e => handleChange('dateTo', e?.target?.value)}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onClear}
          className="flex-1 py-2 text-xs font-medium border border-border rounded-lg text-muted-foreground hover:bg-accent transition-colors"
        >
          Clear All
        </button>
        <button
          onClick={() => { onApply(); onClose(); }}
          className="flex-1 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default AuditFilters;
