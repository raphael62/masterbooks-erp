import React from 'react';
import Icon from '../../../components/AppIcon';

const VendorFilters = ({ filters, onFilterChange, onSearch, searchTerm, onSearchChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card border-b border-border">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search vendors... (F3)"
          value={searchTerm}
          onChange={(e) => onSearchChange?.(e?.target?.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      {/* Category Filter */}
      <select
        value={filters?.category || ''}
        onChange={(e) => onFilterChange?.('category', e?.target?.value)}
        className="px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All Categories</option>
        <option value="supplier">Supplier</option>
        <option value="manufacturer">Manufacturer</option>
        <option value="distributor">Distributor</option>
        <option value="service">Service Provider</option>
      </select>

      {/* Payment Terms Filter */}
      <select
        value={filters?.paymentTerms || ''}
        onChange={(e) => onFilterChange?.('paymentTerms', e?.target?.value)}
        className="px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All Payment Terms</option>
        <option value="net30">Net 30</option>
        <option value="net60">Net 60</option>
        <option value="net90">Net 90</option>
        <option value="cod">Cash on Delivery</option>
        <option value="prepaid">Prepaid</option>
      </select>

      {/* Status Filter */}
      <select
        value={filters?.status || ''}
        onChange={(e) => onFilterChange?.('status', e?.target?.value)}
        className="px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="blocked">Blocked</option>
      </select>

      {/* Include Inactive Toggle */}
      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={filters?.includeInactive || false}
          onChange={(e) => onFilterChange?.('includeInactive', e?.target?.checked)}
          className="rounded border-border"
        />
        Include Inactive
      </label>
    </div>
  );
};

export default VendorFilters;
