import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { supabase } from '../../../lib/supabase';

const ReportFilters = ({ selectedReport, onFiltersChange, onExport, onPrint }) => {
  const [filters, setFilters] = useState({
    dateRange: 'last-30-days',
    startDate: '',
    endDate: '',
    businessExecutive: 'all',
    customerType: 'all',
    location: 'all',
    status: 'all'
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last-7-days', label: 'Last 7 Days' },
    { value: 'last-30-days', label: 'Last 30 Days' },
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'this-quarter', label: 'This Quarter' },
    { value: 'this-year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const businessExecutiveOptions = [
    { value: 'all', label: 'All Executives' },
    ...executives?.map(e => ({ value: e?.full_name?.toLowerCase()?.replace(/\s+/g, '-'), label: e?.full_name }))
  ];

  const customerTypeOptions = [
    { value: 'all', label: 'All Customer Types' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'retail', label: 'Retail' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'institutional', label: 'Institutional' }
  ];

  const locationOptions = [
    { value: 'all', label: 'All Locations' },
    ...locations?.map(l => ({ value: l?.name?.toLowerCase()?.replace(/\s+/g, '-'), label: l?.name }))
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'current', label: 'Current' },
    { value: '1-30-days', label: '1-30 Days' },
    { value: '31-60-days', label: '31-60 Days' },
    { value: '61-90-days', label: '61-90 Days' },
    { value: 'over-90-days', label: 'Over 90 Days' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(filters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      dateRange: 'last-30-days',
      startDate: '',
      endDate: '',
      businessExecutive: 'all',
      customerType: 'all',
      location: 'all',
      status: 'all'
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const exportOptions = [
    { value: 'pdf', label: 'Export as PDF', icon: 'FileText' },
    { value: 'excel', label: 'Export as Excel', icon: 'FileSpreadsheet' },
    { value: 'csv', label: 'Export as CSV', icon: 'Download' }
  ];

  if (!selectedReport) {
    return (
      <div className="bg-card border-b border-border p-4">
        <div className="text-center text-muted-foreground">
          <Icon name="Filter" size={24} className="mx-auto mb-2" />
          <p className="text-sm">Select a report to configure filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border-b border-border p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-48">
          <Select
            label="Date Range"
            options={dateRangeOptions}
            value={filters?.dateRange}
            onChange={(value) => handleFilterChange('dateRange', value)}
          />
        </div>

        {filters?.dateRange === 'custom' && (
          <>
            <div className="min-w-36">
              <Input
                type="date"
                label="Start Date"
                value={filters?.startDate}
                onChange={(e) => handleFilterChange('startDate', e?.target?.value)}
              />
            </div>
            <div className="min-w-36">
              <Input
                type="date"
                label="End Date"
                value={filters?.endDate}
                onChange={(e) => handleFilterChange('endDate', e?.target?.value)}
              />
            </div>
          </>
        )}

        <div className="flex-1 min-w-40">
          <Select
            label="Business Executive"
            options={businessExecutiveOptions}
            value={filters?.businessExecutive}
            onChange={(value) => handleFilterChange('businessExecutive', value)}
          />
        </div>

        <div className="flex-1 min-w-40">
          <Select
            label="Customer Type"
            options={customerTypeOptions}
            value={filters?.customerType}
            onChange={(value) => handleFilterChange('customerType', value)}
          />
        </div>

        <div className="flex-1 min-w-40">
          <Select
            label="Location"
            options={locationOptions}
            value={filters?.location}
            onChange={(value) => handleFilterChange('location', value)}
          />
        </div>

        <div className="flex-1 min-w-36">
          <Select
            label="Status"
            options={statusOptions}
            value={filters?.status}
            onChange={(value) => handleFilterChange('status', value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleApplyFilters} size="sm">
            <Icon name="Filter" size={14} />
            Apply
          </Button>
          <Button variant="outline" onClick={handleResetFilters} size="sm">
            <Icon name="RotateCcw" size={14} />
            Reset
          </Button>
          {onExport && (
            <Button variant="outline" onClick={() => onExport('pdf')} size="sm">
              <Icon name="Download" size={14} />
              Export
            </Button>
          )}
          {onPrint && (
            <Button variant="outline" onClick={onPrint} size="sm">
              <Icon name="Printer" size={14} />
              Print
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;