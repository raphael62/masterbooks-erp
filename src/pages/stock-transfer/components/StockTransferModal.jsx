import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';

const today = () => new Date()?.toISOString()?.slice(0, 10);

const emptyLine = () => ({
  _key: Math.random()?.toString(36)?.slice(2),
  product_id: '',
  product_code: '',
  product_name: '',
  pack_unit: 1,
  cartons: '',
  bottles: '',
  unit_price: '',
  value: 0,
});

const StockTransferModal = ({ isOpen, onClose, onSaved, editRecord }) => {
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [header, setHeader] = useState({
    transfer_no: '',
    request_date: today(),
    driver_name: '',
    from_location_id: '',
    from_location_name: '',
    transfer_date: today(),
    vehicle_no: '',
    to_location_id: '',
    to_location_name: '',
    notes: '',
  });
  const [lines, setLines] = useState([emptyLine()]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!editRecord?.id;
  // Type-to-search dropdown (portal so it's visible above modal)
  const [openDropdown, setOpenDropdown] = useState(null); // { type: 'location_to'|'location_from'|'product', lineIdx?, rect: DOMRect, query: string }

  const fetchLookups = useCallback(async () => {
    const [locRes, prodRes] = await Promise.all([
      supabase?.from('locations')?.select('id, code, name')?.eq('is_active', true)?.order('name'),
      supabase?.from('products')?.select('id, product_code, product_name, pack_unit')?.eq('status', 'active')?.order('product_name'),
    ]);
    setLocations(locRes?.data || []);
    setProducts(prodRes?.data || []);
  }, []);

  const getFilteredLocations = useCallback((query) => {
    if (!locations?.length) return [];
    if (!query?.trim()) return locations?.slice(0, 50) || [];
    const q = String(query).toLowerCase().trim();
    return locations?.filter(l =>
      l?.name?.toLowerCase()?.includes(q) ||
      l?.code?.toLowerCase()?.includes(q)
    )?.slice(0, 50) || [];
  }, [locations]);

  const getFilteredProducts = useCallback((query) => {
    if (!products?.length) return [];
    if (!query?.trim()) return products?.slice(0, 50) || [];
    const q = String(query).toLowerCase().trim();
    return products?.filter(p =>
      p?.product_code?.toLowerCase()?.includes(q) ||
      p?.product_name?.toLowerCase()?.includes(q)
    )?.slice(0, 50) || [];
  }, [products]);

  const openDropdownAt = (type, inputEl, query, lineIdx) => {
    const rect = inputEl?.getBoundingClientRect?.();
    setOpenDropdown(rect ? { type, rect, query: query ?? '', lineIdx } : { type, rect: null, query: query ?? '', lineIdx });
  };

  const getCostPriceAsOf = useCallback(async (productId, asOfDate) => {
    if (!productId || !asOfDate) return 0;
    const { data } = await supabase
      ?.from('purchase_invoice_items')
      ?.select('id, price_tax_inc, price_ex_tax, purchase_invoices(invoice_date)')
      ?.eq('product_id', productId);
    const withDate = (data || []).filter(
      (r) => r?.purchase_invoices?.invoice_date && String(r.purchase_invoices.invoice_date) <= String(asOfDate)
    );
    withDate.sort((a, b) => String(b?.purchase_invoices?.invoice_date || '').localeCompare(String(a?.purchase_invoices?.invoice_date || '')));
    const first = withDate[0];
    const pTaxInc = parseFloat(first?.price_tax_inc);
    const pExTax = parseFloat(first?.price_ex_tax);
    if (Number.isFinite(pTaxInc) && pTaxInc > 0) return pTaxInc;
    return Number.isFinite(pExTax) ? pExTax : 0;
  }, []);

  const generateTransferNo = useCallback(async () => {
    const dateStr = today();
    const prefix = `ST-${dateStr}`;
    const { data } = await supabase
      ?.from('stock_transfer_header')
      ?.select('transfer_no')
      ?.ilike('transfer_no', `${prefix}%`)
      ?.order('transfer_no', { ascending: false })
      ?.limit(1);
    const last = data?.[0]?.transfer_no;
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
        transfer_no: editRecord?.transfer_no || '',
        request_date: editRecord?.request_date || today(),
        driver_name: editRecord?.driver_name || '',
        from_location_id: editRecord?.from_location_id || '',
        from_location_name: editRecord?.from_location_name || '',
        transfer_date: editRecord?.transfer_date || today(),
        vehicle_no: editRecord?.vehicle_no || '',
        to_location_id: editRecord?.to_location_id || '',
        to_location_name: editRecord?.to_location_name || '',
        notes: editRecord?.notes || '',
      });
      setLines((editRecord?.items || []).length > 0 ? editRecord.items.map((it, i) => ({
        _key: it?.id || `row-${i}`,
        product_id: it?.product_id || '',
        product_code: it?.product_code || '',
        product_name: it?.product_name || '',
        pack_unit: it?.pack_unit ?? 1,
        cartons: it?.cartons ?? '',
        bottles: it?.bottles ?? '',
        unit_price: it?.unit_price ?? '',
        value: it?.value ?? 0,
      })) : [emptyLine()]);
    } else {
      generateTransferNo()?.then(no => setHeader(h => ({ ...h, transfer_no: no })));
      setHeader(h => ({ ...h, request_date: today(), driver_name: '', from_location_id: '', from_location_name: '', transfer_date: today(), vehicle_no: '', to_location_id: '', to_location_name: '', notes: '' }));
      setLines([emptyLine()]);
    }
    setError('');
  }, [isOpen, isEdit, editRecord, fetchLookups, generateTransferNo]);

  useEffect(() => {
    if (!isOpen || isEdit || !header?.transfer_date) return;
    lines.forEach((line, idx) => {
      if (!line?.product_id) return;
      getCostPriceAsOf(line.product_id, header.transfer_date).then((cost) => {
        setLines((prev) => {
          const n = [...prev];
          if (n[idx]?.product_id !== line?.product_id || n[idx]?.product_id == null) return prev;
          const l = n[idx];
          const pack = parseFloat(l?.pack_unit) || 1;
          const c = parseFloat(l?.cartons) || 0;
          const b = parseFloat(l?.bottles) || 0;
          const ctnQty = pack > 0 ? c + b / pack : c;
          n[idx] = { ...l, unit_price: cost, value: ctnQty * cost };
          return n;
        });
      });
    });
  }, [header?.transfer_date]);

  const handleHeaderChange = (field, value) => {
    setHeader(prev => ({ ...prev, [field]: value }));
    if (field === 'from_location_id') {
      const loc = locations?.find(l => l?.id === value);
      setHeader(prev => ({ ...prev, from_location_id: value, from_location_name: loc?.name || '' }));
    }
    if (field === 'to_location_id') {
      const loc = locations?.find(l => l?.id === value);
      setHeader(prev => ({ ...prev, to_location_id: value, to_location_name: loc?.name || '' }));
    }
  };

  const addLine = () => setLines(prev => [...prev, emptyLine()]);
  const removeLine = (idx) => setLines(prev => prev?.filter((_, i) => i !== idx));
  const updateLine = (idx, field, value) => {
    setLines(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'product_id') {
        const prod = products?.find(p => p?.id === value);
        if (prod) next[idx] = { ...next[idx], product_code: prod?.product_code || '', product_name: prod?.product_name || '', pack_unit: prod?.pack_unit ?? 1 };
        getCostPriceAsOf(value, header?.transfer_date).then((cost) => {
          setLines((prev) => {
            const n = [...prev];
            if (n[idx]?.product_id !== value) return prev;
            const line = n[idx];
            const pack = parseFloat(line?.pack_unit) || 1;
            const c = parseFloat(line?.cartons) || 0;
            const b = parseFloat(line?.bottles) || 0;
            const ctnQty = pack > 0 ? c + b / pack : c;
            n[idx] = { ...line, unit_price: cost, value: ctnQty * cost };
            return n;
          });
        });
      }
      const line = next[idx];
      const pack = parseFloat(line?.pack_unit) || 1;
      const c = parseFloat(line?.cartons) || 0;
      const b = parseFloat(line?.bottles) || 0;
      const up = parseFloat(line?.unit_price) || 0;
      const ctnQty = pack > 0 ? c + b / pack : c;
      next[idx] = { ...line, value: ctnQty * up };
      return next;
    });
  };

  const getLineQty = (line) => {
    const pack = parseFloat(line?.pack_unit) || 1;
    const c = parseFloat(line?.cartons) || 0;
    const b = parseFloat(line?.bottles) || 0;
    return c * pack + b;
  };
  const getLineCtnQty = (line) => {
    const pack = parseFloat(line?.pack_unit) || 1;
    const c = parseFloat(line?.cartons) || 0;
    const b = parseFloat(line?.bottles) || 0;
    return pack > 0 ? c + b / pack : c;
  };

  const handleSave = async () => {
    if (!header?.from_location_id) { setError('Please select From location.'); return; }
    if (!header?.to_location_id) { setError('Please select To location.'); return; }
    if (header?.from_location_id === header?.to_location_id) { setError('From and To location must be different.'); return; }
    const validLines = lines?.filter(l => l?.product_id && getLineQty(l) > 0) || [];
    if (validLines.length === 0) { setError('Add at least one product with quantity > 0.'); return; }

    if (isEdit) {
      setError('Existing transfers cannot be modified. Stock has already been moved.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const { data: hData, error: hErr } = await supabase?.from('stock_transfer_header')?.insert({
        transfer_no: header?.transfer_no,
        request_date: header?.request_date || null,
        driver_name: header?.driver_name || null,
        from_location_id: header?.from_location_id,
        to_location_id: header?.to_location_id,
        from_location_name: header?.from_location_name || null,
        to_location_name: header?.to_location_name || null,
        transfer_date: header?.transfer_date,
        vehicle_no: header?.vehicle_no || null,
        status: 'posted',
        notes: header?.notes || null,
      })?.select()?.single();
      if (hErr) throw hErr;
      const headerId = hData?.id;

      const transferDate = header?.transfer_date;
      const movementTs = transferDate ? `${transferDate}T12:00:00.000Z` : new Date().toISOString();

      const itemsToInsert = [];
      for (let idx = 0; idx < validLines.length; idx++) {
        const row = validLines[idx];
        const pack = parseFloat(row?.pack_unit) || 1;
        const cartons = parseFloat(row?.cartons) || 0;
        const bottles = parseFloat(row?.bottles) || 0;
        const qty = cartons * pack + bottles;
        const ctnQty = pack > 0 ? cartons + bottles / pack : cartons;
        const unitPrice = Number(await getCostPriceAsOf(row?.product_id, transferDate)) || parseFloat(row?.unit_price) || 0;
        const value = ctnQty * unitPrice;
        itemsToInsert.push({
          header_id: headerId,
          product_id: row?.product_id,
          product_code: row?.product_code || null,
          product_name: row?.product_name || null,
          pack_unit: pack,
          cartons,
          bottles,
          ctn_qty: ctnQty,
          qty,
          unit_price: unitPrice,
          value,
          sort_order: idx,
        });
      }
      const { error: itemErr } = await supabase?.from('stock_transfer_items')?.insert(itemsToInsert);
      if (itemErr) throw itemErr;

      const fromId = header?.from_location_id;
      const toId = header?.to_location_id;

      for (const row of validLines) {
        const qty = getLineQty(row);
        if (qty <= 0) continue;
        const pid = row?.product_id;
        if (!pid) continue;

        const { data: fromRow } = await supabase
          ?.from('stock_levels_by_location')
          ?.select('id, stock_on_hand')
          ?.eq('product_id', pid)
          ?.eq('location_id', fromId)
          ?.single();
        if (fromRow) {
          const newFrom = Math.max(0, (parseFloat(fromRow?.stock_on_hand) || 0) - qty);
          await supabase?.from('stock_levels_by_location')?.update({
            stock_on_hand: newFrom,
            last_movement_date: movementTs,
            updated_at: movementTs,
          })?.eq('id', fromRow?.id);
        }

        const { data: toRow } = await supabase
          ?.from('stock_levels_by_location')
          ?.select('id, stock_on_hand')
          ?.eq('product_id', pid)
          ?.eq('location_id', toId)
          ?.single();
        if (toRow) {
          await supabase?.from('stock_levels_by_location')?.update({
            stock_on_hand: (parseFloat(toRow?.stock_on_hand) || 0) + qty,
            last_movement_date: movementTs,
            updated_at: movementTs,
          })?.eq('id', toRow?.id);
        } else {
          await supabase?.from('stock_levels_by_location')?.insert({
            product_id: pid,
            location_id: toId,
            stock_on_hand: qty,
            last_movement_date: movementTs,
          });
        }
      }

      onSaved?.();
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
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-primary rounded-t-xl">
          <div className="flex items-center gap-2">
            <Icon name="ArrowRightLeft" size={18} className="text-primary-foreground" />
            <h2 className="text-sm font-semibold text-primary-foreground">
              {isEdit ? 'View Stock Transfer' : 'New Stock Transfer'}
            </h2>
          </div>
          <button onClick={onClose} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Row 1: Location In | Request Date | Driver's Name */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Location In *</label>
              {isEdit ? (
                <input className={inputCls} value={header?.to_location_name ?? ''} readOnly />
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    className={inputCls}
                    value={openDropdown?.type === 'location_to' ? openDropdown?.query : (header?.to_location_name || '')}
                    onChange={e => openDropdownAt('location_to', e.target, e?.target?.value)}
                    onFocus={e => openDropdownAt('location_to', e.target, header?.to_location_name || '')}
                    onBlur={() => setTimeout(() => setOpenDropdown(null), 200)}
                    placeholder="Type to search..."
                  />
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Request Date</label>
              <input type="date" className={inputCls} value={header?.request_date ?? ''} onChange={e => handleHeaderChange('request_date', e?.target?.value)} disabled={isEdit} />
            </div>
            <div>
              <label className={labelCls}>Driver&apos;s Name</label>
              <input className={inputCls} value={header?.driver_name ?? ''} onChange={e => handleHeaderChange('driver_name', e?.target?.value)} placeholder="Driver name" disabled={isEdit} />
            </div>
          </div>
          {/* Row 2: Location Out | Transfer Date | Vehicle No. */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Location Out *</label>
              {isEdit ? (
                <input className={inputCls} value={header?.from_location_name ?? ''} readOnly />
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    className={inputCls}
                    value={openDropdown?.type === 'location_from' ? openDropdown?.query : (header?.from_location_name || '')}
                    onChange={e => openDropdownAt('location_from', e.target, e?.target?.value)}
                    onFocus={e => openDropdownAt('location_from', e.target, header?.from_location_name || '')}
                    onBlur={() => setTimeout(() => setOpenDropdown(null), 200)}
                    placeholder="Type to search..."
                  />
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Transfer Date</label>
              <input type="date" className={inputCls} value={header?.transfer_date ?? ''} onChange={e => handleHeaderChange('transfer_date', e?.target?.value)} disabled={isEdit} />
            </div>
            <div>
              <label className={labelCls}>Vehicle No.</label>
              <input className={inputCls} value={header?.vehicle_no ?? ''} onChange={e => handleHeaderChange('vehicle_no', e?.target?.value)} placeholder="Vehicle number" disabled={isEdit} />
            </div>
          </div>
          {/* Row 3: Transfer No. (Auto) | Notes */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Transfer No.</label>
              <input className={inputCls + ' bg-muted/50 font-mono'} value={header?.transfer_no ?? ''} readOnly />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Notes</label>
              <input className={inputCls} value={header?.notes ?? ''} onChange={e => handleHeaderChange('notes', e?.target?.value)} placeholder="Optional" disabled={isEdit} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-foreground">Line items</h3>
              {!isEdit && <button type="button" onClick={addLine} className="text-xs text-primary hover:underline">+ Add line</button>}
            </div>
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-xs border-collapse" style={{ minWidth: '640px' }}>
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-2 py-1.5 text-left font-medium w-8">#</th>
                    <th className="px-2 py-1.5 text-left font-medium min-w-[160px]">Products</th>
                    <th className="px-2 py-1.5 text-right font-medium w-16">Pack unit</th>
                    <th className="px-2 py-1.5 text-right font-medium w-20">Cartons</th>
                    <th className="px-2 py-1.5 text-right font-medium w-20">Bottles</th>
                    <th className="px-2 py-1.5 text-right font-medium w-20">Ctn Qty</th>
                    <th className="px-2 py-1.5 text-right font-medium w-20">Unit price</th>
                    <th className="px-2 py-1.5 text-right font-medium w-24">Values</th>
                    {!isEdit && <th className="w-8" />}
                  </tr>
                </thead>
                <tbody>
                  {lines?.map((line, idx) => (
                    <tr key={line?._key || idx}>
                      <td className="px-2 py-1.5 border-t border-border">{idx + 1}</td>
                      <td className="px-2 py-1.5 border-t border-border">
                        {isEdit ? (
                          <span>{line?.product_name || line?.product_code || '—'}</span>
                        ) : (
                          <input
                            type="text"
                            className={inputCls + ' min-w-[140px]'}
                            value={openDropdown?.type === 'product' && openDropdown?.lineIdx === idx ? openDropdown?.query : (line?.product_code && line?.product_name ? `${line.product_code} — ${line.product_name}` : '')}
                            onChange={e => openDropdownAt('product', e.target, e?.target?.value, idx)}
                            onFocus={e => openDropdownAt('product', e.target, line?.product_code && line?.product_name ? `${line.product_code} — ${line.product_name}` : '', idx)}
                            onBlur={() => setTimeout(() => setOpenDropdown(null), 200)}
                            placeholder="Type to search..."
                          />
                        )}
                      </td>
                      <td className="px-2 py-1.5 border-t border-border text-right tabular-nums">{line?.pack_unit ?? '—'}</td>
                      <td className="px-2 py-1.5 border-t border-border text-right">
                        {isEdit ? (
                          <span className="tabular-nums">{Number(line?.cartons) ?? '—'}</span>
                        ) : (
                          <input type="number" min="0" step="1" className={inputCls + ' text-right w-16'} value={line?.cartons ?? ''} onChange={e => updateLine(idx, 'cartons', e?.target?.value)} />
                        )}
                      </td>
                      <td className="px-2 py-1.5 border-t border-border text-right">
                        {isEdit ? (
                          <span className="tabular-nums">{Number(line?.bottles) ?? '—'}</span>
                        ) : (
                          <input type="number" min="0" step="1" className={inputCls + ' text-right w-16'} value={line?.bottles ?? ''} onChange={e => updateLine(idx, 'bottles', e?.target?.value)} />
                        )}
                      </td>
                      <td className="px-2 py-1.5 border-t border-border text-right tabular-nums">
                        {getLineCtnQty(line) > 0 ? getLineCtnQty(line).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="px-2 py-1.5 border-t border-border text-right">
                        {isEdit ? (
                          <span className="tabular-nums">{(Number(line?.unit_price) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                        ) : (
                          <input type="number" min="0" step="0.01" className={inputCls + ' text-right w-20'} value={line?.unit_price ?? ''} onChange={e => updateLine(idx, 'unit_price', e?.target?.value)} placeholder="0" />
                        )}
                      </td>
                      <td className="px-2 py-1.5 border-t border-border text-right tabular-nums">
                        {(Number(line?.value) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      {!isEdit && (
                        <td className="px-1 py-1.5 border-t border-border">
                          <button type="button" onClick={() => removeLine(idx)} className="text-destructive hover:bg-destructive/10 rounded p-0.5">
                            <Icon name="Trash2" size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!isEdit && (
              <p className="text-xs text-muted-foreground mt-1">Unit price = cost per carton (tax inclusive) from latest purchase invoice on or before Transfer date. Ctn Qty = Cartons + Bottles ÷ Pack unit. Values = Ctn Qty × Unit price (per carton). Stock movements use Transfer date at both locations.</p>
            )}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="flex-shrink-0 px-5 py-3 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="h-8 px-3 text-xs font-medium border border-border rounded hover:bg-accent">Cancel</button>
          {!isEdit && (
            <button onClick={handleSave} disabled={isSaving} className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5">
              {isSaving ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Save" size={14} />}
              {isSaving ? 'Saving...' : 'Save & Post'}
            </button>
          )}
        </div>
      </div>

      {/* Type-to-search dropdown portal (fixed position so visible above modal) */}
      {openDropdown && openDropdown.rect && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[9999] bg-card border border-border rounded-md shadow-xl max-h-52 overflow-y-auto min-w-[200px]"
          style={{
            left: openDropdown.rect.left,
            top: openDropdown.rect.bottom + 4,
            width: Math.max(openDropdown.rect.width, 220),
          }}
        >
          {openDropdown.type === 'location_to' && (
            <>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); handleHeaderChange('to_location_id', ''); setOpenDropdown(null); }}
                className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted text-muted-foreground border-b border-border"
              >
                — Clear —
              </button>
              {getFilteredLocations(openDropdown.query)?.length > 0 ? (
                getFilteredLocations(openDropdown.query).map(l => (
                  <button
                    key={l?.id}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); handleHeaderChange('to_location_id', l?.id); setOpenDropdown(null); }}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 block"
                  >
                    {l?.name || l?.code}
                  </button>
                ))
              ) : (
                <div className="px-2 py-2 text-xs text-muted-foreground">No locations found</div>
              )}
            </>
          )}
          {openDropdown.type === 'location_from' && (
            <>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); handleHeaderChange('from_location_id', ''); setOpenDropdown(null); }}
                className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted text-muted-foreground border-b border-border"
              >
                — Clear —
              </button>
              {getFilteredLocations(openDropdown.query)?.length > 0 ? (
                getFilteredLocations(openDropdown.query).map(l => (
                  <button
                    key={l?.id}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); handleHeaderChange('from_location_id', l?.id); setOpenDropdown(null); }}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 block"
                  >
                    {l?.name || l?.code}
                  </button>
                ))
              ) : (
                <div className="px-2 py-2 text-xs text-muted-foreground">No locations found</div>
              )}
            </>
          )}
          {openDropdown.type === 'product' && typeof openDropdown.lineIdx === 'number' && (
            <>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); updateLine(openDropdown.lineIdx, 'product_id', ''); setOpenDropdown(null); }}
                className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted text-muted-foreground border-b border-border"
              >
                — Clear —
              </button>
              {getFilteredProducts(openDropdown.query)?.length > 0 ? (
                getFilteredProducts(openDropdown.query).map(p => (
                  <button
                    key={p?.id}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); updateLine(openDropdown.lineIdx, 'product_id', p?.id); setOpenDropdown(null); }}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 block"
                  >
                    {p?.product_code} — {p?.product_name}
                  </button>
                ))
              ) : (
                <div className="px-2 py-2 text-xs text-muted-foreground">No products found</div>
              )}
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default StockTransferModal;
