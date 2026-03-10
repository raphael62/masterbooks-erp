import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const defaultData = [
  { name: 'Retail', value: 42, amount: 294000, color: '#7c3aed' },
  { name: 'Wholesale', value: 35, amount: 245000, color: '#0ea5e9' },
  { name: 'Distributor', value: 23, amount: 161000, color: '#f59e0b' }
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload?.length) {
    const d = payload?.[0]?.payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground text-sm">{d?.name}</p>
        <p className="text-xs text-muted-foreground">GHS {d?.amount?.toLocaleString('en-GB')}</p>
        <p className="text-xs font-medium" style={{ color: d?.color }}>{d?.value}% of total</p>
      </div>
    );
  }
  return null;
};

const SalesByPriceType = ({ data, isLoading }) => {
  const chartData = data?.length ? data : defaultData;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground text-base">Sales by Price Type</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Revenue distribution this month</p>
      </div>
      {isLoading ? (
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="h-44 w-full sm:w-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData?.map((entry, index) => (
                    <Cell key={index} fill={entry?.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3 w-full">
            {chartData?.map((item) => (
              <div key={item?.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item?.color }} />
                  <span className="text-sm text-foreground font-medium">{item?.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">GHS {item?.amount?.toLocaleString('en-GB')}</p>
                  <p className="text-xs text-muted-foreground">{item?.value}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesByPriceType;
