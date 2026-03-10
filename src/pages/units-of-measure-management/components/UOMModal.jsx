import React, { useState, useEffect } from 'react';
import { X, Ruler } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const UOM_TYPES = ['Weight', 'Volume', 'Count', 'Length'];

const INITIAL_FORM = {
  uom_code: '',
  uom_name: '',
  uom_type: 'Count',
  status: 'active',
};

const UOMModal = ({ item, onClose, onSaved }) => {
  const isEdit = !!item;
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        uom_code: item?.uom_code || '',
        uom_name: item?.uom_name || '',
        uom_type: item?.uom_type || 'Count',
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
    if (!form?.uom_code?.trim()) errs.uom_code = 'UOM Code is required';
    if (!form?.uom_name?.trim()) errs.uom_name = 'UOM Name is required';
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
        uom_code: form?.uom_code?.trim()?.toUpperCase(),
        uom_name: form?.uom_name?.trim(),
        uom_type: form?.uom_type,
        status: form?.status,
        updated_at: new Date()?.toISOString(),
      };
      if (isEdit) {
        const { error } = await supabase?.from('units_of_measure')?.update(payload)?.eq('id', item?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase?.from('units_of_measure')?.insert([payload]);
        if (error) throw error;
      }
      onSaved?.();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save unit of measure');
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
            <Ruler size={16} className="text-white" />
            <h2 className="text-sm font-semibold text-white">{isEdit ? 'Edit Unit of Measure' : 'New Unit of Measure'}</h2>
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
              <label className="block text-xs font-medium text-foreground mb-0.5">UOM Code <span className="text-red-500">*</span></label>
              <input type="text" value={form?.uom_code} onChange={e => handleChange('uom_code', e?.target?.value)}
                placeholder="e.g. CS" className={inputCls('uom_code')} autoFocus />
              {errors?.uom_code && <p className="mt-0.5 text-xs text-red-500">{errors?.uom_code}</p>}
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
            <label className="block text-xs font-medium text-foreground mb-0.5">UOM Name <span className="text-red-500">*</span></label>
            <input type="text" value={form?.uom_name} onChange={e => handleChange('uom_name', e?.target?.value)}
              placeholder="e.g. Cases" className={inputCls('uom_name')} />
            {errors?.uom_name && <p className="mt-0.5 text-xs text-red-500">{errors?.uom_name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-0.5">Type</label>
            <select value={form?.uom_type} onChange={e => handleChange('uom_type', e?.target?.value)}
              className="w-full h-7 px-2 text-xs border border-border rounded focus:outline-none focus:border-primary bg-background">
              {UOM_TYPES?.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
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

export default UOMModal;
