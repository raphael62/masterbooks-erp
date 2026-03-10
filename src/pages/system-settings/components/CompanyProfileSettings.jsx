import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import { supabase } from '../../../lib/supabase';

const CompanyProfileSettings = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  const fetchCompanies = useCallback(async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        ?.from('companies')
        ?.select('*')
        ?.order('name');
      if (error) throw error;
      const list = data || [];
      setCompanies(list);
      if (list?.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(list?.[0]?.id);
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    } finally {
      setIsFetching(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!selectedCompanyId || companies?.length === 0) return;
    const company = companies?.find(c => c?.id === selectedCompanyId);
    if (company) {
      setCompanyData({
        code: company?.code || '',
        name: company?.name || '',
        address: company?.address || '',
        phone: company?.phone || '',
        email: company?.email || '',
        vat_number: company?.vat_number || '',
        is_active: company?.is_active ?? true,
      });
      setLogoPreview(null);
      setSaveMessage('');
      setSaveError('');
    }
  }, [selectedCompanyId, companies]);

  const handleInputChange = (field, value) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
    setSaveMessage('');
    setSaveError('');
  };

  const handleLogoUpload = (event) => {
    const file = event?.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e?.target?.result);
      reader?.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!selectedCompanyId || !companyData) return;
    setIsLoading(true);
    setSaveMessage('');
    setSaveError('');
    try {
      const payload = {
        code: companyData?.code?.trim(),
        name: companyData?.name?.trim(),
        address: companyData?.address?.trim() || null,
        phone: companyData?.phone?.trim() || null,
        email: companyData?.email?.trim() || null,
        vat_number: companyData?.vat_number?.trim() || null,
        is_active: companyData?.is_active,
      };
      const { error } = await supabase
        ?.from('companies')
        ?.update(payload)
        ?.eq('id', selectedCompanyId);
      if (error) throw error;
      setSaveMessage('Company profile saved successfully.');
      // Refresh list to reflect name changes
      const { data } = await supabase?.from('companies')?.select('*')?.order('name');
      if (data) setCompanies(data);
    } catch (err) {
      setSaveError(err?.message || 'Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Loading companies...</span>
      </div>
    );
  }

  if (companies?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Icon name="Building2" size={40} className="text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">No companies found</p>
        <p className="text-xs text-muted-foreground mt-1">Create a company from the Customer Management page to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Company Profile</h3>
          <p className="text-sm text-muted-foreground">
            Configure your business information and compliance settings
          </p>
        </div>
        <Button
          variant="default"
          onClick={handleSave}
          loading={isLoading}
          iconName="Save"
          iconPosition="left"
          disabled={!selectedCompanyId}
        >
          Save Changes
        </Button>
      </div>

      {/* Company Selector */}
      {companies?.length > 1 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-3">Select Company</h4>
          <div className="flex flex-wrap gap-2">
            {companies?.map(company => (
              <button
                key={company?.id}
                onClick={() => setSelectedCompanyId(company?.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedCompanyId === company?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent text-foreground hover:bg-accent/80'
                }`}
              >
                {company?.name}
                {!company?.is_active && (
                  <span className="ml-1.5 text-xs opacity-70">(Inactive)</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {saveMessage && (
        <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {saveMessage}
        </div>
      )}
      {saveError && (
        <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {saveError}
        </div>
      )}

      {companyData && (
        <>
          {/* Company Logo */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-medium text-foreground mb-4">Company Logo</h4>
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden bg-accent/30">
                {logoPreview ? (
                  <Image src={logoPreview} alt="Company Logo" className="w-full h-full object-contain" />
                ) : (
                  <Icon name="Building2" size={32} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button variant="outline" asChild>
                    <span className="cursor-pointer">
                      <Icon name="Upload" size={16} className="mr-2" />
                      Upload Logo
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  Recommended: 200x200px, PNG or JPG format
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-medium text-foreground mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company Code"
                type="text"
                value={companyData?.code}
                onChange={(e) => handleInputChange('code', e?.target?.value)}
                required
              />
              <Input
                label="Company Name"
                type="text"
                value={companyData?.name}
                onChange={(e) => handleInputChange('name', e?.target?.value)}
                required
              />
              <Input
                label="VAT Number"
                type="text"
                value={companyData?.vat_number}
                onChange={(e) => handleInputChange('vat_number', e?.target?.value)}
                description="VAT registration number"
              />
              <div className="flex items-center gap-3 pt-6">
                <Checkbox
                  label="Active"
                  description="Company is active and operational"
                  checked={companyData?.is_active}
                  onChange={(e) => handleInputChange('is_active', e?.target?.checked)}
                />
              </div>
            </div>
          </div>

          {/* Address & Contact */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-medium text-foreground mb-4">Address & Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Business Address"
                  type="text"
                  value={companyData?.address}
                  onChange={(e) => handleInputChange('address', e?.target?.value)}
                />
              </div>
              <Input
                label="Phone Number"
                type="tel"
                value={companyData?.phone}
                onChange={(e) => handleInputChange('phone', e?.target?.value)}
              />
              <Input
                label="Email Address"
                type="email"
                value={companyData?.email}
                onChange={(e) => handleInputChange('email', e?.target?.value)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CompanyProfileSettings;