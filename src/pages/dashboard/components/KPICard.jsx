import React from 'react';
import Icon from '../../../components/AppIcon';

const KPICard = ({ 
  title, 
  value, 
  currency = false, 
  trend, 
  trendValue, 
  icon, 
  color = 'primary',
  onClick,
  subtitle,
  isLoading = false 
}) => {
  const formatValue = (val) => {
    if (currency) {
      return `GHS ${val?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return val?.toLocaleString('en-GB');
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-success';
      case 'down': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return 'TrendingUp';
      case 'down': return 'TrendingDown';
      default: return 'Minus';
    }
  };

  const getColorClasses = (color) => {
    switch (color) {
      case 'success': return 'text-success bg-success/10';
      case 'warning': return 'text-warning bg-warning/10';
      case 'error': return 'text-error bg-error/10';
      default: return 'text-primary bg-primary/10';
    }
  };

  return (
    <div 
      className={`bg-card border border-border rounded-lg p-6 transition-all duration-200 ease-out ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-primary/20' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${getColorClasses(color)}`}>
          <Icon name={icon} size={24} />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${getTrendColor(trend)}`}>
            <Icon name={getTrendIcon(trend)} size={16} />
            <span className="text-sm font-medium">{trendValue}</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {isLoading ? (
          <div className="h-8 bg-muted animate-pulse rounded" />
        ) : (
          <div className="text-2xl font-bold text-foreground">
            {formatValue(value)}
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default KPICard;