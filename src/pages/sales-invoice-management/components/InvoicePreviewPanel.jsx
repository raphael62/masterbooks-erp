import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const InvoicePreviewPanel = ({ invoiceData, isOffline }) => {
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Mock PDF generation
    alert('PDF generation would be implemented here');
  };

  const mockCompanyInfo = {
    name: 'MasterBooks ERP Solutions',
    address: '123 Business District, Accra, Ghana',
    phone: '+233 20 123 4567',
    email: 'info@masterbooks.gh',
    website: 'www.masterbooks.gh',
    vatNumber: 'VAT-GH-123456789'
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Invoice Preview</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center space-x-2"
            >
              <Icon name="Printer" size={16} />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isOffline}
              className="flex items-center space-x-2"
            >
              <Icon name="Download" size={16} />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>

        {/* Payment Status */}
        {invoiceData?.status && (
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${
              invoiceData?.status === 'paid' ? 'bg-green-500' :
              invoiceData?.status === 'sent' ? 'bg-purple-700' :
              invoiceData?.status === 'overdue'? 'bg-red-500' : 'bg-gray-500'
            }`} />
            <span className="text-muted-foreground">
              Status: <span className="font-medium text-foreground">{invoiceData?.status?.toUpperCase()}</span>
            </span>
          </div>
        )}
      </div>
      {/* Invoice Preview Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto bg-white border border-border rounded-lg shadow-sm">
          {/* Invoice Header */}
          <div className="p-8 pb-6">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <div className="text-sm text-gray-600">
                  <p>Invoice #: {invoiceData?.invoiceNumber || 'INV-2025-001'}</p>
                  <p>Date: {new Date()?.toLocaleDateString('en-GB')}</p>
                  <p>Due Date: {invoiceData?.dueDate ? new Date(invoiceData?.dueDate)?.toLocaleDateString('en-GB') : 'Not set'}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-gray-900">{mockCompanyInfo?.name}</h2>
                <div className="text-sm text-gray-600 mt-2">
                  <p>{mockCompanyInfo?.address}</p>
                  <p>{mockCompanyInfo?.phone}</p>
                  <p>{mockCompanyInfo?.email}</p>
                  <p className="mt-1 font-medium">VAT: {mockCompanyInfo?.vatNumber}</p>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="border-t border-b border-gray-200 py-4 mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-2">BILL TO:</h3>
              {invoiceData?.customer ? (
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{invoiceData?.customer?.name}</p>
                  <p>{invoiceData?.customer?.email}</p>
                  <p>{invoiceData?.customer?.address}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No customer selected</p>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="px-8 pb-6">
            {invoiceData?.lineItems?.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoiceData?.lineItems?.map((item, index) => {
                      const lineTotal = item?.quantity * item?.unitPrice;
                      const discountAmount = (lineTotal * (item?.discount || 0)) / 100;
                      const netAmount = lineTotal - discountAmount;

                      return (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item?.product}</p>
                              {item?.description && (
                                <p className="text-sm text-gray-600">{item?.description}</p>
                              )}
                              {item?.discount > 0 && (
                                <p className="text-xs text-green-600">Discount: {item?.discount}%</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">{item?.quantity}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            GHS {item?.unitPrice?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            GHS {netAmount?.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Icon name="Package" size={48} className="mx-auto mb-4 opacity-30" />
                <p>No items added to invoice</p>
                <p className="text-sm">Add line items to see the preview</p>
              </div>
            )}

            {/* Totals */}
            {invoiceData?.lineItems?.length > 0 && (
              <div className="mt-6 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">GHS {subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">VAT (12.5%):</span>
                    <span className="text-gray-900">GHS {vatAmount?.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">GHS {total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {invoiceData?.notes && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Notes:</h3>
                <p className="text-sm text-gray-600">{invoiceData?.notes}</p>
              </div>
            )}

            {/* Payment Terms */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500">
              <p><strong>Payment Terms:</strong> {invoiceData?.paymentTerms === 'immediate' ? 'Due Immediately' : 
                 invoiceData?.paymentTerms === 'net15' ? 'Net 15 Days' :
                 invoiceData?.paymentTerms === 'net30' ? 'Net 30 Days' :
                 invoiceData?.paymentTerms === 'net60' ? 'Net 60 Days' : 'Net 30 Days'}</p>
              <p className="mt-1">Thank you for your business!</p>
            </div>
          </div>
        </div>

        {/* Payment Tracking Section */}
        {invoiceData?.status && invoiceData?.status !== 'draft' && (
          <div className="mt-6 max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Payment Tracking</h3>
              
              <div className="space-y-4">
                {/* Payment Status Timeline */}
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    invoiceData?.status === 'paid' ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`} />
                  <span className="text-sm text-muted-foreground">Invoice sent</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date()?.toLocaleDateString('en-GB')}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    invoiceData?.status === 'paid' ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`} />
                  <span className="text-sm text-muted-foreground">Payment received</span>
                  {invoiceData?.status === 'paid' && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date()?.toLocaleDateString('en-GB')}
                    </span>
                  )}
                </div>

                {/* Outstanding Balance */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Outstanding Balance:</span>
                    <span className={`font-bold ${
                      invoiceData?.status === 'paid' ? 'text-green-600' : 
                      invoiceData?.status === 'overdue' ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {invoiceData?.status === 'paid' ? 'GHS 0.00' : `GHS ${total?.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePreviewPanel;