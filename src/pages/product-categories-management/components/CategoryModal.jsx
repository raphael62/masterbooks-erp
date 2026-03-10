import React, { useState, useEffect, useRef } from 'react';
import { X, Tag } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const INITIAL_FORM = {
  category_code: '',
  category_name: '',
  description: '',
  status: 'active',
};

const CategoryModal = ({ isOpen, onClose, onSuccess, editItem }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const firstInputRef = useRef(null);
  const isEditMode = !!editItem?.id;

  useEffect(() => {
    if (!isOpen) return;
    if (editItem?.id) {
      setForm({
        category_code: editItem?.category_code || '',
        category_name: editItem?.category_name || '',
        description: editItem?.description || '',
        status: editItem?.status || 'active',
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
    setSaveError('');
    setTimeout(() => firstInputRef?.current?.focus(), 100);
  }, [isOpen, editItem]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e?.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    setSaveError('');
  };

  const validate = () => {
    const errs = {};
    if (!form?.category_code?.trim()) errs.category_code = 'Category Code is required';
    if (!form?.category_name?.trim()) errs.category_name = 'Category Name is required';
    setErrors(errs);
    return Object.keys(errs)?.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
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
      let error;
      if (isEditMode) {
        const result = await supabase?.from('product_categories')?.update(payload)?.eq('id', editItem?.id);
        error = result?.error;
      } else {
        const result = await supabase?.from('product_categories')?.insert([payload]);
        error = result?.error;
      }
      if (error) throw error;
      onSuccess?.();
      onClose();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save category.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = (field) =>
    `w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
      errors?.[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e?.target === e?.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 bg-primary rounded-t-lg">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-white" />
            <h2 className="text-sm font-semibold text-white">{isEditMode ? 'Edit Category' : 'New Category'}</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-white/70 transition-colors p-0.5 rounded">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">
          {saveError && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">{saveError}</div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Category Code <span className="text-red-500">*</span></label>
              <input ref={firstInputRef} type="text" value={form?.category_code}
                onChange={e => handleChange('category_code', e?.target?.value)}
                placeholder="e.g. BEV" className={inputCls('category_code')} />
              {errors?.category_code && <p className="text-xs text-red-500 mt-0.5">{errors?.category_code}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
              <select value={form?.status} onChange={e => handleChange('status', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Category Name <span className="text-red-500">*</span></label>
              <input type="text" value={form?.category_name}
                onChange={e => handleChange('category_name', e?.target?.value)}
                placeholder="e.g. Beverages" className={inputCls('category_name')} />
              {errors?.category_name && <p className="text-xs text-red-500 mt-0.5">{errors?.category_name}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Description</label>
              <textarea value={form?.description} onChange={e => handleChange('description', e?.target?.value)}
                placeholder="Optional description..." rows={3}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary resize-none" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={isSaving}
            className="px-4 py-1.5 text-xs font-medium bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-60 transition-colors">
            {isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
