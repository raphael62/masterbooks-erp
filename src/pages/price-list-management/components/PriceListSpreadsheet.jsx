import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Edit2, Trash2, Download, X, Upload } from 'lucide-react';
import PriceListModal from './PriceListModal';
import PriceListImportModal from './PriceListImportModal';

const formatDate = (d) => {
  if (!d) return '—';
  try { return new Date(d + 'T00:00:00')?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const PriceListSpreadsheet = () => {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Filters
  const [searchPriceType, setSearchPriceType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [priceTypeOptions, setPriceTypeOptions] = useState([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: headers, error } = await supabase?.from('price_list_headers')?.select('*')?.order('created_at', { ascending: false });
      if (error) throw error;

      const { data: ptData } = await supabase?.from('price_types')?.select('id, type_name')?.order('type_name');
      const ptMap = {};
      (ptData || [])?.forEach(pt => { ptMap[pt.id] = pt?.type_name; });
      setPriceTypeOptions(ptData || []);

      // Count items per header
      const { data: itemCounts } = await supabase?.from('price_list_items')?.select('header_id, price_list_header_id');
      const countMap = {};
      (itemCounts || [])?.forEach(i => {
        const hid = i?.header_id || i?.price_list_header_id;
        if (hid) countMap[hid] = (countMap?.[hid] || 0) + 1;
      });

      const enriched = (headers || [])?.map(h => ({
        ...h,
        _price_type_name: ptMap?.[h?.price_type_id] || '—',
        _item_count: countMap?.[h?.id] || 0,
        _effective_date: h?.effective_date || h?.start_date || null,
        _expiry_date: h?.expiry_date || h?.end_date || null,
        _name: h?.name || h?.price_list_name || '',
      }));
      setRows(enriched);
    } catch (err) {
      console.error('Fetch error:', err);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // F2 shortcut
  useEffect(() => {
    const onKey = (e) => {
      if (e?.key === 'F2') { e?.preventDefault(); setEditItem(null); setShowModal(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    let list = rows;
    if (searchPriceType) {
      list = list?.filter(r => r?.price_type_id === searchPriceType);
    }
    if (filterDateFrom) {
      list = list?.filter(r => r?._effective_date && r?._effective_date >= filterDateFrom);
    }
    if (filterDateTo) {
      list = list?.filter(r => r?._effective_date && r?._effective_date <= filterDateTo);
    }
    return list;
  }, [rows, searchPriceType, filterDateFrom, filterDateTo]);

  const handleNew = () => { setEditItem(null); setShowModal(true); };

  const handleEdit = () => {
    const row = rows?.find(r => r?.id === selectedId);
    if (!row) { alert('Please select a price list to edit.'); return; }
    setEditItem(row);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!selectedId) { alert('Please select a price list to delete.'); return; }
    const row = rows?.find(r => r?.id === selectedId);
    if (!window.confirm(`Delete "${row?._name}"? This will also remove all line items.`)) return;
    try {
      const { error } = await supabase?.from('price_list_headers')?.delete()?.eq('id', selectedId);
      if (error) throw error;
      setSelectedId(null);
      fetchData();
    } catch (err) {
      alert('Delete failed: ' + err?.message);
    }
  };

  const handleImportCSV = () => {
    if (!selectedId) {
      alert('Please select a price list first, then click Import CSV to add items to it.');
      return;
    }
    setShowImportModal(true);
  };

  const handleExport = () => {
    const cols = ['Price List Name', 'Price Type', 'Effective Date', 'Expiry Date', 'No. of Items', 'Created At'];
    const dataRows = filtered?.map(r => [
      r?._name,
      r?._price_type_name,
      r?._effective_date || '',
      r?._expiry_date || '',
      r?._item_count,
      r?.created_at ? new Date(r.created_at)?.toLocaleDateString() : '',
    ]?.join('\t'));
    const content = [cols?.join('\t'), ...dataRows]?.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'price_lists.xls'; a?.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchPriceType('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const hasFilters = searchPriceType || filterDateFrom || filterDateTo;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Action buttons */}
        <button
          onClick={handleNew}
          className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          title="New (F2)"
        >
          <Plus size={13} /> New <span className="text-white/60 text-xs">(F2)</span>
        </button>
        <button
          onClick={handleEdit}
          className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
        >
          <Edit2 size={13} /> Edit
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
        >
          <Trash2 size={13} /> Delete
        </button>
        <button
          onClick={handleImportCSV}
          className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-indigo-300 text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
          title="Select a price list row first, then click to import CSV items into it"
        >
          <Upload size={13} /> Import CSV
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
        >
          <Download size={13} /> Excel
        </button>

        <div className="flex-1" />

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={searchPriceType}
            onChange={e => setSearchPriceType(e?.target?.value)}
            className="h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
          >
            <option value="">All Price Types</option>
            {priceTypeOptions?.map(pt => (
              <option key={pt?.id} value={pt?.id}>{pt?.type_name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">From:</span>
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e?.target?.value)}
              className="h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">To:</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={e => setFilterDateTo(e?.target?.value)}
              className="h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 h-8 px-2 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded hover:bg-gray-50"
              title="Clear filters"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>
      {/* Table */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100">
              <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-600">Price List Name</th>
              <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-600">Price Type</th>
              <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-600">Effective Date</th>
              <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-600">Expiry Date</th>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold text-gray-600">No. of Items</th>
              <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-600">Created At</th>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading price lists...
                  </div>
                </td>
              </tr>
            ) : filtered?.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  No price lists found. Click <strong>New</strong> to create one.
                </td>
              </tr>
            ) : (
              filtered?.map((row, i) => (
                <tr
                  key={row?.id}
                  onClick={() => setSelectedId(row?.id)}
                  onDoubleClick={() => { setEditItem(row); setShowModal(true); }}
                  className={`cursor-pointer transition-colors ${
                    selectedId === row?.id
                      ? 'bg-primary/10 border-l-2 border-primary'
                      : i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/60 hover:bg-gray-100'
                  }`}
                >
                  <td className="border-b border-gray-100 px-3 py-2 font-medium text-gray-800">{row?._name}</td>
                  <td className="border-b border-gray-100 px-3 py-2 text-gray-600">{row?._price_type_name}</td>
                  <td className="border-b border-gray-100 px-3 py-2 text-gray-600">{formatDate(row?._effective_date)}</td>
                  <td className="border-b border-gray-100 px-3 py-2 text-gray-600">{formatDate(row?._expiry_date)}</td>
                  <td className="border-b border-gray-100 px-3 py-2 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-5 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                      {row?._item_count}
                    </span>
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2 text-gray-500">
                    {row?.created_at ? new Date(row.created_at)?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={e => { e?.stopPropagation(); setEditItem(row); setShowModal(true); }}
                        className="flex items-center gap-1 h-6 px-2 text-xs font-medium text-primary border border-primary/30 rounded hover:bg-primary/10 transition-colors"
                      >
                        <Edit2 size={10} /> Edit
                      </button>
                      <button
                        onClick={async e => {
                          e?.stopPropagation();
                          if (!window.confirm(`Delete "${row?._name}"?`)) return;
                          try {
                            await supabase?.from('price_list_headers')?.delete()?.eq('id', row?.id);
                            if (selectedId === row?.id) setSelectedId(null);
                            fetchData();
                          } catch (err) { alert('Delete failed: ' + err?.message); }
                        }}
                        className="flex items-center gap-1 h-6 px-2 text-xs font-medium text-red-500 border border-red-200 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={10} /> Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Status bar */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
        <span>{filtered?.length} price list{filtered?.length !== 1 ? 's' : ''}{hasFilters ? ' (filtered)' : ''}</span>
        <span>Double-click a row to edit</span>
      </div>
      {/* Modal */}
      {showModal && (
        <PriceListModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSuccess={() => { fetchData(); setShowModal(false); setEditItem(null); }}
          editItem={editItem}
        />
      )}
      {showImportModal && (
        <PriceListImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => { fetchData(); setShowImportModal(false); }}
          priceListHeader={rows?.find(r => r?.id === selectedId) || null}
        />
      )}
    </div>
  );
};

export default PriceListSpreadsheet;
