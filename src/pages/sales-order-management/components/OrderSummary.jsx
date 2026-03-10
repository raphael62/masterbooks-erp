import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const OrderSummary = ({ orderItems, onRemoveItem, onUpdateQuantity, selectedCustomer, isOffline, queuedOrdersCount }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    })?.format(amount);
  };

  const calculateOrderTotals = () => {
    const subtotal = orderItems?.reduce((sum, item) => sum + item?.totals?.subtotal, 0);
    const vat = orderItems?.reduce((sum, item) => sum + item?.totals?.vat, 0);
    const total = subtotal + vat;
    const totalFreeQty = orderItems?.reduce((sum, item) => sum + item?.totals?.freeQty, 0);

    return { subtotal, vat, total, totalFreeQty };
  };

  const orderTotals = calculateOrderTotals();

  const handleSaveOrder = () => {
    if (!selectedCustomer || orderItems?.length === 0) return;

    const orderData = {
      id: `SO-${Date.now()}`,
      customer: selectedCustomer,
      items: orderItems,
      totals: orderTotals,
      status: isOffline ? 'queued' : 'pending',
      createdAt: new Date(),
      createdBy: 'Current User'
    };

    console.log('Saving order:', orderData);
    // In real app, this would save to IndexedDB for offline or send to server
  };

  const handleSubmitOrder = () => {
    if (!selectedCustomer || orderItems?.length === 0) return;

    const orderData = {
      id: `SO-${Date.now()}`,
      customer: selectedCustomer,
      items: orderItems,
      totals: orderTotals,
      status: isOffline ? 'queued' : 'submitted',
      createdAt: new Date(),
      createdBy: 'Current User'
    };

    console.log('Submitting order:', orderData);
    // In real app, this would handle submission logic
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Order Summary</h3>
        {isOffline && queuedOrdersCount > 0 && (
          <div className="flex items-center space-x-2 text-warning">
            <Icon name="Clock" size={16} />
            <span className="text-xs">{queuedOrdersCount} queued</span>
          </div>
        )}
      </div>
      {/* Customer Info */}
      {selectedCustomer && (
        <div className="bg-muted rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="User" size={16} className="text-muted-foreground" />
            <span className="font-medium text-foreground">{selectedCustomer?.name}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedCustomer?.location} • {selectedCustomer?.code}
          </div>
        </div>
      )}
      {/* Order Items */}
      <div className="space-y-3 mb-4">
        {orderItems?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="ShoppingCart" size={32} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No items in order</p>
          </div>
        ) : (
          orderItems?.map((item) => (
            <div key={item?.id} className="bg-muted rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm">{item?.product?.name}</h4>
                  <p className="text-xs text-muted-foreground">{item?.product?.code}</p>
                </div>
                <button
                  onClick={() => onRemoveItem(item?.id)}
                  className="p-1 rounded hover:bg-accent transition-colors duration-150 ease-out"
                >
                  <Icon name="X" size={14} className="text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-1 text-sm">
                {item?.quantities?.cartons > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {item?.quantities?.cartons} cartons
                    </span>
                    <span>{formatCurrency(item?.quantities?.cartons * item?.product?.cartonPrice)}</span>
                  </div>
                )}
                {item?.quantities?.bottles > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {item?.quantities?.bottles} bottles
                    </span>
                    <span>{formatCurrency(item?.quantities?.bottles * item?.product?.unitPrice)}</span>
                  </div>
                )}
                {item?.totals?.freeQty > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Free: {item?.totals?.freeQty} cartons</span>
                    <span>GHS 0.00</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-1 border-t border-border">
                  <span>Item Total:</span>
                  <span>{formatCurrency(item?.totals?.total)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Order Totals */}
      {orderItems?.length > 0 && (
        <div className="bg-background rounded-lg p-4 mb-4">
          <h4 className="font-medium text-foreground mb-3">Order Totals</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(orderTotals?.subtotal)}</span>
            </div>
            {orderTotals?.vat > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT:</span>
                <span>{formatCurrency(orderTotals?.vat)}</span>
              </div>
            )}
            {orderTotals?.totalFreeQty > 0 && (
              <div className="flex justify-between text-success">
                <span>Free Items:</span>
                <span>{orderTotals?.totalFreeQty} cartons</span>
              </div>
            )}
            <div className="border-t border-border pt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(orderTotals?.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Payment Terms */}
      {selectedCustomer && (
        <div className="bg-muted rounded-lg p-3 mb-4">
          <h5 className="font-medium text-foreground mb-2">Payment Terms</h5>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credit Available:</span>
              <span className="font-medium">
                {formatCurrency(selectedCustomer?.creditLimit - selectedCustomer?.currentBalance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">After This Order:</span>
              <span className={`font-medium ${
                (selectedCustomer?.currentBalance + orderTotals?.total) > selectedCustomer?.creditLimit 
                  ? 'text-error' :'text-success'
              }`}>
                {formatCurrency(selectedCustomer?.creditLimit - (selectedCustomer?.currentBalance + orderTotals?.total))}
              </span>
            </div>
          </div>

          {(selectedCustomer?.currentBalance + orderTotals?.total) > selectedCustomer?.creditLimit && (
            <div className="mt-2 p-2 bg-error/10 rounded-md">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={14} className="text-error" />
                <span className="text-xs font-medium text-error">
                  Credit limit will be exceeded by {formatCurrency((selectedCustomer?.currentBalance + orderTotals?.total) - selectedCustomer?.creditLimit)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          variant="outline"
          fullWidth
          disabled={!selectedCustomer || orderItems?.length === 0}
          onClick={handleSaveOrder}
          iconName="Save"
          iconPosition="left"
        >
          Save Draft
        </Button>
        
        <Button
          variant="default"
          fullWidth
          disabled={!selectedCustomer || orderItems?.length === 0}
          onClick={handleSubmitOrder}
          iconName={isOffline ? "Clock" : "Send"}
          iconPosition="left"
        >
          {isOffline ? 'Queue Order' : 'Submit Order'}
        </Button>
      </div>
      {/* Offline Status */}
      {isOffline && (
        <div className="mt-4 p-3 bg-warning/10 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="WifiOff" size={16} className="text-warning" />
            <span className="text-sm font-medium text-warning">Offline Mode</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Orders will be queued and submitted when connection is restored.
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;