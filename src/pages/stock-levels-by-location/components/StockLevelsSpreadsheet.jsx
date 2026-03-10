import React, { useState, useMemo, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import StockTransferModal from './StockTransferModal';

const ITEMS_PER_PAGE = 23;

const getStatusBadge = (status) => {
  switch (status) {
    case 'low':
      return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Low</span>;
    case 'overstock':
      return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700"><span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>Over</span>;
    case 'out':
      return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>Out</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>OK</span>;
  }
};

const getStockCellClass = (stock, reorderLevel) => {
  if (stock <= 0) return 'bg-gray-50 text-gray-400';
  if (stock <= reorderLevel) return 'bg-red-50 text-red-700 font-medium';
  if (stock > reorderLevel * 3) return 'bg-orange-50 text-orange-700';
  return 'bg-green-50 text-green-700';
};

const StockLevelsSpreadsheet = ({ stockData, locations, activeLocation, isLoading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRow, setSelectedRow] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferProduct, setTransferProduct] = useState(null);
  const filterPanelRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e?.key === 'F3') { e?.preventDefault(); setShowFilterPanel(prev => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterPanelRef?.current && !filterPanelRef?.current?.contains(e?.target)) {
        setShowFilterPanel(false);
      }
    };
    if (showFilterPanel) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterPanel]);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc' }));
    setCurrentPage(1);
  };

  const SortIcon = ({ colKey }) => {
    if (sortConfig?.key !== colKey) return <Icon name="ChevronsUpDown" size={11} className="text-muted-foreground/40 ml-0.5" />;
    return sortConfig?.direction === 'asc'
      ? <Icon name="ChevronUp" size={11} className="text-primary ml-0.5" />
      : <Icon name="ChevronDown" size={11} className="text-primary ml-0.5" />;
  };

  // Determine visible location columns
  const visibleLocations = useMemo(() => {
    if (activeLocation === 'all') return locations;
    return locations?.filter(l => l?.id === activeLocation);
  }, [locations, activeLocation]);

  const filteredData = useMemo(() => {
    let list = stockData || [];
    if (searchTerm?.trim()) {
      const term = searchTerm?.toLowerCase();
      list = list?.filter(r =>
        r?.product_code?.toLowerCase()?.includes(term) ||
        r?.product_name?.toLowerCase()?.includes(term)
      );
    }
    if (filterCategory) list = list?.filter(r => r?.category === filterCategory);
    if (filterStatus && filterStatus !== 'all') list = list?.filter(r => r?.status === filterStatus);
    if (sortConfig?.key) {
      list = [...list]?.sort((a, b) => {
        const aVal = a?.[sortConfig?.key];
        const bVal = b?.[sortConfig?.key];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig?.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return sortConfig?.direction === 'asc' ? String(aVal ||'')?.localeCompare(String(bVal || ''))
          : String(bVal || '')?.localeCompare(String(aVal || ''));
      });
    }
    return list;
  }, [stockData, searchTerm, filterCategory, filterStatus, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredData?.length / ITEMS_PER_PAGE));
  const paginatedData = filteredData?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const uniqueCategories = useMemo(() => {
    return [...new Set(stockData?.map(r => r?.category)?.filter(Boolean))]?.sort();
  }, [stockData]);

  const handleTransfer = (row) => {
    setTransferProduct(row);
    setShowTransferModal(true);
  };

  const handleExport = () => {
    const headers = ['Product Code', 'Product Name', 'Category', 'Pack Unit', ...visibleLocations?.map(l => l?.location_name), 'Total Stock', 'Reorder Level', 'Status'];
    const rows = filteredData?.map(r => [
      r?.product_code,
      r?.product_name,
      r?.category,
      r?.pack_unit,
      ...visibleLocations?.map(l => r?.location_stocks?.[l?.id] || 0),
      r?.total_stock,
      r?.reorder_level,
      r?.status,
    ]);
    const content = [headers, ...rows]?.map(row => row?.join('\t'))?.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock-levels-by-location.txt';
    a?.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-border flex-shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e?.target?.value); setCurrentPage(1); }}
            placeholder="Search product code or name..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filter Panel */}
        <div className="relative" ref={filterPanelRef}>
          <button
            onClick={() => setShowFilterPanel(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-background border border-border rounded hover:bg-accent"
          >
            <Icon name="Filter" size={12} />
            Filter (F3)
          </button>
          {showFilterPanel && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded shadow-lg z-30 p-3">
              <div className="text-xs font-semibold text-foreground mb-2">Filter Options</div>
              <div className="flex flex-col gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Category</label>
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e?.target?.value)}
                    className="w-full border border-border rounded px-2 py-1 text-xs"
                  >
                    <option value="">All Categories</option>
                    {uniqueCategories?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Stock Status</label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e?.target?.value)}
                    className="w-full border border-border rounded px-2 py-1 text-xs"
                  >
                    <option value="all">All Statuses</option>
                    <option value="ok">Adequate</option>
                    <option value="low">Low Stock</option>
                    <option value="overstock">Overstock</option>
                    <option value="out">Out of Stock</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setFilterCategory(''); setFilterStatus('all'); setShowFilterPanel(false); }}
                    className="flex-1 px-2 py-1 text-xs text-muted-foreground bg-muted rounded hover:bg-accent"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="flex-1 px-2 py-1 text-xs text-white rounded"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-background border border-border rounded hover:bg-accent"
        >
          <Icon name="RefreshCw" size={12} />
          Refresh
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-background border border-border rounded hover:bg-accent"
        >
          <Icon name="Download" size={12} />
          Export
        </button>

        <div className="ml-auto text-xs text-muted-foreground">
          {filteredData?.length} product{filteredData?.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Icon name="Loader2" size={16} className="animate-spin" />
              Loading stock levels...
            </div>
          </div>
        ) : (
          <table className="w-full text-xs border-collapse min-w-max">
            <thead>
              <tr className="bg-primary/10 border-b border-border sticky top-0 z-10">
                <th className="w-8 px-2 py-2 text-center font-semibold text-foreground border-r border-border">#</th>
                <th
                  className="px-3 py-2 text-left font-semibold text-foreground border-r border-border cursor-pointer hover:bg-primary/20 whitespace-nowrap"
                  onClick={() => handleSort('product_code')}
                >
                  <span className="flex items-center">Product Code <SortIcon colKey="product_code" /></span>
                </th>
                <th
                  className="px-3 py-2 text-left font-semibold text-foreground border-r border-border cursor-pointer hover:bg-primary/20 whitespace-nowrap min-w-[180px]"
                  onClick={() => handleSort('product_name')}
                >
                  <span className="flex items-center">Product Name <SortIcon colKey="product_name" /></span>
                </th>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap">Category</th>
                <th
                  className="px-3 py-2 text-center font-semibold text-foreground border-r border-border cursor-pointer hover:bg-primary/20 whitespace-nowrap"
                  onClick={() => handleSort('pack_unit')}
                >
                  <span className="flex items-center justify-center">Pack Unit <SortIcon colKey="pack_unit" /></span>
                </th>
                {visibleLocations?.map(loc => (
                  <th
                    key={loc?.id}
                    className="px-3 py-2 text-center font-semibold text-foreground border-r border-border whitespace-nowrap"
                  >
                    <div className="flex flex-col items-center">
                      <span>{loc?.location_name}</span>
                      <span className="text-muted-foreground font-normal text-xs">{loc?.location_code}</span>
                    </div>
                  </th>
                ))}
                <th
                  className="px-3 py-2 text-center font-semibold text-foreground border-r border-border cursor-pointer hover:bg-primary/20 whitespace-nowrap"
                  onClick={() => handleSort('total_stock')}
                >
                  <span className="flex items-center justify-center">Total Stock <SortIcon colKey="total_stock" /></span>
                </th>
                <th
                  className="px-3 py-2 text-center font-semibold text-foreground border-r border-border cursor-pointer hover:bg-primary/20 whitespace-nowrap"
                  onClick={() => handleSort('reorder_level')}
                >
                  <span className="flex items-center justify-center">Reorder Level <SortIcon colKey="reorder_level" /></span>
                </th>
                <th className="px-3 py-2 text-center font-semibold text-foreground border-r border-border whitespace-nowrap">Status</th>
                <th className="px-3 py-2 text-center font-semibold text-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData?.length === 0 ? (
                <tr>
                  <td colSpan={10 + visibleLocations?.length} className="text-center py-12 text-muted-foreground">
                    <Icon name="Package" size={32} className="mx-auto mb-2 opacity-30" />
                    <div>No stock data found</div>
                  </td>
                </tr>
              ) : (
                paginatedData?.map((row, idx) => {
                  const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const isSelected = selectedRow?.id === row?.id;
                  return (
                    <tr
                      key={row?.id}
                      onClick={() => setSelectedRow(row)}
                      className={`border-b border-border cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10' : idx % 2 === 0 ? 'bg-background hover:bg-accent/40' : 'bg-muted/20 hover:bg-accent/40'
                      }`}
                    >
                      <td className="px-2 py-1.5 text-center text-muted-foreground border-r border-border font-mono">{rowNum}</td>
                      <td className="px-3 py-1.5 font-mono border-r border-border whitespace-nowrap" style={{ color: 'var(--color-primary)' }}>{row?.product_code}</td>
                      <td className="px-3 py-1.5 text-foreground border-r border-border">{row?.product_name}</td>
                      <td className="px-3 py-1.5 text-muted-foreground border-r border-border whitespace-nowrap">{row?.category}</td>
                      <td className="px-3 py-1.5 text-center font-mono text-foreground border-r border-border">{row?.pack_unit || 1}</td>
                      {visibleLocations?.map(loc => {
                        const locStock = row?.location_stocks?.[loc?.id] || 0;
                        return (
                          <td
                            key={loc?.id}
                            className={`px-3 py-1.5 text-center font-mono border-r border-border ${getStockCellClass(locStock, row?.reorder_level)}`}
                          >
                            {locStock?.toLocaleString()}
                          </td>
                        );
                      })}
                      <td className={`px-3 py-1.5 text-center font-mono font-semibold border-r border-border ${getStockCellClass(row?.total_stock, row?.reorder_level)}`}>
                        {row?.total_stock?.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 text-center font-mono text-muted-foreground border-r border-border">{row?.reorder_level?.toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-center border-r border-border">{getStatusBadge(row?.status)}</td>
                      <td className="px-3 py-1.5 text-center">
                        <button
                          onClick={(e) => { e?.stopPropagation(); handleTransfer(row); }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded hover:opacity-80 transition-colors"
                          style={{ color: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, white)' }}
                          title="Transfer stock between locations"
                        >
                          <Icon name="ArrowRightLeft" size={11} />
                          Transfer
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-3 py-2 bg-background border-t border-border flex-shrink-0">
        <div className="text-xs text-muted-foreground">
          Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredData?.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredData?.length)} of {filteredData?.length} records
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-2 py-1 text-xs border border-border rounded disabled:opacity-40 hover:bg-accent"
          >
            «
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 text-xs border border-border rounded disabled:opacity-40 hover:bg-accent"
          >
            ‹
          </button>
          <span className="px-3 py-1 text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-xs border border-border rounded disabled:opacity-40 hover:bg-accent"
          >
            ›
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-xs border border-border rounded disabled:opacity-40 hover:bg-accent"
          >
            »
          </button>
        </div>
      </div>

      {/* Transfer Modal */}
      <StockTransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        product={transferProduct}
        locations={locations}
        onTransfer={async (data) => {
          console.log('Transfer:', data);
          setShowTransferModal(false);
        }}
      />
    </div>
  );
};

export default StockLevelsSpreadsheet;
