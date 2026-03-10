import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import Icon from '../../../components/AppIcon';

const MOCK_CUSTOMERS = [
  { id: 'c1', customer_name: 'Kwame Asante Stores' },
  { id: 'c2', customer_name: 'Ama Boateng Enterprises' },
  { id: 'c3', customer_name: 'Kofi Mensah Trading' },
  { id: 'c4', customer_name: 'Abena Osei Distributors' },
];

const MOCK_ITEMS = [
  { id: 'rg1', item_name: 'Standard Bottle 33cl', item_type: 'Bottle', deposit_amount: 0.50 },
  { id: 'rg2', item_name: 'Standard Bottle 50cl', item_type: 'Bottle', deposit_amount: 0.75 },
  { id: 'rg3', item_name: 'Plastic Crate 24-slot', item_type: 'Crate', deposit_amount: 8.00 },
  { id: 'rg4', item_name: 'Plastic Crate 12-slot', item_type: 'Crate', deposit_amount: 5.00 },
  { id: 'rg5', item_name: 'Metal Keg 30L', item_type: 'Keg', deposit_amount: 45.00 },
];

const NewTransactionModal = ({ isOpen, onClose, onSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    customer_id: '',
    customer_name: '',
    item_id: '',
    item_name: '',
    item_type: '',
    quantity_given: '',
    deposit_amount: '',
    transaction_date: new Date()?.toISOString()?.split('T')?.[0],
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        customer_id: '',
        customer_name: '',
        item_id: '',
        item_name: '',
        item_type: '',
        quantity_given: '',
        deposit_amount: '',
        transaction_date: new Date()?.toISOString()?.split('T')?.[0],
        notes: '',
      });
      setErrors({});
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [custRes, itemRes] = await Promise.all([
        supabase?.from('customers')?.select('id, customer_name')?.order('customer_name'),
        supabase?.from('returnable_items')?.select('id, item_name, item_type, deposit_amount')?.order('item_name'),
      ]);
      setCustomers(custRes?.data?.length > 0 ? custRes?.data : MOCK_CUSTOMERS);
      setItems(itemRes?.data?.length > 0 ? itemRes?.data : MOCK_ITEMS);
    } catch {
      setCustomers(MOCK_CUSTOMERS);
      setItems(MOCK_ITEMS);
    }
  };

  const handleItemChange = (itemId) => {
    const item = items?.find(i => i?.id === itemId);
    const qty = parseFloat(form?.quantity_given) || 0;
    setForm(prev => ({
      ...prev,
      item_id: itemId,
      item_name: item?.item_name || '',
      item_type: item?.item_type || '',
      deposit_amount: item ? (parseFloat(item?.deposit_amount) * qty)?.toFixed(2) : '',
    }));
  };

  const handleQtyChange = (qty) => {
    const item = items?.find(i => i?.id === form?.item_id);
    setForm(prev => ({
      ...prev,
      quantity_given: qty,
      deposit_amount: item && qty ? (parseFloat(item?.deposit_amount) * parseFloat(qty))?.toFixed(2) : prev?.deposit_amount,
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form?.customer_id) errs.customer_id = 'Customer is required';
    if (!form?.item_id) errs.item_id = 'Item is required';
    if (!form?.quantity_given || parseFloat(form?.quantity_given) <= 0) errs.quantity_given = 'Valid quantity required';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs)?.length > 0) { setErrors(errs); return; }
    setIsSaving(true);
    try {
      const payload = {
        customer_id: form?.customer_id,
        customer_name: form?.customer_name,
        item_id: form?.item_id,
        item_name: form?.item_name,
        item_type: form?.item_type,
        quantity_given: parseInt(form?.quantity_given),
        quantity_returned: 0,
        balance: parseInt(form?.quantity_given),
        deposit_amount: parseFloat(form?.deposit_amount) || 0,
        transaction_date: form?.transaction_date,
        notes: form?.notes || null,
        status: 'outstanding',
      };
      const { error } = await supabase?.from('returnable_transactions')?.insert([payload]);
      if (error) throw error;
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setErrors({ submit: err?.message || 'Failed to save transaction' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedItem = items?.find(i => i?.id === form?.item_id);

  return (
    <div className="fixed inset-0 bg-black/50 z-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, white)' }}>
              <Icon name="PackagePlus" size={16} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">New Transaction</h2>
              <p className="text-xs text-gray-500">Record glass items given to customer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Icon name="X" size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          {errors?.submit && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{errors?.submit}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Customer <span className="text-red-500">*</span></label>
            <select
              value={form?.customer_id}
              onChange={e => {
                const c = customers?.find(x => x?.id === e?.target?.value);
                setForm(prev => ({ ...prev, customer_id: e?.target?.value, customer_name: c?.customer_name || '' }));
                if (errors?.customer_id) setErrors(prev => ({ ...prev, customer_id: null }));
              }}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${errors?.customer_id ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">Select customer...</option>
              {customers?.map(c => <option key={c?.id} value={c?.id}>{c?.customer_name}</option>)}
            </select>
            {errors?.customer_id && <p className="text-xs text-red-500 mt-0.5">{errors?.customer_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Item <span className="text-red-500">*</span></label>
              <select
                value={form?.item_id}
                onChange={e => { handleItemChange(e?.target?.value); if (errors?.item_id) setErrors(prev => ({ ...prev, item_id: null })); }}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${errors?.item_id ? 'border-red-400' : 'border-gray-300'}`}
              >
                <option value="">Select item...</option>
                {items?.map(i => <option key={i?.id} value={i?.id}>{i?.item_name}</option>)}
              </select>
              {errors?.item_id && <p className="text-xs text-red-500 mt-0.5">{errors?.item_id}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quantity Given <span className="text-red-500">*</span></label>
              <input
                type="number" min="1" step="1"
                value={form?.quantity_given}
                onChange={e => { handleQtyChange(e?.target?.value); if (errors?.quantity_given) setErrors(prev => ({ ...prev, quantity_given: null })); }}
                placeholder="0"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${errors?.quantity_given ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors?.quantity_given && <p className="text-xs text-red-500 mt-0.5">{errors?.quantity_given}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Date</label>
              <input
                type="date"
                value={form?.transaction_date}
                onChange={e => setForm(prev => ({ ...prev, transaction_date: e?.target?.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Deposit Amount (GHS)</label>
              <input
                type="number" min="0" step="0.01"
                value={form?.deposit_amount}
                onChange={e => setForm(prev => ({ ...prev, deposit_amount: e?.target?.value }))}
                placeholder="Auto-calculated"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {selectedItem && form?.quantity_given && (
            <div className="p-3 rounded-lg border" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 5%, white)', borderColor: 'color-mix(in srgb, var(--color-primary) 30%, white)' }}>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Unit Deposit:</span>
                <span className="font-medium">GHS {parseFloat(selectedItem?.deposit_amount)?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-600">Total Deposit:</span>
                <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                  GHS {(parseFloat(selectedItem?.deposit_amount) * parseFloat(form?.quantity_given || 0))?.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form?.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e?.target?.value }))}
              placeholder="Optional notes..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {isSaving ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving...</> : <><Icon name="Save" size={14} />Save Transaction</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewTransactionModal;