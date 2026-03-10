import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';

const EMPTY_ITEM = { line_no: 1, material_code: '', material_name: '', uom: 'Units', quantity_required: 0, waste_factor: 0, adjusted_qty: 0, unit_cost: 0, total_cost: 0 };

const BOMModal = ({ isOpen, onClose, bom, products, onSave, isVersionPrompt }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [versionHistory, setVersionHistory] = useState([]);
  const [form, setForm] = useState({
    bom_code: '', product_id: '', product_name: '', product_code: '',
    version: '1.0', effective_date: '', expiry_date: '',
    labor_cost: 0, overhead_cost: 0, notes: '', status: 'Draft'
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  const generateBOMCode = () => {
    const yr = new Date()?.getFullYear();
    const rnd = Math.floor(1000 + Math.random() * 9000);
    return `BOM-${yr}-${rnd}`;
  };

  const calcTotalMaterialCost = (rows) =>
    rows?.reduce((s, r) => s + (parseFloat(r?.total_cost) || 0), 0);

  useEffect(() => {
    if (!isOpen) return;
    if (bom) {
      setForm({
        bom_code: bom?.bom_code || '',
        product_id: bom?.product_id || '',
        product_name: bom?.product_name || '',
        product_code: bom?.product_code || '',
        version: bom?.version || '1.0',
        effective_date: bom?.effective_date || '',
        expiry_date: bom?.expiry_date || '',
        labor_cost: bom?.labor_cost || 0,
        overhead_cost: bom?.overhead_cost || 0,
        notes: bom?.notes || '',
        status: bom?.status || 'Draft'
      });
      fetchBOMItems(bom?.id);
      if (bom?.product_id) fetchVersionHistory(bom?.product_id, bom?.id);
    } else {
      setForm(f => ({ ...f, bom_code: generateBOMCode(), version: '1.0', status: 'Draft', product_id: '', product_name: '', product_code: '', effective_date: '', expiry_date: '', labor_cost: 0, overhead_cost: 0, notes: '' }));
      setItems([{ ...EMPTY_ITEM }]);
      setVersionHistory([]);
    }
    setActiveTab('details');
    setError(null);
  }, [isOpen, bom]);

  const fetchBOMItems = async (bomId) => {
    try {
      const { data } = await supabase?.from('bom_items')?.select('*')?.eq('bom_header_id', bomId)?.order('sort_order');
      setItems(data?.length > 0 ? data : [{ ...EMPTY_ITEM }]);
    } catch (e) { console.error(e); }
  };

  const fetchVersionHistory = async (productId, currentId) => {
    try {
      const { data } = await supabase?.from('bom_headers')?.select('id, bom_code, version, effective_date, status, created_by, created_at')?.eq('product_id', productId)?.neq('id', currentId)?.order('created_at', { ascending: false });
      setVersionHistory(data || []);
    } catch (e) { console.error(e); }
  };

  const handleProductChange = (e) => {
    const pid = e?.target?.value;
    const prod = products?.find(p => p?.id === pid);
    setForm(f => ({ ...f, product_id: pid, product_name: prod?.product_name || '', product_code: prod?.product_code || '' }));
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated?.[idx], [field]: value };
      const row = updated?.[idx];
      const qty = parseFloat(row?.quantity_required) || 0;
      const waste = parseFloat(row?.waste_factor) || 0;
      const adjQty = qty * (1 + waste / 100);
      const unitCost = parseFloat(row?.unit_cost) || 0;
      updated[idx].adjusted_qty = parseFloat(adjQty?.toFixed(4));
      updated[idx].total_cost = parseFloat((adjQty * unitCost)?.toFixed(4));
      return updated;
    });
  };

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM, line_no: prev?.length + 1 }]);
  const removeItem = (idx) => setItems(prev => prev?.filter((_, i) => i !== idx)?.map((r, i) => ({ ...r, line_no: i + 1 })));

  const totalMaterialCost = calcTotalMaterialCost(items);
  const laborCost = parseFloat(form?.labor_cost) || 0;
  const overheadCost = parseFloat(form?.overhead_cost) || 0;
  const totalCost = totalMaterialCost + laborCost + overheadCost;

  const handleSave = async () => {
    if (!form?.product_name) { setError('Product is required'); return; }
    setIsSaving(true);
    setError(null);
    try {
      await onSave?.(
        { ...form, total_material_cost: totalMaterialCost, total_cost: totalCost },
        items?.filter(i => i?.material_name)
      );
      onClose();
    } catch (e) {
      setError(e?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const fmt = (n) => Number(n || 0)?.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-primary text-primary-foreground rounded-t-xl">
          <div className="flex items-center gap-2">
            <Icon name="FileText" size={18} />
            <h2 className="font-semibold text-base">{bom ? `Edit BOM — ${bom?.bom_code}` : 'New Bill of Materials'}</h2>
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
              {tab === 'details' ? 'BOM Details' : tab === 'ingredients' ? 'Ingredients / Recipe' : 'Version History'}
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">BOM Code *</label>
                <input className="w-full h-8 px-2.5 text-sm border border-border rounded-lg bg-muted/30 font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form?.bom_code} readOnly />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Product *</label>
                <select className="w-full h-8 px-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form?.product_id} onChange={handleProductChange}>
                  <option value="">— Select Product —</option>
                  {products?.map(p => <option key={p?.id} value={p?.id}>{p?.product_code} — {p?.product_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Version</label>
                <input className="w-full h-8 px-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form?.version} onChange={e => setForm(f => ({...f, version: e?.target?.value}))} placeholder="1.0" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Effective Date</label>
                <input type="date" className="w-full h-8 px-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form?.effective_date} onChange={e => setForm(f => ({...f, effective_date: e?.target?.value}))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Expiry Date</label>
                <input type="date" className="w-full h-8 px-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form?.expiry_date} onChange={e => setForm(f => ({...f, expiry_date: e?.target?.value}))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Labor Cost (GHS)</label>
                <input type="number" min="0" step="0.01" className="w-full h-8 px-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                  value={form?.labor_cost} onChange={e => setForm(f => ({...f, labor_cost: e?.target?.value}))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Overhead Cost (GHS)</label>
                <input type="number" min="0" step="0.01" className="w-full h-8 px-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                  value={form?.overhead_cost} onChange={e => setForm(f => ({...f, overhead_cost: e?.target?.value}))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <select className="w-full h-8 px-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form?.status} onChange={e => setForm(f => ({...f, status: e?.target?.value}))}>
                  <option>Draft</option>
                  <option>Active</option>
                  <option>Archived</option>
                </select>
              </div>
              <div className="col-span-3">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                <textarea rows={2} className="w-full px-2.5 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  value={form?.notes} onChange={e => setForm(f => ({...f, notes: e?.target?.value}))} placeholder="Additional notes..." />
              </div>
              {/* Cost Summary */}
              <div className="col-span-3 grid grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Material Cost</div>
                  <div className="text-sm font-bold tabular-nums text-foreground">GHS {fmt(totalMaterialCost)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Labor Cost</div>
                  <div className="text-sm font-bold tabular-nums text-foreground">GHS {fmt(laborCost)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Overhead Cost</div>
                  <div className="text-sm font-bold tabular-nums text-foreground">GHS {fmt(overheadCost)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Total Cost</div>
                  <div className="text-base font-bold tabular-nums text-primary">GHS {fmt(totalCost)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Ingredients Tab */}
          {activeTab === 'ingredients' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Recipe / Ingredients</h3>
                <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                  <Icon name="Plus" size={13} />Add Row
                </button>
              </div>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-10 px-2 py-2 text-center text-muted-foreground">Line</th>
                      <th className="w-24 px-2 py-2 text-left text-muted-foreground">Mat. Code</th>
                      <th className="w-40 px-2 py-2 text-left text-muted-foreground">Ingredient Name *</th>
                      <th className="w-20 px-2 py-2 text-left text-muted-foreground">UOM</th>
                      <th className="w-24 px-2 py-2 text-right text-muted-foreground">Qty Required</th>
                      <th className="w-20 px-2 py-2 text-right text-muted-foreground">Waste %</th>
                      <th className="w-24 px-2 py-2 text-right text-muted-foreground">Adj. Qty</th>
                      <th className="w-24 px-2 py-2 text-right text-muted-foreground">Unit Cost</th>
                      <th className="w-24 px-2 py-2 text-right text-muted-foreground">Total Cost</th>
                      <th className="w-8 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {items?.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                        <td className="px-2 py-1 text-center text-muted-foreground tabular-nums">{idx + 1}</td>
                        <td className="px-1 py-1">
                          <input className="w-full h-6 px-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            value={item?.material_code} onChange={e => updateItem(idx, 'material_code', e?.target?.value)} placeholder="MAT-001" />
                        </td>
                        <td className="px-1 py-1">
                          <input className="w-full h-6 px-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            value={item?.material_name} onChange={e => updateItem(idx, 'material_name', e?.target?.value)} placeholder="Ingredient name" />
                        </td>
                        <td className="px-1 py-1">
                          <input className="w-full h-6 px-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            value={item?.uom} onChange={e => updateItem(idx, 'uom', e?.target?.value)} placeholder="Units" />
                        </td>
                        <td className="px-1 py-1">
                          <input type="number" min="0" step="0.001" className="w-full h-6 px-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary text-right tabular-nums"
                            value={item?.quantity_required} onChange={e => updateItem(idx, 'quantity_required', e?.target?.value)} />
                        </td>
                        <td className="px-1 py-1">
                          <input type="number" min="0" max="100" step="0.1" className="w-full h-6 px-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary text-right tabular-nums"
                            value={item?.waste_factor} onChange={e => updateItem(idx, 'waste_factor', e?.target?.value)} />
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums text-muted-foreground">{Number(item?.adjusted_qty || 0)?.toFixed(3)}</td>
                        <td className="px-1 py-1">
                          <input type="number" min="0" step="0.01" className="w-full h-6 px-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary text-right tabular-nums"
                            value={item?.unit_cost} onChange={e => updateItem(idx, 'unit_cost', e?.target?.value)} />
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums font-medium">{Number(item?.total_cost || 0)?.toFixed(2)}</td>
                        <td className="px-1 py-1 text-center">
                          <button onClick={() => removeItem(idx)} className="p-0.5 text-red-500 hover:text-red-700 rounded">
                            <Icon name="Trash2" size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t border-border">
                    <tr>
                      <td colSpan={8} className="px-2 py-2 text-xs font-semibold text-right text-muted-foreground">Total Material Cost:</td>
                      <td className="px-2 py-2 text-right tabular-nums text-sm font-bold text-primary">{fmt(totalMaterialCost)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Version History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Version History for {form?.product_name || 'this product'}</h3>
              {versionHistory?.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Icon name="History" size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No previous versions found</p>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-muted-foreground">BOM Code</th>
                        <th className="px-3 py-2 text-left text-muted-foreground">Version</th>
                        <th className="px-3 py-2 text-left text-muted-foreground">Effective Date</th>
                        <th className="px-3 py-2 text-left text-muted-foreground">Created By</th>
                        <th className="px-3 py-2 text-left text-muted-foreground">Status</th>
                        <th className="px-3 py-2 text-left text-muted-foreground">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {versionHistory?.map((v, i) => (
                        <tr key={v?.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                          <td className="px-3 py-2 font-mono text-primary">{v?.bom_code}</td>
                          <td className="px-3 py-2 tabular-nums">{v?.version}</td>
                          <td className="px-3 py-2">{v?.effective_date || '—'}</td>
                          <td className="px-3 py-2">{v?.created_by || '—'}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              v?.status === 'Active' ? 'bg-green-100 text-green-800' :
                              v?.status === 'Archived'? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-800'
                            }`}>{v?.status}</span>
                          </td>
                          <td className="px-3 py-2">{v?.created_at ? new Date(v.created_at)?.toLocaleDateString() : '—'}</td>
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
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors">
            {isSaving ? <><Icon name="Loader2" size={14} className="animate-spin" />Saving...</> : <><Icon name="Save" size={14} />Save BOM</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BOMModal;
