import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6'];

const BOMAnalytics = ({ boms, bomItems }) => {
  const [isOpen, setIsOpen] = useState(false);

  const costBreakdownData = useMemo(() => {
    const byProduct = {};
    boms?.forEach(b => {
      const name = b?.product_name?.length > 12 ? b?.product_name?.substring(0, 12) + '…' : b?.product_name;
      if (!byProduct?.[name]) byProduct[name] = { name, material: 0, labor: 0, overhead: 0 };
      byProduct[name].material += parseFloat(b?.total_material_cost) || 0;
      byProduct[name].labor += parseFloat(b?.labor_cost) || 0;
      byProduct[name].overhead += parseFloat(b?.overhead_cost) || 0;
    });
    return Object.values(byProduct)?.slice(0, 10);
  }, [boms]);

  const ingredientUsageData = useMemo(() => {
    const byIngredient = {};
    bomItems?.forEach(item => {
      const name = item?.material_name;
      if (!name) return;
      if (!byIngredient?.[name]) byIngredient[name] = { name, value: 0 };
      byIngredient[name].value += parseFloat(item?.adjusted_qty) || 0;
    });
    return Object.values(byIngredient)?.sort((a, b) => b?.value - a?.value)?.slice(0, 10)?.map(d => ({ ...d, value: parseFloat(d?.value?.toFixed(2)) }));
  }, [bomItems]);

  const costTrendData = useMemo(() => {
    const byProduct = {};
    boms?.forEach(b => {
      const name = b?.product_name?.length > 15 ? b?.product_name?.substring(0, 15) + '…' : b?.product_name;
      if (!byProduct?.[name]) byProduct[name] = [];
      byProduct?.[name]?.push({ version: `v${b?.version}`, cost: parseFloat(b?.total_cost) || 0 });
    });
    const allVersions = [...new Set(boms?.map(b => `v${b?.version}`))]?.sort();
    return allVersions?.map(ver => {
      const row = { version: ver };
      Object.entries(byProduct)?.forEach(([prod, entries]) => {
        const match = entries?.find(e => e?.version === ver);
        row[prod] = match?.cost || null;
      });
      return row;
    });
  }, [boms]);

  const productNames = useMemo(() => [...new Set(boms?.map(b => b?.product_name?.length > 15 ? b.product_name.substring(0, 15) + '…' : b?.product_name))]?.slice(0, 5), [boms]);

  const fmt = (v) => `GHS ${Number(v)?.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon name="BarChart3" size={16} className="text-primary" />
          <span className="font-semibold text-sm text-foreground">BOM Analytics</span>
        </div>
        <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground" />
      </button>
      {isOpen && (
        <div className="border-t border-border p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cost Breakdown Bar Chart */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Cost Breakdown by Product</h4>
            {costBreakdownData?.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-xs">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={costBreakdownData} margin={{ top: 5, right: 5, left: 5, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000)?.toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="material" name="Material" fill="#6366f1" radius={[2,2,0,0]} />
                  <Bar dataKey="labor" name="Labor" fill="#22c55e" radius={[2,2,0,0]} />
                  <Bar dataKey="overhead" name="Overhead" fill="#f59e0b" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Ingredient Usage Pie Chart */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Top Ingredients by Usage</h4>
            {ingredientUsageData?.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-xs">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={ingredientUsageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name?.substring(0,8)} ${(percent * 100)?.toFixed(0)}%`} labelLine={false}>
                    {ingredientUsageData?.map((_, i) => <Cell key={i} fill={COLORS?.[i % COLORS?.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v?.toFixed(2), 'Qty']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Cost Trend Line Chart */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Cost Trend by Version</h4>
            {costTrendData?.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-xs">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={costTrendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="version" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000)?.toFixed(0)}k`} />
                  <Tooltip formatter={(v) => v ? fmt(v) : 'N/A'} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {productNames?.map((prod, i) => (
                    <Line key={prod} type="monotone" dataKey={prod} stroke={COLORS?.[i % COLORS?.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BOMAnalytics;
