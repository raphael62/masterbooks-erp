import React from 'react';
import Icon from '../../../components/AppIcon';

const StockSummaryPanel = ({ stockData, activeLocationName }) => {
  const totalProducts = stockData?.length || 0;
  const lowStockCount = stockData?.filter(r => r?.status === 'low')?.length || 0;
  const overstockCount = stockData?.filter(r => r?.status === 'overstock')?.length || 0;
  const totalValue = stockData?.reduce((sum, r) => sum + (parseFloat(r?.total_stock || 0) * parseFloat(r?.cost_price || 0)), 0);

  const cards = [
    {
      label: 'Total Products',
      value: totalProducts?.toLocaleString(),
      icon: 'Package',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Low Stock Alerts',
      value: lowStockCount?.toLocaleString(),
      icon: 'AlertTriangle',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Overstock Items',
      value: overstockCount?.toLocaleString(),
      icon: 'TrendingUp',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Total Inv. Value',
      value: `GH₵ ${totalValue?.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: 'DollarSign',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="w-56 flex-shrink-0 flex flex-col gap-3 p-3 border-l border-gray-200 bg-gray-50 overflow-y-auto">
      <div className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
        <Icon name="BarChart3" size={13} />
        {activeLocationName || 'All Locations'}
      </div>
      {cards?.map((card, idx) => (
        <div key={idx} className="bg-white rounded border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-7 h-7 rounded flex items-center justify-center ${card?.bg}`}>
              <Icon name={card?.icon} size={14} className={card?.color} />
            </div>
            <span className="text-xs text-gray-500">{card?.label}</span>
          </div>
          <div className={`text-sm font-bold ${card?.color}`}>{card?.value}</div>
        </div>
      ))}
      {/* Stock Status Legend */}
      <div className="bg-white rounded border border-gray-200 p-3">
        <div className="text-xs font-semibold text-gray-600 mb-2">Stock Status</div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></span>
            <span className="text-xs text-gray-600">Adequate Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></span>
            <span className="text-xs text-gray-600">Low Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-400 flex-shrink-0"></span>
            <span className="text-xs text-gray-600">Overstock</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0"></span>
            <span className="text-xs text-gray-600">Out of Stock</span>
          </div>
        </div>
      </div>
      {/* Last Updated */}
      <div className="text-xs text-gray-400 text-center mt-auto">
        <Icon name="Clock" size={11} className="inline mr-1" />
        Updated: {new Date()?.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default StockSummaryPanel;
