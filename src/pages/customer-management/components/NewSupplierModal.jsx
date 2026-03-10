import React, { useState, useEffect, useRef } from 'react';
import { X, Truck } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const PAYMENT_TERMS_OPTIONS = [
  { value: '', label: 'Select Payment Terms' },
  { value: 'Net 7', label: 'Net 7 days' },
  { value: 'Net 14', label: 'Net 14 days' },
  { value: 'Net 30', label: 'Net 30 days' },
  { value: 'Net 60', label: 'Net 60 days' },
  { value: 'Net 90', label: 'Net 90 days' },
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'Prepaid', label: 'Prepaid' },
  { value: 'EOM', label: 'End of Month' },
];

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

const INITIAL_FORM = {
  supplier_code: '',
  supplier_name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  payment_terms: '',
  status: 'Active',
};

const NewSupplierModal = ({ isOpen, onClose, onSaved }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM);
      setErrors({});
      setSaveError('');
      setTimeout(() => firstInputRef?.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e?.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    setSaveError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData?.supplier_code?.trim()) newErrors.supplier_code = 'Supplier Code is required';
    if (!formData?.supplier_name?.trim()) newErrors.supplier_name = 'Supplier Name is required';
    if (formData?.email?.trim() && !/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setSaveError('');
    try {
      const payload = {
        supplier_code: formData?.supplier_code?.trim(),
        supplier_name: formData?.supplier_name?.trim(),
        contact_person: formData?.contact_person?.trim() || null,
        phone: formData?.phone?.trim() || null,
        email: formData?.email?.trim() || null,
        address: formData?.address?.trim() || null,
        payment_terms: formData?.payment_terms || null,
        status: formData?.status,
      };
      const { data, error } = await supabase?.from('suppliers')?.insert(payload)?.select()?.single();
      if (error) throw error;
      onSaved?.(data);
      onClose();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save supplier. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e?.target === e?.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl mx-4 flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-purple-700 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-white" />
            <h2 className="text-sm font-semibold text-white">New Supplier</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-purple-200 transition-colors p-0.5 rounded" title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {saveError && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">{saveError}</div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {/* Supplier Code */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Supplier Code <span className="text-red-500">*</span></label>
              <input
                ref={firstInputRef}
                type="text"
                value={formData?.supplier_code}
                onChange={e => handleChange('supplier_code', e?.target?.value)}
                placeholder="e.g. SUP001"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-purple-500 ${
                  errors?.supplier_code ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.supplier_code && <p className="text-xs text-red-500 mt-0.5">{errors?.supplier_code}</p>}
            </div>

            {/* Supplier Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Supplier Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData?.supplier_name}
                onChange={e => handleChange('supplier_name', e?.target?.value)}
                placeholder="Enter supplier name"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-purple-500 ${
                  errors?.supplier_name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.supplier_name && <p className="text-xs text-red-500 mt-0.5">{errors?.supplier_name}</p>}
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Contact Person</label>
              <input
                type="text"
                value={formData?.contact_person}
                onChange={e => handleChange('contact_person', e?.target?.value)}
                placeholder="Enter contact person name"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Phone</label>
              <input
                type="text"
                value={formData?.phone}
                onChange={e => handleChange('phone', e?.target?.value)}
                placeholder="e.g. +233 24 123 4567"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Email</label>
              <input
                type="email"
                value={formData?.email}
                onChange={e => handleChange('email', e?.target?.value)}
                placeholder="supplier@example.com"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-purple-500 ${
                  errors?.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.email && <p className="text-xs text-red-500 mt-0.5">{errors?.email}</p>}
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Payment Terms</label>
              <select
                value={formData?.payment_terms}
                onChange={e => handleChange('payment_terms', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-purple-500 bg-white"
              >
                {PAYMENT_TERMS_OPTIONS?.map(opt => (
                  <option key={opt?.value} value={opt?.value}>{opt?.label}</option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Address</label>
              <input
                type="text"
                value={formData?.address}
                onChange={e => handleChange('address', e?.target?.value)}
                placeholder="Enter supplier address"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
              <select
                value={formData?.status}
                onChange={e => handleChange('status', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-purple-500 bg-white"
              >
                {STATUS_OPTIONS?.map(opt => (
                  <option key={opt?.value} value={opt?.value}>{opt?.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="h-7 px-4 text-xs font-medium border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-7 px-4 text-xs font-semibold bg-purple-700 text-white rounded hover:bg-purple-800 transition-colors disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSupplierModal;
