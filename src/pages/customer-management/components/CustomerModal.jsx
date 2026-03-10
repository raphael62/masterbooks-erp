import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { supabase } from '../../../lib/supabase';

const CustomerModal = ({ isOpen, onClose, customer, onSave, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    businessType: '',
    creditLimit: '',
    assignedExecutive: '',
    status: 'Active',
    taxId: '',
    contactPerson: '',
    paymentTerms: '30',
    location: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executives, setExecutives] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchDropdowns = async () => {
        const [exRes, locRes] = await Promise.all([
          supabase?.from('business_executives')?.select('id, full_name')?.eq('status', 'Active')?.order('full_name'),
          supabase?.from('locations')?.select('id, name')?.eq('is_active', true)?.order('name'),
        ]);
        if (!exRes?.error) setExecutives(exRes?.data || []);
        if (!locRes?.error) setLocations(locRes?.data || []);
      };
      fetchDropdowns();
    }
  }, [isOpen]);

  useEffect(() => {
    if (customer && mode === 'edit') {
      setFormData({
        name: customer?.name || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        businessType: customer?.businessType || '',
        creditLimit: customer?.creditLimit?.toString() || '',
        assignedExecutive: customer?.assignedExecutive || '',
        status: customer?.status || 'Active',
        taxId: customer?.taxId || '',
        contactPerson: customer?.contactPerson || '',
        paymentTerms: customer?.paymentTerms?.toString() || '30',
        location: customer?.location || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        businessType: '',
        creditLimit: '',
        assignedExecutive: '',
        status: 'Active',
        taxId: '',
        contactPerson: '',
        paymentTerms: '30',
        location: ''
      });
    }
    setErrors({});
  }, [customer, mode, isOpen]);

  const businessTypeOptions = [
    { value: '', label: 'Select Business Type' },
    { value: 'Retailer', label: 'Retailer' },
    { value: 'Wholesaler', label: 'Wholesaler' },
    { value: 'Distributor', label: 'Distributor' },
    { value: 'Supermarket', label: 'Supermarket' },
    { value: 'Restaurant', label: 'Restaurant' },
    { value: 'Hotel', label: 'Hotel' },
    { value: 'Bar/Pub', label: 'Bar/Pub' }
  ];

  const executiveOptions = [
    { value: '', label: 'Select Executive' },
    ...executives?.map(e => ({ value: e?.full_name, label: e?.full_name }))
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Suspended', label: 'Suspended' }
  ];

  const locationOptions = [
    { value: '', label: 'Select Location' },
    ...locations?.map(l => ({ value: l?.name, label: l?.name }))
  ];

  const paymentTermsOptions = [
    { value: '0', label: 'Cash on Delivery' },
    { value: '7', label: '7 Days' },
    { value: '15', label: '15 Days' },
    { value: '30', label: '30 Days' },
    { value: '45', label: '45 Days' },
    { value: '60', label: '60 Days' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.name?.trim()) {
      newErrors.name = 'Customer name is required';
    }

    if (!formData?.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData?.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData?.businessType) {
      newErrors.businessType = 'Business type is required';
    }

    if (!formData?.creditLimit || parseFloat(formData?.creditLimit) < 0) {
      newErrors.creditLimit = 'Please enter a valid credit limit';
    }

    if (!formData?.assignedExecutive) {
      newErrors.assignedExecutive = 'Please assign a business executive';
    }

    if (!formData?.location) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const customerData = {
        ...formData,
        creditLimit: parseFloat(formData?.creditLimit),
        paymentTerms: parseInt(formData?.paymentTerms),
        id: customer?.id || Date.now(),
        outstandingBalance: customer?.outstandingBalance || 0,
        totalOrders: customer?.totalOrders || 0,
        daysSinceLastOrder: customer?.daysSinceLastOrder || 0,
        recentTransactions: customer?.recentTransactions || []
      };

      await onSave(customerData);
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-400 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-modal w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {mode === 'edit' ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Icon name="X" size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Customer Name"
                  value={formData?.name}
                  onChange={(e) => handleInputChange('name', e?.target?.value)}
                  error={errors?.name}
                  required
                  placeholder="Enter customer name"
                />
                <Select
                  label="Business Type"
                  options={businessTypeOptions}
                  value={formData?.businessType}
                  onChange={(value) => handleInputChange('businessType', value)}
                  error={errors?.businessType}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={formData?.email}
                  onChange={(e) => handleInputChange('email', e?.target?.value)}
                  error={errors?.email}
                  required
                  placeholder="customer@example.com"
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData?.phone}
                  onChange={(e) => handleInputChange('phone', e?.target?.value)}
                  error={errors?.phone}
                  required
                  placeholder="+233 XX XXX XXXX"
                />
                <Input
                  label="Contact Person"
                  value={formData?.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e?.target?.value)}
                  placeholder="Primary contact name"
                />
                <Input
                  label="Tax ID"
                  value={formData?.taxId}
                  onChange={(e) => handleInputChange('taxId', e?.target?.value)}
                  placeholder="Enter tax ID"
                />
              </div>
            </div>

            {/* Business Details */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">Business Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Assigned Executive"
                  options={executiveOptions}
                  value={formData?.assignedExecutive}
                  onChange={(value) => handleInputChange('assignedExecutive', value)}
                  error={errors?.assignedExecutive}
                  required
                />
                <Select
                  label="Location"
                  options={locationOptions}
                  value={formData?.location}
                  onChange={(value) => handleInputChange('location', value)}
                  error={errors?.location}
                  required
                />
                <Input
                  label="Credit Limit (GHS)"
                  type="number"
                  value={formData?.creditLimit}
                  onChange={(e) => handleInputChange('creditLimit', e?.target?.value)}
                  error={errors?.creditLimit}
                  required
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <Select
                  label="Payment Terms"
                  options={paymentTermsOptions}
                  value={formData?.paymentTerms}
                  onChange={(value) => handleInputChange('paymentTerms', value)}
                />
                <Select
                  label="Status"
                  options={statusOptions}
                  value={formData?.status}
                  onChange={(value) => handleInputChange('status', value)}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">Address</h3>
              <Input
                label="Address"
                value={formData?.address}
                onChange={(e) => handleInputChange('address', e?.target?.value)}
                placeholder="Enter full address"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              iconName={isSubmitting ? 'Loader' : 'Save'}
            >
              {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Customer' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;