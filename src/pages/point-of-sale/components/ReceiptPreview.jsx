import React from 'react';
import Icon from '../../../components/AppIcon';

const ReceiptPreview = ({ isVisible, receiptData, onClose, onPrint, onEmail }) => {
  if (!isVisible || !receiptData) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    })?.format(amount);
  };

  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })?.format(date);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-300 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-modal w-full max-w-md animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-medium text-card-foreground">Receipt Preview</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-accent transition-colors duration-150 ease-out"
          >
            <Icon name="X" size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="bg-white text-black p-4 font-mono text-sm border border-border rounded">
            {/* Store Header */}
            <div className="text-center mb-4">
              <div className="font-bold text-lg">MASTERBOOKS ERP</div>
              <div>Point of Sale System</div>
              <div>Accra, Ghana</div>
              <div>Tel: +233 20 123 4567</div>
              <div className="border-t border-black mt-2 pt-2">
                Receipt #{receiptData?.receiptNumber}
              </div>
            </div>

            {/* Transaction Details */}
            <div className="mb-4">
              <div>Date: {formatDateTime(receiptData?.timestamp)}</div>
              <div>Cashier: {receiptData?.cashier}</div>
              <div>Shift: {receiptData?.shiftNumber}</div>
            </div>

            {/* Items */}
            <div className="border-t border-black pt-2 mb-4">
              {receiptData?.items?.map((item, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between">
                    <span className="truncate mr-2">{item?.name}</span>
                    <span>{formatCurrency(item?.price * item?.quantity)}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {item?.quantity} x {formatCurrency(item?.price)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-black pt-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(receiptData?.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (15%):</span>
                <span>{formatCurrency(receiptData?.vat)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-black pt-1">
                <span>TOTAL:</span>
                <span>{formatCurrency(receiptData?.total)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-t border-black pt-2 mb-4">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="capitalize">{receiptData?.paymentMethod?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span>{formatCurrency(receiptData?.amountPaid)}</span>
              </div>
              {receiptData?.change > 0 && (
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span>{formatCurrency(receiptData?.change)}</span>
                </div>
              )}
              {receiptData?.chequeNumber && (
                <div className="flex justify-between">
                  <span>Cheque #:</span>
                  <span>{receiptData?.chequeNumber}</span>
                </div>
              )}
              {receiptData?.mobileMoneyId && (
                <div className="flex justify-between">
                  <span>Mobile Money ID:</span>
                  <span>{receiptData?.mobileMoneyId}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-xs border-t border-black pt-2">
              <div>Thank you for your business!</div>
              <div>Goods sold are not returnable</div>
              <div className="mt-2">
                Powered by MasterBooks ERP
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onPrint}
              className="flex items-center justify-center space-x-2 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-150 ease-out"
            >
              <Icon name="Printer" size={16} />
              <span>Print</span>
            </button>
            
            <button
              onClick={onEmail}
              className="flex items-center justify-center space-x-2 py-2 px-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors duration-150 ease-out"
            >
              <Icon name="Mail" size={16} />
              <span>Email</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;