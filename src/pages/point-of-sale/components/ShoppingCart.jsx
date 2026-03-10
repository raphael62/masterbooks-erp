import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const ShoppingCart = ({ cartItems, onUpdateQuantity, onRemoveItem, onClearCart }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    })?.format(amount);
  };

  const calculateSubtotal = () => {
    return cartItems?.reduce((sum, item) => sum + (item?.price * item?.quantity), 0);
  };

  const calculateVAT = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.15; // 15% VAT
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateVAT();
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      onRemoveItem(itemId);
    } else {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  if (cartItems?.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <Icon name="ShoppingCart" size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">Cart is empty</p>
        <p className="text-sm text-center">
          Search and add products to start a transaction
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Cart Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-medium text-foreground">
          Shopping Cart ({cartItems?.length} items)
        </h3>
        <button
          onClick={onClearCart}
          className="text-sm text-error hover:text-error/80 transition-colors duration-150 ease-out"
        >
          Clear All
        </button>
      </div>
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-4">
          {cartItems?.map((item) => (
            <div key={item?.id} className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
              <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={item?.image}
                  alt={item?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-card-foreground truncate mb-1">
                  {item?.name}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(item?.price)} each
                  </span>
                  <span className="text-sm font-mono text-success">
                    {formatCurrency(item?.price * item?.quantity)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuantityChange(item?.id, item?.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center bg-muted hover:bg-accent rounded-md transition-colors duration-150 ease-out"
                >
                  <Icon name="Minus" size={16} />
                </button>
                
                <span className="w-12 text-center font-mono text-foreground">
                  {item?.quantity}
                </span>
                
                <button
                  onClick={() => handleQuantityChange(item?.id, item?.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-muted hover:bg-accent rounded-md transition-colors duration-150 ease-out"
                >
                  <Icon name="Plus" size={16} />
                </button>
                
                <button
                  onClick={() => onRemoveItem(item?.id)}
                  className="w-8 h-8 flex items-center justify-center text-error hover:bg-error/10 rounded-md transition-colors duration-150 ease-out ml-2"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Cart Summary */}
      <div className="border-t border-border p-4 bg-muted/30">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono">{formatCurrency(calculateSubtotal())}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT (15%)</span>
            <span className="font-mono">{formatCurrency(calculateVAT())}</span>
          </div>
          <div className="flex justify-between text-lg font-medium pt-2 border-t border-border">
            <span>Total</span>
            <span className="font-mono text-success">{formatCurrency(calculateTotal())}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;