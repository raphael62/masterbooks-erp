import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const PaymentMethodSettings = () => {
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      name: "Cash",
      type: "cash",
      isActive: true,
      isDefault: true,
      requiresReference: false,
      allowPartialPayment: true,
      config: {}
    },
    {
      id: 2,
      name: "GCB Bank Account",
      type: "bank",
      isActive: true,
      isDefault: false,
      requiresReference: true,
      allowPartialPayment: true,
      config: {
        accountNumber: "1234567890",
        accountName: "MasterBooks Distribution Ltd",
        bankName: "GCB Bank Limited",
        branchCode: "GH123"
      }
    },
    {
      id: 3,
      name: "MTN Mobile Money",
      type: "mobile_money",
      isActive: true,
      isDefault: false,
      requiresReference: true,
      allowPartialPayment: false,
      config: {
        merchantId: "MTN123456",
        apiKey: "••••••••••••••••",
        walletNumber: "024-123-4567"
      }
    },
    {
      id: 4,
      name: "Cheque Payments",
      type: "cheque",
      isActive: true,
      isDefault: false,
      requiresReference: true,
      allowPartialPayment: false,
      config: {
        clearingDays: 3,
        requireBankDetails: true
      }
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "cash",
    isActive: true,
    requiresReference: false,
    allowPartialPayment: true,
    config: {}
  });

  const paymentTypes = [
    { value: "cash", label: "Cash Payment" },
    { value: "bank", label: "Bank Transfer" },
    { value: "mobile_money", label: "Mobile Money" },
    { value: "cheque", label: "Cheque Payment" },
    { value: "card", label: "Card Payment" },
    { value: "credit", label: "Credit Account" }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfigChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev?.config,
        [field]: value
      }
    }));
  };

  const handleAddMethod = () => {
    setFormData({
      name: "",
      type: "cash",
      isActive: true,
      requiresReference: false,
      allowPartialPayment: true,
      config: {}
    });
    setEditingMethod(null);
    setShowAddForm(true);
  };

  const handleEditMethod = (method) => {
    setFormData({
      name: method?.name,
      type: method?.type,
      isActive: method?.isActive,
      requiresReference: method?.requiresReference,
      allowPartialPayment: method?.allowPartialPayment,
      config: { ...method?.config }
    });
    setEditingMethod(method);
    setShowAddForm(true);
  };

  const handleSaveMethod = () => {
    if (editingMethod) {
      setPaymentMethods(prev => prev?.map(method => 
        method?.id === editingMethod?.id 
          ? { ...method, ...formData }
          : method
      ));
    } else {
      const newMethod = {
        id: Date.now(),
        ...formData,
        isDefault: false
      };
      setPaymentMethods(prev => [...prev, newMethod]);
    }
    setShowAddForm(false);
    setEditingMethod(null);
  };

  const handleToggleStatus = (methodId) => {
    setPaymentMethods(prev => prev?.map(method =>
      method?.id === methodId
        ? { ...method, isActive: !method?.isActive }
        : method
    ));
  };

  const handleSetDefault = (methodId) => {
    setPaymentMethods(prev => prev?.map(method => ({
      ...method,
      isDefault: method?.id === methodId
    })));
  };

  const getMethodIcon = (type) => {
    switch (type) {
      case 'cash': return 'Banknote';
      case 'bank': return 'Building2';
      case 'mobile_money': return 'Smartphone';
      case 'cheque': return 'FileText';
      case 'card': return 'CreditCard';
      case 'credit': return 'Clock';
      default: return 'DollarSign';
    }
  };

  const getMethodColor = (type) => {
    switch (type) {
      case 'cash': return 'bg-success/10 text-success';
      case 'bank': return 'bg-primary/10 text-primary';
      case 'mobile_money': return 'bg-warning/10 text-warning';
      case 'cheque': return 'bg-secondary/10 text-secondary';
      case 'card': return 'bg-error/10 text-error';
      case 'credit': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const renderConfigFields = () => {
    switch (formData?.type) {
      case 'bank':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Account Number"
                type="text"
                value={formData?.config?.accountNumber || ''}
                onChange={(e) => handleConfigChange('accountNumber', e?.target?.value)}
                required
              />
              <Input
                label="Account Name"
                type="text"
                value={formData?.config?.accountName || ''}
                onChange={(e) => handleConfigChange('accountName', e?.target?.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Bank Name"
                type="text"
                value={formData?.config?.bankName || ''}
                onChange={(e) => handleConfigChange('bankName', e?.target?.value)}
                required
              />
              <Input
                label="Branch Code"
                type="text"
                value={formData?.config?.branchCode || ''}
                onChange={(e) => handleConfigChange('branchCode', e?.target?.value)}
              />
            </div>
          </div>
        );
      
      case 'mobile_money':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Merchant ID"
                type="text"
                value={formData?.config?.merchantId || ''}
                onChange={(e) => handleConfigChange('merchantId', e?.target?.value)}
                required
              />
              <Input
                label="Wallet Number"
                type="tel"
                value={formData?.config?.walletNumber || ''}
                onChange={(e) => handleConfigChange('walletNumber', e?.target?.value)}
                required
              />
            </div>
            <Input
              label="API Key"
              type="password"
              value={formData?.config?.apiKey || ''}
              onChange={(e) => handleConfigChange('apiKey', e?.target?.value)}
              description="Keep this secure and never share"
            />
          </div>
        );
      
      case 'cheque':
        return (
          <div className="space-y-4">
            <Input
              label="Clearing Days"
              type="number"
              value={formData?.config?.clearingDays || 3}
              onChange={(e) => handleConfigChange('clearingDays', parseInt(e?.target?.value))}
              description="Number of days for cheque to clear"
            />
            <Checkbox
              label="Require Bank Details"
              description="Collect bank details for cheque verification"
              checked={formData?.config?.requireBankDetails || false}
              onChange={(e) => handleConfigChange('requireBankDetails', e?.target?.checked)}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Payment Methods</h3>
          <p className="text-sm text-muted-foreground">
            Configure payment methods and processing settings
          </p>
        </div>
        <Button 
          variant="default" 
          onClick={handleAddMethod}
          iconName="Plus"
          iconPosition="left"
        >
          Add Payment Method
        </Button>
      </div>
      {/* Payment Methods List */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h4 className="font-medium text-foreground">Configured Payment Methods</h4>
        </div>
        <div className="divide-y divide-border">
          {paymentMethods?.map((method) => (
            <div key={method?.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${getMethodColor(method?.type)}`}>
                    <Icon name={getMethodIcon(method?.type)} size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="font-medium text-foreground">{method?.name}</h5>
                      {method?.isDefault && (
                        <span className="px-2 py-1 text-xs font-medium bg-success/10 text-success rounded-full">
                          Default
                        </span>
                      )}
                      <div className={`w-2 h-2 rounded-full ${method?.isActive ? 'bg-success' : 'bg-error'}`} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                      <div>
                        <span className="font-medium">Type:</span> {method?.type?.replace('_', ' ')}
                      </div>
                      <div>
                        <span className="font-medium">Reference:</span> {method?.requiresReference ? 'Required' : 'Optional'}
                      </div>
                      <div>
                        <span className="font-medium">Partial:</span> {method?.allowPartialPayment ? 'Allowed' : 'Not Allowed'}
                      </div>
                    </div>
                    {method?.type === 'bank' && method?.config?.accountNumber && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Account:</span> {method?.config?.accountNumber} ({method?.config?.bankName})
                      </div>
                    )}
                    {method?.type === 'mobile_money' && method?.config?.walletNumber && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Wallet:</span> {method?.config?.walletNumber}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditMethod(method)}
                    iconName="Edit"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(method?.id)}
                    iconName={method?.isActive ? "Pause" : "Play"}
                  />
                  {!method?.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(method?.id)}
                      iconName="Star"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Add/Edit Payment Method Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-400 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
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
                  label="Method Name"
                  type="text"
                  value={formData?.name}
                  onChange={(e) => handleInputChange('name', e?.target?.value)}
                  required
                />
                <Select
                  label="Payment Type"
                  options={paymentTypes}
                  value={formData?.type}
                  onChange={(value) => handleInputChange('type', value)}
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Checkbox
                  label="Method is Active"
                  description="Active methods are available for transactions"
                  checked={formData?.isActive}
                  onChange={(e) => handleInputChange('isActive', e?.target?.checked)}
                />
                <Checkbox
                  label="Require Reference Number"
                  description="Require reference/transaction ID for this payment method"
                  checked={formData?.requiresReference}
                  onChange={(e) => handleInputChange('requiresReference', e?.target?.checked)}
                />
                <Checkbox
                  label="Allow Partial Payments"
                  description="Allow customers to make partial payments"
                  checked={formData?.allowPartialPayment}
                  onChange={(e) => handleInputChange('allowPartialPayment', e?.target?.checked)}
                />
              </div>
              
              {renderConfigFields()}
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
                onClick={handleSaveMethod}
                iconName="Save"
                iconPosition="left"
              >
                {editingMethod ? 'Update Method' : 'Add Method'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSettings;