import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import Icon from '../../../components/AppIcon';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];

const ProductionAnalytics = ({ orders, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Material Usage: planned vs actual per product
  const materialUsageData = React.useMemo(() => {
    const map = {};
    orders?.forEach(o => {
      const key = o?.product_name || 'Unknown';
      if (!map?.[key]) map[key] = { product: key?.length > 12 ? key?.substring(0, 12) + '...' : key, planned: 0, actual: 0 };
      map[key].planned += parseFloat(o?.planned_qty) || 0;
      map[key].actual += parseFloat(o?.actual_qty) || 0;
    });
    return Object.values(map)?.slice(0, 8);
  }, [orders]);

  // Cost Trend: last 30 days
  const costTrendData = React.useMemo(() => {
    const days = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d?.setDate(d?.getDate() - i);
      const key = d?.toISOString()?.split('T')?.[0];
      days[key] = { date: d?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), cost: 0 };
    }
    orders?.forEach(o => {
      const d = o?.start_date;
      if (d && days?.[d]) days[d].cost += parseFloat(o?.total_cost) || 0;
    });
    return Object.values(days);
  }, [orders]);

  // Cost Breakdown pie
  const costBreakdown = React.useMemo(() => {
    const totals = orders?.reduce((acc, o) => ({
      materials: acc?.materials + (parseFloat(o?.total_material_cost) || 0),
      labor: acc?.labor + (parseFloat(o?.labor_cost) || 0),
      overhead: acc?.overhead + (parseFloat(o?.overhead_cost) || 0),
      packaging: acc?.packaging + (parseFloat(o?.packaging_cost) || 0),
    }), { materials: 0, labor: 0, overhead: 0, packaging: 0 });
    const total = Object.values(totals)?.reduce((a, b) => a + b, 0) || 1;
    return [
      { name: 'Raw Materials', value: parseFloat(((totals?.materials / total) * 100)?.toFixed(1)), amount: totals?.materials },
      { name: 'Labor', value: parseFloat(((totals?.labor / total) * 100)?.toFixed(1)), amount: totals?.labor },
      { name: 'Overhead', value: parseFloat(((totals?.overhead / total) * 100)?.toFixed(1)), amount: totals?.overhead },
      { name: 'Packaging', value: parseFloat(((totals?.packaging / total) * 100)?.toFixed(1)), amount: totals?.packaging },
    ];
  }, [orders]);

  // Efficiency table
  const efficiencyData = React.useMemo(() => {
    const map = {};
    orders?.forEach(o => {
      const key = o?.product_name || 'Unknown';
      if (!map?.[key]) map[key] = { product: key, planned: 0, actual: 0, cost: 0 };
      map[key].planned += parseFloat(o?.planned_qty) || 0;
      map[key].actual += parseFloat(o?.actual_qty) || 0;
      map[key].cost += parseFloat(o?.total_cost) || 0;
    });
    return Object.values(map)?.map(p => ({
      ...p,
      variance: p?.actual - p?.planned,
      efficiency: p?.planned > 0 ? parseFloat(((p?.actual / p?.planned) * 100)?.toFixed(1)) : 0,
      costPerUnit: p?.actual > 0 ? parseFloat((p?.cost / p?.actual)?.toFixed(2)) : 0,
    }));
  }, [orders]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload?.map((p, i) => (
          <p key={i} style={{ color: p?.color }} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p?.color }} />
            {p?.name}: <span className="font-semibold ml-1">{typeof p?.value === 'number' ? p?.value?.toLocaleString('en-GB', { maximumFractionDigits: 2 }) : p?.value}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon name="BarChart3" size={18} className="text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-foreground">Production Analytics</h3>
            <p className="text-xs text-muted-foreground">Material usage, cost trends, efficiency metrics</p>
          </div>
        </div>
        <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-muted-foreground" />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 space-y-6 border-t border-border">
          {isLoading ? (
            <div className="h-64 bg-muted animate-pulse rounded-lg mt-4" />
          ) : (
            <>
              {/* Row 1: Material Usage + Cost Trend */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
                {/* Material Usage Chart */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Icon name="Layers" size={13} className="text-primary" />
                    Material Usage: Planned vs Actual
                  </h4>
                  {materialUsageData?.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-xs">No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={materialUsageData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="product" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="planned" name="Planned" fill="#6366f1" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Cost Trend */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Icon name="TrendingUp" size={13} className="text-primary" />
                    Production Cost Trend (Last 30 Days)
                  </h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={costTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} interval={4} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="cost" name="Cost (GHS)" stroke="#6366f1" fill="url(#costGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Row 2: Cost Breakdown + Efficiency Table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Cost Breakdown Pie */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Icon name="PieChart" size={13} className="text-primary" />
                    Cost Breakdown
                  </h4>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie
                          data={costBreakdown}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={80}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {costBreakdown?.map((_, i) => (
                            <Cell key={i} fill={COLORS?.[i % COLORS?.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => `${v}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {costBreakdown?.map((item, i) => (
                        <div key={item?.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS?.[i % COLORS?.length] }} />
                            <span className="text-xs text-muted-foreground">{item?.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-foreground tabular-nums">{item?.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Efficiency Table */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Icon name="Gauge" size={13} className="text-primary" />
                    Production Efficiency by Product
                  </h4>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-primary/10">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-foreground">Product</th>
                          <th className="px-2 py-2 text-right font-semibold text-foreground">Planned</th>
                          <th className="px-2 py-2 text-right font-semibold text-foreground">Actual</th>
                          <th className="px-2 py-2 text-right font-semibold text-foreground">Variance</th>
                          <th className="px-2 py-2 text-right font-semibold text-foreground">Eff%</th>
                          <th className="px-2 py-2 text-right font-semibold text-foreground">Cost/Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {efficiencyData?.length === 0 ? (
                          <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">No data</td></tr>
                        ) : (
                          efficiencyData?.map((row, i) => (
                            <tr key={row?.product} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                              <td className="px-3 py-2 font-medium text-foreground truncate max-w-[100px]" title={row?.product}>{row?.product}</td>
                              <td className="px-2 py-2 text-right tabular-nums">{row?.planned?.toLocaleString()}</td>
                              <td className="px-2 py-2 text-right tabular-nums">{row?.actual?.toLocaleString()}</td>
                              <td className={`px-2 py-2 text-right tabular-nums font-medium ${row?.variance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {row?.variance >= 0 ? '+' : ''}{row?.variance?.toLocaleString()}
                              </td>
                              <td className="px-2 py-2 text-right tabular-nums">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                                  row?.efficiency >= 90 ? 'bg-emerald-100 text-emerald-700' :
                                  row?.efficiency >= 70 ? 'bg-amber-100 text-amber-700': 'bg-red-100 text-red-600'
                                }`}>{row?.efficiency}%</span>
                              </td>
                              <td className="px-2 py-2 text-right tabular-nums">{row?.costPerUnit?.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductionAnalytics;
