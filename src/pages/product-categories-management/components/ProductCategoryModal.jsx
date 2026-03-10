import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const INITIAL_FORM = {
  category_code: '',
  category_name: '',
  description: '',
  status: 'active',
};

const ProductCategoryModal = ({ item, onClose, onSaved }) => {
  const isEdit = !!item;
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        category_code: item?.category_code || '',
        category_name: item?.category_name || '',
        description: item?.description || '',
        status: item?.status || 'active',
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
    setSaveError('');
  }, [item]);

  useEffect(() => {
    const handleKey = (e) => { if (e?.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const validate = () => {
    const errs = {};
    if (!form?.category_code?.trim()) errs.category_code = 'Category Code is required';
    if (!form?.category_name?.trim()) errs.category_name = 'Category Name is required';
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
        category_code: form?.category_code?.trim()?.toUpperCase(),
        category_name: form?.category_name?.trim(),
        description: form?.description?.trim() || null,
        status: form?.status,
        updated_at: new Date()?.toISOString(),
      };
      if (isEdit) {
        const { error } = await supabase?.from('product_categories')?.update(payload)?.eq('id', item?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase?.from('product_categories')?.insert([payload]);
        if (error) throw error;
      }
      onSaved?.();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save category');
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
            <h2 className="text-sm font-semibold text-white">{isEdit ? 'Edit Category' : 'New Product Category'}</h2>
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
              <label className="block text-xs font-medium text-foreground mb-0.5">Category Code <span className="text-red-500">*</span></label>
              <input type="text" value={form?.category_code} onChange={e => handleChange('category_code', e?.target?.value)}
                placeholder="e.g. BEV" className={inputCls('category_code')} autoFocus />
              {errors?.category_code && <p className="mt-0.5 text-xs text-red-500">{errors?.category_code}</p>}
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
            <label className="block text-xs font-medium text-foreground mb-0.5">Category Name <span className="text-red-500">*</span></label>
            <input type="text" value={form?.category_name} onChange={e => handleChange('category_name', e?.target?.value)}
              placeholder="e.g. Beverages" className={inputCls('category_name')} />
            {errors?.category_name && <p className="mt-0.5 text-xs text-red-500">{errors?.category_name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-0.5">Description</label>
            <textarea value={form?.description} onChange={e => handleChange('description', e?.target?.value)}
              placeholder="Optional description..." rows={3}
              className="w-full px-2 py-1.5 text-xs border border-border rounded focus:outline-none focus:border-primary bg-background resize-none" />
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

export default ProductCategoryModal;
