import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';


const generateMockData = (range) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
  const days = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);

  const labels = range === 'daily' ? days : range === 'weekly' ? weeks : months;
  return labels?.map((label) => ({
    label,
    purchases: Math.floor(Math.random() * 80000) + 20000,
    payments: Math.floor(Math.random() * 60000) + 15000,
  }));
};

const PurchaseTrendChart = () => {
  const [range, setRange] = useState('monthly');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    setChartData(generateMockData(range));
  }, [range]);

  const formatGHS = (val) => `GHS ${(val || 0)?.toLocaleString('en-GB')}`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
          {payload?.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry?.color }} />
              <span className="text-muted-foreground capitalize">{entry?.name}:</span>
              <span className="font-medium text-foreground">{formatGHS(entry?.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Purchase Trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Purchases vs Payments over time</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {['daily', 'weekly', 'monthly']?.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 capitalize ${
                range === r
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="purchasesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="paymentsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${(v / 1000)?.toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area type="monotone" dataKey="purchases" name="Purchases" stroke="var(--color-primary)" strokeWidth={2} fill="url(#purchasesGrad)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="payments" name="Payments" stroke="#10b981" strokeWidth={2} fill="url(#paymentsGrad)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PurchaseTrendChart;
