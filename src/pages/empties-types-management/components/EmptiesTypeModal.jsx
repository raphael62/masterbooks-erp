import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const INITIAL_FORM = {
  empties_code: '',
  empties_name: '',
  status: 'active',
};

const EmptiesTypeModal = ({ item, onClose, onSaved }) => {
  const isEdit = !!item;
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        empties_code: item?.empties_code || '',
        empties_name: item?.empties_name || '',
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
    if (!form?.empties_code?.trim()) errs.empties_code = 'Empties Code is required';
    if (!form?.empties_name?.trim()) errs.empties_name = 'Empties Name is required';
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
        empties_code: form?.empties_code?.trim()?.toUpperCase(),
        empties_name: form?.empties_name?.trim(),
        status: form?.status,
        updated_at: new Date()?.toISOString(),
      };
      if (isEdit) {
        const { error } = await supabase?.from('empties_types')?.update(payload)?.eq('id', item?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase?.from('empties_types')?.insert([payload]);
        if (error) throw error;
      }
      onSaved?.();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save empties type');
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
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-md mx-4 flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-primary rounded-t-lg">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-white" />
            <h2 className="text-sm font-semibold text-white">{isEdit ? 'Edit Empties Type' : 'New Empties Type'}</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-white/70 transition-colors p-0.5 rounded" title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {saveError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">{saveError}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-0.5">Empties Code <span className="text-red-500">*</span></label>
              <input type="text" value={form?.empties_code} onChange={e => handleChange('empties_code', e?.target?.value)}
                placeholder="e.g. GB-330" className={inputCls('empties_code')} autoFocus />
              {errors?.empties_code && <p className="mt-0.5 text-xs text-red-500">{errors?.empties_code}</p>}
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
            <label className="block text-xs font-medium text-foreground mb-0.5">Empties Name <span className="text-red-500">*</span></label>
            <input type="text" value={form?.empties_name} onChange={e => handleChange('empties_name', e?.target?.value)}
              placeholder="e.g. Glass Bottle 330ml" className={inputCls('empties_name')} />
            {errors?.empties_name && <p className="mt-0.5 text-xs text-red-500">{errors?.empties_name}</p>}
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

export default EmptiesTypeModal;
