import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';

const ITEMS_PER_PAGE = 23;
const COLUMNS = [
  { key: 'order_no', label: 'Order No', width: 'w-28' },
  { key: 'customer_name', label: 'Customer Name', width: 'w-44' },
  { key: 'order_date', label: 'Order Date', width: 'w-28' },
  { key: 'due_date', label: 'Due Date', width: 'w-28' },
  { key: 'amount', label: 'Amount', width: 'w-28' },
  { key: 'vat', label: 'VAT', width: 'w-24' },
  { key: 'total', label: 'Total', width: 'w-28' },
  { key: 'status', label: 'Status', width: 'w-24' },
];

const SalesOrderSpreadsheet = ({ onNew, onView, onEdit }) => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef(null);

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterPanelRef = useRef(null);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [filterOrderNo, setFilterOrderNo] = useState('');

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase?.from('sales_orders')?.select('*')?.order('order_date', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e?.key === 'F3') {
        e?.preventDefault();
        searchInputRef?.current?.focus();
      }
      if (e?.key === 'F2') {
        e?.preventDefault();
        onNew?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNew]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const uniqueCustomers = useMemo(() => {
    const names = [...new Set(orders?.map(o => o?.customer_name)?.filter(Boolean))];
    return names?.sort();
  }, [orders]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setShowFilterPanel(false);
  };

  const handleResetFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterCustomer('');
    setFilterStatus('all');
    setFilterAmountMin('');
    setFilterAmountMax('');
    setSearchTerm('');
    setFilterOrderNo('');
    setCurrentPage(1);
    setShowFilterPanel(false);
  };

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (!includeCompleted) {
      list = list?.filter(o => o?.status !== 'delivered' && o?.status !== 'cancelled');
    }
    if (searchTerm?.trim()) {
      const term = searchTerm?.toLowerCase();
      list = list?.filter(o =>
        o?.order_no?.toLowerCase()?.includes(term) ||
        o?.customer_name?.toLowerCase()?.includes(term) ||
        o?.status?.toLowerCase()?.includes(term)
      );
    }
    if (filterOrderNo?.trim()) {
      const term = filterOrderNo?.toLowerCase();
      list = list?.filter(o => o?.order_no?.toLowerCase()?.includes(term));
    }
    if (filterDateFrom) {
      list = list?.filter(o => o?.order_date && o?.order_date >= filterDateFrom);
    }
    if (filterDateTo) {
      list = list?.filter(o => o?.order_date && o?.order_date <= filterDateTo);
    }
    if (filterCustomer) {
      list = list?.filter(o => o?.customer_name === filterCustomer);
    }
    if (filterStatus && filterStatus !== 'all') {
      list = list?.filter(o => o?.status === filterStatus);
    }
    if (filterAmountMin !== '') {
      list = list?.filter(o => parseFloat(o?.amount || 0) >= parseFloat(filterAmountMin));
    }
    if (filterAmountMax !== '') {
      list = list?.filter(o => parseFloat(o?.amount || 0) <= parseFloat(filterAmountMax));
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
  }, [orders, searchTerm, includeCompleted, sortConfig, filterDateFrom, filterDateTo, filterCustomer, filterStatus, filterAmountMin, filterAmountMax, filterOrderNo]);

  const grandTotals = useMemo(() => ({
    amount: filteredOrders?.reduce((sum, o) => sum + parseFloat(o?.amount || 0), 0),
    vat: filteredOrders?.reduce((sum, o) => sum + parseFloat(o?.vat || 0), 0),
    total: filteredOrders?.reduce((sum, o) => sum + parseFloat(o?.total || 0), 0),
  }), [filteredOrders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders?.length / ITEMS_PER_PAGE));
  const paginatedOrders = filteredOrders?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSelectAll = (e) => {
    setSelectAll(e?.target?.checked);
    if (e?.target?.checked) {
      setSelectedRows(paginatedOrders?.map(o => o?.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev?.includes(id) ? prev?.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    const targets = selectedRows?.length > 0 ? selectedRows : selectedRow ? [selectedRow?.id] : [];
    if (targets?.length === 0) {
      alert('Please select an order to delete.');
      return;
    }
    if (!window.confirm(`Delete ${targets?.length} order(s)?`)) return;
    try {
      for (const id of targets) {
        await supabase?.from('sales_orders')?.delete()?.eq('id', id);
      }
      fetchOrders();
      setSelectedRows([]);
      setSelectedRow(null);
    } catch (err) {
      console.error('Error deleting orders:', err);
      setOrders(prev => prev?.filter(o => !targets?.includes(o?.id)));
      setSelectedRows([]);
      setSelectedRow(null);
    }
  };

  const handlePrint = () => { window.print(); };

  const handleExcelExport = () => {
    const headers = COLUMNS?.map(c => c?.label)?.join('\t');
    const rows = filteredOrders?.map(o =>
      COLUMNS?.map(col => {
        const val = o?.[col?.key];
        if (col?.key === 'amount' || col?.key === 'vat' || col?.key === 'total') {
          return val ? parseFloat(val)?.toFixed(2) : '';
        }
        return val || '';
      })?.join('\t')
    )?.join('\n');
    const content = headers + '\n' + rows;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales_orders.xls';
    a?.click();
    URL.revokeObjectURL(url);
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

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '-';
    return parseFloat(val)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (val) => {
    if (!val) return '-';
    try {
      return new Date(val)?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return val;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'delivered': return 'bg-blue-100 text-blue-700';
      case 'draft': return 'bg-gray-100 text-gray-600';
      case 'cancelled': return 'bg-red-50 text-red-400';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const hasActiveFilters = filterDateFrom || filterDateTo || filterCustomer || (filterStatus && filterStatus !== 'all') || filterAmountMin !== '' || filterAmountMax !== '';

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200">
        <span className="text-yellow-500 text-lg">★</span>
        <h2 className="text-base font-semibold text-gray-800">Order List</h2>
        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer ml-2">
          <input
            type="checkbox"
            checked={includeCompleted}
            onChange={e => { setIncludeCompleted(e?.target?.checked); setCurrentPage(1); }}
            className="w-3.5 h-3.5"
            style={{ accentColor: 'var(--color-primary)' }}
          />
          Include Delivered/Cancelled
        </label>
        <div className="flex items-center gap-0 ml-2 flex-1 max-w-xs">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e?.target?.value); setCurrentPage(1); }}
            placeholder="Input and press [Enter]"
            className="flex-1 h-7 px-2 text-xs border border-gray-300 rounded-l focus:outline-none"
            onKeyDown={e => e?.key === 'Enter' && setCurrentPage(1)}
          />
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

            {showFilterPanel && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-400 shadow-xl z-50" style={{ width: '480px' }}>
                <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <span className="text-xs font-semibold text-white">Search Options</span>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="text-sm leading-none opacity-70 hover:opacity-100 text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-2 bg-white">
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-gray-600 whitespace-nowrap w-28 border border-gray-200 bg-gray-50 px-2">Order No</td>
                        <td className="py-1 px-2 border border-gray-200">
                          <input
                            type="text"
                            value={filterOrderNo}
                            onChange={e => setFilterOrderNo(e?.target?.value)}
                            placeholder="e.g. SO-2024"
                            className="w-full h-6 px-2 text-xs border border-gray-300 focus:outline-none"
                          />
                        </td>
                        <td className="py-1 pr-2 text-right font-medium text-gray-600 whitespace-nowrap w-28 border border-gray-200 bg-gray-50 px-2">Customer</td>
                        <td className="py-1 px-2 border border-gray-200">
                          <select
                            value={filterCustomer}
                            onChange={e => setFilterCustomer(e?.target?.value)}
                            className="w-full h-6 px-1 text-xs border border-gray-300 focus:outline-none bg-white"
                          >
                            <option value="">-- All --</option>
                            {uniqueCustomers?.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-gray-600 whitespace-nowrap border border-gray-200 bg-gray-50 px-2">Date From</td>
                        <td className="py-1 px-2 border border-gray-200">
                          <input
                            type="date"
                            value={filterDateFrom}
                            onChange={e => setFilterDateFrom(e?.target?.value)}
                            className="w-full h-6 px-1.5 text-xs border border-gray-300 focus:outline-none"
                          />
                        </td>
                        <td className="py-1 pr-2 text-right font-medium text-gray-600 whitespace-nowrap border border-gray-200 bg-gray-50 px-2">Date To</td>
                        <td className="py-1 px-2 border border-gray-200">
                          <input
                            type="date"
                            value={filterDateTo}
                            onChange={e => setFilterDateTo(e?.target?.value)}
                            className="w-full h-6 px-1.5 text-xs border border-gray-300 focus:outline-none"
                          />
                        </td>
                      </tr>

                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-gray-600 whitespace-nowrap border border-gray-200 bg-gray-50 px-2">Amount From</td>
                        <td className="py-1 px-2 border border-gray-200">
                          <input
                            type="number"
                            value={filterAmountMin}
                            onChange={e => setFilterAmountMin(e?.target?.value)}
                            placeholder="0.00"
                            className="w-full h-6 px-2 text-xs border border-gray-300 focus:outline-none"
                          />
                        </td>
                        <td className="py-1 pr-2 text-right font-medium text-gray-600 whitespace-nowrap border border-gray-200 bg-gray-50 px-2">Amount To</td>
                        <td className="py-1 px-2 border border-gray-200">
                          <input
                            type="number"
                            value={filterAmountMax}
                            onChange={e => setFilterAmountMax(e?.target?.value)}
                            placeholder="0.00"
                            className="w-full h-6 px-2 text-xs border border-gray-300 focus:outline-none"
                          />
                        </td>
                      </tr>

                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-gray-600 whitespace-nowrap border border-gray-200 bg-gray-50 px-2">Status</td>
                        <td colSpan={3} className="py-1 px-2 border border-gray-200">
                          <div className="flex flex-wrap gap-1">
                            {['all', 'pending', 'confirmed', 'delivered', 'draft', 'cancelled']?.map(s => (
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

                <div className="flex items-center justify-end gap-2 px-3 py-1 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={handleApplyFilters}
                    className="h-7 px-5 text-xs font-semibold text-white transition-colors"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    Search
                  </button>
                  <button
                    onClick={handleResetFilters}
                    className="h-7 px-5 text-xs font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="h-7 px-5 text-xs font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <button className="h-7 px-3 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">Option</button>
        <button className="h-7 px-3 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">Help</button>
      </div>

      {/* Pagination Top */}
      <div className="flex items-center gap-1 px-4 py-1.5 bg-white border-b border-gray-200">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="w-7 h-7 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-40"
        >«</button>
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="w-7 h-7 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-40"
        >‹</button>
        {renderPageNumbers()}
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="w-7 h-7 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-40"
        >›</button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="w-7 h-7 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-40"
        >»</button>
        <span className="text-xs text-gray-400 ml-1">/ {totalPages}</span>
        <span className="text-xs text-gray-400 ml-3">({filteredOrders?.length} records)</span>
      </div>

      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-auto bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-sm text-gray-400">Loading orders...</div>
          </div>
        ) : (
          <table className="w-full border-collapse text-xs" style={{ minWidth: '1000px' }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-1 py-1.5 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-3 h-3"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                </th>
                <th className="border border-gray-300 px-1 py-1.5 w-8 text-center text-gray-500">#</th>
                {COLUMNS?.map(col => (
                  <th
                    key={col?.key}
                    className={`border border-gray-300 px-2 py-1.5 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 whitespace-nowrap select-none ${col?.width}`}
                    onClick={() => handleSort(col?.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col?.label}
                      <span className="text-gray-400 text-xs">{getSortIcon(col?.key)}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedOrders?.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS?.length + 2} className="text-center py-12 text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                paginatedOrders?.map((order, idx) => {
                  const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const isSelected = selectedRows?.includes(order?.id);
                  const isActive = selectedRow?.id === order?.id;
                  return (
                    <tr
                      key={order?.id}
                      onClick={() => setSelectedRow(order)}
                      className="cursor-pointer transition-colors"
                      style={{
                        backgroundColor: (isActive || isSelected)
                          ? 'color-mix(in srgb, var(--color-primary) 8%, white)'
                          : idx % 2 === 0 ? '#fff' : '#F9FAFB',
                      }}
                    >
                      <td className="border border-gray-200 px-1 py-0.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(order?.id)}
                          onClick={e => e?.stopPropagation()}
                          className="w-3 h-3"
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                      </td>
                      <td className="border border-gray-200 px-1 py-0.5 text-center text-gray-400">{rowNum}</td>
                      <td
                        className="border border-gray-200 px-2 py-0.5 font-medium cursor-pointer hover:underline"
                        style={{ color: 'var(--color-primary)' }}
                        onClick={e => { e?.stopPropagation(); onView?.(order); }}
                      >
                        {order?.order_no || '-'}
                      </td>
                      <td className="border border-gray-200 px-2 py-0.5 text-gray-700">{order?.customer_name || '-'}</td>
                      <td className="border border-gray-200 px-2 py-0.5 text-gray-700">{formatDate(order?.order_date)}</td>
                      <td className="border border-gray-200 px-2 py-0.5 text-gray-700">{formatDate(order?.due_date)}</td>
                      <td className="border border-gray-200 px-2 py-0.5 text-gray-700 font-sans tabular-nums text-right">{formatCurrency(order?.amount)}</td>
                      <td className="border border-gray-200 px-2 py-0.5 text-gray-700 font-sans tabular-nums text-right">{formatCurrency(order?.vat)}</td>
                      <td className="border border-gray-200 px-2 py-0.5 text-gray-700 font-sans tabular-nums text-right font-semibold">{formatCurrency(order?.total)}</td>
                      <td className="border border-gray-200 px-2 py-0.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium capitalize ${getStatusStyle(order?.status)}`}>
                          {order?.status || 'draft'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredOrders?.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={2} className="border border-gray-300 px-2 py-1.5 text-right text-xs text-gray-500"></td>
                  <td colSpan={4} className="border border-gray-300 px-2 py-1.5 text-right text-xs font-bold text-gray-700">Grand Total</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right text-xs font-bold text-gray-800 font-sans tabular-nums">{formatCurrency(grandTotals?.amount)}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right text-xs font-bold text-gray-800 font-sans tabular-nums">{formatCurrency(grandTotals?.vat)}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right text-xs font-bold text-gray-800 font-sans tabular-nums">{formatCurrency(grandTotals?.total)}</td>
                  <td className="border border-gray-300 px-2 py-1.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 border-t border-gray-300 flex-wrap">
        <button
          onClick={() => onNew?.()}
          className="h-8 px-3 text-xs font-semibold text-white rounded transition-colors flex items-center gap-1"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          New (F2)
        </button>
        <button
          onClick={() => {
            if (!selectedRow) { alert('Please select an order to view.'); return; }
            onView?.(selectedRow);
          }}
          className="h-8 px-3 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
        >
          View
        </button>
        <button
          onClick={() => {
            if (!selectedRow) { alert('Please select an order to edit.'); return; }
            onEdit?.(selectedRow);
          }}
          className="h-8 px-3 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="h-8 px-3 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
        >
          Delete
        </button>
        <button
          onClick={handlePrint}
          className="h-8 px-3 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
        >
          Print
          <span className="text-gray-400">▲</span>
        </button>
        <button
          onClick={handleExcelExport}
          className="h-8 px-3 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
        >
          Excel
          <span className="text-gray-400">▲</span>
        </button>
        {selectedRows?.length > 0 && (
          <span className="ml-auto text-xs text-gray-500">{selectedRows?.length} row(s) selected</span>
        )}
      </div>
    </div>
  );
};

export default SalesOrderSpreadsheet;
