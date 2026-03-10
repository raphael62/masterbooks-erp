import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const PaymentPanel = ({ total, onProcessPayment, onPrintReceipt }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tenderAmount, setTenderAmount] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [mobileMoneyId, setMobileMoneyId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    { value: 'cash', label: 'Cash Payment' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'card', label: 'Card Payment' }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    })?.format(amount);
  };

  const calculateChange = () => {
    const tender = parseFloat(tenderAmount) || 0;
    return Math.max(0, tender - total);
  };

  const isPaymentValid = () => {
    const tender = parseFloat(tenderAmount) || 0;
    
    switch (paymentMethod) {
      case 'cash':
        return tender >= total;
      case 'cheque':
        return tender >= total && chequeNumber?.trim()?.length > 0;
      case 'mobile_money':
        return tender >= total && mobileMoneyId?.trim()?.length > 0;
      case 'card':
        return tender >= total;
      default:
        return false;
    }
  };

  const handleProcessPayment = async () => {
    if (!isPaymentValid()) return;

    setIsProcessing(true);
    
    const paymentData = {
      method: paymentMethod,
      amount: parseFloat(tenderAmount),
      total,
      change: calculateChange(),
      chequeNumber: paymentMethod === 'cheque' ? chequeNumber : null,
      mobileMoneyId: paymentMethod === 'mobile_money' ? mobileMoneyId : null,
      customerEmail: customerEmail?.trim() || null,
      timestamp: new Date()
    };

    try {
      await onProcessPayment(paymentData);
      // Reset form after successful payment
      setTenderAmount('');
      setChequeNumber('');
      setMobileMoneyId('');
      setCustomerEmail('');
    } catch (error) {
      console.error('Payment processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmountButtons = [
    { label: 'Exact', amount: total },
    { label: '+5', amount: total + 5 },
    { label: '+10', amount: total + 10 },
    { label: '+20', amount: total + 20 }
  ];

  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-lg">
      {/* Payment Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-medium text-card-foreground mb-2">Payment Processing</h3>
        <div className="text-2xl font-mono text-success">
          Total: {formatCurrency(total)}
        </div>
      </div>
      {/* Payment Form */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Payment Method Selection */}
        <Select
          label="Payment Method"
          options={paymentMethods}
          value={paymentMethod}
          onChange={setPaymentMethod}
        />

        {/* Tender Amount */}
        <div>
          <Input
            label="Tender Amount"
            type="number"
            placeholder="0.00"
            value={tenderAmount}
            onChange={(e) => setTenderAmount(e?.target?.value)}
            step="0.01"
            min="0"
          />
          
          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2 mt-2">
            {quickAmountButtons?.map((button) => (
              <button
                key={button?.label}
                onClick={() => setTenderAmount(button?.amount?.toString())}
                className="px-3 py-2 text-sm bg-muted hover:bg-accent rounded-md transition-colors duration-150 ease-out"
              >
                {button?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Payment Fields */}
        {paymentMethod === 'cheque' && (
          <Input
            label="Cheque Number"
            type="text"
            placeholder="Enter cheque number"
            value={chequeNumber}
            onChange={(e) => setChequeNumber(e?.target?.value)}
            required
          />
        )}

        {paymentMethod === 'mobile_money' && (
          <Input
            label="Mobile Money Transaction ID"
            type="text"
            placeholder="Enter transaction ID"
            value={mobileMoneyId}
            onChange={(e) => setMobileMoneyId(e?.target?.value)}
            required
          />
        )}

        {/* Customer Email for Receipt */}
        <Input
          label="Customer Email (Optional)"
          type="email"
          placeholder="customer@example.com"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e?.target?.value)}
          description="For digital receipt delivery"
        />

        {/* Change Calculation */}
        {paymentMethod === 'cash' && tenderAmount && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Change Due:</span>
              <span className="text-lg font-mono text-foreground">
                {formatCurrency(calculateChange())}
              </span>
            </div>
          </div>
        )}

        {/* Payment Validation */}
        {tenderAmount && parseFloat(tenderAmount) < total && (
          <div className="flex items-center space-x-2 text-error text-sm">
            <Icon name="AlertCircle" size={16} />
            <span>Tender amount is less than total</span>
          </div>
        )}
      </div>
      {/* Payment Actions */}
      <div className="p-4 border-t border-border space-y-3">
        <Button
          variant="default"
          fullWidth
          loading={isProcessing}
          disabled={!isPaymentValid() || total <= 0}
          onClick={handleProcessPayment}
          iconName="CreditCard"
          iconPosition="left"
        >
          {isProcessing ? 'Processing...' : 'Process Payment'}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => onPrintReceipt('thermal')}
            iconName="Printer"
            iconPosition="left"
            size="sm"
          >
            Print Receipt
          </Button>
          
          <Button
            variant="outline"
            onClick={() => onPrintReceipt('email')}
            iconName="Mail"
            iconPosition="left"
            size="sm"
          >
            Email Receipt
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPanel;