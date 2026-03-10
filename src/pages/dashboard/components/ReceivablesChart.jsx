import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ReceivablesChart = () => {
  const [showDetails, setShowDetails] = useState(false);
  
  const receivablesData = [
    { name: 'Current (0-30 days)', value: 125000, percentage: 45.5, color: '#10B981' },
    { name: 'Past Due (31-60 days)', value: 85000, percentage: 31.0, color: '#F59E0B' },
    { name: 'Overdue (61-90 days)', value: 42000, percentage: 15.3, color: '#EF4444' },
    { name: 'Critical (90+ days)', value: 22500, percentage: 8.2, color: '#DC2626' }
  ];

  const totalReceivables = receivablesData?.reduce((sum, item) => sum + item?.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload?.length) {
      const data = payload?.[0]?.payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-modal">
          <p className="font-medium text-popover-foreground mb-2">{data?.name}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between space-x-4">
              <span className="text-sm text-muted-foreground">Amount:</span>
              <span className="text-sm font-medium">
                GHS {data?.value?.toLocaleString('en-GB')}
              </span>
            </div>
            <div className="flex items-center justify-between space-x-4">
              <span className="text-sm text-muted-foreground">Percentage:</span>
              <span className="text-sm font-medium">{data?.percentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-col space-y-2 mt-4">
        {payload?.map((entry, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry?.color }}
              />
              <span className="text-sm text-muted-foreground">{entry?.value}</span>
            </div>
            <div className="text-sm font-medium">
              GHS {receivablesData?.[index]?.value?.toLocaleString('en-GB')}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Receivables Aging</h3>
          <p className="text-sm text-muted-foreground">Outstanding customer payments</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            iconName={showDetails ? 'EyeOff' : 'Eye'}
            iconPosition="left"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            iconName="ExternalLink"
            iconPosition="right"
            onClick={() => console.log('Navigate to AR aging report')}
          >
            Full Report
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={receivablesData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {receivablesData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry?.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              GHS {totalReceivables?.toLocaleString('en-GB')}
            </div>
            <div className="text-sm text-muted-foreground">Total Outstanding</div>
          </div>

          {showDetails && (
            <div className="space-y-3">
              {receivablesData?.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item?.color }}
                    />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {item?.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item?.percentage}% of total
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    GHS {item?.value?.toLocaleString('en-GB')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <Icon 
            name="AlertTriangle" 
            size={16} 
            className="text-warning" 
          />
          <span className="text-sm text-muted-foreground">
            GHS {(receivablesData?.[2]?.value + receivablesData?.[3]?.value)?.toLocaleString('en-GB')} overdue
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          As of: {new Date()?.toLocaleDateString('en-GB')}
        </div>
      </div>
    </div>
  );
};

export default ReceivablesChart;