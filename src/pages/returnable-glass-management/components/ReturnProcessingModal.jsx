import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import Icon from '../../../components/AppIcon';

const ReturnProcessingModal = ({ isOpen, transaction, onClose, onSuccess }) => {
  const [quantityReturned, setQuantityReturned] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuantityReturned('');
      setError('');
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const maxReturn = (transaction?.balance || 0);
  const returnQty = parseFloat(quantityReturned) || 0;
  const depositPerUnit = maxReturn > 0 ? (parseFloat(transaction?.deposit_amount || 0) / (transaction?.quantity_given || 1)) : 0;
  const refundAmount = returnQty * depositPerUnit;
  const newBalance = maxReturn - returnQty;

  const handleSave = async () => {
    if (!quantityReturned || returnQty <= 0) { setError('Enter a valid return quantity'); return; }
    if (returnQty > maxReturn) { setError(`Cannot exceed balance of ${maxReturn}`); return; }
    setIsSaving(true);
    try {
      const newReturned = (transaction?.quantity_returned || 0) + returnQty;
      const newBal = (transaction?.quantity_given || 0) - newReturned;
      const newDeposit = newBal * depositPerUnit;
      const newStatus = newBal <= 0 ? 'fully_returned' : 'partial_return';
      const { error: err } = await supabase?.from('returnable_transactions')?.update({
        quantity_returned: newReturned,
        balance: newBal,
        deposit_amount: newDeposit,
        status: newStatus,
      })?.eq('id', transaction?.id);
      if (err) throw err;
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Failed to process return');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100">
              <Icon name="PackageCheck" size={16} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Process Return</h2>
              <p className="text-xs text-gray-500">{transaction?.customer_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Icon name="X" size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{error}</div>}

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Item:</span>
              <span className="font-medium text-gray-800">{transaction?.item_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Originally Given:</span>
              <span className="font-medium">{transaction?.quantity_given}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Already Returned:</span>
              <span className="font-medium">{transaction?.quantity_returned || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Outstanding Balance:</span>
              <span className="font-semibold text-orange-600">{maxReturn}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity Being Returned <span className="text-red-500">*</span></label>
            <input
              type="number" min="1" max={maxReturn} step="1"
              value={quantityReturned}
              onChange={e => { setQuantityReturned(e?.target?.value); setError(''); }}
              placeholder={`Max: ${maxReturn}`}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {returnQty > 0 && returnQty <= maxReturn && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Deposit Refund:</span>
                <span className="font-semibold text-emerald-700">GHS {refundAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New Balance:</span>
                <span className="font-semibold">{newBalance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status after return:</span>
                <span className={`font-semibold ${newBalance <= 0 ? 'text-emerald-700' : 'text-orange-600'}`}>
                  {newBalance <= 0 ? 'Fully Returned' : 'Partial Return'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? 'Processing...' : <><Icon name="Check" size={14} />Process Return</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnProcessingModal;