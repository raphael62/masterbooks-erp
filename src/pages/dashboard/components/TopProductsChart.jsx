import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TopProductsChart = () => {
  const [viewType, setViewType] = useState('revenue');
  
  const productData = {
    revenue: [
      { name: 'Coca-Cola 500ml', value: 45200, units: 1890, color: '#DC2626' },
      { name: 'Fanta Orange 500ml', value: 38900, units: 1620, color: '#EA580C' },
      { name: 'Sprite 500ml', value: 32100, units: 1340, color: '#16A34A' },
      { name: 'Coca-Cola 1.5L', value: 28700, units: 820, color: '#991B1B' },
      { name: 'Water 500ml', value: 24500, units: 2450, color: '#0EA5E9' },
      { name: 'Fanta Grape 500ml', value: 19800, units: 825, color: '#7C3AED' }
    ],
    units: [
      { name: 'Water 500ml', value: 2450, revenue: 24500, color: '#0EA5E9' },
      { name: 'Coca-Cola 500ml', value: 1890, revenue: 45200, color: '#DC2626' },
      { name: 'Fanta Orange 500ml', value: 1620, revenue: 38900, color: '#EA580C' },
      { name: 'Sprite 500ml', value: 1340, revenue: 32100, color: '#16A34A' },
      { name: 'Fanta Grape 500ml', value: 825, revenue: 19800, color: '#7C3AED' },
      { name: 'Coca-Cola 1.5L', value: 820, revenue: 28700, color: '#991B1B' }
    ]
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      const data = payload?.[0]?.payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-modal">
          <p className="font-medium text-popover-foreground mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between space-x-4">
              <span className="text-sm text-muted-foreground">Revenue:</span>
              <span className="text-sm font-medium">
                GHS {data?.revenue ? data?.revenue?.toLocaleString('en-GB') : data?.value?.toLocaleString('en-GB')}
              </span>
            </div>
            <div className="flex items-center justify-between space-x-4">
              <span className="text-sm text-muted-foreground">Units:</span>
              <span className="text-sm font-medium">
                {data?.units ? data?.units?.toLocaleString('en-GB') : data?.value?.toLocaleString('en-GB')}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value) => {
    if (viewType === 'revenue') {
      return `${(value / 1000)?.toFixed(0)}k`;
    }
    return value?.toLocaleString('en-GB');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Top Products</h3>
          <p className="text-sm text-muted-foreground">Best performing products this month</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewType === 'revenue' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewType('revenue')}
          >
            Revenue
          </Button>
          <Button
            variant={viewType === 'units' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewType('units')}
          >
            Units
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            iconName="ExternalLink"
            iconPosition="right"
            onClick={() => console.log('Navigate to product performance report')}
          >
            View All
          </Button>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={productData?.[viewType]} 
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
            layout="horizontal"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              type="number"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={formatYAxis}
            />
            <YAxis 
              type="category"
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              width={120}
              tick={{ textAnchor: 'end' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              fill="hsl(var(--primary))"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <Icon name="TrendingUp" size={16} className="text-success" />
          <span className="text-sm text-muted-foreground">
            {viewType === 'revenue' ? 'Revenue' : 'Units sold'} for March 2025
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Updated: {new Date()?.toLocaleString('en-GB')}
        </div>
      </div>
    </div>
  );
};

export default TopProductsChart;