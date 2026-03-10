import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select Category' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'service', label: 'Service Provider' },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: '', label: 'Select Payment Terms' },
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'net30', label: 'Net 30 Days' },
  { value: 'net60', label: 'Net 60 Days' },
  { value: 'net90', label: 'Net 90 Days' },
  { value: 'prepaid', label: 'Prepaid' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'blocked', label: 'Blocked' },
];

const INITIAL_FORM = {
  vendor_code: '',
  vendor_name: '',
  category: '',
  tax_id: '',
  contact_person: '',
  phone: '',
  mobile: '',
  email: '',
  address: '',
  city: '',
  bank_name: '',
  bank_account: '',
  bank_branch: '',
  payment_terms: '',
  credit_limit: '',
  currency: 'GHS',
  notes: '',
  status: 'active',
};

const NewVendorModal = ({ isOpen, onClose, onSaved, editItem }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [currencies, setCurrencies] = useState(['GHS', 'USD', 'EUR', 'GBP', 'NGN']);
  const firstInputRef = useRef(null);

  const isEditMode = !!editItem?.id;

  // Fetch currencies from companies table
  useEffect(() => {
    if (!isOpen) return;
    const fetchDropdowns = async () => {
      const { data, error } = await supabase?.from('companies')?.select('currency')?.not('currency', 'is', null);
      if (!error && data) {
        const unique = [...new Set(data?.map(c => c?.currency)?.filter(Boolean))];
        if (unique?.length > 0) setCurrencies(unique);
      }
    };
    fetchDropdowns();
  }, [isOpen]);

  // Pre-fill form on open
  useEffect(() => {
    if (isOpen) {
      if (editItem?.id) {
        setFormData({
          vendor_code: editItem?.vendor_code || '',
          vendor_name: editItem?.vendor_name || '',
          category: editItem?.category || '',
          tax_id: editItem?.tax_id || '',
          contact_person: editItem?.contact_person || '',
          phone: editItem?.phone || '',
          mobile: editItem?.mobile || '',
          email: editItem?.email || '',
          address: editItem?.address || '',
          city: editItem?.city || '',
          bank_name: editItem?.bank_name || '',
          bank_account: editItem?.bank_account || '',
          bank_branch: editItem?.bank_branch || '',
          payment_terms: editItem?.payment_terms || '',
          credit_limit: editItem?.credit_limit !== undefined && editItem?.credit_limit !== null ? String(editItem?.credit_limit) : '',
          currency: editItem?.currency || 'GHS',
          notes: editItem?.notes || '',
          status: editItem?.status || 'active',
        });
      } else {
        setFormData(INITIAL_FORM);
      }
      setErrors({});
      setSaveError('');
      setTimeout(() => firstInputRef?.current?.focus(), 100);
    }
  }, [isOpen, editItem]);

  // Escape key to close
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
    if (!formData?.vendor_code?.trim()) newErrors.vendor_code = 'Vendor Code is required';
    if (!formData?.vendor_name?.trim()) newErrors.vendor_name = 'Vendor Name is required';
    if (formData?.email?.trim() && !/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (formData?.credit_limit !== '' && isNaN(Number(formData?.credit_limit))) {
      newErrors.credit_limit = 'Credit Limit must be a number';
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
        vendor_code: formData?.vendor_code?.trim(),
        vendor_name: formData?.vendor_name?.trim(),
        category: formData?.category || null,
        tax_id: formData?.tax_id?.trim() || null,
        contact_person: formData?.contact_person?.trim() || null,
        phone: formData?.phone?.trim() || null,
        mobile: formData?.mobile?.trim() || null,
        email: formData?.email?.trim() || null,
        address: formData?.address?.trim() || null,
        city: formData?.city?.trim() || null,
        bank_name: formData?.bank_name?.trim() || null,
        bank_account: formData?.bank_account?.trim() || null,
        bank_branch: formData?.bank_branch?.trim() || null,
        payment_terms: formData?.payment_terms || null,
        credit_limit: formData?.credit_limit !== '' ? Number(formData?.credit_limit) : 0,
        currency: formData?.currency || 'GHS',
        notes: formData?.notes?.trim() || null,
        status: formData?.status,
      };

      let data, error;
      if (isEditMode) {
        const result = await supabase?.from('vendors')?.update(payload)?.eq('id', editItem?.id)?.select()?.single();
        data = result?.data;
        error = result?.error;
      } else {
        const result = await supabase?.from('vendors')?.insert(payload)?.select()?.single();
        data = result?.data;
        error = result?.error;
      }
      if (error) throw error;
      onSaved?.(data, isEditMode);
      onClose();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save vendor. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = (field) =>
    `w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
      errors?.[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e?.target === e?.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ maxHeight: '92vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-primary rounded-t-lg">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-white" />
            <h2 className="text-sm font-semibold text-white">{isEditMode ? 'Edit Vendor' : 'New Vendor'}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white/70 transition-colors p-0.5 rounded"
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {saveError && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              {saveError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {/* Vendor Code */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Vendor Code <span className="text-red-500">*</span>
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={formData?.vendor_code}
                onChange={e => handleChange('vendor_code', e?.target?.value)}
                placeholder="e.g. V001"
                className={inputCls('vendor_code')}
              />
              {errors?.vendor_code && <p className="text-xs text-red-500 mt-0.5">{errors?.vendor_code}</p>}
            </div>

            {/* Vendor Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData?.vendor_name}
                onChange={e => handleChange('vendor_name', e?.target?.value)}
                placeholder="Enter vendor name"
                className={inputCls('vendor_name')}
              />
              {errors?.vendor_name && <p className="text-xs text-red-500 mt-0.5">{errors?.vendor_name}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Category</label>
              <select
                value={formData?.category}
                onChange={e => handleChange('category', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                {CATEGORY_OPTIONS?.map(opt => (
                  <option key={opt?.value} value={opt?.value}>{opt?.label}</option>
                ))}
              </select>
            </div>

            {/* Tax ID */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Tax ID / VAT Number</label>
              <input
                type="text"
                value={formData?.tax_id}
                onChange={e => handleChange('tax_id', e?.target?.value)}
                placeholder="Enter tax ID"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Contact Person</label>
              <input
                type="text"
                value={formData?.contact_person}
                onChange={e => handleChange('contact_person', e?.target?.value)}
                placeholder="Enter contact person"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Phone</label>
              <input
                type="tel"
                value={formData?.phone}
                onChange={e => handleChange('phone', e?.target?.value)}
                placeholder="e.g. +233 24 123 4567"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Mobile</label>
              <input
                type="tel"
                value={formData?.mobile}
                onChange={e => handleChange('mobile', e?.target?.value)}
                placeholder="e.g. 0244123456"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Email</label>
              <input
                type="email"
                value={formData?.email}
                onChange={e => handleChange('email', e?.target?.value)}
                placeholder="e.g. vendor@email.com"
                className={inputCls('email')}
              />
              {errors?.email && <p className="text-xs text-red-500 mt-0.5">{errors?.email}</p>}
            </div>

            {/* Address - full width */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Address</label>
              <input
                type="text"
                value={formData?.address}
                onChange={e => handleChange('address', e?.target?.value)}
                placeholder="Enter business address"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">City</label>
              <input
                type="text"
                value={formData?.city}
                onChange={e => handleChange('city', e?.target?.value)}
                placeholder="Enter city"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Payment Terms</label>
              <select
                value={formData?.payment_terms}
                onChange={e => handleChange('payment_terms', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                {PAYMENT_TERMS_OPTIONS?.map(opt => (
                  <option key={opt?.value} value={opt?.value}>{opt?.label}</option>
                ))}
              </select>
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Bank Name</label>
              <input
                type="text"
                value={formData?.bank_name}
                onChange={e => handleChange('bank_name', e?.target?.value)}
                placeholder="Enter bank name"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            {/* Bank Account */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Bank Account</label>
              <input
                type="text"
                value={formData?.bank_account}
                onChange={e => handleChange('bank_account', e?.target?.value)}
                placeholder="Enter account number"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            {/* Bank Branch */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Bank Branch</label>
              <input
                type="text"
                value={formData?.bank_branch}
                onChange={e => handleChange('bank_branch', e?.target?.value)}
                placeholder="Enter branch name"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            {/* Credit Limit */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Credit Limit</label>
              <input
                type="number"
                min="0"
                value={formData?.credit_limit}
                onChange={e => handleChange('credit_limit', e?.target?.value)}
                placeholder="0.00"
                className={inputCls('credit_limit')}
              />
              {errors?.credit_limit && <p className="text-xs text-red-500 mt-0.5">{errors?.credit_limit}</p>}
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Currency</label>
              <select
                value={formData?.currency}
                onChange={e => handleChange('currency', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                {currencies?.map(cur => (
                  <option key={cur} value={cur}>{cur}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
              <select
                value={formData?.status}
                onChange={e => handleChange('status', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                {STATUS_OPTIONS?.map(opt => (
                  <option key={opt?.value} value={opt?.value}>{opt?.label}</option>
                ))}
              </select>
            </div>

            {/* Notes - full width */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Notes</label>
              <textarea
                value={formData?.notes}
                onChange={e => handleChange('notes', e?.target?.value)}
                placeholder="Additional notes..."
                rows={2}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="h-7 px-4 text-xs font-medium border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-7 px-4 text-xs font-semibold bg-primary text-white rounded hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save size={12} />
                {isEditMode ? 'Update' : 'Save'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewVendorModal;
