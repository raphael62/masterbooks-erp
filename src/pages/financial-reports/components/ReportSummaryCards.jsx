import React from 'react';
import Icon from '../../../components/AppIcon';

const ReportSummaryCards = ({ selectedReport, summaryData }) => {
  if (!selectedReport || !summaryData) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    })?.format(amount);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value?.toFixed(1)}%`;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-error';
    return 'text-muted-foreground';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return 'TrendingUp';
    if (change < 0) return 'TrendingDown';
    return 'Minus';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {summaryData?.map((card, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${card?.iconBg}`}>
              <Icon 
                name={card?.icon} 
                size={20} 
                className={card?.iconColor} 
              />
            </div>
            {card?.change !== undefined && (
              <div className={`flex items-center space-x-1 ${getChangeColor(card?.change)}`}>
                <Icon 
                  name={getChangeIcon(card?.change)} 
                  size={14} 
                />
                <span className="text-xs font-medium">
                  {formatPercentage(card?.change)}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-foreground">
              {card?.type === 'currency' ? formatCurrency(card?.value) : card?.value?.toLocaleString()}
            </h3>
            <p className="text-sm text-muted-foreground">{card?.label}</p>
            {card?.subtitle && (
              <p className="text-xs text-muted-foreground">{card?.subtitle}</p>
            )}
          </div>

          {card?.progress !== undefined && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{card?.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    card?.progress >= 80 ? 'bg-success' :
                    card?.progress >= 60 ? 'bg-warning' : 'bg-error'
                  }`}
                  style={{ width: `${Math.min(card?.progress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReportSummaryCards;