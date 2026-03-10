import React from 'react';
import Icon from '../../../components/AppIcon';

const ProductionKPICards = ({ data, isLoading }) => {
  const formatGHS = (val) =>
    `GHS ${(val || 0)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatNum = (val) => (val || 0)?.toLocaleString('en-GB');
  const formatPct = (val) => `${(val || 0)?.toFixed(1)}%`;

  const cards = [
    {
      id: 'total_orders',
      title: 'Total Production Orders',
      value: formatNum(data?.totalOrders),
      icon: 'Factory',
      color: 'primary',
      breakdown: [
        { label: 'Planned', value: data?.planned || 0, color: 'text-blue-600' },
        { label: 'In Progress', value: data?.inProgress || 0, color: 'text-amber-600' },
        { label: 'Completed', value: data?.completed || 0, color: 'text-emerald-600' },
        { label: 'On Hold', value: data?.onHold || 0, color: 'text-red-500' },
      ]
    },
    {
      id: 'units_produced',
      title: 'Units Produced vs Target',
      value: formatNum(data?.actualUnits),
      icon: 'PackageCheck',
      color: 'success',
      subtitle: `Target: ${formatNum(data?.plannedUnits)}`,
      badge: data?.achievementPct != null ? `${data?.achievementPct?.toFixed(1)}% achieved` : null,
      badgeColor: (data?.achievementPct || 0) >= 90 ? 'bg-emerald-100 text-emerald-700' : (data?.achievementPct || 0) >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
    },
    {
      id: 'total_cost',
      title: 'Total Production Cost',
      value: formatGHS(data?.totalCost),
      icon: 'DollarSign',
      color: 'warning',
      subtitle: 'All production orders'
    },
    {
      id: 'material_utilization',
      title: 'Material Utilization Rate',
      value: formatPct(data?.materialUtilization),
      icon: 'Layers',
      color: 'info',
      subtitle: 'Actual vs planned materials'
    },
    {
      id: 'waste_loss',
      title: 'Waste / Loss %',
      value: formatPct(data?.wasteLoss),
      icon: 'Trash2',
      color: 'danger',
      trend: data?.wasteLoss > 5 ? 'up' : 'down',
      trendValue: data?.wasteLoss > 5 ? 'High' : 'Low',
      subtitle: 'Material waste rate'
    }
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'success': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
      case 'warning': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      case 'danger': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'info': return 'text-sky-600 bg-sky-50 dark:bg-sky-900/20';
      default: return 'text-primary bg-primary/10';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
      {cards?.map((card) => (
        <div
          key={card?.id}
          className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/20 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${getColorClasses(card?.color)}`}>
              <Icon name={card?.icon} size={20} />
            </div>
            {card?.badge && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${card?.badgeColor}`}>
                {card?.badge}
              </span>
            )}
            {card?.trend && (
              <div className={`flex items-center gap-1 text-xs font-medium ${card?.trend === 'up' ? 'text-red-500' : 'text-emerald-600'}`}>
                <Icon name={card?.trend === 'up' ? 'TrendingUp' : 'TrendingDown'} size={12} />
                <span>{card?.trendValue}</span>
              </div>
            )}
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{card?.title}</p>
          {isLoading ? (
            <div className="h-7 bg-muted animate-pulse rounded w-3/4 mb-1" />
          ) : (
            <p className="text-xl font-bold text-foreground leading-tight tabular-nums">{card?.value}</p>
          )}
          {card?.subtitle && <p className="text-xs text-muted-foreground mt-1">{card?.subtitle}</p>}
          {card?.breakdown && (
            <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5">
              {card?.breakdown?.map(b => (
                <div key={b?.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{b?.label}</span>
                  {isLoading ? (
                    <div className="h-3 bg-muted animate-pulse rounded w-4" />
                  ) : (
                    <span className={`text-xs font-semibold tabular-nums ${b?.color}`}>{b?.value}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProductionKPICards;
