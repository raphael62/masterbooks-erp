import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

const ACCOUNT_TYPES = ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Cost of Goods Sold', 'Expenses'];

const SUB_TYPES_BY_TYPE = {
  'Assets': ['Current Assets', 'Fixed Assets', 'Other Assets'],
  'Liabilities': ['Current Liabilities', 'Long-term Liabilities'],
  'Equity': ['Owners Equity', 'Retained Earnings', 'Reserves'],
  'Revenue': ['Operating Revenue', 'Other Revenue', 'Contra Revenue'],
  'Cost of Goods Sold': ['Direct Costs'],
  'Expenses': ['Administrative Expenses', 'Selling Expenses', 'Finance Expenses'],
};

const CODE_PREFIXES = {
  'Assets': '1',
  'Liabilities': '2',
  'Equity': '3',
  'Revenue': '4',
  'Cost of Goods Sold': '5',
  'Expenses': '6',
};

const EMPTY_FORM = {
  account_code: '',
  account_name: '',
  account_type: 'Assets',
  sub_type: '',
  parent_account_id: '',
  is_header: false,
  currency: 'GHS',
  opening_balance: '',
  current_balance: '',
  is_active: true,
  description: '',
};

const CoAModal = ({ account, onClose, onSaved }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [headerAccounts, setHeaderAccounts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchHeaderAccounts = useCallback(async () => {
    try {
      const { data, error } = await supabase?.from('chart_of_accounts')?.select('id, account_code, account_name, account_type')?.eq('is_header', true)?.order('account_code');
      if (error) throw error;
      setHeaderAccounts(data || []);
    } catch (err) {
      console.error('Failed to fetch header accounts:', err);
    }
  }, []);

  useEffect(() => {
    fetchHeaderAccounts();
  }, [fetchHeaderAccounts]);

  useEffect(() => {
    if (account) {
      setForm({
        account_code: account?.account_code || '',
        account_name: account?.account_name || '',
        account_type: account?.account_type || 'Assets',
        sub_type: account?.sub_type || '',
        parent_account_id: account?.parent_account_id || '',
        is_header: account?.is_header || false,
        currency: account?.currency || 'GHS',
        opening_balance: account?.opening_balance ?? '',
        current_balance: account?.current_balance ?? '',
        is_active: account?.is_active !== false,
        description: account?.description || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [account]);

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'account_type' && !account) {
        updated.sub_type = '';
        updated.parent_account_id = '';
        const prefix = CODE_PREFIXES?.[value] || '';
        if (!prev?.account_code || Object.values(CODE_PREFIXES)?.some(p => prev?.account_code?.startsWith(p))) {
          updated.account_code = prefix;
        }
      }
      return updated;
    });
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form?.account_code?.trim()) errs.account_code = 'Account code is required';
    if (!form?.account_name?.trim()) errs.account_name = 'Account name is required';
    if (!form?.account_type) errs.account_type = 'Account type is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const errs = validate();
    if (Object.keys(errs)?.length > 0) { setErrors(errs); return; }
    setIsSaving(true);
    try {
      const payload = {
        account_code: form?.account_code?.trim(),
        account_name: form?.account_name?.trim(),
        account_type: form?.account_type,
        sub_type: form?.sub_type || null,
        parent_account_id: form?.parent_account_id || null,
        is_header: form?.is_header,
        currency: form?.currency || 'GHS',
        opening_balance: parseFloat(form?.opening_balance) || 0,
        current_balance: parseFloat(form?.current_balance) || 0,
        is_active: form?.is_active,
        description: form?.description?.trim() || null,
      };
      if (account?.id) {
        const { error } = await supabase?.from('chart_of_accounts')?.update(payload)?.eq('id', account?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase?.from('chart_of_accounts')?.insert(payload);
        if (error) throw error;
      }
      onSaved?.();
    } catch (err) {
      console.error('Save failed:', err);
      if (err?.message?.includes('unique') || err?.code === '23505') {
        setErrors({ account_code: 'Account code already exists' });
      } else {
        setErrors({ general: err?.message || 'Save failed. Please try again.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredHeaderAccounts = headerAccounts?.filter(h => h?.id !== account?.id);
  const subTypes = SUB_TYPES_BY_TYPE?.[form?.account_type] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">{account ? 'Edit Account' : 'New Account'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Chart of Accounts — Ghana GRA Compliant</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4">
          {errors?.general && (
            <div className="mb-4 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">{errors?.general}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {/* Account Code */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Account Code <span className="text-destructive">*</span></label>
              <input
                type="text"
                value={form?.account_code}
                onChange={e => handleChange('account_code', e?.target?.value)}
                placeholder="e.g. 1101"
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono ${
                  errors?.account_code ? 'border-destructive' : 'border-border'
                }`}
              />
              {errors?.account_code && <p className="mt-1 text-xs text-destructive">{errors?.account_code}</p>}
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Account Type <span className="text-destructive">*</span></label>
              <select
                value={form?.account_type}
                onChange={e => handleChange('account_type', e?.target?.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors?.account_type ? 'border-destructive' : 'border-border'
                }`}
              >
                {ACCOUNT_TYPES?.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors?.account_type && <p className="mt-1 text-xs text-destructive">{errors?.account_type}</p>}
            </div>

            {/* Account Name */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1">Account Name <span className="text-destructive">*</span></label>
              <input
                type="text"
                value={form?.account_name}
                onChange={e => handleChange('account_name', e?.target?.value)}
                placeholder="e.g. Cash on Hand"
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors?.account_name ? 'border-destructive' : 'border-border'
                }`}
              />
              {errors?.account_name && <p className="mt-1 text-xs text-destructive">{errors?.account_name}</p>}
            </div>

            {/* Sub Type */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Sub Type</label>
              <select
                value={form?.sub_type}
                onChange={e => handleChange('sub_type', e?.target?.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— Select Sub Type —</option>
                {subTypes?.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Parent Account */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Parent Account (Header only)</label>
              <select
                value={form?.parent_account_id}
                onChange={e => handleChange('parent_account_id', e?.target?.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— No Parent —</option>
                {filteredHeaderAccounts?.map(h => (
                  <option key={h?.id} value={h?.id}>{h?.account_code} — {h?.account_name}</option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Currency</label>
              <select
                value={form?.currency}
                onChange={e => handleChange('currency', e?.target?.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="GHS">GHS — Ghana Cedi</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </div>

            {/* Opening Balance */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Opening Balance</label>
              <input
                type="number"
                step="0.01"
                value={form?.opening_balance}
                onChange={e => handleChange('opening_balance', e?.target?.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
              />
            </div>

            {/* Current Balance */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Current Balance</label>
              <input
                type="number"
                step="0.01"
                value={form?.current_balance}
                onChange={e => handleChange('current_balance', e?.target?.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1">Description</label>
              <textarea
                value={form?.description}
                onChange={e => handleChange('description', e?.target?.value)}
                placeholder="Optional description..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Checkboxes */}
            <div className="col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form?.is_header}
                  onChange={e => handleChange('is_header', e?.target?.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-foreground">Is Header Account</span>
                <span className="text-xs text-muted-foreground">(cannot post transactions)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form?.is_active}
                  onChange={e => handleChange('is_active', e?.target?.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-foreground">Active</span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} type="button"
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSaving}
            className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
            {isSaving && (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {isSaving ? 'Saving...' : (account ? 'Update Account' : 'Create Account')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoAModal;
