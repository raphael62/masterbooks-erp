import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Briefcase } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

const SALES_REP_TYPE_OPTIONS = [
  { value: '', label: 'Select Type' },
  { value: 'VSR', label: 'VSR — Van Sales Rep' },
  { value: 'SSR', label: 'SSR — Shop Sales Rep' },
];

const INITIAL_FORM = {
  exec_code: '',
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  company_id: '',
  location: '',
  status: 'Active',
  sales_rep_type: '',
};

const BusinessExecutiveModal = ({ item, companies, onClose, onSaved }) => {
  const isEdit = !!item;
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [locations, setLocations] = useState([]);
  const firstInputRef = useRef(null);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase?.from('locations')?.select('id, name')?.eq('is_active', true)?.order('name');
      if (!error) setLocations(data || []);
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    if (item) {
      setForm({
        exec_code: item?.exec_code || '',
        first_name: item?.first_name || '',
        last_name: item?.last_name || '',
        phone: item?.phone || '',
        email: item?.email || '',
        company_id: item?.company_id || '',
        location: item?.location || '',
        status: item?.status || 'Active',
        sales_rep_type: item?.sales_rep_type || '',
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
    setSaveError('');
    setTimeout(() => firstInputRef?.current?.focus(), 100);
  }, [item]);

  useEffect(() => {
    const handleKey = (e) => { if (e?.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const validate = () => {
    const errs = {};
    if (!form?.exec_code?.trim()) errs.exec_code = 'Executive code is required';
    if (!form?.first_name?.trim()) errs.first_name = 'First name is required';
    if (!form?.last_name?.trim()) errs.last_name = 'Last name is required';
    if (form?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(form?.email)) errs.email = 'Invalid email format';
    return errs;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    setSaveError('');
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs)?.length > 0) { setErrors(errs); return; }
    setIsSaving(true);
    setSaveError('');
    try {
      const fullName = `${form?.first_name?.trim()} ${form?.last_name?.trim()}`?.trim();
      const payload = {
        exec_code: form?.exec_code?.trim()?.toUpperCase(),
        first_name: form?.first_name?.trim(),
        last_name: form?.last_name?.trim(),
        full_name: fullName,
        phone: form?.phone?.trim() || null,
        email: form?.email?.trim() || null,
        company_id: form?.company_id || null,
        location: form?.location?.trim() || null,
        status: form?.status,
        sales_rep_type: form?.sales_rep_type || null,
        updated_at: new Date()?.toISOString(),
      };
      if (isEdit) {
        const { error } = await supabase?.from('business_executives')?.update(payload)?.eq('id', item?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase?.from('business_executives')?.insert([payload]);
        if (error) throw error;
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save executive');
    } finally {
      setIsSaving(false);
    }
  };

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
            <Briefcase size={16} className="text-white" />
            <h2 className="text-sm font-semibold text-white">{isEdit ? 'Edit Business Executive' : 'New Business Executive'}</h2>
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
            {/* Executive Code */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Executive Code <span className="text-red-500">*</span>
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={form?.exec_code}
                onChange={e => handleChange('exec_code', e?.target?.value?.toUpperCase())}
                placeholder="e.g. EX001"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
                  errors?.exec_code ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.exec_code && <p className="text-xs text-red-500 mt-0.5">{errors?.exec_code}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
              <select
                value={form?.status}
                onChange={e => handleChange('status', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                {STATUS_OPTIONS?.map(opt => (
                  <option key={opt?.value} value={opt?.value}>{opt?.label}</option>
                ))}
              </select>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form?.first_name}
                onChange={e => handleChange('first_name', e?.target?.value)}
                placeholder="First name"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
                  errors?.first_name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.first_name && <p className="text-xs text-red-500 mt-0.5">{errors?.first_name}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form?.last_name}
                onChange={e => handleChange('last_name', e?.target?.value)}
                placeholder="Last name"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
                  errors?.last_name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.last_name && <p className="text-xs text-red-500 mt-0.5">{errors?.last_name}</p>}
            </div>

            {/* Sales Rep Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Sales Rep Type</label>
              <select
                value={form?.sales_rep_type}
                onChange={e => handleChange('sales_rep_type', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                {SALES_REP_TYPE_OPTIONS?.map(opt => (
                  <option key={opt?.value} value={opt?.value}>{opt?.label}</option>
                ))}
              </select>
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Company</label>
              <select
                value={form?.company_id}
                onChange={e => handleChange('company_id', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                <option value="">Select Company</option>
                {companies?.map(c => (
                  <option key={c?.id} value={c?.id}>{c?.name}</option>
                ))}
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Phone</label>
              <input
                type="tel"
                value={form?.phone}
                onChange={e => handleChange('phone', e?.target?.value)}
                placeholder="e.g. 0244123456"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Email</label>
              <input
                type="email"
                value={form?.email}
                onChange={e => handleChange('email', e?.target?.value)}
                placeholder="exec@company.com"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
                  errors?.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.email && <p className="text-xs text-red-500 mt-0.5">{errors?.email}</p>}
            </div>

            {/* Location */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Location</label>
              <select
                value={form?.location}
                onChange={e => handleChange('location', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                <option value="">Select Location</option>
                {locations?.length > 0
                  ? locations?.map(loc => (
                      <option key={loc?.id} value={loc?.name}>{loc?.name}</option>
                    ))
                  : form?.location
                    ? <option value={form?.location}>{form?.location}</option>
                    : null
                }
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
            onClick={handleSubmit}
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
                {isEdit ? 'Update' : 'Save'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessExecutiveModal;
