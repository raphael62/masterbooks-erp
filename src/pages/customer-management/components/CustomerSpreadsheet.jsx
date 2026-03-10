import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import NewCustomerModal from './NewCustomerModal';
import NewExecutiveModal from './NewExecutiveModal';
import NewSupplierModal from './NewSupplierModal';
import { supabase } from '../../../lib/supabase';
import { useCompanyLocation } from '../../../contexts/CompanyLocationContext';


const ITEMS_PER_PAGE = 23;
const COLUMNS = [
  { key: 'custVendCode', label: 'CustVend Code', width: 'w-24' },
  { key: 'custVendName', label: 'CustVend Name', width: 'w-48' },
  { key: 'picName', label: 'PIC Name', width: 'w-44' },
  { key: 'salesPriceGroupName', label: 'Price Type', width: 'w-36' },
  { key: 'creditLimit', label: 'Credit Limit', width: 'w-28' },
  { key: 'businessExecutive', label: 'Business Executive', width: 'w-36' },
  { key: 'location', label: 'Location', width: 'w-32' },
  { key: 'mobile', label: 'Mobile', width: 'w-28' },
  { key: 'email', label: 'Email', width: 'w-36' },
  { key: 'status', label: 'Status', width: 'w-20' },
];

const CustomerSpreadsheet = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeDeactivated, setIncludeDeactivated] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [showNewExecutiveModal, setShowNewExecutiveModal] = useState(false);
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef(null);
  const isFetchingRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const { selectedCompany, selectedLocation, isOnline, refreshLocations, refreshCompanies } = useCompanyLocation();

  // Filter panel state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterPanelRef = useRef(null);
  const [filterCustomerCode, setFilterCustomerCode] = useState('');
  const [filterCustomerName, setFilterCustomerName] = useState('');
  const [filterPriceType, setFilterPriceType] = useState('');
  const [filterBusinessExecutive, setFilterBusinessExecutive] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch customers from Supabase filtered by company/location
  const fetchCustomers = useCallback(async () => {
    if (isFetchingRef?.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      let query = supabase?.from('customers')?.select('id, customer_code, customer_name, business_executive, price_type, price_type_id, credit_limit, location, location_id, mobile, email, status, outstanding_balance')?.order('customer_name');
      if (selectedCompany?.id) {
        query = query?.or(`company_id.eq.${selectedCompany?.id},company_id.is.null`);
      }
      const { data, error } = await query;
      if (error) throw error;
      const mapped = (data || [])?.map(c => ({
        id: c?.id,
        custVendCode: c?.customer_code || '',
        custVendName: c?.customer_name || '',
        picName: c?.contact_person || c?.business_executive || '',
        salesPriceGroupName: c?.price_type || '',
        price_type_id: c?.price_type_id || null,
        creditLimit: c?.credit_limit ? parseFloat(c?.credit_limit) : 0,
        businessExecutive: c?.business_executive || '',
        location: c?.location || '',
        location_id: c?.location_id || null,
        mobile: c?.mobile || '',
        email: c?.email || '',
        status: c?.status || 'Active',
        active: c?.status === 'Active',
        outstanding_balance: c?.outstanding_balance ?? 0,
      }));
      // Deduplicate by customer_code (business key) - keeps first; fallback to id if no code
      const seen = new Set();
      const deduped = [];
      for (const c of mapped ?? []) {
        const key = (c?.custVendCode || '').trim() || c?.id;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        deduped.push(c);
      }
      setCustomers(deduped);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setCustomers([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [selectedCompany?.id]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Close filter panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterPanelRef?.current && !filterPanelRef?.current?.contains(e?.target)) {
        setShowFilterPanel(false);
      }
    };
    if (showFilterPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterPanel]);

  // F3 shortcut for search, F2 for new
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e?.key === 'F3') {
        e?.preventDefault();
        setShowFilterPanel(prev => !prev);
      }
      if (e?.key === 'F2') {
        e?.preventDefault();
        setShowNewCustomerModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  // Unique values for dropdowns
  const uniquePriceTypes = useMemo(() => {
    const vals = [...new Set(customers?.map(c => c?.salesPriceGroupName)?.filter(Boolean))];
    return vals?.sort();
  }, [customers]);

  const uniqueExecutives = useMemo(() => {
    const vals = [...new Set(customers?.map(c => c?.businessExecutive)?.filter(Boolean))];
    return vals?.sort();
  }, [customers]);

  const uniqueLocations = useMemo(() => {
    const vals = [...new Set(customers?.map(c => c?.location)?.filter(Boolean))];
    return vals?.sort();
  }, [customers]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setShowFilterPanel(false);
  };

  const handleResetFilters = () => {
    setFilterCustomerCode('');
    setFilterCustomerName('');
    setFilterPriceType('');
    setFilterBusinessExecutive('');
    setFilterLocation('');
    setFilterStatus('all');
    setSearchTerm('');
    setCurrentPage(1);
    setShowFilterPanel(false);
  };

  const filteredCustomers = useMemo(() => {
    let list = customers;
    if (!includeDeactivated) {
      list = list?.filter(c => c?.active);
    }
    if (searchTerm?.trim()) {
      const term = searchTerm?.toLowerCase();
      list = list?.filter(c =>
        c?.custVendCode?.toLowerCase()?.includes(term) ||
        c?.custVendName?.toLowerCase()?.includes(term) ||
        c?.picName?.toLowerCase()?.includes(term) ||
        c?.email?.toLowerCase()?.includes(term) ||
        c?.mobile?.toLowerCase()?.includes(term)
      );
    }
    if (filterCustomerCode?.trim()) {
      const term = filterCustomerCode?.toLowerCase();
      list = list?.filter(c => c?.custVendCode?.toLowerCase()?.includes(term));
    }
    if (filterCustomerName?.trim()) {
      const term = filterCustomerName?.toLowerCase();
      list = list?.filter(c => c?.custVendName?.toLowerCase()?.includes(term));
    }
    if (filterPriceType) {
      list = list?.filter(c => c?.salesPriceGroupName === filterPriceType);
    }
    if (filterBusinessExecutive) {
      list = list?.filter(c => c?.businessExecutive === filterBusinessExecutive);
    }
    if (filterLocation) {
      list = list?.filter(c => c?.location === filterLocation);
    }
    if (filterStatus && filterStatus !== 'all') {
      const isActive = filterStatus === 'active';
      list = list?.filter(c => c?.active === isActive);
    }
    if (sortConfig?.key) {
      list = [...list]?.sort((a, b) => {
        const aVal = String(a?.[sortConfig?.key] || '');
        const bVal = String(b?.[sortConfig?.key] || '');
        const cmp = aVal?.localeCompare(bVal);
        return sortConfig?.direction === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [customers, searchTerm, includeDeactivated, sortConfig, filterCustomerCode, filterCustomerName, filterPriceType, filterBusinessExecutive, filterLocation, filterStatus]);

  // Grand total for Credit Limit
  const grandTotalCreditLimit = useMemo(() => {
    return filteredCustomers?.reduce((sum, c) => sum + parseFloat(c?.creditLimit || 0), 0);
  }, [filteredCustomers]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers?.length / ITEMS_PER_PAGE));
  const paginatedCustomers = filteredCustomers?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSelectAll = (e) => {
    setSelectAll(e?.target?.checked);
    if (e?.target?.checked) {
      setSelectedRows(paginatedCustomers?.map(c => c?.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev?.includes(id) ? prev?.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleExcelExport = () => {
    const headers = COLUMNS?.map(c => c?.label)?.join('\t');
    const rows = filteredCustomers?.map(c =>
      COLUMNS?.map(col => {
        const val = c?.[col?.key];
        if (col?.key === 'creditLimit') return val ? parseFloat(val)?.toFixed(2) : '';
        return val || '';
      })?.join('\t')
    )?.join('\n');
    const content = headers + '\n' + rows;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_list.xls';
    a?.click();
    URL.revokeObjectURL(url);
  };

  const handleDeactivate = () => {
    if (selectedRows?.length === 0 && !selectedRow) {
      alert('Please select a customer to deactivate/reactivate.');
      return;
    }
    alert(`Deactivate/Reactivate action for selected customers`);
  };

  const handleCustomerSaved = (newCustomer) => {
    if (!newCustomer) return;
    clearTimeout(debounceTimerRef?.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchCustomers();
    }, 300);
    setCurrentPage(1);
  };

  const handleCustomerUpdated = (updatedCustomer) => {
    if (!updatedCustomer) return;
    clearTimeout(debounceTimerRef?.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchCustomers();
    }, 300);
    const mapped = {
      id: updatedCustomer?.id,
      custVendCode: updatedCustomer?.customer_code || '',
      custVendName: updatedCustomer?.customer_name || '',
      picName: updatedCustomer?.contact_person || updatedCustomer?.business_executive || '',
      salesPriceGroupName: updatedCustomer?.price_type || '',
      creditLimit: updatedCustomer?.credit_limit ? parseFloat(updatedCustomer?.credit_limit) : 0,
      businessExecutive: updatedCustomer?.business_executive || '',
      location: updatedCustomer?.location || '',
      mobile: updatedCustomer?.mobile || '',
      email: updatedCustomer?.email || '',
      status: updatedCustomer?.status || 'Active',
      active: updatedCustomer?.status === 'Active',
      businessName: updatedCustomer?.business_name || '',
      businessAddress: updatedCustomer?.business_address || '',
      callDays: updatedCustomer?.call_days || '',
      customerType: updatedCustomer?.customer_type || '',
    };
    setSelectedRow(mapped);
  };

  const handleSaved = (savedCustomer, isEdit) => {
    if (isEdit) {
      handleCustomerUpdated(savedCustomer);
    } else {
      handleCustomerSaved(savedCustomer);
    }
  };

  const handleEditCustomer = () => {
    const target = selectedRow || (selectedRows?.length === 1 ? customers?.find(c => c?.id === selectedRows?.[0]) : null);
    if (!target) {
      alert('Please select a customer to edit.');
      return;
    }
    setEditCustomer(target);
    setShowNewCustomerModal(true);
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return '\u25BC';
    return sortConfig?.direction === 'asc' ? '\u25B2' : '\u25BC';
  };

  const formatCreditLimit = (val) => {
    if (!val && val !== 0) return '-';
    return parseFloat(val)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 10;
    const start = Math.max(1, Math.min(currentPage - 4, totalPages - maxVisible + 1));
    const end = Math.min(totalPages, start + maxVisible - 1);
    for (let i = start; i <= end; i++) {
      pages?.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className="w-7 h-7 text-xs font-medium rounded transition-colors"
          style={currentPage === i ? { backgroundColor: 'var(--color-primary)', color: '#fff' } : { color: '#4B5563' }}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  const hasActiveFilters = filterCustomerCode || filterCustomerName || filterPriceType || filterBusinessExecutive || filterLocation || (filterStatus && filterStatus !== 'all');

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-background border-b border-border">
        <span className="text-yellow-500 text-lg">★</span>
        <h1 className="text-base font-semibold text-foreground">Customer/Vendor List</h1>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer ml-2">
          <input
            type="checkbox"
            checked={includeDeactivated}
            onChange={e => { setIncludeDeactivated(e?.target?.checked); setCurrentPage(1); }}
            className="w-3.5 h-3.5"
            style={{ accentColor: 'var(--color-primary)' }}
          />
          Include Deactivated
        </label>
        <div className="flex items-center gap-0 ml-2 flex-1 max-w-xs">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e?.target?.value); setCurrentPage(1); }}
            placeholder="Input and press [Enter]"
            className="flex-1 h-7 px-2 text-xs border border-border rounded-l focus:outline-none"
            onKeyDown={e => e?.key === 'Enter' && setCurrentPage(1)}
          />
          {/* Search(F3) Filter Dropdown */}
          <div className="relative" ref={filterPanelRef}>
            <button
              onClick={() => setShowFilterPanel(prev => !prev)}
              className="h-7 px-3 text-xs font-medium rounded-r border-l-0 transition-colors flex items-center gap-1"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff', border: `1px solid var(--color-primary)` }}
            >
              Search(F3)
              <span className="text-xs opacity-70">{showFilterPanel ? '▲' : '▼'}</span>
              {hasActiveFilters && (
                <span className="ml-1 bg-yellow-400 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none" style={{ color: 'var(--color-primary)' }}>
                  !
                </span>
              )}
            </button>

            {/* Filter Dropdown Panel */}
            {showFilterPanel && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-400 shadow-xl z-50" style={{ width: '520px' }}>
                {/* Panel Header */}
                <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <span className="text-xs font-semibold text-white">Search Options</span>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="text-sm leading-none opacity-70 hover:opacity-100 text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Search Fields Grid */}
                <div className="p-2 bg-background">
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      {/* Customer Code & Customer Name */}
                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap w-32 border border-border bg-muted/40 px-2">Customer Code</td>
                        <td className="py-1 px-2 border border-border">
                          <input
                            type="text"
                            value={filterCustomerCode}
                            onChange={e => setFilterCustomerCode(e?.target?.value)}
                            placeholder="e.g. C001"
                            className="w-full h-6 px-2 text-xs border border-border focus:outline-none bg-background"
                          />
                        </td>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Customer Name</td>
                        <td className="py-1 px-2 border border-border">
                          <input
                            type="text"
                            value={filterCustomerName}
                            onChange={e => setFilterCustomerName(e?.target?.value)}
                            placeholder="Search name..."
                            className="w-full h-6 px-2 text-xs border border-border focus:outline-none bg-background"
                          />
                        </td>
                      </tr>

                      {/* Price Type & Business Executive */}
                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Price Type</td>
                        <td className="py-1 px-2 border border-border">
                          <select
                            value={filterPriceType}
                            onChange={e => setFilterPriceType(e?.target?.value)}
                            className="w-full h-6 px-1 text-xs border border-border focus:outline-none bg-background"
                          >
                            <option value="">-- All --</option>
                            {uniquePriceTypes?.map(pt => (
                              <option key={pt} value={pt}>{pt}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Business Executive</td>
                        <td className="py-1 px-2 border border-border">
                          <select
                            value={filterBusinessExecutive}
                            onChange={e => setFilterBusinessExecutive(e?.target?.value)}
                            className="w-full h-6 px-1 text-xs border border-border focus:outline-none bg-background"
                          >
                            <option value="">-- All --</option>
                            {uniqueExecutives?.map(exec => (
                              <option key={exec} value={exec}>{exec}</option>
                            ))}
                          </select>
                        </td>
                      </tr>

                      {/* Location & Status */}
                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Location</td>
                        <td className="py-1 px-2 border border-border">
                          <select
                            value={filterLocation}
                            onChange={e => setFilterLocation(e?.target?.value)}
                            className="w-full h-6 px-1 text-xs border border-border focus:outline-none bg-background"
                          >
                            <option value="">-- All --</option>
                            {uniqueLocations?.map(loc => (
                              <option key={loc} value={loc}>{loc}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Status</td>
                        <td className="py-1 px-2 border border-border">
                          <div className="flex flex-wrap gap-1">
                            {['all', 'active', 'inactive']?.map(s => (
                              <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className="px-2 py-0.5 text-xs border transition-colors capitalize"
                                style={filterStatus === s
                                  ? { backgroundColor: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' }
                                  : { backgroundColor: '#fff', color: '#4B5563', borderColor: '#D1D5DB' }}
                              >
                                {s === 'all' ? 'All' : s?.charAt(0)?.toUpperCase() + s?.slice(1)}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 px-3 py-1 bg-muted/30 border-t border-border">
                  <button
                    onClick={handleApplyFilters}
                    className="h-7 px-5 text-xs font-semibold text-white transition-colors"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    Search
                  </button>
                  <button
                    onClick={handleResetFilters}
                    className="h-7 px-5 text-xs font-medium bg-background border border-border text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="h-7 px-5 text-xs font-medium bg-background border border-border text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <button className="h-7 px-3 text-xs border border-border rounded text-muted-foreground hover:bg-accent transition-colors">Option</button>
        <button className="h-7 px-3 text-xs border border-border rounded text-muted-foreground hover:bg-accent transition-colors">Help</button>
      </div>

      {/* Pagination Top */}
      <div className="flex items-center gap-1 px-4 py-1.5 bg-background border-b border-border">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground hover:bg-accent rounded disabled:opacity-40"
        >
          «
        </button>
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground hover:bg-accent rounded disabled:opacity-40"
        >
          ‹
        </button>
        {renderPageNumbers()}
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground hover:bg-accent rounded disabled:opacity-40"
        >
          ›
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground hover:bg-accent rounded disabled:opacity-40"
        >
          »
        </button>
        <span className="text-xs text-muted-foreground ml-1">/ {totalPages}</span>
        <span className="text-xs text-muted-foreground ml-3">({filteredCustomers?.length} records)</span>
      </div>

      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-auto bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-sm text-gray-400">Loading customers...</div>
          </div>
        ) : (
          <table className="w-full border-collapse text-xs" style={{ minWidth: '1100px' }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-primary/10">
                <th className="border border-border px-1 py-1.5 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-3 h-3"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                </th>
                <th className="border border-border px-1 py-1.5 w-8 text-center text-muted-foreground">#</th>
                {COLUMNS?.map(col => (
                  <th
                    key={col?.key}
                    className={`border border-border px-2 py-1.5 text-left font-medium text-foreground cursor-pointer hover:bg-primary/20 whitespace-nowrap select-none ${col?.width}`}
                    onClick={() => handleSort(col?.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col?.label}
                      <span className="text-muted-foreground/50 text-xs">{getSortIcon(col?.key)}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers?.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS?.length + 2} className="text-center py-12 text-muted-foreground">
                    No customers found
                  </td>
                </tr>
              ) : (
                paginatedCustomers?.map((customer, idx) => {
                  const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const isSelected = selectedRows?.includes(customer?.id);
                  const isActive = selectedRow?.id === customer?.id;
                  return (
                    <tr
                      key={customer?.id}
                      onClick={() => setSelectedRow(customer)}
                      className="cursor-pointer transition-colors"
                      style={{
                        backgroundColor: (isActive || isSelected)
                          ? 'color-mix(in srgb, var(--color-primary) 8%, white)'
                          : idx % 2 === 0 ? '#fff' : '#F9FAFB',
                        opacity: !customer?.active ? 0.6 : 1,
                      }}
                    >
                      <td className="border border-border px-1 py-0.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(customer?.id)}
                          onClick={e => e?.stopPropagation()}
                          className="w-3 h-3"
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                      </td>
                      <td className="border border-border px-1 py-0.5 text-center text-muted-foreground">{rowNum}</td>
                      <td className="border border-border px-2 py-0.5 font-medium" style={{ color: 'var(--color-primary)' }}>{customer?.custVendCode || '-'}</td>
                      <td className="border border-border px-2 py-0.5" style={{ color: 'var(--color-primary)' }}>{customer?.custVendName || '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{customer?.picName || '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{customer?.salesPriceGroupName || '-'}</td>
                      <td className="border border-border px-2 py-0.5 font-sans tabular-nums text-right text-foreground">
                        {customer?.creditLimit ? formatCreditLimit(customer?.creditLimit) : '-'}
                      </td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{customer?.businessExecutive || '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{customer?.location || '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{customer?.mobile || '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{customer?.email || '-'}</td>
                      <td className="border border-border px-2 py-0.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                          customer?.active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                        }`}>
                          {customer?.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Grand Total Footer Row */}
            {filteredCustomers?.length > 0 && (
              <tfoot>
                <tr className="bg-primary/10 font-semibold">
                  <td colSpan={2} className="border border-border px-2 py-1.5"></td>
                  <td colSpan={4} className="border border-border px-2 py-1.5 text-right text-xs font-bold text-foreground">Grand Total</td>
                  <td className="border border-border px-2 py-1.5 text-right text-xs font-bold text-foreground font-sans tabular-nums">
                    {formatCreditLimit(grandTotalCreditLimit)}
                  </td>
                  <td colSpan={4} className="border border-border px-2 py-1.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/30 border-t border-border flex-wrap">
        <button
          onClick={() => setShowNewCustomerModal(true)}
          className="h-8 px-3 text-xs font-semibold text-white rounded transition-colors flex items-center gap-1"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          New (F2)
        </button>
        <button
          onClick={handleEditCustomer}
          className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => setShowNewExecutiveModal(true)}
          className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors"
        >
          New Executive
        </button>
        <button
          onClick={() => setShowNewSupplierModal(true)}
          className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors"
        >
          New Supplier
        </button>
        <button className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors">
          Relation Settings
        </button>
        <button className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors">
          Level Group
        </button>
        <button className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors">
          Change
        </button>
        <button
          onClick={handleDeactivate}
          className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors flex items-center gap-1"
        >
          Deactive/Reactivate
          <span className="text-muted-foreground">▲</span>
        </button>
        <button
          onClick={handleExcelExport}
          className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors flex items-center gap-1"
        >
          Excel
          <span className="text-muted-foreground">▲</span>
        </button>
        <button className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors">
          ECOUNT Web Uploader
        </button>
        {selectedRows?.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">{selectedRows?.length} row(s) selected</span>
        )}
      </div>

      {/* Modals */}
      <NewCustomerModal
        key={editCustomer?.id ?? 'new'}
        isOpen={showNewCustomerModal}
        onClose={() => { setShowNewCustomerModal(false); setEditCustomer(null); }}
        onSaved={handleSaved}
        editItem={editCustomer}
      />
      <NewExecutiveModal
        isOpen={showNewExecutiveModal}
        onClose={() => setShowNewExecutiveModal(false)}
        onSaved={() => {}}
      />
      <NewSupplierModal
        isOpen={showNewSupplierModal}
        onClose={() => setShowNewSupplierModal(false)}
        onSaved={() => {}}
      />
    </div>
  );
};

export default CustomerSpreadsheet;
