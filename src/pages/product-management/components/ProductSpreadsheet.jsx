import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import NewProductModal from '../../inventory-management/components/NewProductModal';

const ITEMS_PER_PAGE = 23;

const COLUMNS = [
  { key: 'product_code', label: 'Product Code', width: 'w-28' },
  { key: 'product_name', label: 'Product Name', width: 'w-48' },
  { key: 'category', label: 'Category', width: 'w-32' },
  { key: 'unit_of_measure', label: 'Unit of Measure', width: 'w-28' },
  { key: 'pack_unit', label: 'Pack Unit', width: 'w-20', numeric: true },
  { key: 'empties_type', label: 'Empties Type', width: 'w-32' },
  { key: 'is_taxable', label: 'Taxable', width: 'w-20' },
  { key: 'is_returnable', label: 'Returnable', width: 'w-24' },
  { key: 'plastic_cost', label: 'Plastic Cost', width: 'w-28', numeric: true },
  { key: 'bottle_cost', label: 'Bottle Cost', width: 'w-28', numeric: true },
  { key: 'reorder_level', label: 'Reorder Level', width: 'w-24', numeric: true },
  { key: 'stock_on_hand', label: 'Stock on Hand', width: 'w-28', numeric: true },
  { key: 'supplier_name', label: 'Supplier', width: 'w-40' },
  { key: 'status', label: 'Status', width: 'w-20' },
];

const ProductSpreadsheet = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeDeactivated, setIncludeDeactivated] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const searchInputRef = useRef(null);

  // Filter panel state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterPanelRef = useRef(null);
  const [filterProductCode, setFilterProductCode] = useState('');
  const [filterProductName, setFilterProductName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase?.from('products')?.select('*')?.order('product_name');
      if (error) throw error;
      setProducts(data?.length > 0 ? data : []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
        setShowNewProductModal(true);
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

  const uniqueSuppliers = useMemo(() => {
    const suppliers = [...new Set(products?.map(p => p?.supplier_name)?.filter(Boolean))];
    return suppliers?.sort();
  }, [products]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setShowFilterPanel(false);
  };

  const handleResetFilters = () => {
    setFilterProductCode('');
    setFilterProductName('');
    setFilterCategory('');
    setFilterSupplier('');
    setFilterStatus('all');
    setSearchTerm('');
    setCurrentPage(1);
    setShowFilterPanel(false);
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (!includeDeactivated) {
      list = list?.filter(p => p?.status !== 'inactive');
    }
    if (searchTerm?.trim()) {
      const term = searchTerm?.toLowerCase();
      list = list?.filter(p =>
        p?.product_code?.toLowerCase()?.includes(term) ||
        p?.product_name?.toLowerCase()?.includes(term) ||
        p?.category?.toLowerCase()?.includes(term) ||
        p?.supplier_name?.toLowerCase()?.includes(term)
      );
    }
    if (filterProductCode?.trim()) {
      list = list?.filter(p => p?.product_code?.toLowerCase()?.includes(filterProductCode?.toLowerCase()));
    }
    if (filterProductName?.trim()) {
      list = list?.filter(p => p?.product_name?.toLowerCase()?.includes(filterProductName?.toLowerCase()));
    }
    if (filterCategory) {
      list = list?.filter(p => p?.category === filterCategory);
    }
    if (filterSupplier) {
      list = list?.filter(p => p?.supplier_name === filterSupplier);
    }
    if (filterStatus && filterStatus !== 'all') {
      list = list?.filter(p => p?.status === filterStatus);
    }
    if (sortConfig?.key) {
      list = [...list]?.sort((a, b) => {
        const aVal = a?.[sortConfig?.key];
        const bVal = b?.[sortConfig?.key];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig?.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const cmp = String(aVal || '')?.localeCompare(String(bVal || ''));
        return sortConfig?.direction === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [products, searchTerm, includeDeactivated, sortConfig, filterProductCode, filterProductName, filterCategory, filterSupplier, filterStatus]);

  const grandTotalPlasticCost = useMemo(() => {
    return filteredProducts?.reduce((sum, p) => sum + parseFloat(p?.plastic_cost || 0), 0);
  }, [filteredProducts]);

  const grandTotalBottleCost = useMemo(() => {
    return filteredProducts?.reduce((sum, p) => sum + parseFloat(p?.bottle_cost || 0), 0);
  }, [filteredProducts]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts?.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSelectAll = (e) => {
    setSelectAll(e?.target?.checked);
    if (e?.target?.checked) {
      setSelectedRows(paginatedProducts?.map(p => p?.id));
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
      alert('Please select a product to edit.');
      return;
    }
    alert(`Edit product: ${selectedRow?.product_name}`);
  };

  const handleDelete = async () => {
    const targets = selectedRows?.length > 0 ? selectedRows : selectedRow ? [selectedRow?.id] : [];
    if (targets?.length === 0) {
      alert('Please select a product to delete.');
      return;
    }
    if (!window.confirm(`Delete ${targets?.length} product(s)?`)) return;
    try {
      for (const id of targets) {
        await supabase?.from('products')?.delete()?.eq('id', id);
      }
      fetchProducts();
      setSelectedRows([]);
      setSelectedRow(null);
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const handleExcelExport = () => {
    const headers = COLUMNS?.map(c => c?.label)?.join('\t');
    const rows = filteredProducts?.map(p =>
      COLUMNS?.map(col => {
        const val = p?.[col?.key];
        if (col?.numeric) return val ? parseFloat(val)?.toFixed(2) : '0.00';
        return val || '';
      })?.join('\t')
    )?.join('\n');
    const content = headers + '\n' + rows;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_list.xls';
    a?.click();
    URL.revokeObjectURL(url);
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return '\u25BC';
    return sortConfig?.direction === 'asc' ? '\u25B2' : '\u25BC';
  };

  const formatNumber = (val) => {
    if (val === null || val === undefined || val === '') return '-';
    return parseFloat(val)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatInt = (val) => {
    if (val === null || val === undefined || val === '') return '-';
    return parseInt(val)?.toLocaleString('en-GB');
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

  const hasActiveFilters = filterProductCode || filterProductName || filterCategory || filterSupplier || (filterStatus && filterStatus !== 'all');

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-background border-b border-border">
        <span className="text-yellow-500 text-lg">★</span>
        <h1 className="text-base font-semibold text-foreground">Product List</h1>
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
                      {/* Product Code & Product Name */}
                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap w-28 border border-border bg-muted/40 px-2">Product Code</td>
                        <td className="py-1 px-2 border border-border">
                          <input
                            type="text"
                            value={filterProductCode}
                            onChange={e => setFilterProductCode(e?.target?.value)}
                            placeholder="e.g. P001"
                            className="w-full h-6 px-2 text-xs border border-border focus:outline-none bg-background"
                          />
                        </td>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap w-28 border border-border bg-muted/40 px-2">Product Name</td>
                        <td className="py-1 px-2 border border-border">
                          <input
                            type="text"
                            value={filterProductName}
                            onChange={e => setFilterProductName(e?.target?.value)}
                            placeholder="Search name..."
                            className="w-full h-6 px-2 text-xs border border-border focus:outline-none bg-background"
                          />
                        </td>
                      </tr>

                      {/* Category & Supplier */}
                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Category</td>
                        <td className="py-1 px-2 border border-border">
                          <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e?.target?.value)}
                            className="w-full h-6 px-1 text-xs border border-border focus:outline-none bg-background"
                          >
                            <option value="">-- All --</option>
                          </select>
                        </td>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Supplier</td>
                        <td className="py-1 px-2 border border-border">
                          <select
                            value={filterSupplier}
                            onChange={e => setFilterSupplier(e?.target?.value)}
                            className="w-full h-6 px-1 text-xs border border-border focus:outline-none bg-background"
                          >
                            <option value="">-- All --</option>
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
        <span className="text-xs text-muted-foreground ml-3">({filteredProducts?.length} records)</span>
      </div>

      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-auto bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-sm text-gray-400">Loading products...</div>
          </div>
        ) : (
          <table className="w-full border-collapse text-xs" style={{ minWidth: '1300px' }}>
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
              {paginatedProducts?.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS?.length + 2} className="text-center py-12 text-muted-foreground">
                    No products found
                  </td>
                </tr>
              ) : (
                paginatedProducts?.map((product, idx) => {
                  const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const isSelected = selectedRows?.includes(product?.id);
                  const isActive = selectedRow?.id === product?.id;
                  const isInactive = product?.status === 'inactive';
                  return (
                    <tr
                      key={product?.id}
                      onClick={() => setSelectedRow(product)}
                      className="cursor-pointer transition-colors"
                      style={{
                        backgroundColor: (isActive || isSelected)
                          ? 'color-mix(in srgb, var(--color-primary) 8%, white)'
                          : idx % 2 === 0 ? '#fff' : '#F9FAFB',
                        opacity: isInactive ? 0.6 : 1,
                      }}
                    >
                      <td className="border border-border px-1 py-0.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(product?.id)}
                          onClick={e => e?.stopPropagation()}
                          className="w-3 h-3"
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                      </td>
                      <td className="border border-border px-1 py-0.5 text-center text-muted-foreground">{rowNum}</td>
                      <td className="border border-border px-2 py-0.5 font-medium font-sans tabular-nums" style={{ color: 'var(--color-primary)' }}>
                        {product?.product_code || '-'}
                      </td>
                      <td
                        className="border border-border px-2 py-0.5 cursor-pointer hover:underline"
                        style={{ color: 'var(--color-primary)' }}
                        onClick={e => { e?.stopPropagation(); setSelectedRow(product); setShowNewProductModal(true); }}
                      >
                        {product?.product_name || '-'}
                      </td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{product?.category || '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{product?.unit_of_measure || '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground font-sans tabular-nums text-right">
                        {product?.pack_unit ? formatInt(product?.pack_unit) : '-'}
                      </td>
                      <td className="border border-border px-2 py-0.5 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                          product?.empties_type && product?.empties_type !== 'None' ? 'bg-blue-50 text-blue-700' : 'bg-muted text-muted-foreground'
                        }`}>
                          {product?.empties_type}
                        </span>
                      </td>
                      <td className="border border-border px-2 py-0.5 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                          product?.is_taxable ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                        }`}>
                          {product?.is_taxable ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="border border-border px-2 py-0.5 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                          product?.is_returnable ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                        }`}>
                          {product?.is_returnable ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="border border-border px-2 py-0.5 text-foreground font-sans tabular-nums text-right">
                        {formatNumber(product?.cost_price)}
                      </td>
                      <td className="border border-border px-2 py-0.5 text-foreground font-sans tabular-nums text-right">
                        {formatNumber(product?.selling_price)}
                      </td>
                      <td className="border border-border px-2 py-0.5 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                          product?.is_returnable ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                        }`}>
                          {product?.is_returnable ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="border border-border px-2 py-0.5 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                          product?.is_returnable ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                        }`}>
                          {product?.is_returnable ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="border border-border px-2 py-0.5 text-foreground font-sans tabular-nums text-right">
                        {formatNumber(product?.cost_price)}
                      </td>
                      <td className="border border-border px-2 py-0.5 text-foreground font-sans tabular-nums text-right">
                        {formatNumber(product?.selling_price)}
                      </td>
                      <td className="border border-border px-2 py-0.5 font-sans tabular-nums text-right">
                        {product?.is_returnable ? (
                          <span className="text-amber-700">{formatNumber(product?.plastic_cost)}</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="border border-border px-2 py-0.5 font-sans tabular-nums text-right">
                        {product?.is_returnable ? (
                          <span className="text-amber-700">{formatNumber(product?.bottle_cost)}</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="border border-border px-2 py-0.5 text-foreground font-sans tabular-nums text-right">
                        {formatInt(product?.reorder_level)}
                      </td>
                      <td className="border border-border px-2 py-0.5 text-foreground font-sans tabular-nums text-right">
                        {formatInt(product?.stock_on_hand)}
                      </td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{product?.supplier_name || '-'}</td>
                      <td className="border border-border px-2 py-0.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                          product?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                        }`}>
                          {product?.status || 'active'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Grand Total Footer Row */}
            {filteredProducts?.length > 0 && (
              <tfoot>
                <tr className="bg-primary/10 font-semibold">
                  <td colSpan={2} className="border border-border px-2 py-1.5"></td>
                  <td colSpan={2} className="border border-border px-2 py-1.5"></td>
                  <td colSpan={4} className="border border-border px-2 py-1.5 text-right text-xs font-bold text-foreground">Grand Total</td>
                  <td className="border border-border px-2 py-1.5 text-right text-xs font-bold text-amber-700 font-sans tabular-nums">
                    {formatNumber(grandTotalPlasticCost)}
                  </td>
                  <td className="border border-border px-2 py-1.5 text-right text-xs font-bold text-amber-700 font-sans tabular-nums">
                    {formatNumber(grandTotalBottleCost)}
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
          onClick={() => setShowNewProductModal(true)}
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

      {/* New Product Modal */}
      <NewProductModal
        isOpen={showNewProductModal}
        onClose={() => { setShowNewProductModal(false); setSelectedRow(null); }}
        editItem={selectedRow}
        onSuccess={() => {
          setShowNewProductModal(false);
          setSelectedRow(null);
          fetchProducts();
        }}
      />
    </div>
  );
};

export default ProductSpreadsheet;
