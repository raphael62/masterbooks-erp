import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import ShiftStatusHeader from './components/ShiftStatusHeader';
import ProductSearch from './components/ProductSearch';
import ShoppingCart from './components/ShoppingCart';
import PaymentPanel from './components/PaymentPanel';
import NumericKeypad from './components/NumericKeypad';
import ReceiptPreview from './components/ReceiptPreview';


const PointOfSale = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Mock data for products
  const products = [
    {
      id: 1,
      name: "Coca-Cola 500ml",
      sku: "CC500",
      barcode: "8901030875991",
      price: 3.50,
      stock: 120,
      unit: "bottles",
      image: "https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg",
      promotion: "Buy 2 Get 1 Free"
    },
    {
      id: 2,
      name: "Fanta Orange 350ml",
      sku: "FO350",
      barcode: "8901030875992",
      price: 2.80,
      stock: 85,
      unit: "bottles",
      image: "https://images.pexels.com/photos/1292294/pexels-photo-1292294.jpeg"
    },
    {
      id: 3,
      name: "Sprite 500ml",
      sku: "SP500",
      barcode: "8901030875993",
      price: 3.20,
      stock: 95,
      unit: "bottles",
      image: "https://images.pexels.com/photos/2775860/pexels-photo-2775860.jpeg"
    },
    {
      id: 4,
      name: "Voltic Water 750ml",
      sku: "VW750",
      barcode: "8901030875994",
      price: 1.50,
      stock: 200,
      unit: "bottles",
      image: "https://images.pexels.com/photos/1000084/pexels-photo-1000084.jpeg"
    },
    {
      id: 5,
      name: "Guinness Stout 330ml",
      sku: "GS330",
      barcode: "8901030875995",
      price: 8.50,
      stock: 45,
      unit: "bottles",
      image: "https://images.pexels.com/photos/5947043/pexels-photo-5947043.jpeg"
    }
  ];

  // Mock shift data
  const [currentShift] = useState({
    number: "SH-2025-001",
    cashier: "Kwame Asante",
    status: "active",
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    openingBalance: 500.00,
    transactionCount: 23,
    totalSales: 1250.75,
    cashInDrawer: 1750.75
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleMenuToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleProductSelect = (product) => {
    const existingItem = cart?.find(item => item?.id === product?.id);
    
    if (existingItem) {
      setCart(cart?.map(item =>
        item?.id === product?.id
          ? { ...item, quantity: item?.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    setCart(cart?.map(item =>
      item?.id === itemId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const handleRemoveItem = (itemId) => {
    setCart(cart?.filter(item => item?.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const calculateTotal = () => {
    const subtotal = cart?.reduce((sum, item) => sum + (item?.price * item?.quantity), 0);
    const vat = subtotal * 0.15;
    return subtotal + vat;
  };

  const handleProcessPayment = async (paymentData) => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const subtotal = cart?.reduce((sum, item) => sum + (item?.price * item?.quantity), 0);
    const vat = subtotal * 0.15;
    
    const receipt = {
      receiptNumber: `R-${Date.now()}`,
      timestamp: paymentData?.timestamp,
      cashier: currentShift?.cashier,
      shiftNumber: currentShift?.number,
      items: cart,
      subtotal,
      vat,
      total: paymentData?.total,
      paymentMethod: paymentData?.method,
      amountPaid: paymentData?.amount,
      change: paymentData?.change,
      chequeNumber: paymentData?.chequeNumber,
      mobileMoneyId: paymentData?.mobileMoneyId
    };

    setReceiptData(receipt);
    setShowReceiptPreview(true);
    setCart([]);
  };

  const handleShiftAction = (action) => {
    switch (action) {
      case 'close': console.log('Closing shift...');
        break;
      default:
        console.log('Unknown shift action:', action);
    }
  };

  const handlePrintReceipt = (type) => {
    if (type === 'thermal') {
      console.log('Printing thermal receipt...');
    } else if (type === 'email') {
      console.log('Sending email receipt...');
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <ShiftStatusHeader 
          shift={currentShift}
          onShiftAction={handleShiftAction}
        />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
          {/* Product Search & Cart */}
          <div className="xl:col-span-2 space-y-6">
            <ProductSearch
              products={products}
              onProductSelect={handleProductSelect}
            />
            
            <ShoppingCart
              cartItems={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
            />
          </div>
          
          {/* Payment Panel */}
          <div className="space-y-6">
            <PaymentPanel
              total={calculateTotal()}
              onProcessPayment={handleProcessPayment}
              onPrintReceipt={handlePrintReceipt}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
            />
            
            <NumericKeypad
              isVisible={showKeypad}
              onNumberClick={(value) => {
                // Handle numeric input
              }}
              onClear={() => {
                // Handle clear
              }}
              onBackspace={() => {
                // Handle backspace
              }}
              onClose={() => setShowKeypad(false)}
            />
          </div>
        </div>

        {showReceipt && (
          <ReceiptPreview
            isVisible={showReceipt}
            receiptData={receiptData}
            items={cart}
            onClose={() => setShowReceipt(false)}
            onPrint={() => {
              // Print receipt logic
            }}
            onEmail={() => {
              // Email receipt logic
            }}
          />
        )}

        {showReceiptPreview && (
          <ReceiptPreview
            isVisible={showReceiptPreview}
            receiptData={receiptData}
            items={receiptData?.items || []}
            onClose={() => setShowReceiptPreview(false)}
            onPrint={() => handlePrintReceipt('thermal')}
            onEmail={() => handlePrintReceipt('email')}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default PointOfSale;