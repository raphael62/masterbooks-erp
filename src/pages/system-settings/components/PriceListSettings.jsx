import React, { useState } from 'react';

import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const PriceListSettings = () => {
  const [priceLists, setPriceLists] = useState([
    {
      id: 1,
      name: "Retail Price List",
      code: "RETAIL",
      customerType: "retail",
      isDefault: true,
      isActive: true,
      currency: "GHS",
      vatInclusive: true,
      effectiveDate: "2025-01-01",
      expiryDate: null,
      itemCount: 156,
      description: "Standard retail pricing for walk-in customers"
    },
    {
      id: 2,
      name: "Wholesale Price List",
      code: "WHOLESALE",
      customerType: "wholesale",
      isDefault: false,
      isActive: true,
      currency: "GHS",
      vatInclusive: true,
      effectiveDate: "2025-01-01",
      expiryDate: null,
      itemCount: 156,
      description: "Discounted pricing for wholesale customers"
    },
    {
      id: 3,
      name: "Distributor Price List",
      code: "DISTRIBUTOR",
      customerType: "distributor",
      isDefault: false,
      isActive: true,
      currency: "GHS",
      vatInclusive: true,
      effectiveDate: "2025-01-01",
      expiryDate: "2025-12-31",
      itemCount: 156,
      description: "Special pricing for authorized distributors"
    },
    {
      id: 4,
      name: "Promotional Price List",
      code: "PROMO2025",
      customerType: "all",
      isDefault: false,
      isActive: false,
      currency: "GHS",
      vatInclusive: true,
      effectiveDate: "2025-03-01",
      expiryDate: "2025-03-31",
      itemCount: 45,
      description: "March 2025 promotional pricing"
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    customerType: "retail",
    isActive: true,
    currency: "GHS",
    vatInclusive: true,
    effectiveDate: "",
    expiryDate: "",
    description: ""
  });

  const customerTypes = [
    { value: "retail", label: "Retail Customers" },
    { value: "wholesale", label: "Wholesale Customers" },
    { value: "distributor", label: "Distributors" },
    { value: "vip", label: "VIP Customers" },
    { value: "all", label: "All Customer Types" }
  ];

  const currencies = [
    { value: "GHS", label: "Ghana Cedis (GHS)" },
    { value: "USD", label: "US Dollars (USD)" },
    { value: "EUR", label: "Euros (EUR)" }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddPriceList = () => {
    setFormData({
      name: "",
      code: "",
      customerType: "retail",
      isActive: true,
      currency: "GHS",
      vatInclusive: true,
      effectiveDate: "",
      expiryDate: "",
      description: ""
    });
    setEditingPriceList(null);
    setShowAddForm(true);
  };

  const handleEditPriceList = (priceList) => {
    setFormData({
      name: priceList?.name,
      code: priceList?.code,
      customerType: priceList?.customerType,
      isActive: priceList?.isActive,
      currency: priceList?.currency,
      vatInclusive: priceList?.vatInclusive,
      effectiveDate: priceList?.effectiveDate,
      expiryDate: priceList?.expiryDate || "",
      description: priceList?.description
    });
    setEditingPriceList(priceList);
    setShowAddForm(true);
  };

  const handleSavePriceList = () => {
    if (editingPriceList) {
      setPriceLists(prev => prev?.map(list => 
        list?.id === editingPriceList?.id 
          ? { ...list, ...formData, expiryDate: formData?.expiryDate || null }
          : list
      ));
    } else {
      const newPriceList = {
        id: Date.now(),
        ...formData,
        expiryDate: formData?.expiryDate || null,
        isDefault: false,
        itemCount: 0
      };
      setPriceLists(prev => [...prev, newPriceList]);
    }
    setShowAddForm(false);
    setEditingPriceList(null);
  };

  const handleToggleStatus = (priceListId) => {
    setPriceLists(prev => prev?.map(list =>
      list?.id === priceListId
        ? { ...list, isActive: !list?.isActive }
        : list
    ));
  };

  const handleSetDefault = (priceListId) => {
    setPriceLists(prev => prev?.map(list => ({
      ...list,
      isDefault: list?.id === priceListId
    })));
  };

  const handleDuplicatePriceList = (priceList) => {
    const duplicatedList = {
      id: Date.now(),
      name: `${priceList?.name} (Copy)`,
      code: `${priceList?.code}_COPY`,
      customerType: priceList?.customerType,
      isDefault: false,
      isActive: false,
      currency: priceList?.currency,
      vatInclusive: priceList?.vatInclusive,
      effectiveDate: new Date()?.toISOString()?.split('T')?.[0],
      expiryDate: priceList?.expiryDate,
      itemCount: priceList?.itemCount,
      description: `Copy of ${priceList?.description}`
    };
    setPriceLists(prev => [...prev, duplicatedList]);
  };

  const getCustomerTypeColor = (type) => {
    switch (type) {
      case 'retail': return 'bg-primary/10 text-primary';
      case 'wholesale': return 'bg-secondary/10 text-secondary';
      case 'distributor': return 'bg-warning/10 text-warning';
      case 'vip': return 'bg-success/10 text-success';
      case 'all': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No expiry';
    return new Date(dateString)?.toLocaleDateString('en-GB');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Price List Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage customer-specific pricing and promotional lists
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            iconName="Upload"
            iconPosition="left"
          >
            Import Prices
          </Button>
          <Button 
            variant="default" 
            onClick={handleAddPriceList}
            iconName="Plus"
            iconPosition="left"
          >
            Add Price List
          </Button>
        </div>
      </div>
      {/* Price Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {priceLists?.map((priceList) => (
          <div key={priceList?.id} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-medium text-foreground">{priceList?.name}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCustomerTypeColor(priceList?.customerType)}`}>
                    {priceList?.customerType}
                  </span>
                  {priceList?.isDefault && (
                    <span className="px-2 py-1 text-xs font-medium bg-success/10 text-success rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{priceList?.description}</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Code:</span>
                    <span className="font-mono">{priceList?.code}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Currency:</span>
                    <span>{priceList?.currency}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>VAT Inclusive:</span>
                    <span>{priceList?.vatInclusive ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Items:</span>
                    <span>{priceList?.itemCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Effective:</span>
                    <span>{formatDate(priceList?.effectiveDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Expires:</span>
                    <span className={isExpired(priceList?.expiryDate) ? 'text-error' : ''}>
                      {formatDate(priceList?.expiryDate)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-4">
                <div className={`w-2 h-2 rounded-full ${priceList?.isActive && !isExpired(priceList?.expiryDate) ? 'bg-success' : 'bg-error'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicatePriceList(priceList)}
                  iconName="Copy"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditPriceList(priceList)}
                  iconName="Edit"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStatus(priceList?.id)}
                  iconName={priceList?.isActive ? "Pause" : "Play"}
                />
              </div>
              <div className="flex items-center space-x-2">
                {!priceList?.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(priceList?.id)}
                    iconName="Star"
                  />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Settings"
                >
                  Manage Items
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Add/Edit Price List Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-400 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {editingPriceList ? 'Edit Price List' : 'Add New Price List'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Price List Name"
                  type="text"
                  value={formData?.name}
                  onChange={(e) => handleInputChange('name', e?.target?.value)}
                  required
                />
                <Input
                  label="Price List Code"
                  type="text"
                  value={formData?.code}
                  onChange={(e) => handleInputChange('code', e?.target?.value?.toUpperCase())}
                  description="Unique identifier for this price list"
                  required
                />
              </div>
              
              <Input
                label="Description"
                type="text"
                value={formData?.description}
                onChange={(e) => handleInputChange('description', e?.target?.value)}
                description="Brief description of this price list's purpose"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Customer Type"
                  options={customerTypes}
                  value={formData?.customerType}
                  onChange={(value) => handleInputChange('customerType', value)}
                  required
                />
                <Select
                  label="Currency"
                  options={currencies}
                  value={formData?.currency}
                  onChange={(value) => handleInputChange('currency', value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Effective Date"
                  type="date"
                  value={formData?.effectiveDate}
                  onChange={(e) => handleInputChange('effectiveDate', e?.target?.value)}
                  required
                />
                <Input
                  label="Expiry Date"
                  type="date"
                  value={formData?.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e?.target?.value)}
                  description="Leave empty for no expiry"
                />
              </div>
              
              <div className="space-y-3">
                <Checkbox
                  label="Price List is Active"
                  description="Active price lists are available for use"
                  checked={formData?.isActive}
                  onChange={(e) => handleInputChange('isActive', e?.target?.checked)}
                />
                <Checkbox
                  label="VAT Inclusive Pricing"
                  description="All prices in this list include VAT"
                  checked={formData?.vatInclusive}
                  onChange={(e) => handleInputChange('vatInclusive', e?.target?.checked)}
                />
              </div>
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
                onClick={handleSavePriceList}
                iconName="Save"
                iconPosition="left"
              >
                {editingPriceList ? 'Update Price List' : 'Create Price List'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceListSettings;