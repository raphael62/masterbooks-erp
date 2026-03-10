import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import StockMovementsSpreadsheet from './components/StockMovementsSpreadsheet';

const TRANSACTION_TYPES = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'issue', label: 'Issue' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'adjustment', label: 'Adjustment' },
];

const LOCATIONS = ['Main Warehouse', 'Branch Store A', 'Branch Store B', 'Cold Storage'];

const StockMovements = () => {
  const [filters, setFilters] = useState({
    product: '',
    location: '',
    transactionType: '',
    dateFrom: '',
    dateTo: '',
    user: '',
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterPanelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterPanelRef?.current && !filterPanelRef?.current?.contains(e?.target)) {
        setShowFilterPanel(false);
      }
    };
    if (showFilterPanel) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterPanel]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e?.key === 'F3') { e?.preventDefault(); setShowFilterPanel(prev => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasActiveFilters = filters?.product || filters?.location || filters?.transactionType || filters?.dateFrom || filters?.dateTo || filters?.user;

  const handleExport = (format) => {
    alert(`${format} export initiated`);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Page Header */}
        <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-200">
          <BreadcrumbNavigation />
          <div className="flex items-center justify-between mt-1">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Inventory</h1>
              <p className="text-xs text-gray-500">Complete transaction history for all stock movements</p>
            </div>
          </div>
          {/* Module Tab Navigation */}
          <div className="flex items-end gap-0 mt-3 -mb-px">
            <a href="/inventory-management" className="px-4 py-2 text-xs font-medium border border-b-0 border-gray-300 rounded-t text-gray-600 hover:bg-gray-50 bg-white mr-0.5">Overview</a>
            <a href="/product-management" className="px-4 py-2 text-xs font-medium border border-b-0 border-gray-300 rounded-t text-gray-600 hover:bg-gray-50 bg-white mr-0.5">Products</a>
            <span className="px-4 py-2 text-xs font-semibold border border-b-0 rounded-t mr-0.5" style={{ backgroundColor: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' }}>Stock Movements</span>
            <a href="/returnable-glass-management" className="px-4 py-2 text-xs font-medium border border-b-0 border-gray-300 rounded-t text-gray-600 hover:bg-gray-50 bg-white mr-0.5">Returnable Glass</a>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 flex-wrap">
          <input
            type="text"
            value={filters?.product}
            onChange={e => setFilters(prev => ({ ...prev, product: e?.target?.value }))}
            placeholder="Product code or name..."
            className="h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none w-44"
          />
          <select
            value={filters?.location}
            onChange={e => setFilters(prev => ({ ...prev, location: e?.target?.value }))}
            className="h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none"
          >
            <option value="">All Locations</option>
            {LOCATIONS?.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={filters?.transactionType}
            onChange={e => setFilters(prev => ({ ...prev, transactionType: e?.target?.value }))}
            className="h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none"
          >
            <option value="">All Types</option>
            {TRANSACTION_TYPES?.map(t => <option key={t?.value} value={t?.value}>{t?.label}</option>)}
          </select>
          <input
            type="date"
            value={filters?.dateFrom}
            onChange={e => setFilters(prev => ({ ...prev, dateFrom: e?.target?.value }))}
            className="h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={filters?.dateTo}
            onChange={e => setFilters(prev => ({ ...prev, dateTo: e?.target?.value }))}
            className="h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none"
          />
          <input
            type="text"
            value={filters?.user}
            onChange={e => setFilters(prev => ({ ...prev, user: e?.target?.value }))}
            placeholder="User..."
            className="h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none w-28"
          />

          <div className="relative ml-auto" ref={filterPanelRef}>
            <button
              onClick={() => setShowFilterPanel(prev => !prev)}
              className="h-7 px-3 text-xs font-medium rounded border flex items-center gap-1 transition-colors"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' }}
            >
              Search(F3)
              {hasActiveFilters && <span className="ml-1 bg-yellow-400 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center" style={{ color: 'var(--color-primary)' }}>!</span>}
            </button>
            {showFilterPanel && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 shadow-xl z-50 p-3 rounded" style={{ width: '340px' }}>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-700">Advanced Search</span>
                  <button onClick={() => setShowFilterPanel(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-0.5">Product</label>
                    <input type="text" value={filters?.product} onChange={e => setFilters(prev => ({ ...prev, product: e?.target?.value }))} className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none" placeholder="Code or name..." />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-0.5">Location</label>
                      <select value={filters?.location} onChange={e => setFilters(prev => ({ ...prev, location: e?.target?.value }))} className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none">
                        <option value="">All</option>
                        {LOCATIONS?.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-0.5">Type</label>
                      <select value={filters?.transactionType} onChange={e => setFilters(prev => ({ ...prev, transactionType: e?.target?.value }))} className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none">
                        <option value="">All</option>
                        {TRANSACTION_TYPES?.map(t => <option key={t?.value} value={t?.value}>{t?.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-0.5">Date From</label>
                      <input type="date" value={filters?.dateFrom} onChange={e => setFilters(prev => ({ ...prev, dateFrom: e?.target?.value }))} className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-0.5">Date To</label>
                      <input type="date" value={filters?.dateTo} onChange={e => setFilters(prev => ({ ...prev, dateTo: e?.target?.value }))} className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-0.5">User</label>
                    <input type="text" value={filters?.user} onChange={e => setFilters(prev => ({ ...prev, user: e?.target?.value }))} className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none" placeholder="Filter by user..." />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setFilters({ product: '', location: '', transactionType: '', dateFrom: '', dateTo: '', user: '' }); setShowFilterPanel(false); }} className="flex-1 h-7 text-xs border border-gray-300 rounded hover:bg-gray-50 text-gray-600">Reset</button>
                  <button onClick={() => setShowFilterPanel(false)} className="flex-1 h-7 text-xs text-white rounded" style={{ backgroundColor: 'var(--color-primary)' }}>Apply</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <StockMovementsSpreadsheet filters={filters} />
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 border-t border-gray-300 flex-wrap">
          <button
            onClick={() => handleExport('Excel')}
            className="h-8 px-3 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            Excel Export
          </button>
          <button
            onClick={() => handleExport('PDF')}
            className="h-8 px-3 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            PDF Export
          </button>
          {hasActiveFilters && (
            <button
              onClick={() => setFilters({ product: '', location: '', transactionType: '', dateFrom: '', dateTo: '', user: '' })}
              className="h-8 px-3 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default StockMovements;