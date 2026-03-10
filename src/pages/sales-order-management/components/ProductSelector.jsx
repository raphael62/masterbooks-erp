import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const ProductSelector = ({ onProductAdd, isOffline }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantities, setQuantities] = useState({
    cartons: 0,
    bottles: 0
  });

  // Mock product data
  useEffect(() => {
    const mockProducts = [
      {
        id: 'PROD001',
        name: 'Coca-Cola 500ml',
        code: 'CC500',
        barcode: '5449000000996',
        packSize: 24,
        unitPrice: 2.50,
        cartonPrice: 60.00,
        emptiesPrice: 12.00,
        stockLevel: 150,
        minOrderQty: 1,
        category: 'Beverages',
        vatRate: 12.5,
        hasEmpties: true,
        promotions: [
          { type: 'free_qty', description: 'Buy 10 cartons, get 1 free', minQty: 10, freeQty: 1 }
        ]
      },
      {
        id: 'PROD002',
        name: 'Fanta Orange 500ml',
        code: 'FO500',
        barcode: '5449000001016',
        packSize: 24,
        unitPrice: 2.30,
        cartonPrice: 55.20,
        emptiesPrice: 12.00,
        stockLevel: 89,
        minOrderQty: 1,
        category: 'Beverages',
        vatRate: 12.5,
        hasEmpties: true,
        promotions: []
      },
      {
        id: 'PROD003',
        name: 'Sprite 500ml',
        code: 'SP500',
        barcode: '5449000002016',
        packSize: 24,
        unitPrice: 2.30,
        cartonPrice: 55.20,
        emptiesPrice: 12.00,
        stockLevel: 45,
        minOrderQty: 1,
        category: 'Beverages',
        vatRate: 12.5,
        hasEmpties: true,
        promotions: [
          { type: 'bogo', description: 'Buy 1 carton, get 1 at 50% off', minQty: 2 }
        ]
      },
      {
        id: 'PROD004',
        name: 'Voltic Water 750ml',
        code: 'VW750',
        barcode: '6789012345678',
        packSize: 12,
        unitPrice: 1.80,
        cartonPrice: 21.60,
        emptiesPrice: 0,
        stockLevel: 200,
        minOrderQty: 2,
        category: 'Water',
        vatRate: 0,
        hasEmpties: false,
        promotions: []
      }
    ];
    setProducts(mockProducts);
  }, []);

  useEffect(() => {
    if (searchQuery?.trim()) {
      const filtered = products?.filter(product =>
        product?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        product?.code?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        product?.barcode?.includes(searchQuery)
      );
      setFilteredProducts(filtered);
      setShowDropdown(true);
    } else {
      setFilteredProducts([]);
      setShowDropdown(false);
    }
  }, [searchQuery, products]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    })?.format(amount);
  };

  const calculateTotals = () => {
    if (!selectedProduct) return { subtotal: 0, vat: 0, total: 0, freeQty: 0 };

    const cartonTotal = quantities?.cartons * selectedProduct?.cartonPrice;
    const bottleTotal = quantities?.bottles * selectedProduct?.unitPrice;
    const subtotal = cartonTotal + bottleTotal;

    // Calculate free quantities from promotions
    let freeQty = 0;
    selectedProduct?.promotions?.forEach(promo => {
      if (promo?.type === 'free_qty' && quantities?.cartons >= promo?.minQty) {
        freeQty += Math.floor(quantities?.cartons / promo?.minQty) * promo?.freeQty;
      }
    });

    const vat = (subtotal * selectedProduct?.vatRate) / 100;
    const total = subtotal + vat;

    return { subtotal, vat, total, freeQty };
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSearchQuery(product?.name);
    setShowDropdown(false);
    setQuantities({ cartons: 0, bottles: 0 });
  };

  const handleQuantityChange = (type, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setQuantities(prev => ({
      ...prev,
      [type]: numValue
    }));
  };

  const handleAddToOrder = () => {
    if (!selectedProduct || (quantities?.cartons === 0 && quantities?.bottles === 0)) return;

    const totals = calculateTotals();
    const orderItem = {
      id: Date.now(),
      product: selectedProduct,
      quantities,
      totals,
      timestamp: new Date()
    };

    onProductAdd(orderItem);
    
    // Reset form
    setSelectedProduct(null);
    setSearchQuery('');
    setQuantities({ cartons: 0, bottles: 0 });
  };

  const getStockStatus = (product) => {
    if (product?.stockLevel <= 10) return { status: 'critical', color: 'text-error' };
    if (product?.stockLevel <= 50) return { status: 'low', color: 'text-warning' };
    return { status: 'good', color: 'text-success' };
  };

  const totals = calculateTotals();

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Product Selection</h3>
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg hover:bg-accent transition-colors duration-150 ease-out">
            <Icon name="ScanLine" size={16} className="text-muted-foreground" />
          </button>
          {isOffline && (
            <div className="flex items-center space-x-2 text-warning">
              <Icon name="WifiOff" size={16} />
              <span className="text-xs">Offline</span>
            </div>
          )}
        </div>
      </div>
      {/* Product Search */}
      <div className="relative mb-4">
        <Input
          label="Search Product"
          type="text"
          placeholder="Search by name, code, or barcode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e?.target?.value)}
          className="mb-0"
        />
        <div className="absolute right-3 top-9 text-muted-foreground">
          <Icon name="Search" size={16} />
        </div>

        {/* Product Dropdown */}
        {showDropdown && filteredProducts?.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-modal z-50 max-h-64 overflow-y-auto">
            {filteredProducts?.map((product) => {
              const stockStatus = getStockStatus(product);
              return (
                <button
                  key={product?.id}
                  onClick={() => handleProductSelect(product)}
                  className="w-full p-3 text-left hover:bg-accent transition-colors duration-150 ease-out border-b border-border last:border-b-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{product?.name}</span>
                    <span className="text-xs text-muted-foreground">{product?.code}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatCurrency(product?.cartonPrice)}/carton • {product?.packSize} units
                    </span>
                    <span className={`font-medium ${stockStatus?.color}`}>
                      {product?.stockLevel} in stock
                    </span>
                  </div>
                  {product?.promotions?.length > 0 && (
                    <div className="mt-1 text-xs text-primary">
                      🎁 {product?.promotions?.[0]?.description}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {/* Selected Product Details */}
      {selectedProduct && (
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground">{selectedProduct?.name}</h4>
              <span className="text-sm text-muted-foreground">{selectedProduct?.code}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-muted-foreground">Pack Size:</span>
                <span className="font-medium ml-2">{selectedProduct?.packSize} units</span>
              </div>
              <div>
                <span className="text-muted-foreground">Stock:</span>
                <span className={`font-medium ml-2 ${getStockStatus(selectedProduct)?.color}`}>
                  {selectedProduct?.stockLevel} cartons
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Carton Price:</span>
                <span className="font-medium ml-2">{formatCurrency(selectedProduct?.cartonPrice)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Unit Price:</span>
                <span className="font-medium ml-2">{formatCurrency(selectedProduct?.unitPrice)}</span>
              </div>
            </div>

            {/* Promotions */}
            {selectedProduct?.promotions?.length > 0 && (
              <div className="bg-primary/10 rounded-md p-3 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon name="Gift" size={16} className="text-primary" />
                  <span className="text-sm font-medium text-primary">Active Promotions</span>
                </div>
                {selectedProduct?.promotions?.map((promo, index) => (
                  <div key={index} className="text-sm text-primary">
                    {promo?.description}
                  </div>
                ))}
              </div>
            )}

            {/* Quantity Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cartons
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleQuantityChange('cartons', quantities?.cartons - 1)}
                    className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors duration-150 ease-out"
                  >
                    <Icon name="Minus" size={14} />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={quantities?.cartons}
                    onChange={(e) => handleQuantityChange('cartons', e?.target?.value)}
                    className="flex-1 text-center py-2 px-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={() => handleQuantityChange('cartons', quantities?.cartons + 1)}
                    className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors duration-150 ease-out"
                  >
                    <Icon name="Plus" size={14} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Individual Bottles
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleQuantityChange('bottles', quantities?.bottles - 1)}
                    className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors duration-150 ease-out"
                  >
                    <Icon name="Minus" size={14} />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={quantities?.bottles}
                    onChange={(e) => handleQuantityChange('bottles', e?.target?.value)}
                    className="flex-1 text-center py-2 px-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={() => handleQuantityChange('bottles', quantities?.bottles + 1)}
                    className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors duration-150 ease-out"
                  >
                    <Icon name="Plus" size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Price Calculation */}
            {(quantities?.cartons > 0 || quantities?.bottles > 0) && (
              <div className="mt-4 p-3 bg-background rounded-md">
                <div className="space-y-2 text-sm">
                  {quantities?.cartons > 0 && (
                    <div className="flex justify-between">
                      <span>{quantities?.cartons} cartons × {formatCurrency(selectedProduct?.cartonPrice)}</span>
                      <span>{formatCurrency(quantities?.cartons * selectedProduct?.cartonPrice)}</span>
                    </div>
                  )}
                  {quantities?.bottles > 0 && (
                    <div className="flex justify-between">
                      <span>{quantities?.bottles} bottles × {formatCurrency(selectedProduct?.unitPrice)}</span>
                      <span>{formatCurrency(quantities?.bottles * selectedProduct?.unitPrice)}</span>
                    </div>
                  )}
                  {totals?.freeQty > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Free quantity (promotion)</span>
                      <span>+{totals?.freeQty} cartons</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(totals?.subtotal)}</span>
                    </div>
                    {totals?.vat > 0 && (
                      <div className="flex justify-between">
                        <span>VAT ({selectedProduct?.vatRate}%):</span>
                        <span>{formatCurrency(totals?.vat)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium text-foreground">
                      <span>Total:</span>
                      <span>{formatCurrency(totals?.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add to Order Button */}
            <div className="mt-4">
              <Button
                variant="default"
                fullWidth
                disabled={quantities?.cartons === 0 && quantities?.bottles === 0}
                onClick={handleAddToOrder}
                iconName="Plus"
                iconPosition="left"
              >
                Add to Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSelector;