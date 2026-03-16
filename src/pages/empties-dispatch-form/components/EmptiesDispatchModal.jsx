import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';

const emptyLine = () => ({
  _key: Math.random()?.toString(36)?.slice(2),
  product_id: null,
  product_code: '',
  product_name: '',
  empties_type: '',
  qty: '',
  unit_price: '',
  total_value: 0,
});

const today = () => new Date()?.toISOString()?.slice(0, 10);

const EmptiesDispatchModal = ({ isOpen, onClose, onSaved, editRecord }) => {
  const [vendors, setVendors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [physicalEmptiesProducts, setPhysicalEmptiesProducts] = useState([]);
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [header, setHeader] = useState({
    dispatch_no: '',
    dispatch_date: today(),
    credit_note_no: '',
    credit_note_date: '',
    supplier_id: '',
    supplier_name: '',
    location_id: '',
    location_name: '',
    po_number: '',
    delivery_note: '',
    notes: '',
  });
  const [lines, setLines] = useState([emptyLine()]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!editRecord;

  const fetchLookups = useCallback(async () => {
    const [vendRes, locRes, prodRes] = await Promise.all([
      supabase?.from('vendors')?.select('id, vendor_name, vendor_code')?.eq('status', 'active')?.order('vendor_name'),
      supabase?.from('locations')?.select('id, name, code')?.eq('is_active', true)?.order('name'),
      supabase?.from('products')?.select('id, product_code, product_name, empties_type, is_returnable')?.order('product_name'),
    ]);
    setVendors(vendRes?.data || []);
    setLocations(locRes?.data || []);
    const allProducts = prodRes?.data || [];
    const physiEmpties = allProducts.filter(p => {
      const name = String(p?.product_name || '').toLowerCase();
      const code = String(p?.product_code || '').toLowerCase();
      return name.includes('physi empties') || name.includes('physical empties') || code.includes('physi empties') || code.includes('physical empties');
    });
    setPhysicalEmptiesProducts(physiEmpties);
  }, []);

  const generateDispatchNo = useCallback(async () => {
    const dateStr = today()?.replace(/-/g, '-');
    const prefix = `EDS-${dateStr}`;
    const { data } = await supabase
      ?.from('empties_dispatch_header')
      ?.select('dispatch_no')
      ?.ilike('dispatch_no', `${prefix}%`)
      ?.order('dispatch_no', { ascending: false })
      ?.limit(1);
    const last = data?.[0]?.dispatch_no;
    let seq = 1;
    if (last) {
      const parts = last?.split('-');
      seq = (parseInt(parts?.[parts?.length - 1]) || 0) + 1;
    }
    return `${prefix}-${String(seq)?.padStart(3, '0')}`;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchLookups();
    if (isEdit && editRecord) {
      setHeader({
        dispatch_no: editRecord?.dispatch_no || '',
        dispatch_date: editRecord?.dispatch_date || today(),
        credit_note_no: editRecord?.credit_note_no || '',
        credit_note_date: editRecord?.credit_note_date || '',
        supplier_id: editRecord?.supplier_id || '',
        supplier_name: editRecord?.supplier_name || '',
        location_id: editRecord?.location_id || '',
        location_name: editRecord?.location_name || '',
        po_number: editRecord?.po_number || '',
        delivery_note: editRecord?.delivery_note || '',
        notes: editRecord?.notes || '',
      });
      setLines(editRecord?.items?.length > 0 ? editRecord?.items?.map(it => ({ ...it, _key: it?.id || Math.random()?.toString(36)?.slice(2) })) : [emptyLine()]);
    } else {
      generateDispatchNo()?.then(no => setHeader(h => ({ ...h, dispatch_no: no })));
      setHeader(h => ({ ...h, dispatch_date: today(), credit_note_no: '', credit_note_date: '', supplier_id: '', supplier_name: '', location_id: '', location_name: '', po_number: '', delivery_note: '', notes: '' }));
      setLines([emptyLine()]);
    }
    setError('');
  }, [isOpen, isEdit, editRecord, fetchLookups, generateDispatchNo]);

  const getFilteredSuppliers = useCallback((query) => {
    if (!vendors?.length) return [];
    if (!query?.trim()) return vendors.slice(0, 30);
    const q = query.toLowerCase().trim();
    return vendors.filter(v =>
      (v?.vendor_code || '').toLowerCase().includes(q) ||
      (v?.vendor_name || '').toLowerCase().includes(q)
    ).slice(0, 30);
  }, [vendors]);

  const handleHeaderChange = (field, value) => {
    setHeader(h => ({ ...h, [field]: value }));
    if (field === 'supplier_id') {
      const vend = vendors?.find(v => v?.id === value);
      setHeader(h => ({ ...h, supplier_id: value, supplier_name: vend?.vendor_name || '' }));
      setSupplierSearchOpen(false);
      setSupplierSearchQuery('');
    }
    if (field === 'location_id') {
      const loc = locations?.find(l => l?.id === value);
      setHeader(h => ({ ...h, location_id: value, location_name: loc?.name || '' }));
    }
  };

  const fetchEmptiesCostPrice = async (productCode, productId, productCostPrice) => {
    const fromProduct = parseFloat(productCostPrice);
    if (!productCode && !productId) return isNaN(fromProduct) ? 0 : fromProduct;
    try {
      if (productCode) {
        const { data } = await supabase
          ?.from('price_list_items')
          ?.select('price, unit_price, pre_tax_price, price_list_headers!inner(status, start_date)')
          ?.eq('product_code', productCode)
          ?.lte('price_list_headers.start_date', today())
          ?.order('price_list_headers(start_date)', { ascending: false })
          ?.limit(1);
        const fromList = parseFloat(data?.[0]?.price || data?.[0]?.pre_tax_price || data?.[0]?.unit_price);
        if (!isNaN(fromList) && fromList > 0) return fromList;
      }
      if (productId) {
        const { data: lastRows } = await supabase
          ?.from('purchase_invoice_items')
          ?.select('price_ex_tax, purchase_invoices(invoice_date)')
          ?.eq('product_id', productId)
          ?.not('price_ex_tax', 'is', null);
        if (lastRows?.length) {
          const sorted = [...lastRows].sort((a, b) => (b?.purchase_invoices?.invoice_date || '').localeCompare(a?.purchase_invoices?.invoice_date || ''));
          const fromLast = parseFloat(sorted[0]?.price_ex_tax);
          if (!isNaN(fromLast) && fromLast > 0) return fromLast;
        }
      }
      return isNaN(fromProduct) ? 0 : fromProduct;
    } catch {
      return isNaN(fromProduct) ? 0 : fromProduct;
    }
  };

  const handleLineChange = (key, field, value) => {
    setLines(prev => prev?.map(line => {
      if (line?._key !== key) return line;
      const updated = { ...line, [field]: value };
      if (field === 'product_id') {
        const prod = physicalEmptiesProducts?.find(p => p?.id === value);
        updated.product_code = prod?.product_code || '';
        updated.product_name = prod?.product_name || '';
        updated.empties_type = prod?.empties_type || '';
        if (prod) {
          fetchEmptiesCostPrice(prod?.product_code, prod?.id, null)?.then(price => {
            setLines(prev2 => prev2?.map(l => {
              if (l?._key !== key) return l;
              const q = parseFloat(l?.qty) || 0;
              return { ...l, unit_price: price > 0 ? price : '', total_value: (price > 0 ? price : 0) * q };
            }));
          });
        }
      }
      if (field === 'qty' || field === 'unit_price') {
        const qty = field === 'qty' ? parseFloat(value) || 0 : parseFloat(updated?.qty) || 0;
        const price = field === 'unit_price' ? parseFloat(value) || 0 : parseFloat(updated?.unit_price) || 0;
        updated.total_value = qty * price;
      }
      return updated;
    }));
  };

  const addLine = () => setLines(prev => [...prev, emptyLine()]);
  const removeLine = (key) => setLines(prev => prev?.filter(l => l?._key !== key));

  const totalValue = lines?.reduce((s, l) => s + (parseFloat(l?.total_value) || 0), 0);

  const handleSave = async () => {
    if (!header?.supplier_id) { setError('Please select a supplier.'); return; }
    if (!header?.location_id) { setError('Please select a location.'); return; }
    const validLines = lines?.filter(l => l?.product_id && parseFloat(l?.qty) > 0);
    if (validLines?.length === 0) { setError('Please add at least one line item.'); return; }
    setIsSaving(true);
    setError('');
    try {
      let headerId = editRecord?.id;
      if (isEdit) {
        const { error: updErr } = await supabase?.from('empties_dispatch_header')?.update({
          dispatch_date: header?.dispatch_date,
          credit_note_no: header?.credit_note_no || null,
          credit_note_date: header?.credit_note_date || null,
          supplier_id: header?.supplier_id,
          supplier_name: header?.supplier_name,
          location_id: header?.location_id,
          location_name: header?.location_name,
          po_number: header?.po_number || null,
          delivery_note: header?.delivery_note || null,
          notes: header?.notes,
          total_value: totalValue,
          updated_at: new Date()?.toISOString(),
        })?.eq('id', headerId);
        if (updErr) throw updErr;
        await supabase?.from('empties_dispatch_items')?.delete()?.eq('header_id', headerId);
      } else {
        const { data: hData, error: hErr } = await supabase?.from('empties_dispatch_header')?.insert({
          dispatch_no: header?.dispatch_no,
          dispatch_date: header?.dispatch_date,
          credit_note_no: header?.credit_note_no || null,
          credit_note_date: header?.credit_note_date || null,
          supplier_id: header?.supplier_id,
          supplier_name: header?.supplier_name,
          location_id: header?.location_id,
          location_name: header?.location_name,
          po_number: header?.po_number || null,
          delivery_note: header?.delivery_note || null,
          notes: header?.notes,
          total_value: totalValue,
          status: 'posted',
        })?.select()?.single();
        if (hErr) throw hErr;
        headerId = hData?.id;
      }

      const itemsToInsert = validLines?.map((l, idx) => ({
        header_id: headerId,
        product_id: l?.product_id,
        product_code: l?.product_code,
        product_name: l?.product_name,
        empties_type: l?.empties_type,
        qty: parseFloat(l?.qty) || 0,
        unit_price: parseFloat(l?.unit_price) || 0,
        total_value: parseFloat(l?.total_value) || 0,
        sort_order: idx,
      }));
      const { error: itemErr } = await supabase?.from('empties_dispatch_items')?.insert(itemsToInsert);
      if (itemErr) throw itemErr;

      // On edit: restore stock for OLD items (reverse previous dispatch)
      if (isEdit && editRecord?.items?.length > 0 && header?.location_id) {
        for (const line of editRecord.items) {
          if (!line?.product_id) continue;
          const qty = parseFloat(line?.qty) || 0;
          if (qty <= 0) continue;
          const { data: existing } = await supabase
            ?.from('stock_levels_by_location')
            ?.select('id, stock_on_hand')
            ?.eq('product_id', line?.product_id)
            ?.eq('location_id', header?.location_id)
            ?.single();
          if (existing) {
            await supabase?.from('stock_levels_by_location')?.update({
              stock_on_hand: (parseFloat(existing?.stock_on_hand) || 0) + qty,
              last_movement_date: new Date()?.toISOString(),
              updated_at: new Date()?.toISOString(),
            })?.eq('id', existing?.id);
          }
        }
      }

      // Stock movements: use DISPATCH DATE — reduces stock at location
      const delReason = `Empties Dispatch ${header?.dispatch_no}`;
      if (header?.dispatch_no) {
        const { data: oldMovements } = await supabase?.from('stock_movements')?.select('id')?.eq('reference_no', header?.dispatch_no)?.eq('reason', delReason);
        for (const m of oldMovements || []) {
          await supabase?.from('stock_movements')?.delete()?.eq('id', m?.id);
        }
      }
      for (const line of validLines) {
        if (!line?.product_id || !header?.location_id) continue;
        const qty = parseFloat(line?.qty) || 0;
        if (qty <= 0) continue;
        const movement = {
          movement_date: header?.dispatch_date,
          product_id: line?.product_id,
          product_code: line?.product_code || '',
          product_name: line?.product_name || '',
          location: header?.location_name || header?.location_id,
          transaction_type: 'issue',
          quantity: -qty,
          unit_cost: parseFloat(line?.unit_price) || 0,
          reference_no: header?.dispatch_no,
          reason: delReason,
        };
        await supabase?.from('stock_movements')?.insert(movement);
      }

      // Update stock_levels_by_location (DECREASE) using dispatch date
      for (const line of validLines) {
        if (!line?.product_id || !header?.location_id) continue;
        const qty = parseFloat(line?.qty) || 0;
        const { data: existing } = await supabase
          ?.from('stock_levels_by_location')
          ?.select('id, stock_on_hand')
          ?.eq('product_id', line?.product_id)
          ?.eq('location_id', header?.location_id)
          ?.single();
        if (existing) {
          await supabase?.from('stock_levels_by_location')?.update({
            stock_on_hand: Math.max(0, (parseFloat(existing?.stock_on_hand) || 0) - qty),
            last_movement_date: new Date()?.toISOString(),
            updated_at: new Date()?.toISOString(),
          })?.eq('id', existing?.id);
        }
      }

      // Supplier ledger: use CREDIT NOTE DATE — affects supplier account (credit reduces what we owe)
      const refNo = header?.credit_note_no || header?.dispatch_no;
      const ledgerDate = header?.credit_note_date || header?.dispatch_date;
      if (ledgerDate && header?.supplier_id) {
        try {
          await supabase?.from('supplier_ledger')?.delete()
            ?.eq('empties_dispatch_header_id', headerId);
        } catch {
          await supabase?.from('supplier_ledger')?.delete()
            ?.eq('transaction_type', 'empties_dispatch')
            ?.eq('supplier_id', header?.supplier_id)
            ?.eq('reference_no', refNo);
        }
        const ledgerEntry = {
          transaction_date: ledgerDate,
          transaction_type: 'empties_dispatch',
          reference_no: refNo,
          supplier_id: header?.supplier_id,
          supplier_name: header?.supplier_name,
          description: 'Empties Dispatch',
          debit_amount: 0,
          credit_amount: totalValue,
          empties_dispatch_header_id: headerId,
        };
        const { error: ledgerErr } = await supabase?.from('supplier_ledger')?.insert(ledgerEntry);
        if (ledgerErr) {
          delete ledgerEntry.empties_dispatch_header_id;
          const { error: ledgerErr2 } = await supabase?.from('supplier_ledger')?.insert(ledgerEntry);
          if (ledgerErr2) throw new Error(`Supplier ledger: ${ledgerErr2?.message || ledgerErr?.message}`);
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = 'h-7 px-2 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full';
  const labelCls = 'block text-xs mb-0.5';
  const labelStyle = { color: 'var(--color-primary)' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-border">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-primary rounded-t-xl">
          <div className="flex items-center gap-2">
            <Icon name="PackageMinus" size={18} className="text-primary-foreground" />
            <h2 className="text-sm font-semibold text-primary-foreground">
              {isEdit ? 'Edit Empties Dispatch' : 'New Empties Dispatch'}
            </h2>
          </div>
          <button onClick={onClose} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls} style={labelStyle}>Supplier *</label>
              <div className="relative">
                <input
                  type="text"
                  className={inputCls}
                  value={supplierSearchOpen ? supplierSearchQuery : (header?.supplier_name || '')}
                  onChange={e => { setSupplierSearchQuery(e?.target?.value); }}
                  onFocus={() => { setSupplierSearchOpen(true); setSupplierSearchQuery(header?.supplier_name || ''); }}
                  onBlur={() => setTimeout(() => setSupplierSearchOpen(false), 200)}
                  placeholder="Type to search supplier..."
                />
                {supplierSearchOpen && getFilteredSuppliers(supplierSearchQuery)?.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-0.5 bg-card border border-border shadow-lg rounded max-h-48 overflow-y-auto">
                    <button type="button" onMouseDown={e => { e.preventDefault(); handleHeaderChange('supplier_id', ''); setSupplierSearchQuery(''); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted text-muted-foreground">— Clear —</button>
                    {getFilteredSuppliers(supplierSearchQuery).map(v => (
                      <button key={v?.id} type="button" onMouseDown={e => { e.preventDefault(); handleHeaderChange('supplier_id', v?.id); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 block">{v?.vendor_code} - {v?.vendor_name}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Dispatch Date *</label>
              <input type="date" className={inputCls} value={header?.dispatch_date} onChange={e => handleHeaderChange('dispatch_date', e?.target?.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Credit Note Date</label>
              <input type="date" className={inputCls} value={header?.credit_note_date} onChange={e => handleHeaderChange('credit_note_date', e?.target?.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Location *</label>
              <select className={inputCls} value={header?.location_id} onChange={e => handleHeaderChange('location_id', e?.target?.value)}>
                <option value="">Select Location</option>
                {locations?.map(l => <option key={l?.id} value={l?.id}>{l?.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Dispatch Note No.</label>
              <input className={inputCls + ' bg-muted/50 font-mono'} value={header?.dispatch_no} readOnly />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Credit Note No.</label>
              <input className={inputCls} value={header?.credit_note_no} onChange={e => handleHeaderChange('credit_note_no', e?.target?.value)} placeholder="Supplier credit note ref." />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>PO Number</label>
              <input className={inputCls} value={header?.po_number} onChange={e => handleHeaderChange('po_number', e?.target?.value)} placeholder="Purchase order ref." />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Delivery Note</label>
              <input className={inputCls} value={header?.delivery_note} onChange={e => handleHeaderChange('delivery_note', e?.target?.value)} placeholder="Delivery note ref." />
            </div>
            <div className="col-span-2">
              <label className={labelCls} style={labelStyle}>Notes</label>
              <input className={inputCls} value={header?.notes} onChange={e => handleHeaderChange('notes', e?.target?.value)} placeholder="Optional notes..." />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold" style={labelStyle}>Line Items — Physi Empties Only</h3>
              <button onClick={addLine} className="flex items-center gap-1 h-6 px-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                <Icon name="Plus" size={12} /> Add Line
              </button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-muted/60">
                  <tr className="border-b border-border">
                    <th className="px-2 py-1.5 text-left font-semibold w-8" style={labelStyle}>#</th>
                    <th className="px-2 py-1.5 text-left font-semibold w-28" style={labelStyle}>Product Code</th>
                    <th className="px-2 py-1.5 text-left font-semibold" style={labelStyle}>Product Name</th>
                    <th className="px-2 py-1.5 text-left font-semibold w-28" style={labelStyle}>Empties Type</th>
                    <th className="px-2 py-1.5 text-right font-semibold w-20" style={labelStyle}>Qty</th>
                    <th className="px-2 py-1.5 text-right font-semibold w-24" style={labelStyle}>Unit Price</th>
                    <th className="px-2 py-1.5 text-right font-semibold w-28" style={labelStyle}>Total Value</th>
                    <th className="px-2 py-1.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines?.map((line, idx) => (
                    <tr key={line?._key} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                      <td className="px-2 py-1 text-center text-muted-foreground">{idx + 1}</td>
                      <td className="px-2 py-1">
                        <input className="h-6 px-1.5 text-xs border border-border rounded bg-background w-full font-mono" value={line?.product_code} readOnly placeholder="—" />
                      </td>
                      <td className="px-2 py-1">
                        <select
                          className="h-6 px-1.5 text-xs border border-border rounded bg-background w-full"
                          value={line?.product_id || ''}
                          onChange={e => handleLineChange(line?._key, 'product_id', e?.target?.value)}
                        >
                          <option value="">Select Product</option>
                          {physicalEmptiesProducts?.map(p => <option key={p?.id} value={p?.id}>{p?.product_name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <input className="h-6 px-1.5 text-xs border border-border rounded bg-muted/50 w-full" value={line?.empties_type || ''} readOnly placeholder="Auto" />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          className="h-6 px-1.5 text-xs border border-border rounded bg-background w-full text-right"
                          value={line?.qty}
                          onChange={e => handleLineChange(line?._key, 'qty', e?.target?.value)}
                          min="0"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          className="h-6 px-1.5 text-xs border border-border rounded bg-background w-full text-right"
                          value={line?.unit_price}
                          onChange={e => handleLineChange(line?._key, 'unit_price', e?.target?.value)}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-2 py-1 text-right tabular-nums font-medium text-xs pr-3">
                        {(parseFloat(line?.total_value) || 0)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button onClick={() => removeLine(line?._key)} className="text-destructive hover:text-destructive/80 transition-colors">
                          <Icon name="Trash2" size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/10 border-t-2 border-primary/30">
                    <td colSpan={6} className="px-3 py-1.5 text-xs font-semibold text-right">Total Value GHS:</td>
                    <td className="px-3 py-1.5 text-right text-xs font-bold tabular-nums">
                      {totalValue?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
              <Icon name="AlertCircle" size={13} />{error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30 rounded-b-xl">
          <p className="text-xs text-muted-foreground">Stock reduced at location using Dispatch Date. Supplier account credited using Credit Note Date.</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-8 px-4 text-xs border border-border rounded hover:bg-accent transition-colors">Cancel</button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 px-4 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Save" size={13} />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptiesDispatchModal;
