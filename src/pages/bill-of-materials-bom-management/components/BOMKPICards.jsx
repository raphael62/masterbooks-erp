import React from 'react';
import Icon from '../../../components/AppIcon';

const BOMKPICards = ({ kpis, isLoading }) => {
  const cards = [
    {
      label: 'Total BOMs',
      value: kpis?.totalBOMs ?? 0,
      icon: 'FileText',
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      trend: null,
      format: 'number'
    },
    {
      label: 'Active BOMs',
      value: kpis?.activeBOMs ?? 0,
      icon: 'CheckCircle',
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      trend: kpis?.totalBOMs > 0 ? ((kpis?.activeBOMs / kpis?.totalBOMs) * 100)?.toFixed(0) + '%' : '0%',
      format: 'number'
    },
    {
      label: 'Avg Cost per BOM',
      value: kpis?.avgCost ?? 0,
      icon: 'DollarSign',
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      trend: null,
      format: 'currency'
    },
    {
      label: 'Products with BOM',
      value: kpis?.coveragePct ?? 0,
      icon: 'Package',
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      trend: null,
      format: 'percent'
    }
  ];

  const formatValue = (val, fmt) => {
    if (fmt === 'currency') return `GHS ${Number(val)?.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (fmt === 'percent') return `${Number(val)?.toFixed(1)}%`;
    return Number(val)?.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4]?.map(i => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-3" />
            <div className="h-7 bg-muted rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards?.map((card, idx) => (
        <div key={idx} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${card?.bg}`}>
              <Icon name={card?.icon} size={18} className={card?.color} />
            </div>
            {card?.trend && (
              <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                {card?.trend}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-foreground font-mono tabular-nums">
            {formatValue(card?.value, card?.format)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{card?.label}</div>
        </div>
      ))}
    </div>
  );
};

export default BOMKPICards;
