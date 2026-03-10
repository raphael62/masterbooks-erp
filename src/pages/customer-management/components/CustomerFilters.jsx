import React, { useState, useEffect } from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';

const CustomerFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  onBulkAction,
  selectedCustomers = []
}) => {
  const [executives, setExecutives] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchFilterData = async () => {
      const [exRes, locRes] = await Promise.all([
        supabase?.from('business_executives')?.select('id, full_name')?.eq('status', 'Active')?.order('full_name'),
        supabase?.from('locations')?.select('id, name')?.eq('is_active', true)?.order('name'),
      ]);
      if (!exRes?.error) setExecutives(exRes?.data || []);
      if (!locRes?.error) setLocations(locRes?.data || []);
    };
    fetchFilterData();
  }, []);

  const businessExecutiveOptions = [
    { value: '', label: 'All Executives' },
    ...executives?.map(e => ({ value: e?.full_name, label: e?.full_name }))
  ];

  const customerTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'Retailer', label: 'Retailer' },
    { value: 'Wholesaler', label: 'Wholesaler' },
    { value: 'Distributor', label: 'Distributor' },
    { value: 'Supermarket', label: 'Supermarket' },
    { value: 'Restaurant', label: 'Restaurant' },
    { value: 'Hotel', label: 'Hotel' },
    { value: 'Bar/Pub', label: 'Bar/Pub' },
  ];

  const creditStatusOptions = [
    { value: '', label: 'All Status' },
    { value: 'good', label: 'Good Standing' },
    { value: 'warning', label: 'Near Limit' },
    { value: 'exceeded', label: 'Limit Exceeded' },
    { value: 'overdue', label: 'Overdue Payments' }
  ];

  const locationOptions = [
    { value: '', label: 'All Locations' },
    ...locations?.map(l => ({ value: l?.name, label: l?.name }))
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Suspended', label: 'Suspended' }
  ];

  const bulkActionOptions = [
    { value: '', label: 'Bulk Actions' },
    { value: 'export', label: 'Export Selected' },
    { value: 'assign-executive', label: 'Assign Executive' },
    { value: 'update-credit', label: 'Update Credit Limits' },
    { value: 'activate', label: 'Activate Customers' },
    { value: 'deactivate', label: 'Deactivate Customers' },
    { value: 'delete', label: 'Delete Selected' }
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = Object.values(filters)?.some(value => value !== '');

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6">
      {/* Search and Quick Actions Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Search customers by name, email, or phone..."
            value={filters?.search || ''}
            onChange={(e) => handleFilterChange('search', e?.target?.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedCustomers?.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {selectedCustomers?.length} selected
              </span>
              <Select
                options={bulkActionOptions}
                value=""
                onChange={(value) => onBulkAction(value)}
                placeholder="Bulk Actions"
                className="min-w-32"
              />
            </div>
          )}
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              iconName="X"
              onClick={onClearFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Select
          label="Business Executive"
          options={businessExecutiveOptions}
          value={filters?.executive || ''}
          onChange={(value) => handleFilterChange('executive', value)}
          searchable
        />

        <Select
          label="Customer Type"
          options={customerTypeOptions}
          value={filters?.customerType || ''}
          onChange={(value) => handleFilterChange('customerType', value)}
        />

        <Select
          label="Credit Status"
          options={creditStatusOptions}
          value={filters?.creditStatus || ''}
          onChange={(value) => handleFilterChange('creditStatus', value)}
        />

        <Select
          label="Location"
          options={locationOptions}
          value={filters?.location || ''}
          onChange={(value) => handleFilterChange('location', value)}
        />

        <Select
          label="Status"
          options={statusOptions}
          value={filters?.status || ''}
          onChange={(value) => handleFilterChange('status', value)}
        />
      </div>
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {Object.entries(filters)?.map(([key, value]) => {
            if (!value) return null;
            
            let label = value;
            if (key === 'executive') label = `Executive: ${value}`;
            if (key === 'customerType') label = `Type: ${value}`;
            if (key === 'creditStatus') label = `Credit: ${value}`;
            if (key === 'location') label = `Location: ${value}`;
            if (key === 'status') label = `Status: ${value}`;
            if (key === 'search') label = `Search: "${value}"`;

            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
              >
                {label}
                <button
                  onClick={() => handleFilterChange(key, '')}
                  className="hover:text-primary/80"
                >
                  <Icon name="X" size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerFilters;