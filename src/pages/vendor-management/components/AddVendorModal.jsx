import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';

const TABS = [
  { id: 'basic', label: 'Basic Info', icon: 'Building2' },
  { id: 'contact', label: 'Contact', icon: 'Phone' },
  { id: 'banking', label: 'Banking', icon: 'CreditCard' },
  { id: 'terms', label: 'Payment Terms', icon: 'FileText' },
];

const initialForm = {
  vendor_code: '',
  vendor_name: '',
  category: 'supplier',
  tax_id: '',
  website: '',
  contact_person: '',
  phone: '',
  mobile: '',
  email: '',
  address: '',
  city: '',
  country: 'Ghana',
  bank_name: '',
  bank_account: '',
  bank_branch: '',
  payment_terms: 'net30',
  credit_limit: '',
  currency: 'GHS',
  notes: '',
  status: 'active',
};

const AddVendorModal = ({ isOpen, onClose, onSuccess, editVendor }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [form, setForm] = useState(editVendor || initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [currencies, setCurrencies] = useState([]);

  React.useEffect(() => {
    if (editVendor) {
      setForm(editVendor);
    } else {
      setForm(initialForm);
    }
    setActiveTab('basic');
    setErrors({});
  }, [editVendor, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchDropdowns = async () => {
      const { data, error } = await supabase?.from('companies')?.select('currency')?.not('currency', 'is', null);
      if (!error && data) {
        const uniqueCurrencies = [...new Set(data?.map(c => c?.currency)?.filter(Boolean))];
        setCurrencies(uniqueCurrencies?.length > 0 ? uniqueCurrencies : ['GHS', 'USD', 'EUR', 'GBP', 'NGN']);
      } else {
        setCurrencies(['GHS', 'USD', 'EUR', 'GBP', 'NGN']);
      }
    };
    fetchDropdowns();
  }, [isOpen]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form?.vendor_name?.trim()) newErrors.vendor_name = 'Vendor name is required';
    if (!form?.contact_person?.trim()) newErrors.contact_person = 'Contact person is required';
    if (form?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(form?.email)) {
      newErrors.email = 'Invalid email address';
    }
    return newErrors;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors)?.length > 0) {
      setErrors(validationErrors);
      setActiveTab('basic');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        vendor_code: form?.vendor_code || `V-${Date.now()}`,
        vendor_name: form?.vendor_name?.trim(),
        category: form?.category,
        tax_id: form?.tax_id,
        website: form?.website,
        contact_person: form?.contact_person?.trim(),
        phone: form?.phone,
        mobile: form?.mobile,
        email: form?.email,
        address: form?.address,
        city: form?.city,
        country: form?.country,
        bank_name: form?.bank_name,
        bank_account: form?.bank_account,
        bank_branch: form?.bank_branch,
        payment_terms: form?.payment_terms,
        credit_limit: form?.credit_limit ? parseFloat(form?.credit_limit) : null,
        currency: form?.currency,
        notes: form?.notes,
        status: form?.status,
      };

      let error = null;
      if (editVendor?.id) {
        const result = await supabase?.from('vendors')?.update(payload)?.eq('id', editVendor?.id);
        error = result?.error;
      } else {
        const result = await supabase?.from('vendors')?.insert([payload]);
        error = result?.error;
      }

      if (error) throw error;
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Error saving vendor:', err);
      setErrors({ submit: err?.message || 'Failed to save vendor. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-200 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{editVendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Fill in the vendor details below</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5">
          {TABS?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => setActiveTab(tab?.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 ${
                activeTab === tab?.id
                  ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name={tab?.icon} size={14} />
              {tab?.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {errors?.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errors?.submit}
            </div>
          )}

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Vendor Code</label>
                <input
                  type="text"
                  value={form?.vendor_code}
                  onChange={(e) => handleChange('vendor_code', e?.target?.value)}
                  placeholder="Auto-generated if empty"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Vendor Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form?.vendor_name}
                  onChange={(e) => handleChange('vendor_name', e?.target?.value)}
                  placeholder="Enter vendor name"
                  className={`w-full px-3 py-2 text-sm bg-muted border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors?.vendor_name ? 'border-red-400' : 'border-border'
                  }`}
                />
                {errors?.vendor_name && <p className="text-xs text-red-500 mt-1">{errors?.vendor_name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Category</label>
                <select
                  value={form?.category}
                  onChange={(e) => handleChange('category', e?.target?.value)}
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="supplier">Supplier</option>
                  <option value="manufacturer">Manufacturer</option>
                  <option value="distributor">Distributor</option>
                  <option value="service">Service Provider</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Tax ID / VAT Number</label>
                <input
                  type="text"
                  value={form?.tax_id}
                  onChange={(e) => handleChange('tax_id', e?.target?.value)}
                  placeholder="Enter tax ID"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Website</label>
                <input
                  type="url"
                  value={form?.website}
                  onChange={(e) => handleChange('website', e?.target?.value)}
                  placeholder="https://"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Status</label>
                <select
                  value={form?.status}
                  onChange={(e) => handleChange('status', e?.target?.value)}
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1.5">Notes</label>
                <textarea
                  value={form?.notes}
                  onChange={(e) => handleChange('notes', e?.target?.value)}
                  placeholder="Additional notes about this vendor"
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Contact Person <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form?.contact_person}
                  onChange={(e) => handleChange('contact_person', e?.target?.value)}
                  placeholder="Primary contact name"
                  className={`w-full px-3 py-2 text-sm bg-muted border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors?.contact_person ? 'border-red-400' : 'border-border'
                  }`}
                />
                {errors?.contact_person && <p className="text-xs text-red-500 mt-1">{errors?.contact_person}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={form?.phone}
                  onChange={(e) => handleChange('phone', e?.target?.value)}
                  placeholder="+233 XX XXX XXXX"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Mobile</label>
                <input
                  type="tel"
                  value={form?.mobile}
                  onChange={(e) => handleChange('mobile', e?.target?.value)}
                  placeholder="+233 XX XXX XXXX"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={form?.email}
                  onChange={(e) => handleChange('email', e?.target?.value)}
                  placeholder="vendor@example.com"
                  className={`w-full px-3 py-2 text-sm bg-muted border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors?.email ? 'border-red-400' : 'border-border'
                  }`}
                />
                {errors?.email && <p className="text-xs text-red-500 mt-1">{errors?.email}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Address</label>
                <input
                  type="text"
                  value={form?.address}
                  onChange={(e) => handleChange('address', e?.target?.value)}
                  placeholder="Street address"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">City</label>
                <input
                  type="text"
                  value={form?.city}
                  onChange={(e) => handleChange('city', e?.target?.value)}
                  placeholder="City"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Country</label>
                <input
                  type="text"
                  value={form?.country}
                  onChange={(e) => handleChange('country', e?.target?.value)}
                  placeholder="Country"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {/* Banking Tab */}
          {activeTab === 'banking' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Bank Name</label>
                <input
                  type="text"
                  value={form?.bank_name}
                  onChange={(e) => handleChange('bank_name', e?.target?.value)}
                  placeholder="e.g. GCB Bank"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Bank Account</label>
                <input
                  type="text"
                  value={form?.bank_account}
                  onChange={(e) => handleChange('bank_account', e?.target?.value)}
                  placeholder="Bank account number"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Bank Branch</label>
                <input
                  type="text"
                  value={form?.bank_branch}
                  onChange={(e) => handleChange('bank_branch', e?.target?.value)}
                  placeholder="Bank branch"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {/* Payment Terms Tab */}
          {activeTab === 'terms' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Payment Terms</label>
                <select
                  value={form?.payment_terms}
                  onChange={(e) => handleChange('payment_terms', e?.target?.value)}
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="cod">Cash on Delivery</option>
                  <option value="net7">Net 7 Days</option>
                  <option value="net15">Net 15 Days</option>
                  <option value="net30">Net 30 Days</option>
                  <option value="net45">Net 45 Days</option>
                  <option value="net60">Net 60 Days</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Credit Limit</label>
                <input
                  type="number"
                  value={form?.credit_limit}
                  onChange={(e) => handleChange('credit_limit', e?.target?.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Currency</label>
                <select
                  value={form?.currency}
                  onChange={(e) => handleChange('currency', e?.target?.value)}
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {currencies?.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-accent rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : editVendor ? 'Update Vendor' : 'Add Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVendorModal;
