import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const CUSTOMER_TYPE_OPTIONS = [
  { value: '', label: 'Select Customer Type' },
  { value: 'Retailer', label: 'Retailer' },
  { value: 'Wholesaler', label: 'Wholesaler' },
  { value: 'Distributor', label: 'Distributor' },
  { value: 'Supermarket', label: 'Supermarket' },
  { value: 'Restaurant', label: 'Restaurant' },
  { value: 'Hotel', label: 'Hotel' },
  { value: 'Bar/Pub', label: 'Bar/Pub' },
];

const CALL_DAYS_OPTIONS = [
  { value: '', label: 'Select Call Days' },
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
];

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

const INITIAL_FORM = {
  customerCode: '',
  customerName: '',
  businessName: '',
  priceType: '',
  priceTypeId: '',
  mobile: '',
  email: '',
  businessAddress: '',
  callDays: '',
  customerType: '',
  businessExecutive: '',
  creditLimit: '',
  location: '',
  locationId: '',
  status: 'Active',
};

const NewCustomerModal = ({ isOpen, onClose, onSaved, editItem }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [priceTypes, setPriceTypes] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [locations, setLocations] = useState([]);
  const firstInputRef = useRef(null);

  const isEditMode = !!editItem?.id;

  // Fetch dropdown data from Supabase when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchDropdowns = async () => {
      const [ptRes, exRes, locRes] = await Promise.all([
        supabase?.from('price_types')?.select('id, price_type_name')?.eq('status', 'Active')?.order('price_type_name'),
        supabase?.from('business_executives')?.select('id, full_name')?.eq('status', 'Active')?.order('full_name'),
        supabase?.from('locations')?.select('id, name')?.eq('is_active', true)?.order('name'),
      ]);
      if (!ptRes?.error) setPriceTypes(ptRes?.data || []);
      if (!exRes?.error) setExecutives(exRes?.data || []);
      if (!locRes?.error) setLocations(locRes?.data || []);
    };

    fetchDropdowns();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (editItem?.id) {
        setFormData({
          customerCode: editItem?.custVendCode || '',
          customerName: editItem?.custVendName || '',
          businessName: editItem?.businessName || '',
          priceType: editItem?.salesPriceGroupName || '',
          priceTypeId: editItem?.price_type_id || '',
          mobile: editItem?.mobile || '',
          email: editItem?.email || '',
          businessAddress: editItem?.businessAddress || '',
          callDays: editItem?.callDays || '',
          customerType: editItem?.customerType || '',
          businessExecutive: editItem?.businessExecutive || '',
          creditLimit: editItem?.creditLimit !== undefined && editItem?.creditLimit !== null ? String(editItem?.creditLimit) : '',
          location: editItem?.location || '',
          locationId: editItem?.location_id || '',
          status: editItem?.status || 'Active',
        });
      } else {
        setFormData(INITIAL_FORM);
      }
      setErrors({});
      setSaveError('');
      setTimeout(() => firstInputRef?.current?.focus(), 100);
    }
  }, [isOpen, editItem]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e?.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setSaveError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData?.customerCode?.trim()) newErrors.customerCode = 'Customer Code is required';
    if (!formData?.customerName?.trim()) newErrors.customerName = 'Customer Name is required';
    if (formData?.email?.trim() && !/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (formData?.creditLimit !== '' && isNaN(Number(formData?.creditLimit))) {
      newErrors.creditLimit = 'Credit Limit must be a number';
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
        customer_code: formData?.customerCode?.trim(),
        customer_name: formData?.customerName?.trim(),
        business_name: formData?.businessName?.trim() || null,
        price_type: formData?.priceType || null,
        price_type_id: formData?.priceTypeId || null,
        mobile: formData?.mobile?.trim() || null,
        email: formData?.email?.trim() || null,
        business_address: formData?.businessAddress?.trim() || null,
        call_days: formData?.callDays || null,
        customer_type: formData?.customerType || null,
        business_executive: formData?.businessExecutive || null,
        credit_limit: formData?.creditLimit !== '' ? Number(formData?.creditLimit) : 0,
        location: formData?.location || null,
        location_id: formData?.locationId || null,
        status: formData?.status,
      };

      let data, error;
      if (isEditMode) {
        const result = await supabase?.from('customers')?.update(payload)?.eq('id', editItem?.id)?.select()?.single();
        data = result?.data;
        error = result?.error;
      } else {
        const result = await supabase?.from('customers')?.insert(payload)?.select()?.single();
        data = result?.data;
        error = result?.error;
      }
      if (error) throw error;
      onSaved?.(data, isEditMode);
      onClose();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save customer. Please try again.');
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
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ maxHeight: '92vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-primary rounded-t-lg">
          <div className="flex items-center gap-2">
            <User size={16} className="text-white" />
            <h2 className="text-sm font-semibold text-white">{isEditMode ? 'Edit Customer' : 'New Customer'}</h2>
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
            {/* Customer Code */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Customer Code <span className="text-red-500">*</span>
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={formData?.customerCode}
                onChange={e => handleChange('customerCode', e?.target?.value)}
                placeholder="e.g. 10001"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
                  errors?.customerCode ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.customerCode && (
                <p className="text-xs text-red-500 mt-0.5">{errors?.customerCode}</p>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData?.customerName}
                onChange={e => handleChange('customerName', e?.target?.value)}
                placeholder="Enter customer name"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
                  errors?.customerName ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.customerName && (
                <p className="text-xs text-red-500 mt-0.5">{errors?.customerName}</p>
              )}
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Name</label>
              <input
                type="text"
                value={formData?.businessName}
                onChange={e => handleChange('businessName', e?.target?.value)}
                placeholder="Enter business name"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            {/* Price Type - live from price_types table */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Price Type</label>
              <select
                value={formData?.priceTypeId}
                onChange={e => {
                  const selectedId = e?.target?.value;
                  const selectedPt = priceTypes?.find(pt => pt?.id === selectedId);
                  handleChange('priceTypeId', selectedId);
                  handleChange('priceType', selectedPt?.price_type_name || '');
                }}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                <option value="">Select Price Type</option>
                {priceTypes?.map(pt => (
                  <option key={pt?.id} value={pt?.id}>{pt?.price_type_name}</option>
                ))}
              </select>
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
                placeholder="e.g. customer@email.com"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
                  errors?.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.email && (
                <p className="text-xs text-red-500 mt-0.5">{errors?.email}</p>
              )}
            </div>

            {/* Business Address - full width */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Address</label>
              <input
                type="text"
                value={formData?.businessAddress}
                onChange={e => handleChange('businessAddress', e?.target?.value)}
                placeholder="Enter business address"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            {/* Call Days */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Call Days</label>
              <select
                value={formData?.callDays}
                onChange={e => handleChange('callDays', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                {CALL_DAYS_OPTIONS?.map(opt => (
                  <option key={opt?.value} value={opt?.value}>{opt?.label}</option>
                ))}
              </select>
            </div>

            {/* Customer Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Customer Type</label>
              <select
                value={formData?.customerType}
                onChange={e => handleChange('customerType', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                {CUSTOMER_TYPE_OPTIONS?.map(opt => (
                  <option key={opt?.value} value={opt?.value}>{opt?.label}</option>
                ))}
              </select>
            </div>

            {/* Business Executive - live from business_executives table */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Executive</label>
              <select
                value={formData?.businessExecutive}
                onChange={e => handleChange('businessExecutive', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                <option value="">Select Executive</option>
                {executives?.map(ex => (
                  <option key={ex?.id} value={ex?.full_name}>{ex?.full_name}</option>
                ))}
              </select>
            </div>

            {/* Credit Limit */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Credit Limit</label>
              <input
                type="number"
                min="0"
                value={formData?.creditLimit}
                onChange={e => handleChange('creditLimit', e?.target?.value)}
                placeholder="0.00"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
                  errors?.creditLimit ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.creditLimit && (
                <p className="text-xs text-red-500 mt-0.5">{errors?.creditLimit}</p>
              )}
            </div>

            {/* Location - live from locations table */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Location</label>
              <select
                value={formData?.locationId}
                onChange={e => {
                  const selectedId = e?.target?.value;
                  const selectedLoc = locations?.find(loc => loc?.id === selectedId);
                  handleChange('locationId', selectedId);
                  handleChange('location', selectedLoc?.name || '');
                }}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                <option value="">Select Location</option>
                {locations?.map(loc => (
                  <option key={loc?.id} value={loc?.id}>{loc?.name}</option>
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
          </div>
        </div>

        {/* Footer Actions */}
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

export default NewCustomerModal;
