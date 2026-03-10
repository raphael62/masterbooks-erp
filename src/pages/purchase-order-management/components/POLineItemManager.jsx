import React, { useState } from 'react';
import Button from '../../../components/ui/Button';

import Icon from '../../../components/AppIcon';

const POLineItemManager = ({ lineItems = [], onLineItemsUpdate }) => {
  const [editingId, setEditingId] = useState(null);

  const addLineItem = () => {
    const newItem = {
      id: `temp-${Date.now()}`,
      product_name: '',
      product_code: '',
      description: '',
      quantity: 1,
      unit_cost: 0,
      tax_rate: 0.125,
      discount_percent: 0,
      line_total: 0,
      delivery_date: ''
    };
    onLineItemsUpdate([...lineItems, newItem]);
    setEditingId(newItem?.id);
  };

  const updateLineItem = (id, field, value) => {
    const updated = lineItems?.map(item => {
      if (item?.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate line total
        const qty = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(updatedItem?.quantity) || 0;
        const cost = field === 'unit_cost' ? parseFloat(value) || 0 : parseFloat(updatedItem?.unit_cost) || 0;
        const discount = field === 'discount_percent' ? parseFloat(value) || 0 : parseFloat(updatedItem?.discount_percent) || 0;
        const gross = qty * cost;
        const discountAmt = (gross * discount) / 100;
        updatedItem.line_total = gross - discountAmt;
        return updatedItem;
      }
      return item;
    });
    onLineItemsUpdate(updated);
  };

  const removeLineItem = (id) => {
    onLineItemsUpdate(lineItems?.filter(item => item?.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Product</th>
              <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Code</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Qty</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Unit Cost</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Disc%</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Tax%</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Total</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lineItems?.map((item) => (
              <tr key={item?.id} className="group hover:bg-muted/30">
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={item?.product_name || ''}
                    onChange={(e) => updateLineItem(item?.id, 'product_name', e?.target?.value)}
                    placeholder="Product name"
                    className="w-full min-w-[120px] bg-transparent border-b border-transparent focus:border-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={item?.product_code || ''}
                    onChange={(e) => updateLineItem(item?.id, 'product_code', e?.target?.value)}
                    placeholder="Code"
                    className="w-20 bg-transparent border-b border-transparent focus:border-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    value={item?.quantity || ''}
                    onChange={(e) => updateLineItem(item?.id, 'quantity', e?.target?.value)}
                    min="0"
                    className="w-16 text-right bg-transparent border-b border-transparent focus:border-primary outline-none text-sm text-foreground"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    value={item?.unit_cost || ''}
                    onChange={(e) => updateLineItem(item?.id, 'unit_cost', e?.target?.value)}
                    min="0"
                    step="0.01"
                    className="w-24 text-right bg-transparent border-b border-transparent focus:border-primary outline-none text-sm text-foreground"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    value={item?.discount_percent || ''}
                    onChange={(e) => updateLineItem(item?.id, 'discount_percent', e?.target?.value)}
                    min="0"
                    max="100"
                    className="w-14 text-right bg-transparent border-b border-transparent focus:border-primary outline-none text-sm text-foreground"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    value={item?.tax_rate ? (item?.tax_rate * 100)?.toFixed(1) : ''}
                    onChange={(e) => updateLineItem(item?.id, 'tax_rate', parseFloat(e?.target?.value) / 100)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-14 text-right bg-transparent border-b border-transparent focus:border-primary outline-none text-sm text-foreground"
                  />
                </td>
                <td className="py-2 px-2 text-right font-medium text-foreground">
                  {(item?.line_total || 0)?.toFixed(2)}
                </td>
                <td className="py-2 px-2">
                  <button
                    onClick={() => removeLineItem(item?.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-500 transition-all"
                  >
                    <Icon name="Trash2" size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {lineItems?.map((item) => (
          <div key={item?.id} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between">
              <input
                type="text"
                value={item?.product_name || ''}
                onChange={(e) => updateLineItem(item?.id, 'product_name', e?.target?.value)}
                placeholder="Product name"
                className="flex-1 bg-transparent border-b border-border focus:border-primary outline-none text-sm font-medium text-foreground"
              />
              <button onClick={() => removeLineItem(item?.id)} className="ml-2 p-1 text-red-500">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Qty</label>
                <input
                  type="number"
                  value={item?.quantity || ''}
                  onChange={(e) => updateLineItem(item?.id, 'quantity', e?.target?.value)}
                  className="w-full border border-border rounded px-2 py-1 text-sm text-foreground bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Unit Cost</label>
                <input
                  type="number"
                  value={item?.unit_cost || ''}
                  onChange={(e) => updateLineItem(item?.id, 'unit_cost', e?.target?.value)}
                  className="w-full border border-border rounded px-2 py-1 text-sm text-foreground bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Total</label>
                <p className="text-sm font-medium text-foreground pt-1">{(item?.line_total || 0)?.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {lineItems?.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground">
          <Icon name="Package" size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No items added yet</p>
        </div>
      )}
      <Button variant="outline" size="sm" onClick={addLineItem} className="flex items-center space-x-2">
        <Icon name="Plus" size={16} />
        <span>Add Item</span>
      </Button>
    </div>
  );
};

export default POLineItemManager;
