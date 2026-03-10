import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import CustomerSelector from './CustomerSelector';
import LineItemManager from './LineItemManager';

const InvoiceFormPanel = ({ invoiceData, onInvoiceUpdate, onPreviewInvoice, isOffline }) => {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const handleFieldChange = (field, value) => {
    onInvoiceUpdate({ [field]: value });
  };

  const handleCustomerSelect = (customer) => {
    handleFieldChange('customer', customer);
    setIsCustomerModalOpen(false);
  };

  const handleLineItemsUpdate = (lineItems) => {
    handleFieldChange('lineItems', lineItems);
  };

  const handleSalesOrderConversion = () => {
    // Mock conversion from sales order
    const mockOrderItems = [
      {
        id: '1',
        product: 'Premium Widget A',
        description: 'High-quality widget with advanced features',
        quantity: 2,
        unitPrice: 150.00,
        vatRate: 0.125,
        discount: 0
      },
      {
        id: '2',
        product: 'Standard Widget B',
        description: 'Standard quality widget for general use',
        quantity: 5,
        unitPrice: 80.00,
        vatRate: 0.125,
        discount: 10
      }
    ];
    handleLineItemsUpdate(mockOrderItems);
  };

  const calculateTotals = () => {
    const subtotal = invoiceData?.lineItems?.reduce((sum, item) => {
      const lineTotal = item?.quantity * item?.unitPrice;
      const discountAmount = (lineTotal * (item?.discount || 0)) / 100;
      return sum + (lineTotal - discountAmount);
    }, 0) || 0;

    const vatAmount = invoiceData?.lineItems?.reduce((sum, item) => {
      const lineTotal = item?.quantity * item?.unitPrice;
      const discountAmount = (lineTotal * (item?.discount || 0)) / 100;
      const netAmount = lineTotal - discountAmount;
      return sum + (netAmount * (item?.vatRate || 0));
    }, 0) || 0;

    const total = subtotal + vatAmount;

    return { subtotal, vatAmount, total };
  };

  const { subtotal, vatAmount, total } = calculateTotals();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {invoiceData?.id ? `Edit Invoice ${invoiceData?.id}` : 'Create New Invoice'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Fill in the details to create or update an invoice
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleSalesOrderConversion}
              className="flex items-center space-x-2"
            >
              <Icon name="FileText" size={16} />
              <span className="hidden sm:inline">From Order</span>
            </Button>
            <Button
              onClick={onPreviewInvoice}
              className="flex items-center space-x-2"
            >
              <Icon name="Eye" size={16} />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          </div>
        </div>
      </div>
      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Customer Selection */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">Customer Information</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCustomerModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <Icon name="User" size={16} />
                <span>Select Customer</span>
              </Button>
            </div>

            {invoiceData?.customer ? (
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{invoiceData?.customer?.name}</h4>
                    <p className="text-sm text-muted-foreground">{invoiceData?.customer?.email}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {invoiceData?.customer?.address}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFieldChange('customer', null)}
                  >
                    <Icon name="X" size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                <Icon name="UserPlus" size={48} className="mx-auto mb-4 opacity-50" />
                <p>No customer selected</p>
                <p className="text-sm">Click "Select Customer" to choose a customer</p>
              </div>
            )}
          </div>

          {/* Invoice Details */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Invoice Number"
                value={invoiceData?.invoiceNumber || ''}
                onChange={(e) => handleFieldChange('invoiceNumber', e?.target?.value)}
                placeholder="Auto-generated"
                disabled
              />
              <Input
                label="Due Date"
                type="date"
                value={invoiceData?.dueDate || ''}
                onChange={(e) => handleFieldChange('dueDate', e?.target?.value)}
              />
              <Select
                label="Payment Terms"
                value={invoiceData?.paymentTerms || 'net30'}
                onValueChange={(value) => handleFieldChange('paymentTerms', value)}
                options={[
                  { value: 'immediate', label: 'Due Immediately' },
                  { value: 'net15', label: 'Net 15 Days' },
                  { value: 'net30', label: 'Net 30 Days' },
                  { value: 'net60', label: 'Net 60 Days' }
                ]}
              />
              <Select
                label="Currency"
                value={invoiceData?.currency || 'GHS'}
                onValueChange={(value) => handleFieldChange('currency', value)}
                options={[
                  { value: 'GHS', label: 'Ghana Cedi (GHS)' },
                  { value: 'USD', label: 'US Dollar (USD)' },
                  { value: 'EUR', label: 'Euro (EUR)' }
                ]}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Line Items</h3>
            <LineItemManager
              lineItems={invoiceData?.lineItems || []}
              onLineItemsUpdate={handleLineItemsUpdate}
            />
          </div>

          {/* Totals Summary */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Invoice Summary</h3>
            <div className="space-y-2 text-right max-w-md ml-auto">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span>GHS {subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>VAT (12.5%):</span>
                <span>GHS {vatAmount?.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between text-lg font-semibold text-foreground">
                  <span>Total:</span>
                  <span>GHS {total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Additional Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
                <textarea
                  value={invoiceData?.notes || ''}
                  onChange={(e) => handleFieldChange('notes', e?.target?.value)}
                  placeholder="Add any additional notes or terms..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" disabled={isOffline}>
                  <Icon name="Save" size={16} className="mr-2" />
                  Save Draft
                </Button>
                <Button variant="default" disabled={!invoiceData?.customer || !invoiceData?.lineItems?.length}>
                  <Icon name="Send" size={16} className="mr-2" />
                  Send Invoice
                </Button>
                <Button variant="outline">
                  <Icon name="Download" size={16} className="mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Customer Selection Modal */}
      {isCustomerModalOpen && (
        <CustomerSelector
          onCustomerSelect={handleCustomerSelect}
          onClose={() => setIsCustomerModalOpen(false)}
        />
      )}
    </div>
  );
};

export default InvoiceFormPanel;