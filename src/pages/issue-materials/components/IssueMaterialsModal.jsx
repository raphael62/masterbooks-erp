import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';

const IssueMaterialsModal = ({ isOpen, onClose, issue, productionOrders, locations, executives, onSave, onConfirmIssue }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [issueHistory, setIssueHistory] = useState([]);
  const [loadingBOM, setLoadingBOM] = useState(false);

  const generateIssueNo = () => {
    const now = new Date();
    const yyyy = now?.getFullYear();
    const mm = String(now?.getMonth() + 1)?.padStart(2, '0');
    const dd = String(now?.getDate())?.padStart(2, '0');
    const seq = String(Math.floor(100 + Math.random() * 900));
    return `ISS-${yyyy}-${mm}-${dd}-${seq}`;
  };

  const [form, setForm] = useState({
    issue_no: '',
    production_order_id: '',
    production_order_no: '',
    product_being_produced: '',
    product_id: '',
    issue_date: new Date()?.toISOString()?.split('T')?.[0],
    from_location_id: '',
    from_location_name: '',
    issued_by: '',
    issued_by_id: '',
    notes: '',
    status: 'Draft'
  });

  const [lineItems, setLineItems] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setActiveTab('details');
    if (issue) {
      setForm({
        issue_no: issue?.issue_no || '',
        production_order_id: issue?.production_order_id || '',
        production_order_no: issue?.production_order_no || '',
        product_being_produced: issue?.product_being_produced || '',
        product_id: issue?.product_id || '',
        issue_date: issue?.issue_date || new Date()?.toISOString()?.split('T')?.[0],
        from_location_id: issue?.from_location_id || '',
        from_location_name: issue?.from_location_name || '',
        issued_by: issue?.issued_by || '',
        issued_by_id: issue?.issued_by_id || '',
        notes: issue?.notes || '',
        status: issue?.status || 'Draft'
      });
      fetchLineItems(issue?.id);
      if (issue?.production_order_id) fetchIssueHistory(issue?.production_order_id, issue?.id);
    } else {
      setForm(f => ({
        ...f,
        issue_no: generateIssueNo(),
        production_order_id: '', production_order_no: '', product_being_produced: '', product_id: '',
        issue_date: new Date()?.toISOString()?.split('T')?.[0],
        from_location_id: '', from_location_name: '', issued_by: '', issued_by_id: '', notes: '', status: 'Draft'
      }));
      setLineItems([]);
      setIssueHistory([]);
    }
  }, [isOpen, issue]);

  const fetchLineItems = async (issueId) => {
    try {
      const { data } = await supabase?.from('material_issue_items')?.select('*')?.eq('material_issue_id', issueId)?.order('sort_order');
      setLineItems(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchIssueHistory = async (productionOrderId, currentId) => {
    try {
      const query = supabase?.from('material_issues')
        ?.select('id, issue_no, issue_date, status, issued_by, total_items_issued, total_cost, confirmed_at, confirmed_by')
        ?.eq('production_order_id', productionOrderId)
        ?.eq('status', 'Confirmed')
        ?.order('issue_date', { ascending: false });
      if (currentId) query?.neq('id', currentId);
      const { data } = await query;
      setIssueHistory(data || []);
    } catch (e) { console.error(e); }
  };

  const loadBOMIngredients = useCallback(async (productId, locationId) => {
    if (!productId) return;
    setLoadingBOM(true);
    try {
      const { data: bomHeader } = await supabase?.from('bom_headers')
        ?.select('id')
        ?.eq('product_id', productId)
        ?.eq('status', 'Active')
        ?.order('created_at', { ascending: false })
        ?.limit(1)
        ?.single();

      if (!bomHeader?.id) {
        setLineItems([]);
        setLoadingBOM(false);
        return;
      }

      const { data: bomItems } = await supabase?.from('bom_items')
        ?.select('*')
        ?.eq('bom_header_id', bomHeader?.id)
        ?.order('sort_order');

      if (!bomItems?.length) {
        setLineItems([]);
        setLoadingBOM(false);
        return;
      }

      const enriched = await Promise.all(
        bomItems?.map(async (item, idx) => {
          let availableStock = 0;
          if (locationId && item?.material_code) {
            const { data: prod } = await supabase?.from('products')
              ?.select('id')
              ?.eq('product_code', item?.material_code)
              ?.single();
            if (prod?.id) {
              const { data: stock } = await supabase?.from('stock_levels_by_location')
                ?.select('stock_on_hand')
                ?.eq('product_id', prod?.id)
                ?.eq('location_id', locationId)
                ?.single();
              availableStock = parseFloat(stock?.stock_on_hand) || 0;
            }
          }
          const requiredQty = parseFloat(item?.adjusted_qty || item?.quantity_required) || 0;
          const unitCost = parseFloat(item?.unit_cost) || 0;
          const qtyToIssue = requiredQty;
          return {
            line_no: idx + 1,
            ingredient_code: item?.material_code || '',
            ingredient_name: item?.material_name || '',
            required_qty: requiredQty,
            available_stock: availableStock,
            qty_to_issue: qtyToIssue,
            uom: item?.uom || 'Units',
            unit_cost: unitCost,
            total_cost: parseFloat((qtyToIssue * unitCost)?.toFixed(4)),
            variance: parseFloat((qtyToIssue - requiredQty)?.toFixed(4)),
            sort_order: idx
          };
        })
      );
      setLineItems(enriched);
    } catch (e) {
      console.error('Error loading BOM:', e);
    } finally {
      setLoadingBOM(false);
    }
  }, []);

  const handleProductionOrderChange = async (e) => {
    const orderId = e?.target?.value;
    const order = productionOrders?.find(o => o?.id === orderId);
    const newForm = {
      ...form,
      production_order_id: orderId,
      production_order_no: order?.order_no || '',
      product_being_produced: order?.product_name || '',
      product_id: order?.product_id || ''
    };
    setForm(newForm);
    if (order?.product_id) {
      await loadBOMIngredients(order?.product_id, form?.from_location_id);
    } else {
      setLineItems([]);
    }
    if (orderId) fetchIssueHistory(orderId, issue?.id);
  };

  const handleLocationChange = async (e) => {
    const locId = e?.target?.value;
    const loc = locations?.find(l => l?.id === locId);
    setForm(f => ({ ...f, from_location_id: locId, from_location_name: loc?.name || '' }));
    if (form?.product_id) {
      await loadBOMIngredients(form?.product_id, locId);
    }
  };

  const updateLineItem = (idx, field, value) => {
    setLineItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated?.[idx], [field]: value };
      if (field === 'qty_to_issue' || field === 'unit_cost') {
        const qty = parseFloat(field === 'qty_to_issue' ? value : updated?.[idx]?.qty_to_issue) || 0;
        const cost = parseFloat(field === 'unit_cost' ? value : updated?.[idx]?.unit_cost) || 0;
        updated[idx].total_cost = parseFloat((qty * cost)?.toFixed(4));
        updated[idx].variance = parseFloat((qty - (parseFloat(updated?.[idx]?.required_qty) || 0))?.toFixed(4));
      }
      return updated;
    });
  };

  const totalCost = lineItems?.reduce((s, r) => s + (parseFloat(r?.total_cost) || 0), 0);

  const handleSave = async () => {
    if (!form?.production_order_id) { setError('Production Order is required'); return; }
    if (!form?.from_location_id) { setError('From Location is required'); return; }
    setIsSaving(true);
    setError(null);
    try {
      await onSave?.(
        { ...form, total_items_issued: lineItems?.length, total_cost: totalCost },
        lineItems
      );
      onClose();
    } catch (e) {
      setError(e?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmIssue = async () => {
    if (!form?.production_order_id) { setError('Production Order is required'); return; }
    if (!form?.from_location_id) { setError('From Location is required'); return; }
    if (!lineItems?.length) { setError('No ingredients to issue'); return; }

    // Validate stock
    const insufficientItems = lineItems?.filter(item => {
      const avail = parseFloat(item?.available_stock) || 0;
      const qty = parseFloat(item?.qty_to_issue) || 0;
      return qty > avail;
    });
    if (insufficientItems?.length > 0) {
      setError(`Insufficient stock for: ${insufficientItems?.map(i => i?.ingredient_name)?.join(', ')}`);
      return;
    }

    setIsConfirming(true);
    setError(null);
    try {
      await onConfirmIssue?.(
        { ...form, total_items_issued: lineItems?.length, total_cost: totalCost },
        lineItems
      );
      onClose();
    } catch (e) {
      setError(e?.message || 'Confirmation failed');
    } finally {
      setIsConfirming(false);
    }
  };

  const fmt = (n) => Number(n || 0)?.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const isReadOnly = form?.status === 'Confirmed' || form?.status === 'Cancelled';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-primary text-primary-foreground rounded-t-xl">
          <div className="flex items-center gap-2">
            <Icon name="ClipboardList" size={18} />
            <h2 className="font-semibold text-base">
              {issue ? `Issue — ${issue?.issue_no}` : 'New Material Issue'}
            </h2>
            {form?.status !== 'Draft' && (
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                form?.status === 'Confirmed' ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
              }`}>{form?.status}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5 bg-muted/20">
          {['details', 'ingredients', 'history']?.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {tab === 'details' ? 'Issue Details' : tab === 'ingredients' ? `Ingredients (${lineItems?.length})` : 'Issue History'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
              <Icon name="AlertCircle" size={14} />{error}
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Issue No</label>
                <input className="w-full h-8 px-3 text-sm border border-border rounded-lg bg-muted/30 text-muted-foreground"
                  value={form?.issue_no} readOnly />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Issue Date <span className="text-red-500">*</span></label>
                <input type="date" className="w-full h-8 px-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/30"
                  value={form?.issue_date} onChange={e => setForm(f => ({...f, issue_date: e?.target?.value}))} disabled={isReadOnly} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Production Order <span className="text-red-500">*</span></label>
                <select className="w-full h-8 px-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/30"
                  value={form?.production_order_id} onChange={handleProductionOrderChange} disabled={isReadOnly}>
                  <option value="">— Select Production Order —</option>
                  {productionOrders?.map(o => (
                    <option key={o?.id} value={o?.id}>{o?.order_no} — {o?.product_name}</option>
                  ))}
                </select>
              </div>
              {form?.product_being_produced && (
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Product Being Produced</label>
                  <input className="w-full h-8 px-3 text-sm border border-border rounded-lg bg-muted/30 text-muted-foreground"
                    value={form?.product_being_produced} readOnly />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">From Location <span className="text-red-500">*</span></label>
                <select className="w-full h-8 px-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/30"
                  value={form?.from_location_id} onChange={handleLocationChange} disabled={isReadOnly}>
                  <option value="">— Select Location —</option>
                  {locations?.map(l => (
                    <option key={l?.id} value={l?.id}>{l?.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Issued By</label>
                <select className="w-full h-8 px-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/30"
                  value={form?.issued_by_id} onChange={e => {
                    const exec = executives?.find(ex => ex?.id === e?.target?.value);
                    setForm(f => ({ ...f, issued_by_id: e?.target?.value, issued_by: exec?.full_name || '' }));
                  }} disabled={isReadOnly}>
                  <option value="">— Select Person —</option>
                  {executives?.map(ex => (
                    <option key={ex?.id} value={ex?.id}>{ex?.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                <textarea className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/30 resize-none"
                  rows={2} value={form?.notes} onChange={e => setForm(f => ({...f, notes: e?.target?.value}))} disabled={isReadOnly}
                  placeholder="Optional notes..." />
              </div>
            </div>
          )}

          {/* Ingredients Tab */}
          {activeTab === 'ingredients' && (
            <div>
              {loadingBOM && (
                <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                  <Icon name="Loader2" size={14} className="animate-spin" />
                  Loading BOM ingredients...
                </div>
              )}
              {!form?.production_order_id && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Icon name="AlertCircle" size={24} className="mx-auto mb-2 opacity-40" />
                  Select a Production Order first to load BOM ingredients
                </div>
              )}
              {form?.production_order_id && lineItems?.length === 0 && !loadingBOM && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Icon name="Package" size={24} className="mx-auto mb-2 opacity-40" />
                  No active BOM found for this product
                </div>
              )}
              {lineItems?.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="w-10 px-2 py-2 text-center text-muted-foreground">#</th>
                        <th className="w-24 px-2 py-2 text-left text-muted-foreground">Code</th>
                        <th className="px-2 py-2 text-left text-muted-foreground">Ingredient Name</th>
                        <th className="w-24 px-2 py-2 text-right text-muted-foreground">Required Qty</th>
                        <th className="w-24 px-2 py-2 text-right text-muted-foreground">Avail. Stock</th>
                        <th className="w-28 px-2 py-2 text-right text-muted-foreground">Qty to Issue</th>
                        <th className="w-16 px-2 py-2 text-center text-muted-foreground">UOM</th>
                        <th className="w-24 px-2 py-2 text-right text-muted-foreground">Unit Cost</th>
                        <th className="w-24 px-2 py-2 text-right text-muted-foreground">Total Cost</th>
                        <th className="w-20 px-2 py-2 text-right text-muted-foreground">Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems?.map((item, idx) => {
                        const variance = parseFloat(item?.variance) || 0;
                        const availStock = parseFloat(item?.available_stock) || 0;
                        const qtyToIssue = parseFloat(item?.qty_to_issue) || 0;
                        const isInsufficient = qtyToIssue > availStock;
                        return (
                          <tr key={idx} className={`border-b border-border ${
                            idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                          }`}>
                            <td className="px-2 py-1.5 text-center text-muted-foreground">{item?.line_no}</td>
                            <td className="px-2 py-1.5 font-mono text-primary">{item?.ingredient_code || '—'}</td>
                            <td className="px-2 py-1.5 font-medium">{item?.ingredient_name}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{item?.required_qty}</td>
                            <td className={`px-2 py-1.5 text-right tabular-nums font-medium ${
                              isInsufficient ? 'text-red-600' : 'text-green-600'
                            }`}>{availStock}</td>
                            <td className="px-2 py-1.5">
                              {isReadOnly ? (
                                <span className="block text-right tabular-nums">{item?.qty_to_issue}</span>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className={`w-full h-6 px-2 text-right text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary tabular-nums ${
                                    isInsufficient ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-border'
                                  }`}
                                  value={item?.qty_to_issue}
                                  onChange={e => updateLineItem(idx, 'qty_to_issue', e?.target?.value)}
                                />
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-center text-muted-foreground">{item?.uom}</td>
                            <td className="px-2 py-1.5">
                              {isReadOnly ? (
                                <span className="block text-right tabular-nums">{fmt(item?.unit_cost)}</span>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="w-full h-6 px-2 text-right text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                                  value={item?.unit_cost}
                                  onChange={e => updateLineItem(idx, 'unit_cost', e?.target?.value)}
                                />
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums font-medium">{fmt(item?.total_cost)}</td>
                            <td className={`px-2 py-1.5 text-right tabular-nums font-semibold ${
                              variance < 0 ? 'text-red-600' : variance === 0 ? 'text-green-600' : 'text-blue-600'
                            }`}>
                              {variance > 0 ? '+' : ''}{variance?.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50 border-t-2 border-border font-semibold">
                        <td colSpan={8} className="px-2 py-2 text-xs text-muted-foreground">Total Cost</td>
                        <td className="px-2 py-2 text-right tabular-nums text-xs text-primary">{fmt(totalCost)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Issue History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Icon name="History" size={15} className="text-primary" />
                Previous Issues for this Production Order
              </h3>
              {issueHistory?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Icon name="History" size={24} className="mx-auto mb-2 opacity-40" />
                  No previous confirmed issues found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-3 py-2 text-left text-muted-foreground">Issue No</th>
                        <th className="px-3 py-2 text-left text-muted-foreground">Issue Date</th>
                        <th className="px-3 py-2 text-left text-muted-foreground">Issued By</th>
                        <th className="px-3 py-2 text-right text-muted-foreground">Items</th>
                        <th className="px-3 py-2 text-right text-muted-foreground">Total Cost</th>
                        <th className="px-3 py-2 text-left text-muted-foreground">Confirmed At</th>
                        <th className="px-3 py-2 text-left text-muted-foreground">Confirmed By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issueHistory?.map((h, idx) => (
                        <tr key={h?.id} className={`border-b border-border ${
                          idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                        }`}>
                          <td className="px-3 py-2 font-mono text-primary">{h?.issue_no}</td>
                          <td className="px-3 py-2 tabular-nums">{h?.issue_date}</td>
                          <td className="px-3 py-2">{h?.issued_by || '—'}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{h?.total_items_issued ?? 0}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-medium">{fmt(h?.total_cost)}</td>
                          <td className="px-3 py-2 tabular-nums">{h?.confirmed_at ? new Date(h?.confirmed_at)?.toLocaleString() : '—'}</td>
                          <td className="px-3 py-2">{h?.confirmed_by || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
          <div className="text-sm font-semibold text-foreground">
            Total Cost: <span className="text-primary">{fmt(totalCost)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors">
              Close
            </button>
            {!isReadOnly && (
              <>
                <button onClick={handleSave} disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent disabled:opacity-60 transition-colors">
                  {isSaving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Save" size={14} />}
                  Save Draft
                </button>
                <button onClick={handleConfirmIssue} disabled={isConfirming || lineItems?.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors">
                  {isConfirming ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="CheckCircle" size={14} />}
                  Confirm Issue
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueMaterialsModal;
