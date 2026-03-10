import React, { useState, useEffect, useRef } from 'react';
import { X, Building2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const CURRENCY_OPTIONS = [
  { value: '', label: 'Select Currency' },
  { value: 'GHS', label: 'GHS - Ghana Cedi' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'NGN', label: 'NGN - Nigerian Naira' },
];

const EditCompanyModal = ({ isOpen, onClose, onSaved, company }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && company) {
      setFormData({
        code: company?.code || '',
        name: company?.name || '',
        address: company?.address || '',
        phone: company?.phone || '',
        email: company?.email || '',
        vat_number: company?.vat_number || '',
        currency: company?.currency || '',
        status: company?.is_active !== false ? 'Active' : 'Inactive',
      });
      setErrors({});
      setSaveError('');
      setTimeout(() => firstInputRef?.current?.focus(), 100);
    }
  }, [isOpen, company]);

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
    if (!formData?.code?.trim()) newErrors.code = 'Company Code is required';
    if (!formData?.name?.trim()) newErrors.name = 'Company Name is required';
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
        code: formData?.code?.trim(),
        name: formData?.name?.trim(),
        address: formData?.address?.trim() || null,
        phone: formData?.phone?.trim() || null,
        email: formData?.email?.trim() || null,
        vat_number: formData?.vat_number?.trim() || null,
        is_active: formData?.status === 'Active',
      };
      const { data, error } = await supabase
        ?.from('companies')
        ?.update(payload)
        ?.eq('id', company?.id)
        ?.select()
        ?.single();
      if (error) throw error;
      onSaved?.(data);
      onClose();
    } catch (err) {
      setSaveError(err?.message || 'Failed to update company. Please try again.');
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
        <div className="flex items-center justify-between px-5 py-3 bg-purple-700 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-white" />
            <h2 className="text-sm font-semibold text-white">Edit Company</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-purple-200 transition-colors p-0.5 rounded" title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {saveError && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">{saveError}</div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Company Code <span className="text-red-500">*</span></label>
              <input
                ref={firstInputRef}
                type="text"
                value={formData?.code || ''}
                onChange={e => handleChange('code', e?.target?.value)}
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-purple-500 ${
                  errors?.code ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.code && <p className="text-xs text-red-500 mt-0.5">{errors?.code}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Company Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData?.name || ''}
                onChange={e => handleChange('name', e?.target?.value)}
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-purple-500 ${
                  errors?.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.name && <p className="text-xs text-red-500 mt-0.5">{errors?.name}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Address</label>
              <input
                type="text"
                value={formData?.address || ''}
                onChange={e => handleChange('address', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Phone</label>
              <input
                type="text"
                value={formData?.phone || ''}
                onChange={e => handleChange('phone', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Email</label>
              <input
                type="email"
                value={formData?.email || ''}
                onChange={e => handleChange('email', e?.target?.value)}
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-purple-500 ${
                  errors?.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.email && <p className="text-xs text-red-500 mt-0.5">{errors?.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">VAT Number</label>
              <input
                type="text"
                value={formData?.vat_number || ''}
                onChange={e => handleChange('vat_number', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Currency</label>
              <select
                value={formData?.currency || ''}
                onChange={e => handleChange('currency', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-purple-500 bg-white"
              >
                {CURRENCY_OPTIONS?.map(opt => (
                  <option key={opt?.value} value={opt?.value}>{opt?.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
              <select
                value={formData?.status || 'Active'}
                onChange={e => handleChange('status', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-purple-500 bg-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

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
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCompanyModal;
