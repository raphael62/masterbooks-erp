import React, { useState, useEffect, useCallback } from 'react';
import { X, MapPin, Users, UserCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const TABLE_ICONS = {
  location_types: MapPin,
  customer_groups: Users,
  customer_types: UserCircle,
};

const SimpleLookupModal = ({ table, columns, editItem, onClose, onSaved, modalTitle }) => {
  const isEdit = !!editItem?.id;
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const Icon = TABLE_ICONS[table] || UserCircle;

  useEffect(() => {
    const initial = {};
    columns?.forEach(col => {
      initial[col.key] = editItem?.[col.key] ?? (col.default ?? '');
    });
    setForm(initial);
  }, [editItem?.id, columns]);

  useEffect(() => {
    const handleKey = (e) => { if (e?.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors?.[key]) setErrors(prev => ({ ...prev, [key]: '' }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (!form?.code?.trim()) errs.code = 'Code is required';
    if (!form?.name?.trim()) errs.name = 'Name is required';
    if (Object.keys(errs)?.length > 0) { setErrors(errs); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        code: form?.code?.trim()?.toUpperCase(),
        name: form?.name?.trim(),
        description: form?.description?.trim() || null,
        status: form?.status || 'active',
        updated_at: new Date()?.toISOString(),
      };
      if (isEdit) {
        const { error: err } = await supabase?.from(table)?.update(payload)?.eq('id', editItem?.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase?.from(table)?.insert([payload]);
        if (err) throw err;
      }
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (field) =>
    `w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
      errors?.[field] ? 'border-red-400 bg-red-50' : 'border-border bg-background'
    }`;

  const singular = modalTitle?.endsWith('s') ? modalTitle?.slice(0, -1) : modalTitle;
  const title = isEdit ? `Edit ${singular}` : `New ${singular}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e?.target === e?.currentTarget) onClose(); }}
    >
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-md mx-4 flex flex-col" onClick={(e) => e?.stopPropagation?.()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-primary rounded-t-lg">
          <div className="flex items-center gap-2">
            <Icon size={16} className="text-white" />
            <h2 className="text-sm font-semibold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-white/70 transition-colors p-0.5 rounded" title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-0.5">Code <span className="text-red-500">*</span></label>
              <input type="text" value={form?.code ?? ''} onChange={e => handleChange('code', e?.target?.value)}
                placeholder="e.g. RETAIL" className={inputCls('code')} autoFocus />
              {errors?.code && <p className="mt-0.5 text-xs text-red-500">{errors?.code}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-0.5">Status</label>
              <select value={form?.status ?? 'active'} onChange={e => handleChange('status', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-border rounded focus:outline-none focus:border-primary bg-background">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-0.5">Name <span className="text-red-500">*</span></label>
            <input type="text" value={form?.name ?? ''} onChange={e => handleChange('name', e?.target?.value)}
              placeholder="e.g. Retail" className={inputCls('name')} />
            {errors?.name && <p className="mt-0.5 text-xs text-red-500">{errors?.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-0.5">Description</label>
            <textarea value={form?.description ?? ''} onChange={e => handleChange('description', e?.target?.value)}
              placeholder="Optional description..." rows={3}
              className="w-full px-2 py-1.5 text-xs border border-border rounded focus:outline-none focus:border-primary bg-background resize-none" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium border border-border rounded hover:bg-accent transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SimpleLookupTab = ({ table, columns, title }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase?.from(table)?.select('*')?.order(columns?.[0]?.key || 'code');
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [table, columns]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleNew = () => { setEditItem(null); setShowModal(true); };
  const handleEdit = (row) => { setEditItem(row); setShowModal(true); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await supabase?.from(table)?.delete()?.eq('id', id);
      fetchData();
    } catch (err) { alert(err?.message || 'Delete failed'); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <button onClick={handleNew} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add New
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {columns?.map(col => <th key={col.key} className="px-3 py-2 text-left font-medium text-gray-700">{col.label}</th>)}
                <th className="px-3 py-2 w-24 text-right font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items?.length === 0 ? (
                <tr><td colSpan={(columns?.length || 1) + 1} className="px-3 py-8 text-center text-muted-foreground">No records</td></tr>
              ) : (
                items?.map(row => (
                  <tr key={row?.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {columns?.map(col => <td key={col.key} className="px-3 py-2 text-gray-800">{row?.[col.key] ?? '-'}</td>)}
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => handleEdit(row)} className="text-primary hover:underline text-xs mr-2">Edit</button>
                      <button onClick={() => handleDelete(row?.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      {showModal && (
        <SimpleLookupModal table={table} columns={columns} editItem={editItem} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchData(); }} modalTitle={title} />
      )}
    </div>
  );
};

export default SimpleLookupTab;
