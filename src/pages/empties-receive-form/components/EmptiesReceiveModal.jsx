import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const EmptiesReceiveModal = ({ isOpen, onClose, onSaved, editRecord }) => {
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [physicalEmptiesProducts, setPhysicalEmptiesProducts] = useState([]);
  const [header, setHeader] = useState({
    receive_no: '',
    receive_date: today(),
    customer_id: '',
    customer_name: '',
    location_id: '',
    location_name: '',
    notes: '',
  });
  const [lines, setLines] = useState([emptyLine()]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!editRecord;

  const fetchLookups = useCallback(async () => {
    const [custRes, locRes, prodRes] = await Promise.all([
      supabase?.from('customers')?.select('id, customer_name, customer_code')?.eq('status', 'Active')?.order('customer_name'),
      supabase?.from('locations')?.select('id, name, code')?.eq('is_active', true)?.order('name'),
      supabase?.from('products')?.select('id, product_code, product_name, empties_type, is_returnable')?.eq('is_returnable', true)?.order('product_name'),
    ]);
    setCustomers(custRes?.data || []);
    setLocations(locRes?.data || []);
    setPhysicalEmptiesProducts(prodRes?.data || []);
  }, []);

  const generateReceiveNo = useCallback(async () => {
    const dateStr = today()?.replace(/-/g, '-');
    const prefix = `ERC-${dateStr}`;
    const { data } = await supabase
      ?.from('empties_receive_header')
      ?.select('receive_no')
      ?.ilike('receive_no', `${prefix}%`)
      ?.order('receive_no', { ascending: false })
      ?.limit(1);
    const last = data?.[0]?.receive_no;
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
        receive_no: editRecord?.receive_no || '',
        receive_date: editRecord?.receive_date || today(),
        customer_id: editRecord?.customer_id || '',
        customer_name: editRecord?.customer_name || '',
        location_id: editRecord?.location_id || '',
        location_name: editRecord?.location_name || '',
        notes: editRecord?.notes || '',
      });
      setLines(editRecord?.items?.length > 0 ? editRecord?.items?.map(it => ({ ...it, _key: it?.id || Math.random()?.toString(36)?.slice(2) })) : [emptyLine()]);
    } else {
      generateReceiveNo()?.then(no => setHeader(h => ({ ...h, receive_no: no })));
      setHeader(h => ({ ...h, receive_date: today(), customer_id: '', customer_name: '', location_id: '', location_name: '', notes: '' }));
      setLines([emptyLine()]);
    }
    setError('');
  }, [isOpen, isEdit, editRecord, fetchLookups, generateReceiveNo]);

  const handleHeaderChange = (field, value) => {
    setHeader(h => ({ ...h, [field]: value }));
    if (field === 'customer_id') {
      const cust = customers?.find(c => c?.id === value);
      setHeader(h => ({ ...h, customer_id: value, customer_name: cust?.customer_name || '' }));
    }
    if (field === 'location_id') {
      const loc = locations?.find(l => l?.id === value);
      setHeader(h => ({ ...h, location_id: value, location_name: loc?.name || '' }));
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
        // Fetch price from price list
        if (prod?.product_code) {
          fetchEmptiesPrice(prod?.product_code)?.then(price => {
            setLines(prev2 => prev2?.map(l => {
              if (l?._key !== key) return l;
              const qty = parseFloat(l?.qty) || 0;
              return { ...l, unit_price: price, total_value: qty * price };
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

  const fetchEmptiesPrice = async (productCode) => {
    if (!productCode) return 0;
    const { data } = await supabase
      ?.from('price_list_items')
      ?.select('price, unit_price, price_list_headers!inner(status, start_date)')
      ?.eq('product_code', productCode)
      ?.lte('price_list_headers.start_date', today())
      ?.order('price_list_headers(start_date)', { ascending: false })
      ?.limit(1);
    return parseFloat(data?.[0]?.price || data?.[0]?.unit_price) || 0;
  };

  const addLine = () => setLines(prev => [...prev, emptyLine()]);
  const removeLine = (key) => setLines(prev => prev?.filter(l => l?._key !== key));

  const totalValue = lines?.reduce((s, l) => s + (parseFloat(l?.total_value) || 0), 0);

  const handleSave = async () => {
    if (!header?.customer_id) { setError('Please select a customer.'); return; }
    if (!header?.location_id) { setError('Please select a location.'); return; }
    const validLines = lines?.filter(l => l?.product_id && parseFloat(l?.qty) > 0);
    if (validLines?.length === 0) { setError('Please add at least one line item.'); return; }
    setIsSaving(true);
    setError('');
    try {
      let headerId = editRecord?.id;
      if (isEdit) {
        const { error: updErr } = await supabase?.from('empties_receive_header')?.update({
          receive_date: header?.receive_date,
          customer_id: header?.customer_id,
          customer_name: header?.customer_name,
          location_id: header?.location_id,
          location_name: header?.location_name,
          notes: header?.notes,
          total_value: totalValue,
          updated_at: new Date()?.toISOString(),
        })?.eq('id', headerId);
        if (updErr) throw updErr;
        await supabase?.from('empties_receive_items')?.delete()?.eq('header_id', headerId);
      } else {
        const { data: hData, error: hErr } = await supabase?.from('empties_receive_header')?.insert({
          receive_no: header?.receive_no,
          receive_date: header?.receive_date,
          customer_id: header?.customer_id,
          customer_name: header?.customer_name,
          location_id: header?.location_id,
          location_name: header?.location_name,
          notes: header?.notes,
          total_value: totalValue,
          status: 'posted',
        })?.select()?.single();
        if (hErr) throw hErr;
        headerId = hData?.id;
      }

      // Insert line items
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
      const { error: itemErr } = await supabase?.from('empties_receive_items')?.insert(itemsToInsert);
      if (itemErr) throw itemErr;

      // Update stock_levels_by_location (increase stock for each empties product)
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
            stock_on_hand: (parseFloat(existing?.stock_on_hand) || 0) + qty,
            last_movement_date: new Date()?.toISOString(),
            updated_at: new Date()?.toISOString(),
          })?.eq('id', existing?.id);
        } else {
          await supabase?.from('stock_levels_by_location')?.insert({
            product_id: line?.product_id,
            location_id: header?.location_id,
            stock_on_hand: qty,
            last_movement_date: new Date()?.toISOString(),
          });
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
  const labelCls = 'block text-xs text-muted-foreground mb-0.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-primary rounded-t-xl">
          <div className="flex items-center gap-2">
            <Icon name="PackagePlus" size={18} className="text-primary-foreground" />
            <h2 className="text-sm font-semibold text-primary-foreground">
              {isEdit ? 'Edit Empties Receive' : 'New Empties Receive'}
            </h2>
          </div>
          <button onClick={onClose} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Header Fields */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Receive No</label>
              <input className={inputCls + ' bg-muted/50 font-mono'} value={header?.receive_no} readOnly />
            </div>
            <div>
              <label className={labelCls}>Receive Date *</label>
              <input type="date" className={inputCls} value={header?.receive_date} onChange={e => handleHeaderChange('receive_date', e?.target?.value)} />
            </div>
            <div>
              <label className={labelCls}>Customer *</label>
              <select className={inputCls} value={header?.customer_id} onChange={e => handleHeaderChange('customer_id', e?.target?.value)}>
                <option value="">Select Customer</option>
                {customers?.map(c => <option key={c?.id} value={c?.id}>{c?.customer_name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Location *</label>
              <select className={inputCls} value={header?.location_id} onChange={e => handleHeaderChange('location_id', e?.target?.value)}>
                <option value="">Select Location</option>
                {locations?.map(l => <option key={l?.id} value={l?.id}>{l?.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Notes</label>
              <input className={inputCls} value={header?.notes} onChange={e => handleHeaderChange('notes', e?.target?.value)} placeholder="Optional notes..." />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-foreground">Line Items — Physical Empties Only</h3>
              <button onClick={addLine} className="flex items-center gap-1 h-6 px-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                <Icon name="Plus" size={12} /> Add Line
              </button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-muted/60">
                  <tr className="border-b border-border">
                    <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground w-8">#</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground w-28">Product Code</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Product Name</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground w-28">Empties Type</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground w-20">Qty</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground w-24">Unit Price</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground w-28">Total Value</th>
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

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30 rounded-b-xl">
          <p className="text-xs text-muted-foreground">On save: stock increases at selected location</p>
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

export default EmptiesReceiveModal;
