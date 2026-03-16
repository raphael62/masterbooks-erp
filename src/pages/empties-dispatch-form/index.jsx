import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import EmptiesDispatchSpreadsheet from './components/EmptiesDispatchSpreadsheet';
import EmptiesDispatchModal from './components/EmptiesDispatchModal';
import EmptiesDispatchSearchPanel from './components/EmptiesDispatchSearchPanel';

const EmptiesDispatchForm = () => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({ dispatch_no: '', supplier_id: '', location_id: '', date_from: '', date_to: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'dispatch_date', direction: 'desc' });
  const searchRef = useRef(null);

  const fetchLookups = useCallback(async () => {
    const [vendRes, locRes] = await Promise.all([
      supabase?.from('vendors')?.select('id, vendor_name')?.eq('status', 'active')?.order('vendor_name'),
      supabase?.from('locations')?.select('id, name')?.eq('is_active', true)?.order('name'),
    ]);
    setVendors(vendRes?.data || []);
    setLocations(locRes?.data || []);
  }, []);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        ?.from('empties_dispatch_header')
        ?.select(`
          id, dispatch_no, dispatch_date, credit_note_no, credit_note_date,
          supplier_id, supplier_name, location_id, location_name,
          po_number, delivery_note, total_value, status, created_at,
          empties_dispatch_items(id)
        `);

      if (filters?.dispatch_no) query = query?.ilike('dispatch_no', `%${filters?.dispatch_no}%`);
      if (filters?.supplier_id) query = query?.eq('supplier_id', filters?.supplier_id);
      if (filters?.location_id) query = query?.eq('location_id', filters?.location_id);
      if (filters?.date_from) query = query?.gte('dispatch_date', filters?.date_from);
      if (filters?.date_to) query = query?.lte('dispatch_date', filters?.date_to);

      const { data, error } = await query?.order(sortConfig?.key, { ascending: sortConfig?.direction === 'asc' });
      if (error) throw error;

      const mapped = (data || [])?.map(r => ({
        ...r,
        item_count: r?.empties_dispatch_items?.length || 0,
      }));
      setRecords(mapped);
    } catch (err) {
      console.error('Error fetching empties dispatches:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortConfig]);

  useEffect(() => { fetchLookups(); }, [fetchLookups]);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e?.key === 'F2') { e?.preventDefault(); handleNew(); }
      if (e?.key === 'F3') { e?.preventDefault(); setShowSearch(s => !s); }
    };
    window?.addEventListener('keydown', handleKey);
    return () => window?.removeEventListener('keydown', handleKey);
  }, []);

  const handleNew = () => { setEditRecord(null); setModalOpen(true); };

  const handleEdit = async () => {
    if (selectedIds?.length !== 1) return;
    const rec = records?.find(r => r?.id === selectedIds?.[0]);
    if (!rec) return;
    const { data: items } = await supabase?.from('empties_dispatch_items')?.select('*')?.eq('header_id', rec?.id)?.order('sort_order');
    setEditRecord({ ...rec, items: items || [] });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (selectedIds?.length === 0) return;
    if (!window?.confirm(`Delete ${selectedIds?.length} record(s)? This will NOT reverse stock movements.`)) return;
    try {
      await supabase?.from('empties_dispatch_header')?.delete()?.in('id', selectedIds);
      setSelectedIds([]);
      fetchRecords();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleRowDoubleClick = async (row) => {
    const { data: items } = await supabase?.from('empties_dispatch_items')?.select('*')?.eq('header_id', row?.id)?.order('sort_order');
    setEditRecord({ ...row, items: items || [] });
    setModalOpen(true);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const handleSelectAll = () => {
    setSelectedIds(prev => prev?.length === records?.length ? [] : records?.map(r => r?.id));
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => prev?.includes(id) ? prev?.filter(x => x !== id) : [...prev, id]);
  };

  const handleFilterChange = (field, value) => {
    if (field === '_reset') {
      setFilters({ dispatch_no: '', supplier_id: '', location_id: '', date_from: '', date_to: '' });
    } else {
      setFilters(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleExportExcel = () => {
    const headers = ['Dispatch No', 'Dispatch Date', 'Supplier Name', 'Location', 'Total Items', 'Total Value GHS', 'Status'];
    const rows = records?.map(r => [
      r?.dispatch_no, r?.dispatch_date, r?.supplier_name, r?.location_name,
      r?.item_count, r?.total_value, r?.status,
    ]);
    const csv = [headers, ...rows]?.map(r => r?.join(','))?.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL?.createObjectURL(blob);
    const a = document?.createElement('a');
    a.href = url; a.download = 'empties_dispatch.csv'; a?.click();
    URL?.revokeObjectURL(url);
  };

  const totalValue = records?.reduce((s, r) => s + (parseFloat(r?.total_value) || 0), 0);

  return (
    <AppLayout activeModule="purchases">
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-3">
            <h1 className="text-2xl font-bold text-foreground">Empties Dispatch</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Dispatch physical empties to suppliers — decreases stock at location</p>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="px-6 pb-2 flex-shrink-0">
          <div className="flex items-center gap-4 p-2.5 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded">
                <Icon name="PackageMinus" size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Records</p>
                <p className="text-sm font-bold text-foreground tabular-nums">{records?.length}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Total Value GHS</p>
              <p className="text-sm font-bold text-foreground tabular-nums">
                {totalValue?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            {selectedIds?.length > 0 && (
              <>
                <div className="w-px h-8 bg-border" />
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs text-primary font-medium">{selectedIds?.length} selected</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Spreadsheet */}
        <div className="flex-1 overflow-hidden px-6 pb-2">
          <EmptiesDispatchSpreadsheet
            rows={records}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            onRowDoubleClick={handleRowDoubleClick}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </div>

        {/* Bottom Action Bar */}
        <div className="px-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between p-2 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleNew}
                className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                <Icon name="Plus" size={13} /> New <span className="opacity-70 text-xs">(F2)</span>
              </button>
              <button
                onClick={handleEdit}
                disabled={selectedIds?.length !== 1}
                className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium border border-border rounded hover:bg-accent transition-colors disabled:opacity-40"
              >
                <Icon name="Edit2" size={13} /> Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={selectedIds?.length === 0}
                className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium border border-destructive/50 text-destructive rounded hover:bg-destructive/10 transition-colors disabled:opacity-40"
              >
                <Icon name="Trash2" size={13} /> Delete
              </button>
              <button className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium border border-border rounded hover:bg-accent transition-colors">
                <Icon name="Printer" size={13} /> Print
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium border border-border rounded hover:bg-accent transition-colors"
              >
                <Icon name="FileSpreadsheet" size={13} /> Excel
              </button>
            </div>
            <div className="relative" ref={searchRef}>
              <button
                onClick={() => setShowSearch(s => !s)}
                className={`flex items-center gap-1.5 h-7 px-3 text-xs font-medium border rounded transition-colors ${
                  showSearch ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'
                }`}
              >
                <Icon name="Search" size={13} /> Search <span className="opacity-70 text-xs">(F3)</span>
              </button>
              {showSearch && (
                <EmptiesDispatchSearchPanel
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onSearch={() => { fetchRecords(); setShowSearch(false); }}
                  onClose={() => setShowSearch(false)}
                  vendors={vendors}
                  locations={locations}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <EmptiesDispatchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchRecords}
        editRecord={editRecord}
      />
    </AppLayout>
  );
};

export default EmptiesDispatchForm;
