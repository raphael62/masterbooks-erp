import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import NewLocationModal from '../../customer-management/components/NewLocationModal';

const ITEMS_PER_PAGE = 23;
const COLUMNS = [
  { key: 'code', label: 'Location Code', width: 'w-28' },
  { key: 'name', label: 'Location Name', width: 'w-44' },
  { key: 'address', label: 'Address', width: 'w-40' },
  { key: 'city', label: 'City', width: 'w-24' },
  { key: 'location_type', label: 'Region/Type', width: 'w-24' },
  { key: 'phone', label: 'Phone', width: 'w-28' },
  { key: 'manager_name', label: 'Manager', width: 'w-32' },
  { key: 'company_name', label: 'Company', width: 'w-32' },
  { key: 'inventory_enabled_label', label: 'Inv. Enabled', width: 'w-24' },
  { key: 'status', label: 'Status', width: 'w-20' },
];

const LocationSpreadsheet = () => {
  const [locations, setLocations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeDeactivated, setIncludeDeactivated] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editLocation, setEditLocation] = useState(null);
  const searchInputRef = useRef(null);

  // Filter panel state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterPanelRef = useRef(null);
  const [filterCode, setFilterCode] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        ?.from('locations')
        ?.select('*, companies(name, code), business_executives(full_name, exec_code)')
        ?.order('name');
      if (error) throw error;
      const mapped = (data || [])?.map(loc => ({
        ...loc,
        company_name: loc?.companies?.name || '',
        company_code: loc?.companies?.code || '',
        manager_name: loc?.business_executives?.full_name || loc?.manager || '',
        inventory_enabled_label: loc?.inventory_enabled ? 'Yes' : 'No',
        status: loc?.is_active ? 'Active' : 'Inactive',
      }));
      setLocations(mapped);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const { data } = await supabase?.from('companies')?.select('id, name, code')?.eq('is_active', true)?.order('name');
      setCompanies(data || []);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
    fetchCompanies();
  }, [fetchLocations, fetchCompanies]);

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
        setEditLocation(null);
        setShowNewModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const uniqueRegions = useMemo(() => {
    const regions = [...new Set(locations?.map(l => l?.location_type)?.filter(Boolean))];
    return regions?.sort();
  }, [locations]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setShowFilterPanel(false);
  };

  const handleResetFilters = () => {
    setFilterCode('');
    setFilterName('');
    setFilterCompany('');
    setFilterRegion('');
    setFilterStatus('all');
    setSearchTerm('');
    setCurrentPage(1);
    setShowFilterPanel(false);
  };

  const filteredLocations = useMemo(() => {
    let list = locations;
    if (!includeDeactivated) {
      list = list?.filter(l => l?.is_active);
    }
    if (searchTerm?.trim()) {
      const term = searchTerm?.toLowerCase();
      list = list?.filter(l =>
        l?.code?.toLowerCase()?.includes(term) ||
        l?.name?.toLowerCase()?.includes(term) ||
        l?.address?.toLowerCase()?.includes(term) ||
        l?.city?.toLowerCase()?.includes(term) ||
        l?.phone?.toLowerCase()?.includes(term) ||
        l?.company_name?.toLowerCase()?.includes(term)
      );
    }
    if (filterCode?.trim()) {
      list = list?.filter(l => l?.code?.toLowerCase()?.includes(filterCode?.toLowerCase()));
    }
    if (filterName?.trim()) {
      list = list?.filter(l => l?.name?.toLowerCase()?.includes(filterName?.toLowerCase()));
    }
    if (filterCompany) {
      list = list?.filter(l => l?.company_id === filterCompany);
    }
    if (filterRegion) {
      list = list?.filter(l => l?.location_type === filterRegion);
    }
    if (filterStatus && filterStatus !== 'all') {
      const isActive = filterStatus === 'active';
      list = list?.filter(l => l?.is_active === isActive);
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
  }, [locations, searchTerm, includeDeactivated, sortConfig, filterCode, filterName, filterCompany, filterRegion, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredLocations?.length / ITEMS_PER_PAGE));
  const paginatedLocations = filteredLocations?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSelectAll = (e) => {
    setSelectAll(e?.target?.checked);
    if (e?.target?.checked) {
      setSelectedRows(paginatedLocations?.map(l => l?.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev?.includes(id) ? prev?.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleEdit = () => {
    if (!selectedRow) {
      alert('Please select a location to edit.');
      return;
    }
    setEditLocation(selectedRow);
    setShowNewModal(true);
  };

  const handleDelete = async () => {
    const targets = selectedRows?.length > 0 ? selectedRows : selectedRow ? [selectedRow?.id] : [];
    if (targets?.length === 0) {
      alert('Please select a location to delete.');
      return;
    }
    if (!window.confirm(`Delete ${targets?.length} location(s)? This cannot be undone.`)) return;
    try {
      for (const id of targets) {
        await supabase?.from('locations')?.delete()?.eq('id', id);
      }
      fetchLocations();
      setSelectedRows([]);
      setSelectedRow(null);
    } catch (err) {
      console.error('Error deleting location:', err);
      alert('Failed to delete location(s). They may be in use.');
    }
  };

  const handleExcelExport = () => {
    const headers = COLUMNS?.map(c => c?.label)?.join('\t');
    const rows = filteredLocations?.map(l =>
      COLUMNS?.map(col => l?.[col?.key] || '')?.join('\t')
    )?.join('\n');
    const content = headers + '\n' + rows;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'location_list.xls';
    a?.click();
    URL.revokeObjectURL(url);
  };

  const handleModalSaved = () => {
    fetchLocations();
    setEditLocation(null);
    setShowNewModal(false);
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return '\u25BC';
    return sortConfig?.direction === 'asc' ? '\u25B2' : '\u25BC';
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

  const hasActiveFilters = filterCode || filterName || filterCompany || filterRegion || (filterStatus && filterStatus !== 'all');

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-background border-b border-border">
        <span className="text-yellow-500 text-lg">★</span>
        <h1 className="text-base font-semibold text-foreground">Location List</h1>
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
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-400 shadow-xl z-50" style={{ width: '500px' }}>
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
                      {/* Location Code & Location Name */}
                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap w-28 border border-border bg-muted/40 px-2">Location Code</td>
                        <td className="py-1 px-2 border border-border">
                          <input
                            type="text"
                            value={filterCode}
                            onChange={e => setFilterCode(e?.target?.value)}
                            placeholder="e.g. MW001"
                            className="w-full h-6 px-2 text-xs border border-border focus:outline-none bg-background"
                          />
                        </td>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap w-28 border border-border bg-muted/40 px-2">Location Name</td>
                        <td className="py-1 px-2 border border-border">
                          <input
                            type="text"
                            value={filterName}
                            onChange={e => setFilterName(e?.target?.value)}
                            placeholder="Search name..."
                            className="w-full h-6 px-2 text-xs border border-border focus:outline-none bg-background"
                          />
                        </td>
                      </tr>

                      {/* Company & Region */}
                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Company</td>
                        <td className="py-1 px-2 border border-border">
                          <select
                            value={filterCompany}
                            onChange={e => setFilterCompany(e?.target?.value)}
                            className="w-full h-6 px-1 text-xs border border-border focus:outline-none bg-background"
                          >
                            <option value="">-- All --</option>
                            {companies?.map(c => (
                              <option key={c?.id} value={c?.id}>{c?.code} - {c?.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Region/Type</td>
                        <td className="py-1 px-2 border border-border">
                          <select
                            value={filterRegion}
                            onChange={e => setFilterRegion(e?.target?.value)}
                            className="w-full h-6 px-1 text-xs border border-border focus:outline-none bg-background"
                          >
                            <option value="">-- All --</option>
                            {uniqueRegions?.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                      </tr>

                      {/* Status */}
                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Status</td>
                        <td colSpan={3} className="py-1 px-2 border border-border">
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
        >«</button>
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground hover:bg-accent rounded disabled:opacity-40"
        >‹</button>
        {renderPageNumbers()}
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground hover:bg-accent rounded disabled:opacity-40"
        >›</button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground hover:bg-accent rounded disabled:opacity-40"
        >»</button>
        <span className="text-xs text-muted-foreground ml-1">/ {totalPages}</span>
        <span className="text-xs text-muted-foreground ml-3">({filteredLocations?.length} records)</span>
      </div>

      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-auto bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-sm text-gray-400">Loading locations...</div>
          </div>
        ) : (
          <table className="w-full border-collapse text-xs font-sans" style={{ minWidth: '1100px' }}>
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
              {paginatedLocations?.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS?.length + 2} className="text-center py-12 text-muted-foreground">
                    No locations found
                  </td>
                </tr>
              ) : (
                paginatedLocations?.map((loc, idx) => {
                  const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const isSelected = selectedRows?.includes(loc?.id);
                  const isActive = selectedRow?.id === loc?.id;
                  return (
                    <tr
                      key={loc?.id}
                      onClick={() => setSelectedRow(loc)}
                      className="cursor-pointer transition-colors"
                      style={{
                        backgroundColor: (isActive || isSelected)
                          ? 'color-mix(in srgb, var(--color-primary) 8%, white)'
                          : idx % 2 === 0 ? '#fff' : '#F9FAFB',
                        opacity: !loc?.is_active ? 0.6 : 1,
                      }}
                    >
                      <td className="border border-border px-1 py-0.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(loc?.id)}
                          onClick={e => e?.stopPropagation()}
                          className="w-3 h-3"
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                      </td>
                      <td className="border border-border px-1 py-0.5 text-center text-muted-foreground tabular-nums">{rowNum}</td>
                      <td className="border border-border px-2 py-0.5 font-medium tabular-nums" style={{ color: 'var(--color-primary)' }}>{loc?.code || '-'}</td>
                      <td
                        className="border border-border px-2 py-0.5 cursor-pointer hover:underline"
                        style={{ color: 'var(--color-primary)' }}
                        onClick={e => { e?.stopPropagation(); setEditLocation(loc); setShowNewModal(true); }}
                      >
                        {loc?.name || '-'}
                      </td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{loc?.address || '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{loc?.city || '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground capitalize">{loc?.location_type || '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground tabular-nums">{loc?.phone || '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{loc?.manager_name || '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{loc?.company_name || '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                          loc?.inventory_enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {loc?.inventory_enabled ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="border border-border px-2 py-0.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                          loc?.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                        }`}>
                          {loc?.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/30 border-t border-border flex-wrap">
        <button
          onClick={() => { setEditLocation(null); setShowNewModal(true); }}
          className="h-8 px-3 text-xs font-semibold text-white rounded transition-colors flex items-center gap-1"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          New (F2)
        </button>
        <button
          onClick={handleEdit}
          className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors"
        >
          Delete
        </button>
        <button
          onClick={handleExcelExport}
          className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors flex items-center gap-1"
        >
          Excel
          <span className="text-muted-foreground">▲</span>
        </button>
        {selectedRows?.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">{selectedRows?.length} row(s) selected</span>
        )}
      </div>

      {/* New/Edit Location Modal */}
      <NewLocationModal
        isOpen={showNewModal}
        onClose={() => { setShowNewModal(false); setEditLocation(null); }}
        onSaved={handleModalSaved}
        editLocation={editLocation}
      />
    </div>
  );
};

export default LocationSpreadsheet;
