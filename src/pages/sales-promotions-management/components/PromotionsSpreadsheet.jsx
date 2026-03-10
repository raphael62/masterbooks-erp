import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Edit2, Trash2, Gift } from 'lucide-react';
import PromotionModal from './PromotionModal';

const formatDate = (d) => {
  if (!d) return '—';
  try { return new Date(d + 'T00:00:00')?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const PromotionsSpreadsheet = () => {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [filterActive, setFilterActive] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: promos, error } = await supabase
        ?.from('promotions')
        ?.select('*')
        ?.order('start_date', { ascending: false });
      if (error) throw error;

      const { data: ruleCounts } = await supabase?.from('promotion_rules')?.select('promotion_id');
      const countMap = {};
      (ruleCounts || [])?.forEach(r => {
        const pid = r?.promotion_id;
        if (pid) countMap[pid] = (countMap[pid] || 0) + 1;
      });

      setRows((promos || [])?.map(p => ({
        ...p,
        _rule_count: countMap[p?.id] || 0,
      })));
    } catch (err) {
      console.error('Fetch promotions error:', err);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const onKey = (e) => {
      if (e?.key === 'F2') { e?.preventDefault(); setEditItem(null); setShowModal(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = React.useMemo(() => {
    let list = rows;
    if (filterActive === 'active') list = list?.filter(r => r?.active === true);
    if (filterActive === 'inactive') list = list?.filter(r => r?.active !== true);
    if (filterDateFrom) list = list?.filter(r => r?.end_date && r.end_date >= filterDateFrom);
    if (filterDateTo) list = list?.filter(r => r?.start_date && r.start_date <= filterDateTo);
    return list;
  }, [rows, filterActive, filterDateFrom, filterDateTo]);

  const handleNew = () => { setEditItem(null); setShowModal(true); };

  const handleEdit = () => {
    const row = rows?.find(r => r?.id === selectedId);
    if (!row) { alert('Please select a promotion to edit.'); return; }
    setEditItem(row);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!selectedId) { alert('Please select a promotion to delete.'); return; }
    const row = rows?.find(r => r?.id === selectedId);
    if (!window.confirm(`Delete promotion "${row?.name}"? This will also remove all rules.`)) return;
    try {
      const { error } = await supabase?.from('promotions')?.delete()?.eq('id', selectedId);
      if (error) throw error;
      setSelectedId(null);
      fetchData();
    } catch (err) {
      alert('Delete failed: ' + err?.message);
    }
  };

  const handleSaved = () => { setShowModal(false); setEditItem(null); fetchData(); };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button
          onClick={handleNew}
          className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold bg-primary text-white rounded hover:bg-primary/90"
          title="New (F2)"
        >
          <Plus size={13} /> New <span className="text-white/60">(F2)</span>
        </button>
        <button
          onClick={handleEdit}
          className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-border text-foreground rounded hover:bg-muted"
        >
          <Edit2 size={13} /> Edit
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-red-300 text-red-600 rounded hover:bg-red-50"
        >
          <Trash2 size={13} /> Delete
        </button>
        <div className="flex-1" />
        <select
          value={filterActive}
          onChange={e => setFilterActive(e?.target?.value)}
          className="h-8 px-2 text-xs border border-border rounded bg-background"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e?.target?.value)} className="h-8 px-2 text-xs border border-border rounded" placeholder="From" />
        <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e?.target?.value)} className="h-8 px-2 text-xs border border-border rounded" placeholder="To" />
      </div>
      <div className="flex-1 overflow-auto border border-border rounded">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-muted/60">
            <tr>
              <th className="border-b border-border px-3 py-2 text-left font-semibold text-foreground w-8" />
              <th className="border-b border-border px-3 py-2 text-left font-semibold text-foreground w-28">Code</th>
              <th className="border-b border-border px-3 py-2 text-left font-semibold text-foreground w-40">Name</th>
              <th className="border-b border-border px-3 py-2 text-left font-semibold text-foreground w-24">Start</th>
              <th className="border-b border-border px-3 py-2 text-left font-semibold text-foreground w-24">End</th>
              <th className="border-b border-border px-3 py-2 text-center font-semibold text-foreground w-20">Rules</th>
              <th className="border-b border-border px-3 py-2 text-right font-semibold text-foreground w-24">Budget</th>
              <th className="border-b border-border px-3 py-2 text-right font-semibold text-foreground w-24">Consumed</th>
              <th className="border-b border-border px-3 py-2 text-center font-semibold text-foreground w-16">Active</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : filtered?.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No promotions. Click New to create one.</td></tr>
            ) : (
              filtered?.map((row, idx) => (
                <tr
                  key={row?.id}
                  onClick={() => setSelectedId(selectedId === row?.id ? null : row?.id)}
                  className={`border-b border-border/50 cursor-pointer ${selectedId === row?.id ? 'bg-primary/10' : idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-primary/5`}
                >
                  <td className="px-3 py-1.5 text-center">{selectedId === row?.id ? '✓' : ''}</td>
                  <td className="px-3 py-1.5 font-mono text-primary">{row?.promotion_code || '—'}</td>
                  <td className="px-3 py-1.5">{row?.name || '—'}</td>
                  <td className="px-3 py-1.5">{formatDate(row?.start_date)}</td>
                  <td className="px-3 py-1.5">{formatDate(row?.end_date)}</td>
                  <td className="px-3 py-1.5 text-center">{row?._rule_count ?? 0}</td>
                  <td className="px-3 py-1.5 text-right">{row?.budget_cartons != null ? Number(row.budget_cartons)?.toLocaleString('en-GB', { maximumFractionDigits: 2 }) : '—'}</td>
                  <td className="px-3 py-1.5 text-right">{row?.consumed_cartons != null ? Number(row.consumed_cartons)?.toLocaleString('en-GB', { maximumFractionDigits: 2 }) : '0'}</td>
                  <td className="px-3 py-1.5 text-center">{row?.active ? 'Yes' : 'No'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <PromotionModal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} onSaved={handleSaved} editItem={editItem} />
    </div>
  );
};

export default PromotionsSpreadsheet;
