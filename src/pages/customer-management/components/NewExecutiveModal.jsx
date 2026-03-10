import React, { useState, useEffect, useRef } from 'react';
import { X, UserCheck } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

const INITIAL_FORM = {
  exec_code: '',
  full_name: '',
  phone: '',
  mobile: '',
  email: '',
  company_id: '',
  status: 'Active',
};

const NewExecutiveModal = ({ isOpen, onClose, onSaved }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [companies, setCompanies] = useState([]);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM);
      setErrors({});
      setSaveError('');
      fetchCompanies();
      setTimeout(() => firstInputRef?.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e?.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const fetchCompanies = async () => {
    try {
      const { data } = await supabase?.from('companies')?.select('id, name, code')?.eq('is_active', true)?.order('name');
      setCompanies(data || []);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    setSaveError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData?.exec_code?.trim()) newErrors.exec_code = 'Executive Code is required';
    if (!formData?.full_name?.trim()) newErrors.full_name = 'Full Name is required';
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
        exec_code: formData?.exec_code?.trim(),
        full_name: formData?.full_name?.trim(),
        phone: formData?.phone?.trim() || null,
        mobile: formData?.mobile?.trim() || null,
        email: formData?.email?.trim() || null,
        company_id: formData?.company_id || null,
        status: formData?.status,
      };
      const { data, error } = await supabase?.from('business_executives')?.insert(payload)?.select()?.single();
      if (error) throw error;
      onSaved?.(data);
      onClose();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save executive. Please try again.');
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
            <UserCheck size={16} className="text-white" />
            <h2 className="text-sm font-semibold text-white">New Business Executive / Sales Rep</h2>
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
            {/* Exec Code */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Executive Code <span className="text-red-500">*</span></label>
              <input
                ref={firstInputRef}
                type="text"
                value={formData?.exec_code}
                onChange={e => handleChange('exec_code', e?.target?.value)}
                placeholder="e.g. BE001"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-purple-500 ${
                  errors?.exec_code ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.exec_code && <p className="text-xs text-red-500 mt-0.5">{errors?.exec_code}</p>}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData?.full_name}
                onChange={e => handleChange('full_name', e?.target?.value)}
                placeholder="Enter full name"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-purple-500 ${
                  errors?.full_name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.full_name && <p className="text-xs text-red-500 mt-0.5">{errors?.full_name}</p>}
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

            {/* Mobile */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Mobile</label>
              <input
                type="text"
                value={formData?.mobile}
                onChange={e => handleChange('mobile', e?.target?.value)}
                placeholder="e.g. +233 55 123 4567"
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
                placeholder="exec@example.com"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-purple-500 ${
                  errors?.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.email && <p className="text-xs text-red-500 mt-0.5">{errors?.email}</p>}
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Company</label>
              <select
                value={formData?.company_id}
                onChange={e => handleChange('company_id', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-purple-500 bg-white"
              >
                <option value="">Select Company</option>
                {companies?.map(c => (
                  <option key={c?.id} value={c?.id}>{c?.code} - {c?.name}</option>
                ))}
              </select>
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

export default NewExecutiveModal;
