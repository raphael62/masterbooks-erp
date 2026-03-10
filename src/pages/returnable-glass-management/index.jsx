import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import ReturnableTransactionsSpreadsheet from './components/ReturnableTransactionsSpreadsheet';
import ReturnableItemsMaster from './components/ReturnableItemsMaster';
import NewTransactionModal from './components/NewTransactionModal';

const ITEM_TYPES = ['Bottle', 'Crate', 'Keg'];

const ReturnableGlassManagement = () => {
  const [filters, setFilters] = useState({
    customer: '',
    itemType: '',
    dateFrom: '',
    dateTo: '',
    status: 'all',
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
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
      if (e?.key === 'F2') { e?.preventDefault(); setShowNewTransactionModal(true); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExport = () => {
    alert('Excel export initiated');
  };

  const hasActiveFilters = filters?.customer || filters?.itemType || filters?.dateFrom || filters?.dateTo || (filters?.status && filters?.status !== 'all');

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Page Header */}
        <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-200">
          <BreadcrumbNavigation />
          <div className="flex items-center justify-between mt-1">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Inventory</h1>
              <p className="text-xs text-gray-500">Track customer returnable glass deposits and returns</p>
            </div>
          </div>
          {/* Module Tab Navigation */}
          <div className="flex items-end gap-0 mt-3 -mb-px">
            <a href="/inventory-management" className="px-4 py-2 text-xs font-medium border border-b-0 border-gray-300 rounded-t text-gray-600 hover:bg-gray-50 bg-white mr-0.5">Overview</a>
            <a href="/product-management" className="px-4 py-2 text-xs font-medium border border-b-0 border-gray-300 rounded-t text-gray-600 hover:bg-gray-50 bg-white mr-0.5">Products</a>
            <a href="/stock-movements" className="px-4 py-2 text-xs font-medium border border-b-0 border-gray-300 rounded-t text-gray-600 hover:bg-gray-50 bg-white mr-0.5">Stock Movements</a>
            <span className="px-4 py-2 text-xs font-semibold border border-b-0 rounded-t mr-0.5" style={{ backgroundColor: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' }}>Returnable Glass</span>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 flex-wrap">
          <input
            type="text"
            value={filters?.customer}
            onChange={e => setFilters(prev => ({ ...prev, customer: e?.target?.value }))}
            placeholder="Search customer..."
            className="h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none w-40"
          />
          <select
            value={filters?.itemType}
            onChange={e => setFilters(prev => ({ ...prev, itemType: e?.target?.value }))}
            className="h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none"
          >
            <option value="">All Item Types</option>
            {ITEM_TYPES?.map(t => <option key={t} value={t}>{t}</option>)}
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
          <div className="flex gap-1">
            {['all', 'outstanding', 'partial_return', 'fully_returned']?.map(s => (
              <button
                key={s}
                onClick={() => setFilters(prev => ({ ...prev, status: s }))}
                className="h-7 px-2 text-xs border rounded transition-colors capitalize"
                style={filters?.status === s
                  ? { backgroundColor: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' }
                  : { backgroundColor: '#fff', color: '#4B5563', borderColor: '#D1D5DB' }}
              >
                {s === 'all' ? 'All' : s === 'partial_return' ? 'Partial' : s === 'fully_returned' ? 'Returned' : 'Outstanding'}
              </button>
            ))}
          </div>
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
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 shadow-xl z-50 p-3 rounded" style={{ width: '320px' }}>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-700">Advanced Filters</span>
                  <button onClick={() => setShowFilterPanel(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-0.5">Customer Name</label>
                    <input type="text" value={filters?.customer} onChange={e => setFilters(prev => ({ ...prev, customer: e?.target?.value }))} className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none" placeholder="Filter by customer..." />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-0.5">Item Type</label>
                    <select value={filters?.itemType} onChange={e => setFilters(prev => ({ ...prev, itemType: e?.target?.value }))} className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none">
                      <option value="">All Types</option>
                      {ITEM_TYPES?.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
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
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setFilters({ customer: '', itemType: '', dateFrom: '', dateTo: '', status: 'all' }); setShowFilterPanel(false); }} className="flex-1 h-7 text-xs border border-gray-300 rounded hover:bg-gray-50 text-gray-600">Reset</button>
                  <button onClick={() => setShowFilterPanel(false)} className="flex-1 h-7 text-xs text-white rounded" style={{ backgroundColor: 'var(--color-primary)' }}>Apply</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Split Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - 60% - Transactions Spreadsheet */}
          <div className="flex flex-col border-r border-gray-200" style={{ width: '60%' }}>
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-700">Customer Returnable Transactions</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <ReturnableTransactionsSpreadsheet 
                key={refreshKey} 
                filters={filters}
                onRefreshNeeded={() => setRefreshKey(k => k + 1)}
              />
            </div>
          </div>

          {/* Right Panel - 40% - Items Master */}
          <div className="flex flex-col" style={{ width: '40%' }}>
            <ReturnableItemsMaster />
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 border-t border-gray-300 flex-wrap">
          <button
            onClick={() => setShowNewTransactionModal(true)}
            className="h-8 px-3 text-xs font-semibold text-white rounded transition-colors flex items-center gap-1"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            New Transaction (F2)
          </button>
          <button className="h-8 px-3 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
            Deposit Adjustment
          </button>
          <button
            onClick={handleExport}
            className="h-8 px-3 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            Excel Export
          </button>
        </div>
      </div>

      <NewTransactionModal
        isOpen={showNewTransactionModal}
        onClose={() => setShowNewTransactionModal(false)}
        onSuccess={() => { setShowNewTransactionModal(false); setRefreshKey(k => k + 1); }}
      />
    </AppLayout>
  );
};

export default ReturnableGlassManagement;