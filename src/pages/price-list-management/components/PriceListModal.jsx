import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Save, List, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const today = () => new Date()?.toISOString()?.slice(0, 10);

const emptyRow = () => ({
  _key: Math.random()?.toString(36)?.slice(2),
  product_code: '',
  product_name: '',
  uom: '',
  pack_unit: '',
  price_tax_inc: '',
  tax_rate_id: '',
  vat_type: 'Inclusive',
  pre_tax_price: '',
  min_qty: '',
  max_qty: '',
  product_id: null,
});

const calcPreTax = (priceTaxInc, taxRate, vatType) => {
  const p = parseFloat(priceTaxInc);
  const r = parseFloat(taxRate) || 0;
  if (isNaN(p) || p === 0) return '';
  if (vatType === 'Inclusive' && r > 0) {
    return (p / (1 + r / 100))?.toFixed(4);
  }
  return p?.toFixed(4);
};

const PriceListModal = ({ isOpen, onClose, onSuccess, editItem }) => {
  const [form, setForm] = useState({
    name: '',
    price_type_id: '',
    effective_date: today(),
    expiry_date: '',
    notes: '',
  });
  const [lineItems, setLineItems] = useState([emptyRow()]);
  const [products, setProducts] = useState([]);
  const [priceTypes, setPriceTypes] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [dropdownIdx, setDropdownIdx] = useState(null);
  const [dropdownField, setDropdownField] = useState(null); // 'code' | 'name'
  const [dropdownQuery, setDropdownQuery] = useState('');

  const lineItemsRef = useRef(lineItems);
  const firstInputRef = useRef(null);
  const rowRefs = useRef({});

  useEffect(() => { lineItemsRef.current = lineItems; }, [lineItems]);

  const isEdit = !!editItem?.id;

  // Fetch lookup data once on open
  const fetchLookups = useCallback(async () => {
    const [prodRes, ptRes, trRes] = await Promise.all([
      supabase?.from('products')?.select('id, product_code, product_name, unit_of_measure, pack_unit')?.eq('status', 'active')?.order('product_name'),
      supabase?.from('price_types')?.select('id, price_type_name')?.order('price_type_name'),
      supabase?.from('tax_rates')?.select('id, tax_name, rate')?.order('tax_name'),
    ]);
    setProducts(prodRes?.data || []);
    setPriceTypes(ptRes?.data || []);
    setTaxRates(trRes?.data || []);
  }, []);

  const loadLineItems = useCallback(async (headerId) => {
    const { data } = await supabase?.from('price_list_items')?.select('*')?.or(`header_id.eq.${headerId},price_list_header_id.eq.${headerId}`)?.order('sort_order');
    if (data && data?.length > 0) {
      setLineItems(data?.map(d => ({
        _key: d?.id,
        product_code: d?.product_code || '',
        product_name: d?.product_name || '',
        uom: d?.uom || d?.unit_of_measure || '',
        pack_unit: d?.pack_unit != null ? String(d?.pack_unit) : '',
        price_tax_inc: d?.price_tax_inc != null ? String(d?.price_tax_inc) : (d?.price != null ? String(d?.price) : ''),
        tax_rate_id: d?.tax_rate_id || '',
        vat_type: d?.vat_type ? (d?.vat_type?.charAt(0)?.toUpperCase() + d?.vat_type?.slice(1)) : 'Inclusive',
        pre_tax_price: d?.pre_tax_price != null ? String(d?.pre_tax_price) : '',
        min_qty: d?.min_qty != null ? String(d?.min_qty) : '',
        max_qty: d?.max_qty != null ? String(d?.max_qty) : '',
        product_id: d?.product_id || null,
      })));
    } else {
      setLineItems([emptyRow()]);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchLookups();
    if (editItem?.id) {
      setForm({
        name: editItem?.name || editItem?.price_list_name || '',
        price_type_id: editItem?.price_type_id || '',
        effective_date: editItem?.effective_date || editItem?.start_date || today(),
        expiry_date: editItem?.expiry_date || editItem?.end_date || '',
        notes: editItem?.notes || '',
      });
      loadLineItems(editItem?.id);
    } else {
      setForm({ name: '', price_type_id: '', effective_date: today(), expiry_date: '', notes: '' });
      setLineItems([emptyRow()]);
    }
    setErrors({});
    setSaveError('');
    setDropdownIdx(null);
    setTimeout(() => firstInputRef?.current?.focus(), 80);
  }, [isOpen, editItem, fetchLookups, loadLineItems]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e?.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // ── Form helpers ──────────────────────────────────────────────
  const setField = (f, v) => {
    setForm(p => ({ ...p, [f]: v }));
    if (errors?.[f]) setErrors(p => ({ ...p, [f]: null }));
    setSaveError('');
  };

  // ── Line item helpers ─────────────────────────────────────────
  const setRow = (idx, patch) => {
    setLineItems(prev => prev?.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };

  const addRow = () => {
    setLineItems(prev => [...prev, emptyRow()]);
  };

  const removeRow = (idx) => {
    if (lineItems?.length <= 1) return;
    setLineItems(prev => prev?.filter((_, i) => i !== idx));
  };

  const selectProduct = (idx, prod) => {
    const taxRate = taxRates?.find(t => t?.id === lineItemsRef?.current?.[idx]?.tax_rate_id);
    const vatType = lineItemsRef?.current?.[idx]?.vat_type || 'Inclusive';
    const priceTaxInc = lineItemsRef?.current?.[idx]?.price_tax_inc || '';
    const preTax = calcPreTax(priceTaxInc, taxRate?.rate, vatType);
    setRow(idx, {
      product_id: prod?.id,
      product_code: prod?.product_code || '',
      product_name: prod?.product_name || '',
      uom: prod?.unit_of_measure || '',
      pack_unit: prod?.pack_unit != null ? String(prod?.pack_unit) : '',
      pre_tax_price: preTax,
    });
    setDropdownIdx(null);
    setDropdownQuery('');
    // Focus price_tax_inc after product selected
    setTimeout(() => {
      rowRefs?.current?.[`price_${idx}`]?.focus();
    }, 30);
  };

  const getFilteredProducts = (query) => {
    if (!query) return products?.slice(0, 20);
    const q = query?.toLowerCase();
    return products?.filter(p =>
      p?.product_code?.toLowerCase()?.includes(q) ||
      p?.product_name?.toLowerCase()?.includes(q)
    )?.slice(0, 20);
  };

  const handleCodeKeyDown = (e, idx) => {
    if (e?.key === 'Enter' || e?.key === 'Tab') {
      e?.preventDefault();
      const code = lineItemsRef?.current?.[idx]?.product_code?.trim();
      const matches = getFilteredProducts(code);
      if (matches?.length > 0) {
        selectProduct(idx, matches?.[0]);
      } else {
        rowRefs?.current?.[`price_${idx}`]?.focus();
      }
    } else if (e?.key === 'ArrowDown') {
      e?.preventDefault();
      const next = (idx + 1) % lineItems?.length;
      rowRefs?.current?.[`code_${next}`]?.focus();
    } else if (e?.key === 'ArrowUp') {
      e?.preventDefault();
      const prev = (idx - 1 + lineItems?.length) % lineItems?.length;
      rowRefs?.current?.[`code_${prev}`]?.focus();
    }
  };

  const handlePriceKeyDown = (e, idx) => {
    if (e?.key === 'Enter') {
      e?.preventDefault();
      // Add new row and focus its product code
      const newRow = emptyRow();
      setLineItems(prev => [...prev, newRow]);
      setTimeout(() => {
        rowRefs?.current?.[`code_${idx + 1}`]?.focus();
      }, 30);
    } else if (e?.key === 'ArrowDown') {
      e?.preventDefault();
      const next = (idx + 1) % lineItems?.length;
      rowRefs?.current?.[`price_${next}`]?.focus();
    } else if (e?.key === 'ArrowUp') {
      e?.preventDefault();
      const prev = (idx - 1 + lineItems?.length) % lineItems?.length;
      rowRefs?.current?.[`price_${prev}`]?.focus();
    }
  };

  const handlePriceChange = (idx, val) => {
    if (val !== '' && !/^\d*\.?\d*$/?.test(val)) return;
    const item = lineItemsRef?.current?.[idx];
    const taxRate = taxRates?.find(t => t?.id === item?.tax_rate_id);
    const preTax = calcPreTax(val, taxRate?.rate, item?.vat_type || 'Inclusive');
    setRow(idx, { price_tax_inc: val, pre_tax_price: preTax });
  };

  const handleTaxRateChange = (idx, taxRateId) => {
    const item = lineItemsRef?.current?.[idx];
    const taxRate = taxRates?.find(t => t?.id === taxRateId);
    const preTax = calcPreTax(item?.price_tax_inc, taxRate?.rate, item?.vat_type || 'Inclusive');
    setRow(idx, { tax_rate_id: taxRateId, pre_tax_price: preTax });
  };

  const handleVatTypeChange = (idx, vatType) => {
    const item = lineItemsRef?.current?.[idx];
    const taxRate = taxRates?.find(t => t?.id === item?.tax_rate_id);
    const preTax = calcPreTax(item?.price_tax_inc, taxRate?.rate, vatType);
    setRow(idx, { vat_type: vatType, pre_tax_price: preTax });
  };

  // ── Validation & Save ─────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form?.name?.trim()) e.name = 'Price List Name is required';
    if (!form?.effective_date) e.effective_date = 'Effective Date is required';
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs)?.length > 0) { setErrors(errs); return; }
    setIsSaving(true);
    setSaveError('');
    try {
      const headerPayload = {
        name: form?.name?.trim(),
        price_list_name: form?.name?.trim(),
        price_type_id: form?.price_type_id || null,
        effective_date: form?.effective_date || null,
        expiry_date: form?.expiry_date || null,
        notes: form?.notes || null,
        // keep legacy columns in sync
        start_date: form?.effective_date || null,
        end_date: form?.expiry_date || null,
      };

      let headerId = editItem?.id;
      if (isEdit) {
        const { error } = await supabase?.from('price_list_headers')?.update(headerPayload)?.eq('id', headerId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase?.from('price_list_headers')?.insert([{ ...headerPayload, price_list_code: `PL-${Date.now()}` }])?.select()?.single();
        if (error) throw error;
        headerId = data?.id;
      }

      // Delete existing items
      await supabase?.from('price_list_items')?.delete()?.or(`header_id.eq.${headerId},price_list_header_id.eq.${headerId}`);

      const validLines = lineItems?.filter(l => l?.product_name?.trim() || l?.product_code?.trim())?.map((l, idx) => {
          const taxRate = taxRates?.find(t => t?.id === l?.tax_rate_id);
          const preTax = calcPreTax(l?.price_tax_inc, taxRate?.rate, l?.vat_type || 'Inclusive');
          return {
            header_id: headerId,
            price_list_header_id: headerId,
            product_id: l?.product_id || null,
            product_code: l?.product_code || null,
            product_name: l?.product_name?.trim() || '',
            uom: l?.uom || null,
            unit_of_measure: l?.uom || null,
            pack_unit: l?.pack_unit !== '' && l?.pack_unit != null ? parseInt(l?.pack_unit) : null,
            price_tax_inc: l?.price_tax_inc ? parseFloat(l?.price_tax_inc) : 0,
            price: l?.price_tax_inc ? parseFloat(l?.price_tax_inc) : 0,
            unit_price: l?.price_tax_inc ? parseFloat(l?.price_tax_inc) : 0,
            tax_rate_id: l?.tax_rate_id || null,
            vat_type: l?.vat_type?.toLowerCase() || 'inclusive',
            pre_tax_price: preTax ? parseFloat(preTax) : 0,
            min_qty: l?.min_qty ? parseFloat(l?.min_qty) : 0,
            max_qty: l?.max_qty ? parseFloat(l?.max_qty) : 0,
            sort_order: idx,
          };
        });

      if (validLines?.length > 0) {
        const { error: lineErr } = await supabase?.from('price_list_items')?.insert(validLines);
        if (lineErr) throw lineErr;
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Save error:', err);
      setSaveError(err?.message || 'Failed to save price list.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const inp = (hasErr) =>
    `w-full h-6 px-1.5 text-xs border rounded focus:outline-none focus:border-primary ${
      hasErr ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
    }`;

  const validItemCount = lineItems?.filter(l => l?.product_name?.trim() || l?.product_code?.trim())?.length;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e?.target === e?.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-2xl flex flex-col" style={{ width: '90vw', maxWidth: '860px', height: '88vh' }}>
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-2">
            <List size={15} className="text-white" />
            <span className="text-sm font-semibold text-white">{isEdit ? 'Edit Price List' : 'New Price List'}</span>
          </div>
          <button onClick={onClose} className="text-white hover:text-white/70 p-0.5 rounded">
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {saveError && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">{saveError}</div>
          )}

          {/* Header Fields */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Price List Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Price List Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={form?.name}
                onChange={e => setField('name', e?.target?.value)}
                placeholder="Enter price list name"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
                  errors?.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.name && <p className="text-xs text-red-500 mt-0.5">{errors?.name}</p>}
            </div>

            {/* Price Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Price Type</label>
              <select
                value={form?.price_type_id}
                onChange={e => setField('price_type_id', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                <option value="">-- Select --</option>
                {priceTypes?.map(pt => (
                  <option key={pt?.id} value={pt?.id}>{pt?.price_type_name}</option>
                ))}
              </select>
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Effective Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form?.effective_date}
                onChange={e => setField('effective_date', e?.target?.value)}
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
                  errors?.effective_date ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.effective_date && <p className="text-xs text-red-500 mt-0.5">{errors?.effective_date}</p>}
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Expiry Date</label>
              <input
                type="date"
                value={form?.expiry_date}
                onChange={e => setField('expiry_date', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Notes</label>
              <input
                type="text"
                value={form?.notes}
                onChange={e => setField('notes', e?.target?.value)}
                placeholder="Optional notes..."
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* ── Line Items Grid ── */}
          <div className="border border-gray-200 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse" style={{ minWidth: '600px' }}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-b border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-600 w-7">#</th>
                    <th className="border-b border-gray-200 px-2 py-1.5 text-left font-semibold text-gray-600 w-24">Product Code</th>
                    <th className="border-b border-gray-200 px-2 py-1.5 text-left font-semibold text-gray-600">Product Name</th>
                    <th className="border-b border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-600 w-14">Pack Unit</th>
                    <th className="border-b border-gray-200 px-2 py-1.5 text-right font-semibold text-gray-600 w-24">Price Tax-Inc</th>
                    <th className="border-b border-gray-200 px-2 py-1.5 text-left font-semibold text-gray-600 w-32">Tax Rate</th>
                    <th className="border-b border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-600 w-24">VAT Type</th>
                    <th className="border-b border-gray-200 px-1 py-1.5 w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems?.map((item, idx) => {
                    const taxRate = taxRates?.find(t => t?.id === item?.tax_rate_id);
                    const showDrop = dropdownIdx === idx;
                    const filteredProds = getFilteredProducts(dropdownQuery);

                    return (
                      <tr key={item?._key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                        {/* # */}
                        <td className="border-b border-gray-100 px-2 py-0.5 text-center text-gray-400 tabular-nums">{idx + 1}</td>
                        {/* Product Code */}
                        <td className="border-b border-gray-100 px-1 py-0.5 relative">
                          <input
                            ref={el => rowRefs.current[`code_${idx}`] = el}
                            type="text"
                            value={item?.product_code}
                            onChange={e => {
                              setRow(idx, { product_code: e?.target?.value });
                              setDropdownIdx(idx);
                              setDropdownField('code');
                              setDropdownQuery(e?.target?.value);
                            }}
                            onFocus={() => {
                              setDropdownIdx(idx);
                              setDropdownField('code');
                              setDropdownQuery(item?.product_code || '');
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                const cur = lineItemsRef?.current?.[idx];
                                if (cur?.product_code?.trim() && !cur?.product_name?.trim()) {
                                  const match = products?.find(p =>
                                    p?.product_code?.toLowerCase() === cur?.product_code?.trim()?.toLowerCase()
                                  );
                                  if (match) selectProduct(idx, match);
                                }
                                setDropdownIdx(null);
                              }, 200);
                            }}
                            onKeyDown={e => handleCodeKeyDown(e, idx)}
                            placeholder="Code"
                            className={inp(false)}
                          />
                          {showDrop && dropdownField === 'code' && filteredProds?.length > 0 && (
                            <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 shadow-lg rounded max-h-44 overflow-y-auto" style={{ minWidth: '260px' }}>
                              {filteredProds?.map(p => (
                                <button
                                  key={p?.id}
                                  onMouseDown={e => { e?.preventDefault(); selectProduct(idx, p); }}
                                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 flex gap-2"
                                >
                                  <span className="text-gray-400 font-mono w-20 flex-shrink-0">{p?.product_code}</span>
                                  <span className="font-medium truncate">{p?.product_name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        {/* Product Name */}
                        <td className="border-b border-gray-100 px-1 py-0.5 relative">
                          <input
                            type="text"
                            value={item?.product_name}
                            onChange={e => {
                              setRow(idx, { product_name: e?.target?.value });
                              setDropdownIdx(idx);
                              setDropdownField('name');
                              setDropdownQuery(e?.target?.value);
                            }}
                            onFocus={() => {
                              setDropdownIdx(idx);
                              setDropdownField('name');
                              setDropdownQuery(item?.product_name || '');
                            }}
                            onBlur={() => setTimeout(() => setDropdownIdx(null), 200)}
                            placeholder="Search product name..."
                            className={inp(false)}
                          />
                          {showDrop && dropdownField === 'name' && filteredProds?.length > 0 && (
                            <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 shadow-lg rounded max-h-44 overflow-y-auto" style={{ minWidth: '260px' }}>
                              {filteredProds?.map(p => (
                                <button
                                  key={p?.id}
                                  onMouseDown={e => { e?.preventDefault(); selectProduct(idx, p); }}
                                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 flex gap-2"
                                >
                                  <span className="font-medium truncate flex-1">{p?.product_name}</span>
                                  <span className="text-gray-400 font-mono">{p?.product_code}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        {/* Pack Unit - read-only */}
                        <td className="border-b border-gray-100 px-1 py-0.5">
                          <input
                            type="text"
                            value={item?.pack_unit}
                            readOnly
                            className="w-full h-6 px-1.5 text-xs bg-gray-100 border border-gray-200 rounded text-center text-gray-600 cursor-default"
                          />
                        </td>
                        {/* Price Tax-Inc */}
                        <td className="border-b border-gray-100 px-1 py-0.5">
                          <input
                            ref={el => rowRefs.current[`price_${idx}`] = el}
                            type="text"
                            inputMode="decimal"
                            value={item?.price_tax_inc}
                            onChange={e => handlePriceChange(idx, e?.target?.value)}
                            onKeyDown={e => handlePriceKeyDown(e, idx)}
                            placeholder="0.00"
                            className="w-full h-6 px-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-primary text-right tabular-nums"
                          />
                        </td>
                        {/* Tax Rate */}
                        <td className="border-b border-gray-100 px-1 py-0.5">
                          <select
                            value={item?.tax_rate_id}
                            onChange={e => handleTaxRateChange(idx, e?.target?.value)}
                            className="w-full h-6 px-1 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-primary"
                          >
                            <option value="">No Tax</option>
                            {taxRates?.map(t => (
                              <option key={t?.id} value={t?.id}>{t?.tax_name} ({t?.rate}%)</option>
                            ))}
                          </select>
                        </td>
                        {/* VAT Type */}
                        <td className="border-b border-gray-100 px-1 py-0.5">
                          <div className="flex h-6 rounded border border-gray-300 overflow-hidden text-xs">
                            {['Inclusive', 'Exclusive']?.map(v => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => handleVatTypeChange(idx, v)}
                                className={`flex-1 px-1 transition-colors text-xs ${
                                  item?.vat_type === v
                                    ? 'bg-primary text-white font-medium' :'bg-white text-gray-600 hover:bg-gray-50'
                                } ${v === 'Exclusive' ? 'border-l border-gray-300' : ''}`}
                              >
                                {v === 'Inclusive' ? 'Incl.' : 'Excl.'}
                              </button>
                            ))}
                          </div>
                        </td>
                        {/* Delete */}
                        <td className="border-b border-gray-100 px-1 py-0.5 text-center">
                          <button
                            onClick={() => removeRow(idx)}
                            disabled={lineItems?.length <= 1}
                            className="w-5 h-5 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 transition-colors"
                          >
                            <Trash2 size={11} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{validItemCount} item{validItemCount !== 1 ? 's' : ''} configured</span>
            <button
              onClick={addRow}
              className="flex items-center gap-1 h-6 px-3 text-xs font-medium text-primary border border-primary rounded hover:bg-primary/10 transition-colors"
            >
              <Plus size={11} /> Add Row
            </button>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-200 bg-gray-50 rounded-b-lg flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="h-7 px-4 text-xs font-medium border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-7 px-4 text-xs font-semibold bg-primary text-white rounded hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            {isSaving ? (
              <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Saving...</>
            ) : (
              <><Save size={12} /> {isEdit ? 'Update' : 'Save'} Price List</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceListModal;
