import React, { useState } from 'react';

import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const TaxConfigurationSettings = () => {
  const [taxSettings, setTaxSettings] = useState({
    defaultVatRate: 15.0,
    vatInclusive: true,
    nhilRate: 2.5,
    getfundRate: 2.5,
    covidLevyRate: 1.0,
    enableVatExemption: true,
    vatExemptionThreshold: 200000,
    taxPeriod: "monthly",
    vatRegistrationNumber: "VAT-GH-123456789",
    enableAutomaticTaxCalculation: true
  });

  const [taxRates, setTaxRates] = useState([
    {
      id: 1,
      name: "Standard VAT",
      type: "vat",
      rate: 15.0,
      isDefault: true,
      isActive: true,
      description: "Standard VAT rate for most goods and services"
    },
    {
      id: 2,
      name: "Zero-rated VAT",
      type: "vat",
      rate: 0.0,
      isDefault: false,
      isActive: true,
      description: "VAT-free items like basic food items"
    },
    {
      id: 3,
      name: "NHIL",
      type: "levy",
      rate: 2.5,
      isDefault: true,
      isActive: true,
      description: "National Health Insurance Levy"
    },
    {
      id: 4,
      name: "GETFund Levy",
      type: "levy",
      rate: 2.5,
      isDefault: true,
      isActive: true,
      description: "Ghana Education Trust Fund Levy"
    },
    {
      id: 5,
      name: "COVID-19 Health Recovery Levy",
      type: "levy",
      rate: 1.0,
      isDefault: true,
      isActive: true,
      description: "COVID-19 Health Recovery Levy"
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "vat",
    rate: 0,
    isActive: true,
    description: ""
  });

  const taxTypes = [
    { value: "vat", label: "VAT (Value Added Tax)" },
    { value: "levy", label: "Levy" },
    { value: "withholding", label: "Withholding Tax" },
    { value: "excise", label: "Excise Duty" }
  ];

  const taxPeriods = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "annually", label: "Annually" }
  ];

  const handleSettingChange = (field, value) => {
    setTaxSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddRate = () => {
    setFormData({
      name: "",
      type: "vat",
      rate: 0,
      isActive: true,
      description: ""
    });
    setEditingRate(null);
    setShowAddForm(true);
  };

  const handleEditRate = (rate) => {
    setFormData({
      name: rate?.name,
      type: rate?.type,
      rate: rate?.rate,
      isActive: rate?.isActive,
      description: rate?.description
    });
    setEditingRate(rate);
    setShowAddForm(true);
  };

  const handleSaveRate = () => {
    if (editingRate) {
      setTaxRates(prev => prev?.map(rate => 
        rate?.id === editingRate?.id 
          ? { ...rate, ...formData }
          : rate
      ));
    } else {
      const newRate = {
        id: Date.now(),
        ...formData,
        isDefault: false
      };
      setTaxRates(prev => [...prev, newRate]);
    }
    setShowAddForm(false);
    setEditingRate(null);
  };

  const handleToggleStatus = (rateId) => {
    setTaxRates(prev => prev?.map(rate =>
      rate?.id === rateId
        ? { ...rate, isActive: !rate?.isActive }
        : rate
    ));
  };

  const handleSetDefault = (rateId, type) => {
    setTaxRates(prev => prev?.map(rate => ({
      ...rate,
      isDefault: rate?.id === rateId && rate?.type === type
    })));
  };

  const getTaxTypeColor = (type) => {
    switch (type) {
      case 'vat': return 'bg-primary/10 text-primary';
      case 'levy': return 'bg-warning/10 text-warning';
      case 'withholding': return 'bg-secondary/10 text-secondary';
      case 'excise': return 'bg-error/10 text-error';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleSaveSettings = () => {
    console.log('Tax settings saved:', taxSettings);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Tax Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure VAT rates, levies, and tax compliance settings
          </p>
        </div>
        <Button 
          variant="default" 
          onClick={handleSaveSettings}
          iconName="Save"
          iconPosition="left"
        >
          Save Settings
        </Button>
      </div>
      {/* General Tax Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-medium text-foreground mb-4">General Tax Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Default VAT Rate (%)"
            type="number"
            step="0.1"
            value={taxSettings?.defaultVatRate}
            onChange={(e) => handleSettingChange('defaultVatRate', parseFloat(e?.target?.value))}
            description="Standard VAT rate for Ghana"
            required
          />
          <Input
            label="VAT Registration Number"
            type="text"
            value={taxSettings?.vatRegistrationNumber}
            onChange={(e) => handleSettingChange('vatRegistrationNumber', e?.target?.value)}
            required
          />
          <Input
            label="VAT Exemption Threshold (GHS)"
            type="number"
            value={taxSettings?.vatExemptionThreshold}
            onChange={(e) => handleSettingChange('vatExemptionThreshold', parseFloat(e?.target?.value))}
            description="Annual turnover threshold for VAT exemption"
          />
          <Select
            label="Tax Period"
            options={taxPeriods}
            value={taxSettings?.taxPeriod}
            onChange={(value) => handleSettingChange('taxPeriod', value)}
            description="Tax reporting period"
          />
        </div>
        
        <div className="mt-6 space-y-4">
          <Checkbox
            label="VAT Inclusive Pricing"
            description="All prices include VAT by default"
            checked={taxSettings?.vatInclusive}
            onChange={(e) => handleSettingChange('vatInclusive', e?.target?.checked)}
          />
          <Checkbox
            label="Enable VAT Exemption"
            description="Allow VAT-exempt transactions for eligible customers"
            checked={taxSettings?.enableVatExemption}
            onChange={(e) => handleSettingChange('enableVatExemption', e?.target?.checked)}
          />
          <Checkbox
            label="Automatic Tax Calculation"
            description="Automatically calculate taxes on transactions"
            checked={taxSettings?.enableAutomaticTaxCalculation}
            onChange={(e) => handleSettingChange('enableAutomaticTaxCalculation', e?.target?.checked)}
          />
        </div>
      </div>
      {/* Levy Rates */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-medium text-foreground mb-4">Ghana Tax Levies</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="NHIL Rate (%)"
            type="number"
            step="0.1"
            value={taxSettings?.nhilRate}
            onChange={(e) => handleSettingChange('nhilRate', parseFloat(e?.target?.value))}
            description="National Health Insurance Levy"
          />
          <Input
            label="GETFund Rate (%)"
            type="number"
            step="0.1"
            value={taxSettings?.getfundRate}
            onChange={(e) => handleSettingChange('getfundRate', parseFloat(e?.target?.value))}
            description="Ghana Education Trust Fund Levy"
          />
          <Input
            label="COVID Levy Rate (%)"
            type="number"
            step="0.1"
            value={taxSettings?.covidLevyRate}
            onChange={(e) => handleSettingChange('covidLevyRate', parseFloat(e?.target?.value))}
            description="COVID-19 Health Recovery Levy"
          />
        </div>
      </div>
      {/* Tax Rates Management */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Tax Rates & Levies</h4>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAddRate}
              iconName="Plus"
              iconPosition="left"
            >
              Add Tax Rate
            </Button>
          </div>
        </div>
        <div className="divide-y divide-border">
          {taxRates?.map((rate) => (
            <div key={rate?.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h5 className="font-medium text-foreground">{rate?.name}</h5>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTaxTypeColor(rate?.type)}`}>
                      {rate?.type?.toUpperCase()}
                    </span>
                    {rate?.isDefault && (
                      <span className="px-2 py-1 text-xs font-medium bg-success/10 text-success rounded-full">
                        Default
                      </span>
                    )}
                    <div className={`w-2 h-2 rounded-full ${rate?.isActive ? 'bg-success' : 'bg-error'}`} />
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-2">
                    <div>
                      <span className="font-medium">Rate:</span> {rate?.rate}%
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {rate?.type}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{rate?.description}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRate(rate)}
                    iconName="Edit"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(rate?.id)}
                    iconName={rate?.isActive ? "Pause" : "Play"}
                  />
                  {!rate?.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(rate?.id, rate?.type)}
                      iconName="Star"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Add/Edit Tax Rate Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-400 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-modal w-full max-w-lg">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {editingRate ? 'Edit Tax Rate' : 'Add Tax Rate'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  iconName="X"
                />
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <Input
                label="Tax Name"
                type="text"
                value={formData?.name}
                onChange={(e) => handleInputChange('name', e?.target?.value)}
                required
              />
              
              <Select
                label="Tax Type"
                options={taxTypes}
                value={formData?.type}
                onChange={(value) => handleInputChange('type', value)}
                required
              />
              
              <Input
                label="Tax Rate (%)"
                type="number"
                step="0.1"
                value={formData?.rate}
                onChange={(e) => handleInputChange('rate', parseFloat(e?.target?.value))}
                required
              />
              
              <Input
                label="Description"
                type="text"
                value={formData?.description}
                onChange={(e) => handleInputChange('description', e?.target?.value)}
                description="Brief description of this tax rate"
              />
              
              <Checkbox
                label="Tax Rate is Active"
                description="Active rates are available for calculations"
                checked={formData?.isActive}
                onChange={(e) => handleInputChange('isActive', e?.target?.checked)}
              />
            </div>
            
            <div className="p-6 border-t border-border flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSaveRate}
                iconName="Save"
                iconPosition="left"
              >
                {editingRate ? 'Update Rate' : 'Add Rate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxConfigurationSettings;