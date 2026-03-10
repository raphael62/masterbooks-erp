import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const PriceTypeModal = ({ item, onClose, onSaved }) => {
  const isEdit = !!item;
  const [form, setForm] = useState({
    price_type_code: '',
    price_type_name: '',
    description: '',
    discount_percent: '',
    status: 'active',
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        price_type_code: item?.price_type_code || '',
        price_type_name: item?.price_type_name || '',
        description: item?.description || '',
        discount_percent: item?.discount_percent != null ? String(item?.discount_percent) : '',
        status: (item?.status || 'active')?.toLowerCase() === 'inactive' ? 'inactive' : 'active',
      });
    } else {
      setForm({
        price_type_code: '',
        price_type_name: '',
        description: '',
        discount_percent: '',
        status: 'active',
      });
    }
  }, [item]);

  useEffect(() => {
    const handleKey = (e) => { if (e?.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const validate = () => {
    const errs = {};
    if (!form?.price_type_code?.trim()) errs.price_type_code = 'Code is required';
    if (!form?.price_type_name?.trim()) errs.price_type_name = 'Name is required';
    if (form?.discount_percent !== '' && form?.discount_percent != null) {
      const val = parseFloat(form?.discount_percent);
      if (isNaN(val) || val < 0 || val > 100) errs.discount_percent = 'Must be between 0 and 100';
    }
    return errs;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    setSaveError('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const errs = validate();
    if (Object.keys(errs)?.length > 0) { setErrors(errs); return; }
    setIsSaving(true);
    setSaveError('');
    try {
      const payload = {
        price_type_code: form?.price_type_code?.trim()?.toUpperCase(),
        price_type_name: form?.price_type_name?.trim(),
        description: form?.description?.trim() || null,
        discount_percent: form?.discount_percent !== '' ? parseFloat(form?.discount_percent) : 0,
        status: form?.status === 'active' ? 'Active' : 'Inactive',
        updated_at: new Date()?.toISOString(),
      };
      if (isEdit) {
        const { error } = await supabase?.from('price_types')?.update(payload)?.eq('id', item?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase?.from('price_types')?.insert([payload]);
        if (error) throw error;
      }
      onSaved?.();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save price type');
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls = (field) =>
    `w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
      errors?.[field] ? 'border-red-400 bg-red-50' : 'border-border bg-background'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e?.target === e?.currentTarget) onClose(); }}
    >
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-md mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-primary rounded-t-lg">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-white" />
            <h2 className="text-sm font-semibold text-white">{isEdit ? 'Edit Price Type' : 'New Price Type'}</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-white/70 transition-colors p-0.5 rounded" title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {saveError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">{saveError}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-0.5">Price Type Code <span className="text-red-500">*</span></label>
              <input type="text" value={form?.price_type_code} onChange={e => handleChange('price_type_code', e?.target?.value)}
                placeholder="e.g. RETAIL" className={inputCls('price_type_code')} autoFocus />
              {errors?.price_type_code && <p className="mt-0.5 text-xs text-red-500">{errors?.price_type_code}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-0.5">Status</label>
              <select value={form?.status} onChange={e => handleChange('status', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-border rounded focus:outline-none focus:border-primary bg-background">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-0.5">Price Type Name <span className="text-red-500">*</span></label>
            <input type="text" value={form?.price_type_name} onChange={e => handleChange('price_type_name', e?.target?.value)}
              placeholder="e.g. Retail Price" className={inputCls('price_type_name')} />
            {errors?.price_type_name && <p className="mt-0.5 text-xs text-red-500">{errors?.price_type_name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-0.5">Description</label>
            <textarea value={form?.description} onChange={e => handleChange('description', e?.target?.value)}
              placeholder="Optional description..." rows={3}
              className="w-full px-2 py-1.5 text-xs border border-border rounded focus:outline-none focus:border-primary bg-background resize-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-0.5">Discount %</label>
            <input type="number" min="0" max="100" step="0.01" value={form?.discount_percent}
              onChange={e => handleChange('discount_percent', e?.target?.value)} placeholder="0.00"
              className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary tabular-nums ${errors?.discount_percent ? 'border-red-400 bg-red-50' : 'border-border bg-background'}`} />
            {errors?.discount_percent && <p className="mt-0.5 text-xs text-red-500">{errors?.discount_percent}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium border border-border rounded hover:bg-accent transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving}
              className="px-4 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {isSaving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PriceTypeModal;
