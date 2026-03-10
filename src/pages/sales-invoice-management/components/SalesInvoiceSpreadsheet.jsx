import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';

const ITEMS_PER_PAGE = 23;
const COLUMNS = [
  { key: 'invoice_no', label: 'Invoice No', width: 'w-36' },
  { key: 'location_name', label: 'Location', width: 'w-32' },
  { key: 'customer_name', label: 'Customer Name', width: 'w-44' },
  { key: 'invoice_date', label: 'Invoice Date', width: 'w-28' },
  { key: 'delivery_date', label: 'Delivery Date', width: 'w-28' },
  { key: 'ctn_qty', label: 'Ctn Qty', width: 'w-20' },
  { key: 'pre_tax_amt', label: 'Pre Tax Amt', width: 'w-28' },
  { key: 'tax_amt', label: 'Tax Amt', width: 'w-24' },
  { key: 'total_amt', label: 'Total Amt (Tax Inc)', width: 'w-32' },
  { key: 'vat_invoice_no', label: 'VAT Invoice No', width: 'w-32' },
];

const SalesInvoiceSpreadsheet = ({ onNew, onView, onEdit }) => {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef(null);

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterPanelRef = useRef(null);
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterInvoiceDateFrom, setFilterInvoiceDateFrom] = useState('');
  const [filterInvoiceDateTo, setFilterInvoiceDateTo] = useState('');
  const [filterDeliveryDateFrom, setFilterDeliveryDateFrom] = useState('');
  const [filterDeliveryDateTo, setFilterDeliveryDateTo] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterSalesRep, setFilterSalesRep] = useState('');
  const [filterTripStatus, setFilterTripStatus] = useState('');

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        ?.from('sales_invoices')
        ?.select(`
          id,
          invoice_no,
          customer_id,
          customer_name,
          location_id,
          location_name,
          invoice_date,
          delivery_date,
          vat_invoice_no,
          total_pre_tax,
          total_tax_amt,
          total_tax_inc_value,
          trip_status,
          sales_rep_name,
          sales_invoice_items ( ctn_qty )
        `)
        ?.order('invoice_date', { ascending: false });
      if (error) throw error;

      const mapped = (data || [])?.map(inv => ({
        ...inv,
        ctn_qty: (inv?.sales_invoice_items || [])?.reduce((sum, item) => sum + (parseFloat(item?.ctn_qty) || 0), 0),
        pre_tax_amt: inv?.total_pre_tax,
        tax_amt: inv?.total_tax_amt,
        total_amt: inv?.total_tax_inc_value,
      }));
      setInvoices(mapped);
    } catch (err) {
      console.error('Error fetching sales invoices:', err);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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
      if (e?.key === 'F3') { e?.preventDefault(); searchInputRef?.current?.focus(); }
      if (e?.key === 'F2') { e?.preventDefault(); onNew?.(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNew]);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc' }));
    setCurrentPage(1);
  };

  const uniqueLocations = useMemo(() => [...new Set(invoices?.map(inv => inv?.location_name)?.filter(Boolean))]?.sort(), [invoices]);
  const uniqueSalesReps = useMemo(() => [...new Set(invoices?.map(inv => inv?.sales_rep_name)?.filter(Boolean))]?.sort(), [invoices]);
  const uniqueCustomers = useMemo(() => [...new Set(invoices?.map(inv => inv?.customer_name)?.filter(Boolean))]?.sort(), [invoices]);

  const handleApplyFilters = () => { setCurrentPage(1); setShowFilterPanel(false); };
  const handleResetFilters = () => {
    setFilterCustomer(''); setFilterInvoiceDateFrom(''); setFilterInvoiceDateTo('');
    setFilterDeliveryDateFrom(''); setFilterDeliveryDateTo('');
    setFilterLocation(''); setFilterSalesRep(''); setFilterTripStatus('');
    setSearchTerm(''); setCurrentPage(1); setShowFilterPanel(false);
  };

  const filteredInvoices = useMemo(() => {
    let list = invoices;
    if (searchTerm?.trim()) {
      const term = searchTerm?.toLowerCase();
      list = list?.filter(inv =>
        inv?.invoice_no?.toLowerCase()?.includes(term) ||
        inv?.customer_name?.toLowerCase()?.includes(term)
      );
    }
    if (filterCustomer) list = list?.filter(inv => inv?.customer_name === filterCustomer);
    if (filterInvoiceDateFrom) list = list?.filter(inv => inv?.invoice_date && inv?.invoice_date >= filterInvoiceDateFrom);
    if (filterInvoiceDateTo) list = list?.filter(inv => inv?.invoice_date && inv?.invoice_date <= filterInvoiceDateTo);
    if (filterDeliveryDateFrom) list = list?.filter(inv => inv?.delivery_date && inv?.delivery_date >= filterDeliveryDateFrom);
    if (filterDeliveryDateTo) list = list?.filter(inv => inv?.delivery_date && inv?.delivery_date <= filterDeliveryDateTo);
    if (filterLocation) list = list?.filter(inv => inv?.location_name === filterLocation);
    if (filterSalesRep) list = list?.filter(inv => inv?.sales_rep_name === filterSalesRep);
    if (filterTripStatus) list = list?.filter(inv => inv?.trip_status === filterTripStatus);
    if (sortConfig?.key) {
      list = [...list]?.sort((a, b) => {
        const aVal = String(a?.[sortConfig?.key] || '');
        const bVal = String(b?.[sortConfig?.key] || '');
        const cmp = aVal?.localeCompare(bVal);
        return sortConfig?.direction === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [invoices, searchTerm, sortConfig, filterCustomer, filterInvoiceDateFrom, filterInvoiceDateTo, filterDeliveryDateFrom, filterDeliveryDateTo, filterLocation, filterSalesRep, filterTripStatus]);

  const grandTotals = useMemo(() => ({
    ctn_qty: filteredInvoices?.reduce((sum, inv) => sum + parseFloat(inv?.ctn_qty || 0), 0),
    pre_tax_amt: filteredInvoices?.reduce((sum, inv) => sum + parseFloat(inv?.pre_tax_amt || 0), 0),
    tax_amt: filteredInvoices?.reduce((sum, inv) => sum + parseFloat(inv?.tax_amt || 0), 0),
    total_amt: filteredInvoices?.reduce((sum, inv) => sum + parseFloat(inv?.total_amt || 0), 0),
  }), [filteredInvoices]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices?.length / ITEMS_PER_PAGE));
  const paginatedInvoices = filteredInvoices?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectAll = (e) => {
    setSelectAll(e?.target?.checked);
    setSelectedRows(e?.target?.checked ? paginatedInvoices?.map(inv => inv?.id) : []);
  };
  const handleSelectRow = (id) => {
    setSelectedRows(prev => prev?.includes(id) ? prev?.filter(r => r !== id) : [...prev, id]);
  };

  const handleDelete = async () => {
    const targets = selectedRows?.length > 0 ? selectedRows : selectedRow ? [selectedRow?.id] : [];
    if (targets?.length === 0) { alert('Please select an invoice to delete.'); return; }
    if (!window.confirm(`Delete ${targets?.length} invoice(s)?`)) return;
    try {
      for (const id of targets) {
        await supabase?.from('sales_invoices')?.delete()?.eq('id', id);
      }
      fetchInvoices();
      setSelectedRows([]);
      setSelectedRow(null);
    } catch (err) {
      console.error('Error deleting invoices:', err);
    }
  };

  const handleExcelExport = () => {
    const headers = COLUMNS?.map(c => c?.label)?.join('\t');
    const rows = filteredInvoices?.map(inv =>
      COLUMNS?.map(col => {
        const val = inv?.[col?.key];
        if (['pre_tax_amt', 'tax_amt', 'total_amt']?.includes(col?.key)) return val !== null && val !== undefined ? parseFloat(val)?.toFixed(2) : '';
        if (col?.key === 'ctn_qty') return val !== null && val !== undefined ? parseFloat(val)?.toFixed(2) : '';
        return val || '';
      })?.join('\t')
    )?.join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sales_invoices.xls'; a?.click();
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
        <button key={i} onClick={() => setCurrentPage(i)}
          className="w-7 h-7 text-xs font-medium rounded transition-colors"
          style={currentPage === i ? { backgroundColor: 'var(--color-primary)', color: '#fff' } : { color: '#4B5563' }}
        >{i}</button>
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
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/?.test(val)) return val?.slice(0, 10);
      const d = new Date(val);
      return `${d?.getFullYear()}-${String(d?.getMonth() + 1)?.padStart(2, '0')}-${String(d?.getDate())?.padStart(2, '0')}`;
    } catch { return val; }
  };

  const hasActiveFilters = filterCustomer || filterInvoiceDateFrom || filterInvoiceDateTo || filterDeliveryDateFrom || filterDeliveryDateTo || filterLocation || filterSalesRep || filterTripStatus;

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-background border-b border-border">
        <span className="text-yellow-500 text-lg">★</span>
        <h2 className="text-base font-semibold text-foreground">Sales Invoices</h2>
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
          <div className="relative" ref={filterPanelRef}>
            <button
              onClick={() => setShowFilterPanel(prev => !prev)}
              className="h-7 px-3 text-xs font-medium rounded-r border-l-0 transition-colors flex items-center gap-1"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff', border: `1px solid var(--color-primary)` }}
            >
              Search(F3)
              <span className="text-xs opacity-70">{showFilterPanel ? '▲' : '▼'}</span>
              {hasActiveFilters && (
                <span className="ml-1 bg-yellow-400 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none" style={{ color: 'var(--color-primary)' }}>!</span>
              )}
            </button>

            {showFilterPanel && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-400 shadow-xl z-50" style={{ width: '520px' }}>
                <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <span className="text-xs font-semibold text-white">Search Options</span>
                  <button onClick={() => setShowFilterPanel(false)} className="text-sm leading-none opacity-70 hover:opacity-100 text-white">✕</button>
                </div>
                <div className="p-2 bg-background">
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap w-28 border border-border bg-muted/40 px-2">Customer</td>
                        <td className="py-1 px-2 border border-border">
                          <select value={filterCustomer} onChange={e => setFilterCustomer(e?.target?.value)} className="w-full h-6 px-1 text-xs border border-border focus:outline-none bg-background">
                            <option value="">-- All --</option>
                            {uniqueCustomers?.map(name => <option key={name} value={name}>{name}</option>)}
                          </select>
                        </td>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap w-28 border border-border bg-muted/40 px-2">Location</td>
                        <td className="py-1 px-2 border border-border">
                          <select value={filterLocation} onChange={e => setFilterLocation(e?.target?.value)} className="w-full h-6 px-1 text-xs border border-border focus:outline-none bg-background">
                            <option value="">-- All --</option>
                            {uniqueLocations?.map(name => <option key={name} value={name}>{name}</option>)}
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Inv Date From</td>
                        <td className="py-1 px-2 border border-border">
                          <input type="date" value={filterInvoiceDateFrom} onChange={e => setFilterInvoiceDateFrom(e?.target?.value)} className="w-full h-6 px-1.5 text-xs border border-border focus:outline-none" />
                        </td>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Inv Date To</td>
                        <td className="py-1 px-2 border border-border">
                          <input type="date" value={filterInvoiceDateTo} onChange={e => setFilterInvoiceDateTo(e?.target?.value)} className="w-full h-6 px-1.5 text-xs border border-border focus:outline-none" />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Del Date From</td>
                        <td className="py-1 px-2 border border-border">
                          <input type="date" value={filterDeliveryDateFrom} onChange={e => setFilterDeliveryDateFrom(e?.target?.value)} className="w-full h-6 px-1.5 text-xs border border-border focus:outline-none" />
                        </td>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Del Date To</td>
                        <td className="py-1 px-2 border border-border">
                          <input type="date" value={filterDeliveryDateTo} onChange={e => setFilterDeliveryDateTo(e?.target?.value)} className="w-full h-6 px-1.5 text-xs border border-border focus:outline-none" />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Sales Rep</td>
                        <td className="py-1 px-2 border border-border">
                          <select value={filterSalesRep} onChange={e => setFilterSalesRep(e?.target?.value)} className="w-full h-6 px-1 text-xs border border-border focus:outline-none bg-background">
                            <option value="">-- All --</option>
                            {uniqueSalesReps?.map(name => <option key={name} value={name}>{name}</option>)}
                          </select>
                        </td>
                        <td className="py-1 pr-2 text-right font-medium text-muted-foreground whitespace-nowrap border border-border bg-muted/40 px-2">Trip Status</td>
                        <td className="py-1 px-2 border border-border">
                          <select value={filterTripStatus} onChange={e => setFilterTripStatus(e?.target?.value)} className="w-full h-6 px-1 text-xs border border-border focus:outline-none bg-background">
                            <option value="">-- All --</option>
                            <option value="Pending">Pending</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-end gap-2 px-3 py-1 bg-muted/30 border-t border-border">
                  <button onClick={handleApplyFilters} className="h-7 px-5 text-xs font-semibold text-white transition-colors" style={{ backgroundColor: 'var(--color-primary)' }}>Search</button>
                  <button onClick={handleResetFilters} className="h-7 px-5 text-xs font-medium bg-background border border-border text-foreground hover:bg-accent transition-colors">Reset</button>
                  <button onClick={() => setShowFilterPanel(false)} className="h-7 px-5 text-xs font-medium bg-background border border-border text-foreground hover:bg-accent transition-colors">Close</button>
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
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground hover:bg-accent rounded disabled:opacity-40">«</button>
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground hover:bg-accent rounded disabled:opacity-40">‹</button>
        {renderPageNumbers()}
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground hover:bg-accent rounded disabled:opacity-40">›</button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground hover:bg-accent rounded disabled:opacity-40">»</button>
        <span className="text-xs text-muted-foreground ml-1">/ {totalPages}</span>
        <span className="text-xs text-muted-foreground ml-3">({filteredInvoices?.length} records)</span>
      </div>

      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-auto bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-sm text-gray-400">Loading invoices...</div>
          </div>
        ) : (
          <table className="w-full border-collapse text-xs" style={{ minWidth: '1100px' }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-primary/10">
                <th className="border border-border px-1 py-1.5 w-8 text-center">
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="w-3 h-3" style={{ accentColor: 'var(--color-primary)' }} />
                </th>
                <th className="border border-border px-1 py-1.5 w-8 text-center text-muted-foreground">#</th>
                {COLUMNS?.map(col => (
                  <th key={col?.key}
                    className={`border border-border px-2 py-1.5 text-left font-medium text-foreground cursor-pointer hover:bg-primary/20 whitespace-nowrap select-none ${col?.width}`}
                    onClick={() => handleSort(col?.key)}
                  >
                    <span className="flex items-center gap-1">{col?.label}<span className="text-muted-foreground/50 text-xs">{getSortIcon(col?.key)}</span></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices?.length === 0 ? (
                <tr><td colSpan={COLUMNS?.length + 2} className="text-center py-12 text-muted-foreground">No invoices found</td></tr>
              ) : (
                paginatedInvoices?.map((inv, idx) => {
                  const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const isSelected = selectedRows?.includes(inv?.id);
                  const isActive = selectedRow?.id === inv?.id;
                  return (
                    <tr key={inv?.id} onClick={() => setSelectedRow(inv)} className="cursor-pointer transition-colors"
                      style={{ backgroundColor: (isActive || isSelected) ? 'color-mix(in srgb, var(--color-primary) 8%, white)' : idx % 2 === 0 ? '#fff' : '#F9FAFB' }}
                    >
                      <td className="border border-border px-1 py-0.5 text-center">
                        <input type="checkbox" checked={isSelected} onChange={() => handleSelectRow(inv?.id)} onClick={e => e?.stopPropagation()} className="w-3 h-3" style={{ accentColor: 'var(--color-primary)' }} />
                      </td>
                      <td className="border border-border px-1 py-0.5 text-center text-muted-foreground">{rowNum}</td>
                      <td className="border border-border px-2 py-0.5 font-medium cursor-pointer hover:underline" style={{ color: 'var(--color-primary)' }}
                        onClick={e => { e?.stopPropagation(); onView?.(inv); }}>
                        {inv?.invoice_no || '-'}
                      </td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{inv?.location_name ? (inv?.location_name?.includes(' - ') ? inv?.location_name?.split(' - ')?.slice(1)?.join(' - ') : inv?.location_name) : '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{inv?.customer_name || '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{formatDate(inv?.invoice_date)}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{formatDate(inv?.delivery_date)}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground font-sans tabular-nums text-right">{inv?.ctn_qty !== null && inv?.ctn_qty !== undefined ? parseFloat(inv?.ctn_qty)?.toFixed(2) : '-'}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground font-sans tabular-nums text-right">{formatCurrency(inv?.pre_tax_amt)}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground font-sans tabular-nums text-right">{formatCurrency(inv?.tax_amt)}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground font-sans tabular-nums text-right font-semibold">{formatCurrency(inv?.total_amt)}</td>
                      <td className="border border-border px-2 py-0.5 text-foreground">{inv?.vat_invoice_no || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredInvoices?.length > 0 && (
              <tfoot>
                <tr className="bg-primary/10 font-semibold">
                  <td colSpan={2} className="border border-border px-2 py-1.5"></td>
                  <td colSpan={5} className="border border-border px-2 py-1.5 text-right text-xs font-bold text-foreground">Grand Total</td>
                  <td className="border border-border px-2 py-1.5 text-right text-xs font-bold text-foreground font-sans tabular-nums">{parseFloat(grandTotals?.ctn_qty)?.toFixed(2)}</td>
                  <td className="border border-border px-2 py-1.5 text-right text-xs font-bold text-foreground font-sans tabular-nums">{formatCurrency(grandTotals?.pre_tax_amt)}</td>
                  <td className="border border-border px-2 py-1.5 text-right text-xs font-bold text-foreground font-sans tabular-nums">{formatCurrency(grandTotals?.tax_amt)}</td>
                  <td className="border border-border px-2 py-1.5 text-right text-xs font-bold text-foreground font-sans tabular-nums">{formatCurrency(grandTotals?.total_amt)}</td>
                  <td className="border border-border px-2 py-1.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/30 border-t border-border flex-wrap">
        <button onClick={() => onNew?.()} className="h-8 px-3 text-xs font-semibold text-white rounded transition-colors flex items-center gap-1" style={{ backgroundColor: 'var(--color-primary)' }}>New (F2)</button>
        <button onClick={() => { if (!selectedRow) { alert('Please select an invoice to view.'); return; } onView?.(selectedRow); }} className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors">View</button>
        <button onClick={() => { if (!selectedRow) { alert('Please select an invoice to edit.'); return; } onEdit?.(selectedRow); }} className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors">Edit</button>
        <button onClick={handleDelete} className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors">Delete</button>
        <button onClick={() => window.print()} className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors flex items-center gap-1">Print <span className="text-muted-foreground">▲</span></button>
        <button onClick={handleExcelExport} className="h-8 px-3 text-xs font-medium bg-background border border-border text-foreground rounded hover:bg-accent transition-colors flex items-center gap-1">Excel <span className="text-muted-foreground">▲</span></button>
        {selectedRows?.length > 0 && <span className="ml-auto text-xs text-muted-foreground">{selectedRows?.length} row(s) selected</span>}
      </div>
    </div>
  );
};

export default SalesInvoiceSpreadsheet;
