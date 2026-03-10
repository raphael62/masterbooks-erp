import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const StockTransferModal = ({ isOpen, onClose, product, locations, onTransfer }) => {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!fromLocation) { setError('Please select source location'); return; }
    if (!toLocation) { setError('Please select destination location'); return; }
    if (fromLocation === toLocation) { setError('Source and destination must be different'); return; }
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) { setError('Please enter a valid quantity'); return; }

    setIsSubmitting(true);
    try {
      await onTransfer?.({ fromLocation, toLocation, quantity: qty, notes, product });
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Icon name="ArrowRightLeft" size={16} className="text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-800">Stock Transfer</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Product Info */}
        {product && (
          <div className="px-5 py-2 bg-blue-50 border-b border-blue-100">
            <div className="text-xs text-blue-700 font-medium">{product?.product_code} — {product?.product_name}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              <Icon name="AlertCircle" size={13} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Location *</label>
            <select
              value={fromLocation}
              onChange={e => setFromLocation(e?.target?.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select source location</option>
              {locations?.map(loc => (
                <option key={loc?.id} value={loc?.id}>{loc?.location_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To Location *</label>
            <select
              value={toLocation}
              onChange={e => setToLocation(e?.target?.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select destination location</option>
              {locations?.map(loc => (
                <option key={loc?.id} value={loc?.id}>{loc?.location_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={e => setQuantity(e?.target?.value)}
              placeholder="Enter quantity to transfer"
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e?.target?.value)}
              placeholder="Optional transfer notes..."
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-xs font-medium text-white rounded transition-colors disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {isSubmitting ? 'Transferring...' : 'Transfer Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockTransferModal;
