import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

const fallbackData = [
  { name: 'Raw Materials', value: 38 },
  { name: 'Packaging', value: 22 },
  { name: 'Finished Goods', value: 18 },
  { name: 'Equipment', value: 12 },
  { name: 'Services', value: 10 },
];

const PurchaseCategoryChart = ({ data, isLoading }) => {
  const displayData = data?.length ? data : fallbackData;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground">{payload?.[0]?.name}</p>
          <p className="text-xs text-muted-foreground">{payload?.[0]?.value}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Purchases by Category</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Breakdown by procurement category</p>
      </div>
      {isLoading ? (
        <div className="h-48 bg-muted animate-pulse rounded" />
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {displayData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS?.[index % COLORS?.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PurchaseCategoryChart;
