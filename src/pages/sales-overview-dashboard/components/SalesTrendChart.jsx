import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';


const dailyData = [
  { name: 'Mon', sales: 12500, orders: 45 },
  { name: 'Tue', sales: 15800, orders: 52 },
  { name: 'Wed', sales: 18200, orders: 61 },
  { name: 'Thu', sales: 14600, orders: 48 },
  { name: 'Fri', sales: 22400, orders: 73 },
  { name: 'Sat', sales: 28900, orders: 89 },
  { name: 'Sun', sales: 19300, orders: 67 }
];

const weeklyData = [
  { name: 'Wk 1', sales: 89500, orders: 285 },
  { name: 'Wk 2', sales: 95200, orders: 312 },
  { name: 'Wk 3', sales: 102800, orders: 341 },
  { name: 'Wk 4', sales: 118600, orders: 389 }
];

const monthlyData = [
  { name: 'Jan', sales: 385000, orders: 1250 },
  { name: 'Feb', sales: 420000, orders: 1380 },
  { name: 'Mar', sales: 465000, orders: 1520 },
  { name: 'Apr', sales: 398000, orders: 1290 },
  { name: 'May', sales: 512000, orders: 1680 },
  { name: 'Jun', sales: 478000, orders: 1560 }
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground text-sm mb-2">{label}</p>
        {payload?.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry?.color }} />
            <span className="text-muted-foreground">{entry?.name === 'sales' ? 'Sales' : 'Orders'}:</span>
            <span className="font-medium text-foreground">
              {entry?.name === 'sales'
                ? `GHS ${entry?.value?.toLocaleString('en-GB')}`
                : entry?.value?.toLocaleString('en-GB')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const SalesTrendChart = ({ supabaseData }) => {
  const [view, setView] = useState('daily');

  const dataMap = { daily: dailyData, weekly: weeklyData, monthly: monthlyData };
  const chartData = supabaseData?.[view] || dataMap?.[view];

  const views = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' }
  ];

  const formatYAxis = (value) => {
    if (value >= 1000000) return `${(value / 1000000)?.toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000)?.toFixed(0)}K`;
    return value;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-semibold text-foreground text-base">Sales Trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Revenue & order volume over time</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {views?.map((v) => (
            <button
              key={v?.key}
              onClick={() => setView(v?.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                view === v?.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v?.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="sales" tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
            <Area yAxisId="sales" type="monotone" dataKey="sales" name="sales" stroke="#7c3aed" strokeWidth={2} fill="url(#salesGrad)" dot={false} activeDot={{ r: 4 }} />
            <Area yAxisId="orders" type="monotone" dataKey="orders" name="orders" stroke="#0ea5e9" strokeWidth={2} fill="url(#ordersGrad)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesTrendChart;
