import React from 'react';
import Icon from '../../../components/AppIcon';

const SalesKPICards = ({ data, isLoading, onCardClick }) => {
  const formatGHS = (val) =>
    `GHS ${(val || 0)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cards = [
    {
      id: 'today_sales',
      title: "Today\'s Sales",
      value: formatGHS(data?.todaySales),
      rawValue: data?.todaySales,
      trend: data?.todayTrend || 'up',
      trendValue: data?.todayTrendValue || '+0.0%',
      icon: 'TrendingUp',
      color: 'primary',
      subtitle: 'VAT inclusive'
    },
    {
      id: 'mtd_sales',
      title: 'MTD Sales',
      value: formatGHS(data?.mtdSales),
      rawValue: data?.mtdSales,
      trend: data?.mtdTrend || 'up',
      trendValue: data?.mtdTrendValue || '+0.0%',
      icon: 'BarChart2',
      color: 'success',
      subtitle: 'Month to date'
    },
    {
      id: 'total_orders',
      title: 'Total Orders',
      value: (data?.totalOrders || 0)?.toLocaleString('en-GB'),
      trend: data?.ordersTrend || 'up',
      trendValue: data?.ordersTrendValue || '+0',
      icon: 'ShoppingCart',
      color: 'warning',
      subtitle: 'This month'
    },
    {
      id: 'active_customers',
      title: 'Active Customers',
      value: (data?.activeCustomers || 0)?.toLocaleString('en-GB'),
      trend: data?.customersTrend || 'up',
      trendValue: data?.customersTrendValue || '+0',
      icon: 'Users',
      color: 'info',
      subtitle: 'Purchased this month'
    }
  ];

  const getTrendColor = (trend) => {
    if (trend === 'up') return 'text-emerald-600';
    if (trend === 'down') return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return 'TrendingUp';
    if (trend === 'down') return 'TrendingDown';
    return 'Minus';
  };

  const getColorClasses = (color) => {
    switch (color) {
      case 'success': return 'text-emerald-600 bg-emerald-50';
      case 'warning': return 'text-amber-600 bg-amber-50';
      case 'info': return 'text-sky-600 bg-sky-50';
      default: return 'text-primary bg-primary/10';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
      {cards?.map((card) => (
        <div
          key={card?.id}
          onClick={() => onCardClick?.(card?.id)}
          className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-200 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 rounded-lg ${getColorClasses(card?.color)}`}>
              <Icon name={card?.icon} size={22} />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor(card?.trend)}`}>
              <Icon name={getTrendIcon(card?.trend)} size={14} />
              <span>{card?.trendValue}</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{card?.title}</p>
            {isLoading ? (
              <div className="h-7 bg-muted animate-pulse rounded w-3/4 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground leading-tight">{card?.value}</p>
            )}
            {card?.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{card?.subtitle}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SalesKPICards;
