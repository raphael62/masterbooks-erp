import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const ProductSearch = ({ onProductSelect, products }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchQuery?.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const filtered = products?.filter(product =>
        product?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        product?.barcode?.includes(searchQuery) ||
        product?.sku?.toLowerCase()?.includes(searchQuery?.toLowerCase())
      );
      setSearchResults(filtered);
      setShowResults(true);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, products]);

  const handleProductClick = (product) => {
    onProductSelect(product);
    setSearchQuery('');
    setShowResults(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    })?.format(amount);
  };

  const handleBarcodeScanner = () => {
    // Simulate barcode scanner
    const mockBarcode = "8901030875991";
    const product = products?.find(p => p?.barcode === mockBarcode);
    if (product) {
      handleProductClick(product);
    }
  };

  return (
    <div className="relative">
      <div className="flex space-x-2 mb-4">
        <div className="flex-1 relative">
          <Icon 
            name="Search" 
            size={20} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
          />
          <input
            type="text"
            placeholder="Search products by name, SKU, or scan barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e?.target?.value)}
            className="w-full pl-10 pr-4 py-3 text-base bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          {isSearching && (
            <Icon 
              name="Loader2" 
              size={20} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground animate-spin" 
            />
          )}
        </div>
        <button
          onClick={handleBarcodeScanner}
          className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-150 ease-out"
          title="Scan Barcode"
        >
          <Icon name="ScanLine" size={20} />
        </button>
      </div>
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-modal z-200 max-h-80 overflow-y-auto">
          {searchResults?.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Icon name="Search" size={32} className="mx-auto mb-2 opacity-50" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="py-2">
              {searchResults?.map((product) => (
                <button
                  key={product?.id}
                  onClick={() => handleProductClick(product)}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-accent transition-colors duration-150 ease-out text-left"
                >
                  <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={product?.image}
                      alt={product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-popover-foreground truncate">
                        {product?.name}
                      </h4>
                      <span className="text-sm font-mono text-success ml-2">
                        {formatCurrency(product?.price)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>SKU: {product?.sku}</span>
                      <span className={`${product?.stock > 0 ? 'text-success' : 'text-error'}`}>
                        Stock: {product?.stock} {product?.unit}
                      </span>
                    </div>
                    
                    {product?.promotion && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-warning/10 text-warning rounded-full">
                          <Icon name="Tag" size={12} className="mr-1" />
                          {product?.promotion}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;