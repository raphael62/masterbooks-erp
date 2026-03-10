import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import Icon from '../../../components/AppIcon';

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

const currentYear = new Date()?.getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

const SSRTargetModal = ({ editItem, onClose, onSaved }) => {
  const [executives, setExecutives] = useState([]);
  const [form, setForm] = useState({
    executive_code: '',
    executive_name: '',
    year: currentYear,
    month: new Date()?.getMonth() + 1,
    target_value: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchExecutives();
    if (editItem) {
      setForm({
        executive_code: editItem?.executive_code || '',
        executive_name: editItem?.executive_name || '',
        year: editItem?.year || currentYear,
        month: editItem?.month || new Date()?.getMonth() + 1,
        target_value: editItem?.target_value ?? '',
      });
    } else {
      setForm({
        executive_code: '',
        executive_name: '',
        year: currentYear,
        month: new Date()?.getMonth() + 1,
        target_value: '',
      });
    }
  }, [editItem]);

  const fetchExecutives = async () => {
    const { data } = await supabase?.from('business_executives')?.select('exec_code, full_name, sales_rep_type')?.eq('sales_rep_type', 'SSR')?.order('exec_code');
    setExecutives(data || []);
  };

  const handleExecChange = (e) => {
    const code = e?.target?.value;
    const exec = executives?.find(ex => ex?.exec_code === code);
    setForm(prev => ({ ...prev, executive_code: code, executive_name: exec?.full_name || '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form?.executive_code) errs.executive_code = 'Executive is required';
    if (!form?.year) errs.year = 'Year is required';
    if (!form?.month) errs.month = 'Month is required';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs)?.length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = {
        executive_code: form?.executive_code,
        executive_name: form?.executive_name,
        year: Number(form?.year),
        month: Number(form?.month),
        target_value: Number(form?.target_value) || 0,
        updated_at: new Date()?.toISOString(),
      };
      // Fixed: Declare error variable before destructuring
      let result;
      if (editItem?.id) {
        result = await supabase?.from('ssr_monthly_targets')?.update(payload)?.eq('id', editItem?.id);
      } else {
        result = await supabase?.from('ssr_monthly_targets')?.insert(payload);
      }
      if (result?.error) throw result?.error;
      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error('Save failed:', err);
      setErrors({ general: err?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (field) =>
    `w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 ${
      errors?.[field] ? 'border-red-400' : 'border-border'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-md shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Icon name="Target" size={18} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">{editItem ? 'Edit SSR Target' : 'New SSR Target'}</h2>
              <p className="text-xs text-muted-foreground">Shop Sales Rep Monthly Target</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errors?.general && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {errors?.general}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Executive (SSR) <span className="text-red-500">*</span></label>
            <select value={form?.executive_code} onChange={handleExecChange} className={inputCls('executive_code')}>
              <option value="">Select SSR Executive...</option>
              {executives?.map(ex => (
                <option key={ex?.exec_code} value={ex?.exec_code}>{ex?.exec_code} — {ex?.full_name}</option>
              ))}
            </select>
            {errors?.executive_code && <p className="text-xs text-red-500 mt-1">{errors?.executive_code}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Year <span className="text-red-500">*</span></label>
              <select value={form?.year} onChange={e => setForm(prev => ({ ...prev, year: e?.target?.value }))} className={inputCls('year')}>
                {YEARS?.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {errors?.year && <p className="text-xs text-red-500 mt-1">{errors?.year}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Month <span className="text-red-500">*</span></label>
              <select value={form?.month} onChange={e => setForm(prev => ({ ...prev, month: e?.target?.value }))} className={inputCls('month')}>
                {MONTHS?.map(m => <option key={m?.value} value={m?.value}>{m?.label}</option>)}
              </select>
              {errors?.month && <p className="text-xs text-red-500 mt-1">{errors?.month}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Target Value (GHS)</label>
            <input type="number" min="0" step="0.01" value={form?.target_value}
              onChange={e => setForm(prev => ({ ...prev, target_value: e?.target?.value }))}
              className={inputCls('target_value')} placeholder="0.00" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving && <Icon name="Loader" size={14} className="animate-spin" />}
            {editItem ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SSRTargetModal;
