import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';

const today = () => new Date()?.toISOString?.()?.slice(0, 10);

const EmptiesReceiveModal = ({ isOpen, onClose, onSaved, editRecord }) => {
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [returnableProducts, setReturnableProducts] = useState([]);
  const [emptiesOwed, setEmptiesOwed] = useState({});
  const [expectedFromTodaysInvoices, setExpectedFromTodaysInvoices] = useState({});
  const [emptiesReceived, setEmptiesReceived] = useState({});
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [header, setHeader] = useState({
    receive_no: '',
    empties_receipt_no: '',
    receive_date: today(),
    customer_id: '',
    customer_name: '',
    location_id: '',
    location_name: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!editRecord;

  const fetchLookups = useCallback(async () => {
    const [custRes, locRes, prodRes] = await Promise.all([
      supabase?.from('customers')?.select('id, customer_name, customer_code, mobile')?.eq('status', 'Active')?.order('customer_name'),
      supabase?.from('locations')?.select('id, name, code')?.eq('is_active', true)?.order('name'),
      supabase?.from('products')?.select('id, product_code, product_name, empties_type, is_returnable')?.eq('is_returnable', true)?.order('product_name'),
    ]);
    setCustomers(custRes?.data || []);
    setLocations(locRes?.data || []);
    setReturnableProducts(prodRes?.data || []);
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

  const fetchOwedEmpties = useCallback(async () => {
    const customerId = header?.customer_id;
    if (!customerId) {
      setEmptiesOwed({});
      return;
    }
    try {
      const { data: invData } = await supabase
        .from('sales_invoices')
        .select('id, delivery_date, invoice_date')
        .eq('customer_id', customerId);
      const pastInvIds = (invData || []).map(inv => inv?.id).filter(Boolean);

      const soldByType = {};
      const emptiesSoldByType = {};
      if (pastInvIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('sales_invoice_items')
          .select('product_id, product_code, product_name, ctn_qty, btl_qty, invoice_id, is_returnable')
          .in('invoice_id', pastInvIds);

        const productIds = [...new Set((itemsData || []).map(r => r?.product_id).filter(Boolean))];
        let prodMap = {};
        if (productIds.length > 0) {
          const { data: prodData } = await supabase.from('products').select('id, empties_type').in('id', productIds);
          prodMap = Object.fromEntries((prodData || []).map(p => [p?.id, p?.empties_type || 'Other']));
        }
        const isEmpties = (r) => {
          const n = String(r?.product_name || '').toLowerCase();
          const c = String(r?.product_code || '').toLowerCase();
          return n.includes('empties') || c.includes('empties');
        };
        for (const r of itemsData || []) {
          const et = prodMap[r.product_id] || 'Other';
          const qty = parseFloat(r.ctn_qty) || parseFloat(r.btl_qty) || 0;
          if (isEmpties(r)) {
            emptiesSoldByType[et] = (emptiesSoldByType[et] || 0) + qty;
          } else if (r?.is_returnable && qty > 0) {
            soldByType[et] = (soldByType[et] || 0) + qty;
          }
        }
      }

      const { data: recData } = await supabase
        .from('empties_receive_header')
        .select('id')
        .eq('customer_id', customerId);
      const recIds = (recData || []).map(r => r?.id).filter(Boolean).filter(id => id !== editRecord?.id);

      const receivedByType = {};
      if (recIds.length > 0) {
        const { data: recItems } = await supabase
          .from('empties_receive_items')
          .select('empties_type, qty')
          .in('header_id', recIds);
        for (const r of recItems || []) {
          const et = r?.empties_type || 'Other';
          receivedByType[et] = (receivedByType[et] || 0) + (parseFloat(r.qty) || 0);
        }
      }

      const { data: invEmptiesRaw } = await supabase
        .from('sales_invoice_empties')
        .select('invoice_id, empties_type, received_qty');
      const { data: invForEmpties } = await supabase
        .from('sales_invoices')
        .select('id, customer_id')
        .eq('customer_id', customerId);
      const invLookup = Object.fromEntries((invForEmpties || []).map(i => [i?.id, i]));
      for (const r of invEmptiesRaw || []) {
        const inv = invLookup[r?.invoice_id];
        if (!inv) continue;
        const et = r?.empties_type || 'Other';
        receivedByType[et] = (receivedByType[et] || 0) + (parseFloat(r?.received_qty) || 0);
      }

      const owed = {};
      const allTypes = new Set([...Object.keys(soldByType), ...Object.keys(receivedByType), ...Object.keys(emptiesSoldByType)]);
      for (const et of allTypes) {
        const sold = soldByType[et] || 0;
        const recv = receivedByType[et] || 0;
        const emptiesSold = emptiesSoldByType[et] || 0;
        owed[et] = sold - recv - emptiesSold;
      }
      setEmptiesOwed(owed);
    } catch (err) {
      console.error('fetchOwedEmpties error:', err);
      setEmptiesOwed({});
    }
  }, [header?.customer_id, editRecord?.id]);

  const fetchExpectedFromTodaysInvoices = useCallback(async () => {
    const customerId = header?.customer_id;
    const refDate = header?.receive_date || today();
    if (!customerId) {
      setExpectedFromTodaysInvoices({});
      return;
    }
    try {
      const { data: todayInvs } = await supabase
        .from('sales_invoices')
        .select('id')
        .eq('customer_id', customerId)
        .eq('delivery_date', refDate);
      const todayInvIds = (todayInvs || []).map(i => i?.id).filter(Boolean);
      if (todayInvIds.length === 0) {
        setExpectedFromTodaysInvoices({});
        return;
      }
      const { data: itemsData } = await supabase
        .from('sales_invoice_items')
        .select('product_id, product_code, product_name, ctn_qty, btl_qty, is_returnable')
        .in('invoice_id', todayInvIds);

      const productIds = [...new Set((itemsData || []).map(r => r?.product_id).filter(Boolean))];
      let prodMap = {};
      if (productIds.length > 0) {
        const { data: prodData } = await supabase.from('products').select('id, empties_type').in('id', productIds);
        prodMap = Object.fromEntries((prodData || []).map(p => [p?.id, p?.empties_type || 'Other']));
      }
      const isEmptiesProduct = (r) => {
        const n = String(r?.product_name || '').toLowerCase();
        const c = String(r?.product_code || '').toLowerCase();
        return n.includes('empties') || c.includes('empties');
      };
      const expected = {};
      for (const r of itemsData || []) {
        const et = prodMap[r.product_id] || 'Other';
        const ctn = parseFloat(r?.ctn_qty) || 0;
        const btl = parseFloat(r?.btl_qty) || 0;
        const qty = ctn !== 0 ? ctn : btl;
        const isReturnable = r?.is_returnable && !isEmptiesProduct(r);
        if (isReturnable) {
          expected[et] = (expected[et] || 0) + qty;
        } else if (isEmptiesProduct(r)) {
          expected[et] = (expected[et] || 0) - qty;
        }
      }
      const { data: invEmpties } = await supabase
        .from('sales_invoice_empties')
        .select('invoice_id, empties_type, sold_qty')
        .in('invoice_id', todayInvIds);
      for (const e of invEmpties || []) {
        const et = e?.empties_type || 'Other';
        const sold = parseFloat(e?.sold_qty) || 0;
        expected[et] = (expected[et] || 0) - sold;
      }
      setExpectedFromTodaysInvoices(expected);
    } catch (err) {
      console.error('fetchExpectedFromTodaysInvoices error:', err);
      setExpectedFromTodaysInvoices({});
    }
  }, [header?.customer_id, header?.receive_date]);

  useEffect(() => {
    fetchOwedEmpties();
  }, [fetchOwedEmpties]);

  useEffect(() => {
    fetchExpectedFromTodaysInvoices();
  }, [fetchExpectedFromTodaysInvoices]);

  useEffect(() => {
    if (!isOpen) return;
    fetchLookups();
    if (isEdit && editRecord) {
      setHeader({
        receive_no: editRecord?.receive_no || '',
        empties_receipt_no: editRecord?.empties_receipt_no || '',
        receive_date: editRecord?.receive_date || today(),
        customer_id: editRecord?.customer_id || '',
        customer_name: editRecord?.customer_name || '',
        location_id: editRecord?.location_id || '',
        location_name: editRecord?.location_name || '',
        notes: editRecord?.notes || '',
      });
      const receivedFromEdit = {};
      for (const it of editRecord?.items || []) {
        const et = it?.empties_type || 'Other';
        receivedFromEdit[et] = (receivedFromEdit[et] || 0) + (parseFloat(it?.qty) || 0);
      }
      setEmptiesReceived(receivedFromEdit);
    } else {
      generateReceiveNo()?.then(no => setHeader(h => ({ ...h, receive_no: no })));
      setHeader(h => ({ ...h, empties_receipt_no: '', receive_date: today(), customer_id: '', customer_name: '', location_id: '', location_name: '', notes: '' }));
      setEmptiesReceived({});
    }
    setError('');
  }, [isOpen, isEdit, editRecord, fetchLookups, generateReceiveNo]);

  const handleHeaderChange = (field, value) => {
    setHeader(h => ({ ...h, [field]: value }));
    if (field === 'customer_id') {
      const cust = customers?.find(c => c?.id === value);
      setHeader(h => ({ ...h, customer_id: value, customer_name: cust?.customer_name || '' }));
      setEmptiesReceived({});
      setShowAllTypes(false);
    }
    if (field === 'location_id') {
      const loc = locations?.find(l => l?.id === value);
      setHeader(h => ({ ...h, location_id: value, location_name: loc?.name || '' }));
    }
  };

  const emptiesSummary = React.useMemo(() => {
    if (!header?.customer_id) return [];
    const typesFromProducts = new Set((returnableProducts || []).map(p => p?.empties_type || 'Other').filter(Boolean));
    const allTypes = new Set([
      ...Object.keys(emptiesOwed || {}),
      ...Object.keys(expectedFromTodaysInvoices || {}),
      ...Object.keys(emptiesReceived || {}),
      ...typesFromProducts,
    ].filter(Boolean));
    return [...allTypes].sort().map(et => {
      const owed = emptiesOwed?.[et] ?? 0;
      const expected = expectedFromTodaysInvoices?.[et] ?? 0;
      const received = parseFloat(emptiesReceived?.[et]) || 0;
      const os = owed + expected - received;
      return { empties_type: et, owed, expected, received, os };
    });
  }, [header?.customer_id, emptiesOwed, expectedFromTodaysInvoices, emptiesReceived, returnableProducts]);

  const hasFigures = (row) => (parseFloat(row?.owed) || 0) !== 0 || (parseFloat(row?.expected) || 0) !== 0 || (parseFloat(row?.received) || 0) !== 0 || (parseFloat(row?.os) || 0) !== 0;
  const visibleRows = showAllTypes ? (emptiesSummary || []) : (emptiesSummary || []).filter(hasFigures);

  const handleEmptiesReceivedChange = (emptiesType, value) => {
    setEmptiesReceived(prev => {
      const v = parseFloat(value);
      if (value === '' || value == null) {
        const next = { ...prev };
        delete next[emptiesType];
        return next;
      }
      return { ...prev, [emptiesType]: isNaN(v) ? value : v };
    });
  };

  const fmtNum = (v) => {
    const n = parseFloat(v);
    if (isNaN(n)) return '';
    return n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const getProductForEmptiesType = (emptiesType) => {
    return returnableProducts?.find(p => (p?.empties_type || 'Other') === emptiesType);
  };

  const handleSave = async () => {
    if (!header?.customer_id) { setError('Please select a customer.'); return; }
    if (!header?.location_id) { setError('Please select a location.'); return; }
    const toSave = emptiesSummary?.filter(r => (parseFloat(emptiesReceived?.[r?.empties_type]) || 0) > 0) || [];
    if (toSave.length === 0) { setError('Please enter at least one receive quantity.'); return; }
    setIsSaving(true);
    setError('');
    try {
      let headerId = editRecord?.id;

      if (isEdit) {
        const { error: updErr } = await supabase?.from('empties_receive_header')?.update({
          empties_receipt_no: header?.empties_receipt_no ?? null,
          receive_date: header?.receive_date,
          customer_id: header?.customer_id,
          customer_name: header?.customer_name,
          location_id: header?.location_id,
          location_name: header?.location_name,
          notes: header?.notes,
          total_value: 0,
          updated_at: new Date()?.toISOString(),
        })?.eq('id', headerId);
        if (updErr) throw updErr;
        for (const oldItem of editRecord?.items || []) {
          const qty = parseFloat(oldItem?.qty) || 0;
          if (qty <= 0 || !header?.location_id) continue;
          const { data: ex } = await supabase
            ?.from('stock_levels_by_location')
            ?.select('id, stock_on_hand')
            ?.eq('product_id', oldItem?.product_id)
            ?.eq('location_id', header?.location_id)
            ?.single();
          if (ex) {
            await supabase?.from('stock_levels_by_location')?.update({
              stock_on_hand: Math.max(0, (parseFloat(ex?.stock_on_hand) || 0) - qty),
              last_movement_date: new Date()?.toISOString(),
              updated_at: new Date()?.toISOString(),
            })?.eq('id', ex?.id);
          }
        }
        await supabase?.from('empties_receive_items')?.delete()?.eq('header_id', headerId);
      } else {
        const { data: hData, error: hErr } = await supabase?.from('empties_receive_header')?.insert({
          receive_no: header?.receive_no,
          empties_receipt_no: header?.empties_receipt_no || null,
          receive_date: header?.receive_date,
          customer_id: header?.customer_id,
          customer_name: header?.customer_name,
          location_id: header?.location_id,
          location_name: header?.location_name,
          notes: header?.notes,
          total_value: 0,
          status: 'posted',
        })?.select()?.single();
        if (hErr) throw hErr;
        headerId = hData?.id;
      }

      const itemsToInsert = [];
      toSave.forEach((row, idx) => {
        const qty = parseFloat(emptiesReceived?.[row?.empties_type]) || 0;
        if (qty <= 0) return;
        const prod = getProductForEmptiesType(row?.empties_type);
        if (!prod) return;
        itemsToInsert.push({
          header_id: headerId,
          product_id: prod?.id,
          product_code: prod?.product_code,
          product_name: prod?.product_name,
          empties_type: row?.empties_type,
          qty,
          unit_price: 0,
          total_value: 0,
          sort_order: idx,
        });
      });

      if (itemsToInsert.length > 0) {
        const { error: itemErr } = await supabase?.from('empties_receive_items')?.insert(itemsToInsert);
        if (itemErr) throw itemErr;
      }

      for (const row of toSave) {
        const qty = parseFloat(emptiesReceived?.[row?.empties_type]) || 0;
        if (qty <= 0 || !header?.location_id) continue;
        const prod = getProductForEmptiesType(row?.empties_type);
        if (!prod?.id) continue;
        const { data: existing } = await supabase
          ?.from('stock_levels_by_location')
          ?.select('id, stock_on_hand')
          ?.eq('product_id', prod.id)
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
            product_id: prod.id,
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
  const labelStyle = { color: 'var(--color-primary)' };
  const thCls = 'px-2 py-1.5 font-medium';
  const tdCls = 'border-b border-border';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-border">
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Empties receive no.</label>
              <input className={inputCls + ' bg-muted/50 font-mono'} value={header?.receive_no ?? ''} readOnly />
            </div>
            <div>
              <label className={labelCls}>Empties Receipt No.</label>
              <input className={inputCls} value={header?.empties_receipt_no ?? ''} onChange={e => handleHeaderChange('empties_receipt_no', e?.target?.value)} placeholder="Manual receipt number" />
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
              {header?.customer_id && (() => {
                const cust = customers?.find(c => c?.id === header?.customer_id);
                const phone = cust?.mobile;
                return phone != null && phone !== '' ? (
                  <p className="text-xs text-muted-foreground mt-1">Phone: {phone}</p>
                ) : null;
              })()}
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold" style={labelStyle}>Customer Empties — Owed, Expected, Receive & O/S</h3>
              {emptiesSummary?.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllTypes(s => !s)}
                  className="text-xs text-primary hover:underline"
                >
                  {showAllTypes ? 'Hide empty types' : `Show all types (${emptiesSummary.length})`}
                </button>
              )}
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs border-collapse" style={{ minWidth: '400px' }}>
                <thead>
                  <tr>
                    <th className={`${thCls} text-left`} style={labelStyle}>PRODUCT</th>
                    <th className={`${thCls} w-20 text-right`} style={labelStyle}>OWED</th>
                    <th className={`${thCls} w-20 text-right`} style={labelStyle}>EXPECTED</th>
                    <th className={`${thCls} w-24 text-right`} style={labelStyle}>RECEIVED</th>
                    <th className={`${thCls} w-20 text-right`} style={labelStyle}>O/S</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows?.length > 0 ? (
                    visibleRows.map(row => (
                      <tr key={row?.empties_type} className="bg-background hover:bg-muted/20">
                        <td className={`${tdCls} px-2 py-1.5 font-medium`}>{row?.empties_type}</td>
                        <td className={`${tdCls} px-2 py-1.5 text-right tabular-nums ${(parseFloat(row?.owed) || 0) < 0 ? 'text-destructive' : ''}`}>{fmtNum(row?.owed) || '0'}</td>
                        <td className={`${tdCls} px-2 py-1.5 text-right tabular-nums`}>{fmtNum(row?.expected) || '0'}</td>
                        <td className={`${tdCls} px-2 py-1.5`}>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={emptiesReceived?.[row?.empties_type] !== undefined ? emptiesReceived[row?.empties_type] : (row?.received || '')}
                            onChange={e => handleEmptiesReceivedChange(row?.empties_type, e?.target?.value)}
                            className="w-full h-6 px-1 text-xs border border-border rounded text-right focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="0"
                            title="Physically returned"
                          />
                        </td>
                        <td className={`${tdCls} px-2 py-1.5 text-right tabular-nums font-semibold ${(parseFloat(row?.os) || 0) < 0 ? 'text-destructive' : ''}`}>{fmtNum(row?.os) || '0'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className={`${tdCls} px-2 py-4 text-center text-muted-foreground`}>
                        {emptiesSummary?.length > 0 ? 'No types with figures. Use "Show all types" to add receive quantities.' : 'Select a customer to see empties summary'}
                      </td>
                    </tr>
                  )}
                </tbody>
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
          <p className="text-xs text-muted-foreground">On save: stock increases at selected location. Value is not used for customer empties.</p>
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
