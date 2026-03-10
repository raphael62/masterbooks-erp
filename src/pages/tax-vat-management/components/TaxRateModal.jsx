import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

const TAX_TYPES = ['VAT', 'Withholding Tax', 'NHIL', 'GetFund Levy', 'COVID Levy'];
const APPLIES_TO = ['Sales', 'Purchases', 'Both'];

const TaxRateModal = ({ item, onClose, onSaved }) => {
  const isEdit = !!item;
  const [form, setForm] = useState({
    tax_code: '',
    tax_name: '',
    tax_type: 'VAT',
    rate: '',
    applies_to: 'Both',
    effective_date: '',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        tax_code: item?.tax_code || '',
        tax_name: item?.tax_name || '',
        tax_type: item?.tax_type || 'VAT',
        rate: item?.rate != null ? String(item?.rate) : '',
        applies_to: item?.applies_to || 'Both',
        effective_date: item?.effective_date || '',
        status: item?.status || 'Active',
      });
    } else {
      setForm({
        tax_code: '',
        tax_name: '',
        tax_type: 'VAT',
        rate: '',
        applies_to: 'Both',
        effective_date: '',
        status: 'Active',
      });
    }
  }, [item]);

  const validate = () => {
    const errs = {};
    if (!form?.tax_code?.trim()) errs.tax_code = 'Tax Code is required';
    if (!form?.tax_name?.trim()) errs.tax_name = 'Tax Name is required';
    if (form?.rate !== '' && (isNaN(parseFloat(form?.rate)) || parseFloat(form?.rate) < 0 || parseFloat(form?.rate) > 100)) {
      errs.rate = 'Rate must be between 0 and 100';
    }
    return errs;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const errs = validate();
    if (Object.keys(errs)?.length > 0) { setErrors(errs); return; }
    setIsSaving(true);
    setSaveError('');
    try {
      const payload = {
        tax_code: form?.tax_code?.trim()?.toUpperCase(),
        tax_name: form?.tax_name?.trim(),
        tax_type: form?.tax_type,
        rate: form?.rate !== '' ? parseFloat(form?.rate) : 0,
        applies_to: form?.applies_to,
        effective_date: form?.effective_date || null,
        status: form?.status,
        updated_at: new Date()?.toISOString(),
      };
      if (isEdit) {
        const { error } = await supabase?.from('tax_rates')?.update(payload)?.eq('id', item?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase?.from('tax_rates')?.insert([payload]);
        if (error) throw error;
      }
      onSaved?.();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save tax rate');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 ${
      errors?.[field] ? 'border-destructive' : 'border-border'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{isEdit ? 'Edit Tax Rate' : 'New Tax Rate'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {saveError && (
            <div className="px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{saveError}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Tax Code <span className="text-destructive">*</span></label>
              <input type="text" value={form?.tax_code} onChange={e => handleChange('tax_code', e?.target?.value)}
                placeholder="e.g. VAT-125" className={inputClass('tax_code')} />
              {errors?.tax_code && <p className="mt-1 text-xs text-destructive">{errors?.tax_code}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Status</label>
              <select value={form?.status} onChange={e => handleChange('status', e?.target?.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Tax Name <span className="text-destructive">*</span></label>
            <input type="text" value={form?.tax_name} onChange={e => handleChange('tax_name', e?.target?.value)}
              placeholder="e.g. Value Added Tax" className={inputClass('tax_name')} />
            {errors?.tax_name && <p className="mt-1 text-xs text-destructive">{errors?.tax_name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Tax Type</label>
              <select value={form?.tax_type} onChange={e => handleChange('tax_type', e?.target?.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50">
                {TAX_TYPES?.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Rate %</label>
              <input type="number" min="0" max="100" step="0.01" value={form?.rate} onChange={e => handleChange('rate', e?.target?.value)}
                placeholder="0.00" className={inputClass('rate')} />
              {errors?.rate && <p className="mt-1 text-xs text-destructive">{errors?.rate}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Applies To</label>
              <select value={form?.applies_to} onChange={e => handleChange('applies_to', e?.target?.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50">
                {APPLIES_TO?.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Effective Date</label>
              <input type="date" value={form?.effective_date} onChange={e => handleChange('effective_date', e?.target?.value)}
                className={inputClass('effective_date')} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {isSaving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaxRateModal;
