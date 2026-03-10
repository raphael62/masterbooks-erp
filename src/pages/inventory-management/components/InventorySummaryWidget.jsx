import React from 'react';
import Icon from '../../../components/AppIcon';

const InventorySummaryWidget = ({ selectedLocation }) => {
  // Mock summary data
  const summaryData = {
    totalValue: 125750.50,
    totalItems: 1247,
    lowStockItems: 23,
    outOfStockItems: 5,
    locations: {
      'main-warehouse': {
        name: 'Main Warehouse',
        value: 85200.30,
        items: 892
      },
      'retail-store': {
        name: 'Retail Store',
        value: 28350.20,
        items: 245
      },
      'distribution-center': {
        name: 'Distribution Center',
        value: 12200.00,
        items: 110
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    })?.format(amount);
  };

  const getLocationData = () => {
    if (selectedLocation === 'all') {
      return {
        name: 'All Locations',
        value: summaryData?.totalValue,
        items: summaryData?.totalItems
      };
    }
    return summaryData?.locations?.[selectedLocation] || {
      name: 'Unknown Location',
      value: 0,
      items: 0
    };
  };

  const locationData = getLocationData();

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="BarChart3" size={20} className="text-primary" />
        <h3 className="font-semibold text-foreground">Inventory Summary</h3>
      </div>
      {/* Current Location Summary */}
      <div className="mb-6">
        <div className="text-sm text-muted-foreground mb-2">{locationData?.name}</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Value</span>
            <span className="font-mono text-lg font-semibold text-foreground">
              {formatCurrency(locationData?.value)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Items</span>
            <span className="text-lg font-semibold text-foreground">
              {locationData?.items?.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      {/* Alert Indicators */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="AlertTriangle" size={16} className="text-warning" />
            <span className="text-sm font-medium text-warning">Low Stock</span>
          </div>
          <span className="text-sm font-semibold text-warning">
            {summaryData?.lowStockItems} items
          </span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-error/10 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="XCircle" size={16} className="text-error" />
            <span className="text-sm font-medium text-error">Out of Stock</span>
          </div>
          <span className="text-sm font-semibold text-error">
            {summaryData?.outOfStockItems} items
          </span>
        </div>
      </div>
      {/* Location Breakdown (only show when all locations selected) */}
      {selectedLocation === 'all' && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground mb-2">By Location</div>
          {Object.entries(summaryData?.locations)?.map(([key, location]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
              <div>
                <div className="text-sm font-medium text-foreground">{location?.name}</div>
                <div className="text-xs text-muted-foreground">{location?.items} items</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-medium text-foreground">
                  {formatCurrency(location?.value)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {((location?.value / summaryData?.totalValue) * 100)?.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Last Updated */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Icon name="Clock" size={12} />
          <span>Last updated: {new Date()?.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</span>
        </div>
      </div>
    </div>
  );
};

export default InventorySummaryWidget;