import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import POLineItemManager from './POLineItemManager';
import { supabase } from '../../../lib/supabase';

const POFormPanel = ({ poData, onPOUpdate, onPreview, isOffline, onSaved }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data } = await supabase?.from('suppliers')?.select('id, supplier_name, supplier_code')?.eq('status', 'Active');
      setSuppliers(data || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  const handleFieldChange = (field, value) => {
    onPOUpdate({ [field]: value });
  };

  const handleSupplierChange = (supplierId) => {
    const supplier = suppliers?.find(s => s?.id === supplierId);
    onPOUpdate({
      supplier_id: supplierId,
      supplier_name: supplier?.supplier_name || ''
    });
  };

  const handleLineItemsUpdate = (lineItems) => {
    const subtotal = lineItems?.reduce((sum, item) => sum + (item?.line_total || 0), 0);
    const taxAmount = lineItems?.reduce((sum, item) => {
      const net = item?.line_total || 0;
      return sum + (net * (item?.tax_rate || 0));
    }, 0);
    onPOUpdate({
      lineItems,
      subtotal,
      tax_amount: taxAmount,
      total_amount: subtotal + taxAmount
    });
  };

  const generatePONumber = () => {
    const date = new Date();
    const year = date?.getFullYear();
    const month = String(date?.getMonth() + 1)?.padStart(2, '0');
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `PO-${year}${month}-${rand}`;
  };

  const handleSave = async (status = 'draft') => {
    if (!poData?.supplier_id) {
      setSaveError('Please select a supplier before saving.');
      return;
    }
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const poNumber = poData?.po_number || generatePONumber();
      const poPayload = {
        po_number: poNumber,
        supplier_id: poData?.supplier_id,
        supplier_name: poData?.supplier_name,
        status,
        order_date: poData?.order_date || new Date()?.toISOString()?.split('T')?.[0],
        expected_delivery_date: poData?.expected_delivery_date || null,
        delivery_address: poData?.delivery_address || null,
        subtotal: poData?.subtotal || 0,
        tax_amount: poData?.tax_amount || 0,
        total_amount: poData?.total_amount || 0,
        notes: poData?.notes || null,
        updated_at: new Date()?.toISOString()
      };

      let savedPO;
      if (poData?.id && !poData?.id?.startsWith('new')) {
        const { data, error } = await supabase?.from('purchase_orders')?.update(poPayload)?.eq('id', poData?.id)?.select()?.single();
        if (error) throw error;
        savedPO = data;
      } else {
        const { data, error } = await supabase?.from('purchase_orders')?.insert(poPayload)?.select()?.single();
        if (error) throw error;
        savedPO = data;
      }

      // Save line items
      if (savedPO?.id && poData?.lineItems?.length > 0) {
        // Delete existing items first
        await supabase?.from('purchase_order_items')?.delete()?.eq('purchase_order_id', savedPO?.id);
        // Insert new items
        const itemsPayload = poData?.lineItems?.map(item => ({
          purchase_order_id: savedPO?.id,
          product_name: item?.product_name,
          product_code: item?.product_code || null,
          description: item?.description || null,
          quantity: parseFloat(item?.quantity) || 0,
          unit_cost: parseFloat(item?.unit_cost) || 0,
          tax_rate: parseFloat(item?.tax_rate) || 0,
          discount_percent: parseFloat(item?.discount_percent) || 0,
          line_total: parseFloat(item?.line_total) || 0,
          delivery_date: item?.delivery_date || null
        }));
        await supabase?.from('purchase_order_items')?.insert(itemsPayload);
      }

      setSaveSuccess(true);
      onPOUpdate({ ...poData, ...savedPO, po_number: savedPO?.po_number });
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err?.message);
    } finally {
      setSaving(false);
    }
  };

  const supplierOptions = [
    { value: '', label: 'Select Supplier...' },
    ...suppliers?.map(s => ({ value: s?.id, label: s?.supplier_name }))
  ];

  const totals = {
    subtotal: poData?.subtotal || 0,
    tax: poData?.tax_amount || 0,
    total: poData?.total_amount || 0
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {poData?.id && !poData?.id?.startsWith('new') ? `Edit ${poData?.po_number}` : 'New Purchase Order'}
          </h2>
          <p className="text-sm text-muted-foreground">Fill in procurement details</p>
        </div>
        <div className="flex items-center space-x-2">
          {isOffline && (
            <span className="flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              <Icon name="WifiOff" size={12} />
              <span>Offline</span>
            </span>
          )}
          <Button variant="outline" size="sm" onClick={onPreview}>
            <Icon name="Eye" size={16} className="mr-1" />
            Preview
          </Button>
        </div>
      </div>
      {/* Form */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Supplier & PO Info */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center space-x-2">
              <Icon name="Building2" size={18} className="text-primary" />
              <span>Supplier & Order Info</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Supplier *</label>
                <Select
                  value={poData?.supplier_id || ''}
                  onValueChange={handleSupplierChange}
                  options={supplierOptions}
                />
              </div>
              <Input
                label="PO Number"
                value={poData?.po_number || ''}
                onChange={(e) => handleFieldChange('po_number', e?.target?.value)}
                placeholder="Auto-generated"
              />
              <Input
                label="Order Date"
                type="date"
                value={poData?.order_date || new Date()?.toISOString()?.split('T')?.[0]}
                onChange={(e) => handleFieldChange('order_date', e?.target?.value)}
              />
              <Input
                label="Expected Delivery Date"
                type="date"
                value={poData?.expected_delivery_date || ''}
                onChange={(e) => handleFieldChange('expected_delivery_date', e?.target?.value)}
              />
              <div className="md:col-span-2">
                <Input
                  label="Delivery Address"
                  value={poData?.delivery_address || ''}
                  onChange={(e) => handleFieldChange('delivery_address', e?.target?.value)}
                  placeholder="Delivery location"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center space-x-2">
              <Icon name="Package" size={18} className="text-primary" />
              <span>Line Items</span>
            </h3>
            <POLineItemManager
              lineItems={poData?.lineItems || []}
              onLineItemsUpdate={handleLineItemsUpdate}
            />
          </div>

          {/* Totals */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">Order Summary</h3>
            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal:</span>
                <span>GHS {totals?.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax:</span>
                <span>GHS {totals?.tax?.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-base font-bold text-foreground">
                <span>Total:</span>
                <span>GHS {totals?.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-base font-semibold text-foreground mb-3">Notes & Terms</h3>
            <textarea
              value={poData?.notes || ''}
              onChange={(e) => handleFieldChange('notes', e?.target?.value)}
              placeholder="Add notes, terms, or special instructions..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Error / Success */}
          {saveError && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm">
              <Icon name="AlertCircle" size={16} />
              <span>{saveError}</span>
            </div>
          )}
          {saveSuccess && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm">
              <Icon name="CheckCircle" size={16} />
              <span>Purchase order saved successfully!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pb-4">
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={saving || isOffline}
              className="flex items-center space-x-2"
            >
              {saving ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Save" size={16} />}
              <span>Save Draft</span>
            </Button>
            <Button
              onClick={() => handleSave('sent')}
              disabled={saving || !poData?.supplier_id}
              className="flex items-center space-x-2"
            >
              <Icon name="Send" size={16} />
              <span>Send to Supplier</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave('confirmed')}
              disabled={saving || !poData?.supplier_id}
              className="flex items-center space-x-2"
            >
              <Icon name="CheckCircle" size={16} />
              <span>Confirm PO</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POFormPanel;
