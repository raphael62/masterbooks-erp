import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActionPanel = ({ 
  onStockAdjustment, 
  onStockTransfer, 
  onPhysicalCount, 
  onNewProduct,
  onBarcodeScanner 
}) => {
  const quickActions = [
    {
      id: 'adjustment',
      title: 'Stock Adjustment',
      description: 'Adjust stock quantities',
      icon: 'Edit',
      color: 'bg-warning/10 text-warning',
      action: onStockAdjustment
    },
    {
      id: 'transfer',
      title: 'Stock Transfer',
      description: 'Transfer between locations',
      icon: 'ArrowRightLeft',
      color: 'bg-primary/10 text-primary',
      action: onStockTransfer
    },
    {
      id: 'count',
      title: 'Physical Count',
      description: 'Start physical inventory count',
      icon: 'Calculator',
      color: 'bg-secondary/10 text-secondary',
      action: onPhysicalCount
    },
    {
      id: 'product',
      title: 'Add Product',
      description: 'Add new product to catalog',
      icon: 'Plus',
      color: 'bg-success/10 text-success',
      action: onNewProduct
    },
    {
      id: 'scanner',
      title: 'Barcode Scanner',
      description: 'Scan product barcodes',
      icon: 'Scan',
      color: 'bg-accent text-accent-foreground',
      action: onBarcodeScanner
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="Zap" size={20} className="text-primary" />
        <h3 className="font-semibold text-foreground">Quick Actions</h3>
      </div>
      <div className="space-y-3">
        {quickActions?.map((action) => (
          <button
            key={action?.id}
            onClick={action?.action}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors duration-150 ease-out text-left group"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action?.color} group-hover:scale-105 transition-transform duration-150 ease-out`}>
              <Icon name={action?.icon} size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors duration-150 ease-out">
                {action?.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {action?.description}
              </div>
            </div>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground group-hover:text-primary transition-colors duration-150 ease-out" />
          </button>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-border">
        <Button
          variant="outline"
          fullWidth
          onClick={() => console.log('View all inventory tools')}
        >
          <Icon name="Grid3x3" size={16} />
          View All Tools
        </Button>
      </div>
    </div>
  );
};

export default QuickActionPanel;