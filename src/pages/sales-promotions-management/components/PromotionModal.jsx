import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Gift, Trash2 } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const UNITS = ['Cartons', 'Pieces', 'Bottles', 'Ctns'];

const emptyRule = () => ({
  _key: Math.random()?.toString(36)?.slice(2),
  buy_product_id: null,
  buy_product_code: '',
  buy_product_name: '',
  buy_qty: 10,
  buy_unit: 'Cartons',
  reward_product_id: null,
  reward_product_code: '',
  reward_product_name: '',
  reward_qty: 1,
  reward_unit: 'Cartons',
});

const PromotionModal = ({ isOpen, onClose, onSaved, editItem }) => {
  const [form, setForm] = useState({
    promotion_code: '',
    name: '',
    budget_cartons: '',
    start_date: '',
    end_date: '',
    description: '',
    active: true,
    location_ids: [],
    price_type_ids: [],
    days_of_week: [],
    happy_hour_start: '',
    happy_hour_end: '',
  });
  const [rules, setRules] = useState([emptyRule()]);
  const [priceTypes, setPriceTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const loadLookups = useCallback(async () => {
    const [ptRes, locRes, prodRes] = await Promise.all([
      supabase?.from('price_types')?.select('id, price_type_name')?.order('price_type_name'),
      supabase?.from('locations')?.select('id, code, name')?.order('name'),
      supabase?.from('products')?.select('id, product_code, product_name, pack_unit')?.order('product_name'),
    ]);
    setPriceTypes(ptRes?.data || []);
    setLocations(locRes?.data || []);
    setProducts(prodRes?.data || []);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadLookups();
    if (editItem?.id) {
      setForm({
        promotion_code: editItem?.promotion_code || '',
        name: editItem?.name || '',
        budget_cartons: editItem?.budget_cartons != null ? String(editItem.budget_cartons) : '',
        start_date: editItem?.start_date || '',
        end_date: editItem?.end_date || '',
        description: editItem?.description || '',
        active: editItem?.active !== false,
        location_ids: Array.isArray(editItem?.location_ids) ? editItem.location_ids : (editItem?.location_ids ? JSON.parse(editItem.location_ids) : []),
        price_type_ids: Array.isArray(editItem?.price_type_ids) ? editItem.price_type_ids : (editItem?.price_type_ids ? JSON.parse(editItem.price_type_ids) : []),
        days_of_week: Array.isArray(editItem?.days_of_week) ? editItem.days_of_week : (editItem?.days_of_week ? JSON.parse(editItem.days_of_week) : []),
        happy_hour_start: editItem?.happy_hour_start ? String(editItem.happy_hour_start).slice(0, 5) : '',
        happy_hour_end: editItem?.happy_hour_end ? String(editItem.happy_hour_end).slice(0, 5) : '',
      });
      supabase?.from('promotion_rules')?.select('*')?.eq('promotion_id', editItem.id)?.order('sort_order').then(({ data }) => {
        if (data?.length) {
          setRules(data?.map(r => ({
            _key: r?.id || Math.random()?.toString(36)?.slice(2),
            buy_product_id: r?.buy_product_id,
            buy_product_code: r?.buy_product_code || '',
            buy_product_name: r?.buy_product_name || '',
            buy_qty: r?.buy_qty ?? 10,
            buy_unit: r?.buy_unit || 'Cartons',
            reward_product_id: r?.reward_product_id,
            reward_product_code: r?.reward_product_code || '',
            reward_product_name: r?.reward_product_name || '',
            reward_qty: r?.reward_qty ?? 1,
            reward_unit: r?.reward_unit || 'Cartons',
          })));
        } else {
          setRules([emptyRule()]);
        }
      });
    } else {
      const today = new Date()?.toISOString()?.slice(0, 10);
      setForm({
        promotion_code: '',
        name: '',
        budget_cartons: '',
        start_date: today,
        end_date: '',
        description: '',
        active: true,
        location_ids: [],
        price_type_ids: [],
        days_of_week: [],
        happy_hour_start: '',
        happy_hour_end: '',
      });
      setRules([emptyRule()]);
    }
    setErrors({});
  }, [isOpen, editItem?.id, loadLookups]);

  const togglePriceType = (id) => {
    setForm(prev => ({
      ...prev,
      price_type_ids: prev.price_type_ids?.includes(id) ? prev.price_type_ids?.filter(x => x !== id) : [...(prev.price_type_ids || []), id],
    }));
  };

  const toggleLocation = (id) => {
    setForm(prev => ({
      ...prev,
      location_ids: prev.location_ids?.includes(id) ? prev.location_ids?.filter(x => x !== id) : [...(prev.location_ids || []), id],
    }));
  };

  const toggleDay = (dayIndex) => {
    setForm(prev => {
      const arr = prev.days_of_week || [];
      const has = arr.includes(dayIndex);
      return { ...prev, days_of_week: has ? arr.filter(d => d !== dayIndex) : [...arr, dayIndex].sort((a, b) => a - b) };
    });
  };

  const setRule = (idx, field, value) => {
    setRules(prev => {
      const u = [...prev];
      if (!u[idx]) return prev;
      u[idx] = { ...u[idx], [field]: value };
      return u;
    });
  };

  const setRuleProduct = (idx, type, productId) => {
    const prod = products?.find(p => p?.id === productId);
    if (!prod) return;
    if (type === 'buy') {
      setRule(idx, 'buy_product_id', prod?.id);
      setRule(idx, 'buy_product_code', prod?.product_code || '');
      setRule(idx, 'buy_product_name', prod?.product_name || '');
    } else {
      setRule(idx, 'reward_product_id', prod?.id);
      setRule(idx, 'reward_product_code', prod?.product_code || '');
      setRule(idx, 'reward_product_name', prod?.product_name || '');
    }
  };

  const addRule = () => setRules(prev => [...prev, emptyRule()]);
  const removeRule = (idx) => setRules(prev => prev?.filter((_, i) => i !== idx));

  const validate = () => {
    const e = {};
    if (!form?.promotion_code?.trim()) e.promotion_code = 'Required';
    if (!form?.name?.trim()) e.name = 'Required';
    if (!form?.start_date) e.start_date = 'Required';
    if (!form?.end_date) e.end_date = 'Required';
    if (form?.start_date && form?.end_date && form.start_date > form.end_date) e.end_date = 'End must be after start';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = {
        promotion_code: form.promotion_code?.trim(),
        name: form.name?.trim(),
        budget_cartons: form.budget_cartons === '' ? null : parseFloat(form.budget_cartons),
        start_date: form.start_date,
        end_date: form.end_date,
        description: form.description?.trim() || null,
        active: form.active,
        location_ids: form.location_ids?.length ? form.location_ids : [],
        price_type_ids: form.price_type_ids?.length ? form.price_type_ids : [],
        days_of_week: form.days_of_week?.length ? form.days_of_week : [],
        happy_hour_start: form.happy_hour_start || null,
        happy_hour_end: form.happy_hour_end || null,
        updated_at: new Date()?.toISOString(),
      };

      let promoId = editItem?.id;
      if (editItem?.id) {
        const { error } = await supabase?.from('promotions')?.update(payload)?.eq('id', editItem.id);
        if (error) throw error;
        await supabase?.from('promotion_rules')?.delete()?.eq('promotion_id', editItem.id);
      } else {
        const { data, error } = await supabase?.from('promotions')?.insert(payload)?.select()?.single();
        if (error) throw error;
        promoId = data?.id;
      }

      const validRules = rules?.filter(r => (r?.buy_product_id || r?.buy_product_code) && (r?.reward_product_id || r?.reward_product_code) && (parseFloat(r?.buy_qty) > 0 && parseFloat(r?.reward_qty) > 0));
      if (validRules?.length > 0) {
        const ruleRows = validRules?.map((r, i) => ({
          promotion_id: promoId,
          buy_product_id: r?.buy_product_id || null,
          buy_product_code: r?.buy_product_code || null,
          buy_product_name: r?.buy_product_name || null,
          buy_qty: parseFloat(r?.buy_qty) || 1,
          buy_unit: r?.buy_unit || 'Cartons',
          reward_product_id: r?.reward_product_id || null,
          reward_product_code: r?.reward_product_code || null,
          reward_product_name: r?.reward_product_name || null,
          reward_qty: parseFloat(r?.reward_qty) || 1,
          reward_unit: r?.reward_unit || 'Cartons',
          sort_order: i,
        }));
        const { error: ruleErr } = await supabase?.from('promotion_rules')?.insert(ruleRows);
        if (ruleErr) throw ruleErr;
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      setErrors({ submit: err?.message || 'Save failed' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = 'w-full h-8 px-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary';
  const labelCls = 'block text-xs font-medium text-foreground mb-0.5';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={e => { if (e?.target === e?.currentTarget) onClose(); }}>
      <div className="bg-card border border-border rounded-lg shadow-xl flex flex-col max-h-[95vh] w-full max-w-4xl">
        <div className="flex items-center justify-between px-4 py-2.5 rounded-t-lg flex-shrink-0" style={{ backgroundColor: 'var(--color-primary)' }}>
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-white" />
            <span className="text-sm font-semibold text-white">{editItem?.id ? 'Edit Promotion' : 'New Promotion'}</span>
          </div>
          <button type="button" onClick={onClose} className="text-white hover:text-white/80 p-1 rounded"> <X size={18} /> </button>
        </div>
        <p className="px-4 py-1 text-xs text-muted-foreground border-b border-border">Promotions auto-apply in Sales Invoice entry.</p>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {errors?.submit && <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">{errors.submit}</div>}

          {/* Basic */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={labelCls}>Promo Code <span className="text-red-500">*</span></label>
              <input type="text" value={form.promotion_code} onChange={e => setField('promotion_code', e?.target?.value)} className={inputCls} placeholder="e.g. 123456" />
              {errors.promotion_code && <p className="text-xs text-red-500 mt-0.5">{errors.promotion_code}</p>}
            </div>
            <div>
              <label className={labelCls}>Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => setField('name', e?.target?.value)} className={inputCls} placeholder="e.g. Fes 10x1" />
              {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
            </div>
            <div>
              <label className={labelCls}>Promo Budget (Cartons) — Optional (blank = unlimited)</label>
              <input type="number" min="0" step="0.0001" value={form.budget_cartons} onChange={e => setField('budget_cartons', e?.target?.value)} className={inputCls} placeholder="Optional" />
              {editItem?.consumed_cartons != null && <p className="text-xs text-muted-foreground mt-0.5">Consumed so far: {Number(editItem.consumed_cartons)?.toLocaleString('en-GB', { minimumFractionDigits: 4 })} cartons</p>}
            </div>
            <div />
            <div>
              <label className={labelCls}>Start Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.start_date} onChange={e => setField('start_date', e?.target?.value)} className={inputCls} />
              {errors.start_date && <p className="text-xs text-red-500 mt-0.5">{errors.start_date}</p>}
            </div>
            <div>
              <label className={labelCls}>End Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.end_date} onChange={e => setField('end_date', e?.target?.value)} className={inputCls} />
              {errors.end_date && <p className="text-xs text-red-500 mt-0.5">{errors.end_date}</p>}
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Description (Optional)</label>
              <textarea value={form.description} onChange={e => setField('description', e?.target?.value)} className={inputCls + ' min-h-[60px]'} rows={2} placeholder="Optional" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="promo-active" checked={form.active} onChange={e => setField('active', e?.target?.checked)} className="rounded border-border" />
              <label htmlFor="promo-active" className="text-xs font-medium text-foreground">Active</label>
            </div>
          </div>

          {/* Eligibility */}
          <div className="border-t border-border pt-3 mb-4">
            <h3 className="text-xs font-semibold text-foreground mb-1">Eligibility (Optional)</h3>
            <p className="text-xs text-muted-foreground mb-2">Leave blank to apply to everyone / every day.</p>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className={labelCls}>Customer Groups (Price Types)</label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-border rounded bg-muted/30 min-h-[36px]">
                  {priceTypes?.map(pt => (
                    <span
                      key={pt?.id}
                      onClick={() => togglePriceType(pt?.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer ${form.price_type_ids?.includes(pt?.id) ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'}`}
                    >
                      {pt?.price_type_name} {form.price_type_ids?.includes(pt?.id) ? '×' : ''}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Locations — Leave blank for all locations</label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-border rounded bg-muted/30 min-h-[36px]">
                  {locations?.map(loc => (
                    <span
                      key={loc?.id}
                      onClick={() => toggleLocation(loc?.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer ${form.location_ids?.includes(loc?.id) ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'}`}
                    >
                      {loc?.code} - {loc?.name} {form.location_ids?.includes(loc?.id) ? '×' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs text-foreground">Days of week:</span>
              {DAYS?.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`px-2 py-1 text-xs rounded border ${form.days_of_week?.includes(i) ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-background'}`}
                >
                  {day}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <div>
                <label className={labelCls}>Happy Hour Start</label>
                <input type="time" value={form.happy_hour_start} onChange={e => setField('happy_hour_start', e?.target?.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Happy Hour End</label>
                <input type="time" value={form.happy_hour_end} onChange={e => setField('happy_hour_end', e?.target?.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-semibold text-foreground">Rules</h3>
                <p className="text-xs text-muted-foreground">Buy Product A → Get Product B (e.g. Buy 10 Get 1)</p>
              </div>
              <button type="button" onClick={addRule} className="flex items-center gap-1 h-7 px-2 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90">
                + Add Rule
              </button>
            </div>
            <div className="overflow-x-auto border border-border rounded">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="border-b border-border px-2 py-1.5 text-left font-semibold w-40">Buy Product</th>
                    <th className="border-b border-border px-2 py-1.5 text-right font-semibold w-16">Qty (Buy)</th>
                    <th className="border-b border-border px-2 py-1.5 text-left font-semibold w-20">Unit</th>
                    <th className="border-b border-border px-2 py-1.5 text-left font-semibold w-40">Reward Product</th>
                    <th className="border-b border-border px-2 py-1.5 text-right font-semibold w-16">Qty (Reward)</th>
                    <th className="border-b border-border px-2 py-1.5 text-left font-semibold w-20">Unit</th>
                    <th className="border-b border-border px-2 py-1.5 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {rules?.map((rule, idx) => (
                    <tr key={rule?._key} className="border-b border-border/50">
                      <td className="px-2 py-1">
                        <select value={rule?.buy_product_id || ''} onChange={e => setRuleProduct(idx, 'buy', e?.target?.value)} className="w-full h-7 px-1 text-xs border border-border rounded bg-background">
                          <option value="">— Select —</option>
                          {products?.map(p => <option key={p?.id} value={p?.id}>{p?.product_code} - {p?.product_name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <input type="number" min="0" step="1" value={rule?.buy_qty} onChange={e => setRule(idx, 'buy_qty', e?.target?.value)} className="w-full h-7 px-1 text-xs border border-border rounded text-right" />
                      </td>
                      <td className="px-2 py-1">
                        <select value={rule?.buy_unit} onChange={e => setRule(idx, 'buy_unit', e?.target?.value)} className="w-full h-7 px-1 text-xs border border-border rounded bg-background">
                          {UNITS?.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <select value={rule?.reward_product_id || ''} onChange={e => setRuleProduct(idx, 'reward', e?.target?.value)} className="w-full h-7 px-1 text-xs border border-border rounded bg-background">
                          <option value="">— Select —</option>
                          {products?.map(p => <option key={p?.id} value={p?.id}>{p?.product_code} - {p?.product_name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <input type="number" min="0" step="1" value={rule?.reward_qty} onChange={e => setRule(idx, 'reward_qty', e?.target?.value)} className="w-full h-7 px-1 text-xs border border-border rounded text-right" />
                      </td>
                      <td className="px-2 py-1">
                        <select value={rule?.reward_unit} onChange={e => setRule(idx, 'reward_unit', e?.target?.value)} className="w-full h-7 px-1 text-xs border border-border rounded bg-background">
                          {UNITS?.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <button type="button" onClick={() => removeRule(idx)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Remove rule">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border flex-shrink-0">
          <button type="button" onClick={onClose} className="h-8 px-3 text-xs font-medium border border-border rounded hover:bg-muted">Cancel</button>
          <button type="button" onClick={handleSave} disabled={isSaving} className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;
