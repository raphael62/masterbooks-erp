import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const EMPTY_BOM_ROW = { material_code: '', material_name: '', required_qty: '', uom: 'Units', unit_cost: '', total_cost: 0 };

const ProductionOrderModal = ({ isOpen, onClose, order, products, locations, executives, onSave }) => {
  const today = new Date();
  const dateStr = today?.toISOString()?.split('T')?.[0];
  const autoOrderNo = `PO-${dateStr}-${String(Math.floor(Math.random() * 900) + 100)}`;

  const [form, setForm] = useState({
    order_no: autoOrderNo,
    product_id: '',
    product_name: '',
    product_code: '',
    planned_qty: '',
    actual_qty: '',
    uom: 'Units',
    pack_unit: 1,
    start_date: dateStr,
    end_date: '',
    location_id: '',
    location_name: '',
    assigned_to: '',
    status: 'Planned',
    notes: '',
    labor_cost: '',
    overhead_cost: '',
    packaging_cost: '',
  });
  const [bomRows, setBomRows] = useState([{ ...EMPTY_BOM_ROW }]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (order) {
      setForm({
        order_no: order?.order_no || autoOrderNo,
        product_id: order?.product_id || '',
        product_name: order?.product_name || '',
        product_code: order?.product_code || '',
        planned_qty: order?.planned_qty || '',
        actual_qty: order?.actual_qty || '',
        uom: order?.uom || 'Units',
        pack_unit: order?.pack_unit || 1,
        start_date: order?.start_date || dateStr,
        end_date: order?.end_date || '',
        location_id: order?.location_id || '',
        location_name: order?.location_name || '',
        assigned_to: order?.assigned_to || '',
        status: order?.status || 'Planned',
        notes: order?.notes || '',
        labor_cost: order?.labor_cost || '',
        overhead_cost: order?.overhead_cost || '',
        packaging_cost: order?.packaging_cost || '',
      });
      setBomRows(order?.bom_items?.length ? order?.bom_items?.map(i => ({ ...i })) : [{ ...EMPTY_BOM_ROW }]);
    } else {
      setForm(prev => ({ ...prev, order_no: autoOrderNo }));
      setBomRows([{ ...EMPTY_BOM_ROW }]);
    }
  }, [order, isOpen]);

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'product_id') {
        const prod = products?.find(p => p?.id === value);
        updated.product_name = prod?.product_name || '';
        updated.product_code = prod?.product_code || '';
        updated.uom = prod?.unit_of_measure || 'Units';
        updated.pack_unit = prod?.pack_unit || 1;
      }
      if (field === 'location_id') {
        const loc = locations?.find(l => l?.id === value);
        updated.location_name = loc?.name || '';
      }
      return updated;
    });
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleBomChange = (idx, field, value) => {
    setBomRows(prev => {
      const rows = [...prev];
      rows[idx] = { ...rows?.[idx], [field]: value };
      if (field === 'required_qty' || field === 'unit_cost') {
        const qty = parseFloat(field === 'required_qty' ? value : rows?.[idx]?.required_qty) || 0;
        const cost = parseFloat(field === 'unit_cost' ? value : rows?.[idx]?.unit_cost) || 0;
        rows[idx].total_cost = qty * cost;
      }
      return rows;
    });
  };

  const addBomRow = () => setBomRows(prev => [...prev, { ...EMPTY_BOM_ROW }]);
  const removeBomRow = (idx) => setBomRows(prev => prev?.filter((_, i) => i !== idx));

  const totalMaterialCost = bomRows?.reduce((sum, r) => sum + (parseFloat(r?.total_cost) || 0), 0);
  const totalCost = totalMaterialCost + (parseFloat(form?.labor_cost) || 0) + (parseFloat(form?.overhead_cost) || 0) + (parseFloat(form?.packaging_cost) || 0);

  const validate = () => {
    const errs = {};
    if (!form?.product_name?.trim()) errs.product_name = 'Product is required';
    if (!form?.planned_qty || isNaN(parseFloat(form?.planned_qty))) errs.planned_qty = 'Planned qty required';
    if (!form?.start_date) errs.start_date = 'Start date required';
    setErrors(errs);
    return Object.keys(errs)?.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const validBom = bomRows?.filter(r => r?.material_name?.trim());
      await onSave?.({ ...form, total_material_cost: totalMaterialCost, total_cost: totalCost }, validBom);
      onClose?.();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">{order ? 'Edit Production Order' : 'New Production Order'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{form?.order_no}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Order No</label>
              <input
                type="text"
                value={form?.order_no}
                readOnly
                className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Product <span className="text-red-500">*</span></label>
              <select
                value={form?.product_id}
                onChange={e => handleChange('product_id', e?.target?.value)}
                className={`w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary ${errors?.product_name ? 'border-red-500' : 'border-border'}`}
              >
                <option value="">Select product...</option>
                {products?.map(p => (
                  <option key={p?.id} value={p?.id}>{p?.product_code} - {p?.product_name}</option>
                ))}
              </select>
              {!form?.product_id && (
                <input
                  type="text"
                  placeholder="Or type product name"
                  value={form?.product_name}
                  onChange={e => handleChange('product_name', e?.target?.value)}
                  className={`mt-1 w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary ${errors?.product_name ? 'border-red-500' : 'border-border'}`}
                />
              )}
              {errors?.product_name && <p className="text-xs text-red-500 mt-1">{errors?.product_name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Planned Qty <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form?.planned_qty}
                onChange={e => handleChange('planned_qty', e?.target?.value)}
                className={`w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary ${errors?.planned_qty ? 'border-red-500' : 'border-border'}`}
                placeholder="0"
              />
              {errors?.planned_qty && <p className="text-xs text-red-500 mt-1">{errors?.planned_qty}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Actual Qty</label>
              <input
                type="number"
                value={form?.actual_qty}
                onChange={e => handleChange('actual_qty', e?.target?.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">UOM</label>
              <input
                type="text"
                value={form?.uom}
                onChange={e => handleChange('uom', e?.target?.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Pack Unit</label>
              <input
                type="number"
                value={form?.pack_unit}
                onChange={e => handleChange('pack_unit', e?.target?.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form?.start_date}
                onChange={e => handleChange('start_date', e?.target?.value)}
                className={`w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary ${errors?.start_date ? 'border-red-500' : 'border-border'}`}
              />
              {errors?.start_date && <p className="text-xs text-red-500 mt-1">{errors?.start_date}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">End Date</label>
              <input
                type="date"
                value={form?.end_date}
                onChange={e => handleChange('end_date', e?.target?.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Location</label>
              <select
                value={form?.location_id}
                onChange={e => handleChange('location_id', e?.target?.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select location...</option>
                {locations?.map(l => (
                  <option key={l?.id} value={l?.id}>{l?.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Assigned To</label>
              <select
                value={form?.assigned_to}
                onChange={e => handleChange('assigned_to', e?.target?.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select executive...</option>
                {executives?.map(e => (
                  <option key={e?.id} value={e?.full_name}>{e?.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select
                value={form?.status}
                onChange={e => handleChange('status', e?.target?.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {['Planned', 'In Progress', 'Completed', 'On Hold']?.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
              <textarea
                value={form?.notes}
                onChange={e => handleChange('notes', e?.target?.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                placeholder="Optional notes..."
              />
            </div>
          </div>

          {/* Cost Fields */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon name="DollarSign" size={14} className="text-primary" />
              Additional Costs (GHS)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[['labor_cost', 'Labor Cost'], ['overhead_cost', 'Overhead Cost'], ['packaging_cost', 'Packaging Cost']]?.map(([field, label]) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
                  <input
                    type="number"
                    value={form?.[field]}
                    onChange={e => handleChange(field, e?.target?.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bill of Materials */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Icon name="List" size={14} className="text-primary" />
                Bill of Materials
              </h3>
              <button
                onClick={addBomRow}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Icon name="Plus" size={12} />
                Add Row
              </button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-primary/10">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Material Code</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Material Name</th>
                    <th className="px-3 py-2 text-right font-semibold text-foreground">Req. Qty</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">UOM</th>
                    <th className="px-3 py-2 text-right font-semibold text-foreground">Unit Cost</th>
                    <th className="px-3 py-2 text-right font-semibold text-foreground">Total Cost</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {bomRows?.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row?.material_code}
                          onChange={e => handleBomChange(idx, 'material_code', e?.target?.value)}
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-border focus:border-primary rounded focus:outline-none"
                          placeholder="Code"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row?.material_name}
                          onChange={e => handleBomChange(idx, 'material_name', e?.target?.value)}
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-border focus:border-primary rounded focus:outline-none"
                          placeholder="Material name"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          value={row?.required_qty}
                          onChange={e => handleBomChange(idx, 'required_qty', e?.target?.value)}
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-border focus:border-primary rounded focus:outline-none text-right tabular-nums"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row?.uom}
                          onChange={e => handleBomChange(idx, 'uom', e?.target?.value)}
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-border focus:border-primary rounded focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          value={row?.unit_cost}
                          onChange={e => handleBomChange(idx, 'unit_cost', e?.target?.value)}
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-border focus:border-primary rounded focus:outline-none text-right tabular-nums"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-2 py-1 text-right tabular-nums text-foreground font-medium">
                        {(parseFloat(row?.total_cost) || 0)?.toFixed(2)}
                      </td>
                      <td className="px-2 py-1">
                        {bomRows?.length > 1 && (
                          <button onClick={() => removeBomRow(idx)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors">
                            <Icon name="Trash2" size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-primary/10 border-t border-border">
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-right text-xs font-semibold text-foreground">Material Total:</td>
                    <td className="px-3 py-2 text-right text-xs font-bold text-foreground tabular-nums">{totalMaterialCost?.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-right text-xs font-bold text-primary">Grand Total Cost:</td>
                    <td className="px-3 py-2 text-right text-xs font-bold text-primary tabular-nums">{totalCost?.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Icon name="Loader2" size={14} className="animate-spin" />}
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductionOrderModal;
