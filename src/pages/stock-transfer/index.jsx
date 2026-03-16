import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import StockTransferSpreadsheet from './components/StockTransferSpreadsheet';
import StockTransferModal from './components/StockTransferModal';

const StockTransfer = () => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [filters, setFilters] = useState({ transfer_no: '', from_location_id: '', to_location_id: '', date_from: '', date_to: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'transfer_date', direction: 'desc' });

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        ?.from('stock_transfer_header')
        ?.select(`
          id, transfer_no, request_date, driver_name, from_location_id, to_location_id,
          transfer_date, vehicle_no, from_location_name, to_location_name, status, notes, created_at,
          stock_transfer_items(id)
        `);

      if (filters?.transfer_no) query = query?.ilike('transfer_no', `%${filters?.transfer_no}%`);
      if (filters?.from_location_id) query = query?.eq('from_location_id', filters?.from_location_id);
      if (filters?.to_location_id) query = query?.eq('to_location_id', filters?.to_location_id);
      if (filters?.date_from) query = query?.gte('transfer_date', filters?.date_from);
      if (filters?.date_to) query = query?.lte('transfer_date', filters?.date_to);

      const { data, error } = await query?.order(sortConfig?.key, { ascending: sortConfig?.direction === 'asc' });
      if (error) throw error;

      const mapped = (data || [])?.map(r => ({
        ...r,
        item_count: r?.stock_transfer_items?.length || 0,
      }));
      setRecords(mapped);
    } catch (err) {
      console.error('Error fetching stock transfers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortConfig]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e?.key === 'F2') { e?.preventDefault(); handleNew(); }
    };
    window?.addEventListener('keydown', handleKey);
    return () => window?.removeEventListener('keydown', handleKey);
  }, []);

  const handleNew = () => { setEditRecord(null); setModalOpen(true); };

  const handleEdit = async () => {
    if (selectedIds?.length !== 1) return;
    const rec = records?.find(r => r?.id === selectedIds?.[0]);
    if (!rec) return;
    const { data: items } = await supabase?.from('stock_transfer_items')?.select('*')?.eq('header_id', rec?.id)?.order('sort_order');
    setEditRecord({ ...rec, items: items || [] });
    setModalOpen(true);
  };

  const handleRowDoubleClick = async (row) => {
    const { data: items } = await supabase?.from('stock_transfer_items')?.select('*')?.eq('header_id', row?.id)?.order('sort_order');
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

  return (
    <AppLayout activeModule="inventory">
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-3">
            <h1 className="text-2xl font-bold text-foreground">Stock Transfer</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Move stock between locations</p>
          </div>
        </div>

        <div className="px-6 pb-2 flex-shrink-0">
          <div className="flex items-center gap-4 p-2.5 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded">
                <Icon name="ArrowRightLeft" size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Transfers</p>
                <p className="text-sm font-bold text-foreground tabular-nums">{records?.length}</p>
              </div>
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

        <div className="flex-1 overflow-hidden px-6 pb-2">
          <StockTransferSpreadsheet
            rows={records}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            onRowDoubleClick={handleRowDoubleClick}
            onEditRow={handleRowDoubleClick}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </div>

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
                <Icon name="Edit2" size={13} /> View / Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      <StockTransferModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchRecords}
        editRecord={editRecord}
      />
    </AppLayout>
  );
};

export default StockTransfer;
