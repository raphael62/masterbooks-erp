import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const LOCATION_TYPE_OPTIONS = [
  { value: '', label: 'Select Location Type' },
  { value: 'branch', label: 'Branch' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'office', label: 'Office' },
  { value: 'store', label: 'Store' },
  { value: 'depot', label: 'Depot' },
];

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

const INITIAL_FORM = {
  code: '',
  name: '',
  company_id: '',
  address: '',
  phone: '',
  location_type: '',
  status: 'Active',
  location_manager_id: '',
  inventory_enabled: true,
};

const NewLocationModal = ({ isOpen, onClose, onSaved, editLocation }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [managers, setManagers] = useState([]);
  const firstInputRef = useRef(null);

  const isEditMode = !!editLocation;

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setSaveError('');
      fetchCompanies();
      fetchManagers();
      if (editLocation) {
        // Pre-fill form from the selected location object
        setFormData({
          code: editLocation?.code || '',
          name: editLocation?.name || '',
          company_id: editLocation?.company_id || '',
          address: editLocation?.address || '',
          phone: editLocation?.phone || '',
          location_type: editLocation?.location_type || '',
          status: editLocation?.is_active ? 'Active' : 'Inactive',
          location_manager_id: editLocation?.location_manager_id || '',
          inventory_enabled: editLocation?.inventory_enabled !== undefined ? editLocation?.inventory_enabled : true,
        });
      } else {
        setFormData(INITIAL_FORM);
        setTimeout(() => firstInputRef?.current?.focus(), 100);
      }
    }
  }, [isOpen, editLocation]);

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

  const fetchManagers = async () => {
    try {
      const { data } = await supabase?.from('business_executives')?.select('id, full_name, exec_code')?.eq('status', 'Active')?.order('full_name');
      setManagers(data || []);
    } catch (err) {
      console.error('Failed to fetch managers:', err);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    setSaveError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData?.code?.trim()) newErrors.code = 'Location Code is required';
    if (!formData?.name?.trim()) newErrors.name = 'Location Name is required';
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
        company_id: formData?.company_id || null,
        address: formData?.address?.trim() || null,
        phone: formData?.phone?.trim() || null,
        location_type: formData?.location_type || 'branch',
        is_active: formData?.status === 'Active',
        location_manager_id: formData?.location_manager_id || null,
        inventory_enabled: formData?.inventory_enabled,
      };

      let data, error;
      if (isEditMode) {
        const result = await supabase?.from('locations')?.update(payload)?.eq('id', editLocation?.id)?.select()?.single();
        data = result.data;
        error = result.error;
      } else {
        const result = await supabase?.from('locations')?.insert(payload)?.select()?.single();
        data = result.data;
        error = result.error;
      }
      if (error) throw error;
      onSaved?.(data);
      onClose();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save location. Please try again.');
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
        <div className="flex items-center justify-between px-5 py-3 bg-primary rounded-t-lg">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-white" />
            <h2 className="text-sm font-semibold text-white">{isEditMode ? 'Edit Location' : 'New Location'}</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-white/70 transition-colors p-0.5 rounded" title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {saveError && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">{saveError}</div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {/* Location Code */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Location Code <span className="text-red-500">*</span></label>
              <input
                ref={firstInputRef}
                type="text"
                value={formData?.code}
                onChange={e => handleChange('code', e?.target?.value)}
                placeholder="e.g. MW001"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
                  errors?.code ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.code && <p className="text-xs text-red-500 mt-0.5">{errors?.code}</p>}
            </div>

            {/* Location Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Location Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData?.name}
                onChange={e => handleChange('name', e?.target?.value)}
                placeholder="Enter location name"
                className={`w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
                  errors?.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.name && <p className="text-xs text-red-500 mt-0.5">{errors?.name}</p>}
            </div>

            {/* Company */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Company</label>
              <select
                value={formData?.company_id}
                onChange={e => handleChange('company_id', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                <option value="">Select Company</option>
                {companies?.map(c => (
                  <option key={c?.id} value={c?.id}>{c?.code} - {c?.name}</option>
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
                placeholder="Enter location address"
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
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
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            {/* Location Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Location Type</label>
              <select
                value={formData?.location_type}
                onChange={e => handleChange('location_type', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                {LOCATION_TYPE_OPTIONS?.map(opt => (
                  <option key={opt?.value} value={opt?.value}>{opt?.label}</option>
                ))}
              </select>
            </div>

            {/* Location Manager */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Location Manager</label>
              <select
                value={formData?.location_manager_id}
                onChange={e => handleChange('location_manager_id', e?.target?.value)}
                className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
              >
                <option value="">Select Manager</option>
                {managers?.map(m => (
                  <option key={m?.id} value={m?.id}>{m?.exec_code ? `${m?.exec_code} - ` : ''}{m?.full_name}</option>
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

            {/* Enable Inventory Management */}
            <div className="flex flex-col justify-center">
              <label className="block text-xs font-medium text-gray-700 mb-1">Enable Inventory Management</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('inventory_enabled', true)}
                  className={`h-7 px-4 text-xs font-medium rounded border transition-colors ${
                    formData?.inventory_enabled
                      ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('inventory_enabled', false)}
                  className={`h-7 px-4 text-xs font-medium rounded border transition-colors ${
                    !formData?.inventory_enabled
                      ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  No
                </button>
              </div>
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
            className="h-7 px-4 text-xs font-semibold bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewLocationModal;
