import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

const ACCOUNT_TYPES = ['Cash', 'Bank', 'Mobile Money'];
const CURRENCIES = ['GHS', 'USD', 'EUR', 'GBP', 'NGN'];

const PaymentAccountModal = ({ item, onClose, onSaved }) => {
  const isEdit = !!item;
  const [form, setForm] = useState({
    account_code: '',
    account_name: '',
    account_type: 'Cash',
    bank_name: '',
    account_number: '',
    branch: '',
    currency: 'GHS',
    opening_balance: '',
    current_balance: '',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        account_code: item?.account_code || '',
        account_name: item?.account_name || '',
        account_type: item?.account_type || 'Cash',
        bank_name: item?.bank_name || '',
        account_number: item?.account_number || '',
        branch: item?.branch || '',
        currency: item?.currency || 'GHS',
        opening_balance: item?.opening_balance != null ? String(item?.opening_balance) : '',
        current_balance: item?.current_balance != null ? String(item?.current_balance) : '',
        status: item?.status || 'Active',
      });
    } else {
      setForm({
        account_code: '',
        account_name: '',
        account_type: 'Cash',
        bank_name: '',
        account_number: '',
        branch: '',
        currency: 'GHS',
        opening_balance: '',
        current_balance: '',
        status: 'Active',
      });
    }
  }, [item]);

  const validate = () => {
    const errs = {};
    if (!form?.account_code?.trim()) errs.account_code = 'Account Code is required';
    if (!form?.account_name?.trim()) errs.account_name = 'Account Name is required';
    if (!form?.account_type) errs.account_type = 'Account Type is required';
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
        account_code: form?.account_code?.trim()?.toUpperCase(),
        account_name: form?.account_name?.trim(),
        account_type: form?.account_type,
        bank_name: form?.bank_name?.trim() || null,
        account_number: form?.account_number?.trim() || null,
        branch: form?.branch?.trim() || null,
        currency: form?.currency || 'GHS',
        opening_balance: form?.opening_balance !== '' ? parseFloat(form?.opening_balance) : 0,
        current_balance: form?.current_balance !== '' ? parseFloat(form?.current_balance) : 0,
        status: form?.status,
        updated_at: new Date()?.toISOString(),
      };
      if (isEdit) {
        const { error } = await supabase?.from('payment_accounts')?.update(payload)?.eq('id', item?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase?.from('payment_accounts')?.insert([payload]);
        if (error) throw error;
      }
      onSaved?.();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save account');
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
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-semibold text-foreground">{isEdit ? 'Edit Payment Account' : 'New Payment Account'}</h2>
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
              <label className="block text-xs font-medium text-foreground mb-1">Account Code <span className="text-destructive">*</span></label>
              <input type="text" value={form?.account_code} onChange={e => handleChange('account_code', e?.target?.value)}
                placeholder="e.g. CASH-001" className={inputClass('account_code')} />
              {errors?.account_code && <p className="mt-1 text-xs text-destructive">{errors?.account_code}</p>}
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
            <label className="block text-xs font-medium text-foreground mb-1">Account Name <span className="text-destructive">*</span></label>
            <input type="text" value={form?.account_name} onChange={e => handleChange('account_name', e?.target?.value)}
              placeholder="e.g. Main Cash Account" className={inputClass('account_name')} />
            {errors?.account_name && <p className="mt-1 text-xs text-destructive">{errors?.account_name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Account Type <span className="text-destructive">*</span></label>
              <select value={form?.account_type} onChange={e => handleChange('account_type', e?.target?.value)}
                className={inputClass('account_type')}>
                {ACCOUNT_TYPES?.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors?.account_type && <p className="mt-1 text-xs text-destructive">{errors?.account_type}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Currency</label>
              <select value={form?.currency} onChange={e => handleChange('currency', e?.target?.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50">
                {CURRENCIES?.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {(form?.account_type === 'Bank' || form?.account_type === 'Mobile Money') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Bank Name</label>
                <input type="text" value={form?.bank_name} onChange={e => handleChange('bank_name', e?.target?.value)}
                  placeholder="e.g. GCB Bank" className={inputClass('bank_name')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Account Number</label>
                <input type="text" value={form?.account_number} onChange={e => handleChange('account_number', e?.target?.value)}
                  placeholder="e.g. 1234567890" className={inputClass('account_number')} />
              </div>
            </div>
          )}
          {form?.account_type === 'Bank' && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Branch</label>
              <input type="text" value={form?.branch} onChange={e => handleChange('branch', e?.target?.value)}
                placeholder="e.g. Accra Main Branch" className={inputClass('branch')} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Opening Balance</label>
              <input type="number" step="0.01" value={form?.opening_balance} onChange={e => handleChange('opening_balance', e?.target?.value)}
                placeholder="0.00" className={inputClass('opening_balance')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Current Balance</label>
              <input type="number" step="0.01" value={form?.current_balance} onChange={e => handleChange('current_balance', e?.target?.value)}
                placeholder="0.00" className={inputClass('current_balance')} />
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

export default PaymentAccountModal;
