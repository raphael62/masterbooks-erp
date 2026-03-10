import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

const EmployeeFilters = ({ 
  searchQuery, 
  onSearchChange, 
  filters, 
  onFilterChange, 
  onClearFilters,
  onExport 
}) => {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase?.from('locations')?.select('id, name')?.eq('is_active', true)?.order('name');
      if (!error) setLocations(data || []);
    };
    fetchLocations();
  }, []);

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Finance', label: 'Finance' },
    { value: 'HR', label: 'Human Resources' },
    { value: 'IT', label: 'Information Technology' },
    { value: 'Logistics', label: 'Logistics' },
    { value: 'Production', label: 'Production' }
  ];

  const locationOptions = [
    { value: '', label: 'All Locations' },
    ...locations?.map(l => ({ value: l?.name, label: l?.name }))
  ];

  const employmentTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Intern', label: 'Intern' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Active', label: 'Active' },
    { value: 'On Leave', label: 'On Leave' },
    { value: 'Inactive', label: 'Inactive' }
  ];

  const hasActiveFilters = filters?.department || filters?.location || filters?.employmentType || filters?.status;

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Icon 
              name="Search" 
              size={16} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            />
            <Input
              type="search"
              placeholder="Search employees by name, ID, or role..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e?.target?.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            options={departmentOptions}
            value={filters?.department}
            onChange={(value) => onFilterChange('department', value)}
            placeholder="Department"
            className="w-40"
          />

          <Select
            options={locationOptions}
            value={filters?.location}
            onChange={(value) => onFilterChange('location', value)}
            placeholder="Location"
            className="w-40"
          />

          <Select
            options={employmentTypeOptions}
            value={filters?.employmentType}
            onChange={(value) => onFilterChange('employmentType', value)}
            placeholder="Type"
            className="w-32"
          />

          <Select
            options={statusOptions}
            value={filters?.status}
            onChange={(value) => onFilterChange('status', value)}
            placeholder="Status"
            className="w-32"
          />

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <Icon name="X" size={14} />
              Clear
            </Button>
          )}

          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Icon name="Download" size={14} />
              Export
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeFilters;