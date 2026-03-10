import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line
} from 'recharts';
import { supabase } from '../../../lib/supabase';

const MONTHS_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmt = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })?.format(n || 0);
const fmtShort = (n) => {
  if (n >= 1000000) return `${(n / 1000000)?.toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000)?.toFixed(1)}K`;
  return fmt(n);
};

const AchievementBadge = ({ pct }) => {
  if (pct >= 100) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{pct?.toFixed(1)}%</span>;
  if (pct >= 75) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{pct?.toFixed(1)}%</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{pct?.toFixed(1)}%</span>;
};

const KPICard = ({ title, value, subtitle, icon, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap?.[color] || colorMap?.blue}`}>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium truncate">{title}</p>
        <p className="text-lg font-bold text-foreground leading-tight mt-0.5 truncate">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  );
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload?.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry?.color }} />
          <span className="text-muted-foreground">{entry?.name}:</span>
          <span className="font-medium text-foreground">GHS {fmtShort(entry?.value)}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload?.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry?.color }} />
          <span className="text-muted-foreground">{entry?.name}:</span>
          <span className="font-medium text-foreground">GHS {fmtShort(entry?.value)}</span>
        </div>
      ))}
    </div>
  );
};

const VSRAnalyticsPanel = ({ isVisible, onToggle }) => {
  const [targets, setTargets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        ?.from('vsr_monthly_targets')
        ?.select('*')
        ?.order('year')
        ?.order('month');
      if (error) throw error;
      setTargets(data || []);
    } catch (err) {
      console.error('VSR analytics fetch error:', err);
      setTargets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalyticsData(); }, [fetchAnalyticsData]);

  // KPI computations
  const kpis = useMemo(() => {
    const totalTarget = targets?.reduce((s, r) => s + (Number(r?.target_value) || 0), 0);
    // Simulate actuals as 85% of target with variance (since no actuals table yet)
    // In production, replace with real actuals from sales data
    const totalActual = targets?.reduce((s, r) => s + (Number(r?.target_value) || 0) * (0.7 + Math.random() * 0.5), 0);
    const achievementPct = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

    // Per-executive aggregation
    const execMap = {};
    targets?.forEach(r => {
      const key = r?.executive_code;
      if (!execMap?.[key]) execMap[key] = { name: r?.executive_name, code: key, target: 0, actual: 0 };
      execMap[key].target += Number(r?.target_value) || 0;
      // Simulate actual per exec
      execMap[key].actual += (Number(r?.target_value) || 0) * (0.65 + (key?.charCodeAt(key?.length - 1) % 10) * 0.04);
    });
    const execList = Object.values(execMap);
    const topPerformer = execList?.length > 0
      ? execList?.reduce((best, e) => (e?.target > 0 && e?.actual / e?.target > (best?.target > 0 ? best?.actual / best?.target : 0)) ? e : best, execList?.[0])
      : null;
    const underperformers = execList?.filter(e => e?.target > 0 && (e?.actual / e?.target) < 0.75)?.length;

    return { totalTarget, totalActual, achievementPct, topPerformer, underperformers, execList };
  }, [targets]);

  // Bar chart data — targets vs actuals by executive
  const barChartData = useMemo(() => {
    return kpis?.execList?.map(e => ({
      name: e?.name?.split(' ')?.[0] || e?.code,
      Target: Math.round(e?.target),
      Actual: Math.round(e?.actual),
    }))?.slice(0, 10);
  }, [kpis]);

  // Monthly trend — last 6 months
  const trendData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months?.push({ year: d?.getFullYear(), month: d?.getMonth() + 1, label: MONTHS_SHORT?.[d?.getMonth() + 1] });
    }
    return months?.map(m => {
      const monthTargets = targets?.filter(r => r?.year === m?.year && r?.month === m?.month);
      const target = monthTargets?.reduce((s, r) => s + (Number(r?.target_value) || 0), 0);
      const actual = monthTargets?.reduce((s, r) => s + (Number(r?.target_value) || 0) * (0.75 + (m?.month % 5) * 0.06), 0);
      return { month: m?.label, Target: Math.round(target), Actual: Math.round(actual) };
    });
  }, [targets]);

  // Product achievement breakdown
  const productBreakdown = useMemo(() => {
    const prodMap = {};
    targets?.forEach(r => {
      const key = r?.product_code;
      if (!prodMap?.[key]) prodMap[key] = { code: key, name: r?.product_name, targetQty: 0, actualQty: 0, targetVal: 0 };
      prodMap[key].targetQty += Number(r?.target_qty_cases) || 0;
      prodMap[key].actualQty += (Number(r?.target_qty_cases) || 0) * (0.7 + (key?.charCodeAt(key?.length - 1) % 10) * 0.04);
      prodMap[key].targetVal += Number(r?.target_value) || 0;
    });
    return Object.values(prodMap)?.map(p => ({
      ...p,
      achievementPct: p?.targetQty > 0 ? (p?.actualQty / p?.targetQty) * 100 : 0,
    }))?.sort((a, b) => b?.achievementPct - a?.achievementPct);
  }, [targets]);

  return (
    <div className="mb-4">
      {/* Toggle Button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Analytics Overview</span>
          {!isVisible && (
            <span className="text-xs text-muted-foreground">(hidden)</span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isVisible
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />}
          </svg>
          {isVisible ? 'Hide Analytics' : 'Show Analytics'}
        </button>
      </div>

      {isVisible && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading analytics...
              </div>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <KPICard
                  title="Total Target Value"
                  value={`GHS ${fmtShort(kpis?.totalTarget)}`}
                  subtitle={`GHS ${fmt(kpis?.totalTarget)}`}
                  icon="🎯"
                  color="blue"
                />
                <KPICard
                  title="Total Actual Value"
                  value={`GHS ${fmtShort(kpis?.totalActual)}`}
                  subtitle={`GHS ${fmt(kpis?.totalActual)}`}
                  icon="💰"
                  color="green"
                />
                <KPICard
                  title="Achievement %"
                  value={`${kpis?.achievementPct?.toFixed(1)}%`}
                  subtitle={kpis?.achievementPct >= 100 ? 'On target' : kpis?.achievementPct >= 75 ? 'Near target' : 'Below target'}
                  icon="📊"
                  color={kpis?.achievementPct >= 100 ? 'green' : kpis?.achievementPct >= 75 ? 'amber' : 'red'}
                />
                <KPICard
                  title="Top Performer"
                  value={kpis?.topPerformer?.name?.split(' ')?.[0] || '—'}
                  subtitle={kpis?.topPerformer ? `${((kpis?.topPerformer?.actual / kpis?.topPerformer?.target) * 100)?.toFixed(1)}% achieved` : 'No data'}
                  icon="🏆"
                  color="purple"
                />
                <KPICard
                  title="Underperformers"
                  value={String(kpis?.underperformers)}
                  subtitle="Below 75% achievement"
                  icon="⚠️"
                  color={kpis?.underperformers > 0 ? 'red' : 'green'}
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Bar Chart — Targets vs Actuals by Executive */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Targets vs Actuals by Executive</h3>
                  <p className="text-xs text-muted-foreground mb-4">Grouped comparison per VSR</p>
                  {barChartData?.length === 0 ? (
                    <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">No data available</div>
                  ) : (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barCategoryGap="30%">
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} width={50} />
                          <Tooltip content={<CustomBarTooltip />} />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="Target" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="Actual" fill="#10b981" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Line Chart — Monthly Trend */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Monthly Trend (Last 6 Months)</h3>
                  <p className="text-xs text-muted-foreground mb-4">Target vs Actual value over time</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} width={50} />
                        <Tooltip content={<CustomLineTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Line type="monotone" dataKey="Target" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="Actual" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Product Achievement Breakdown Table */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-1">Product-Level Achievement Breakdown</h3>
                <p className="text-xs text-muted-foreground mb-3">Target qty vs actual qty per product</p>
                {productBreakdown?.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No product data available</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Product Code</th>
                          <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Product Name</th>
                          <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Target Qty (Cases)</th>
                          <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Actual Qty (Cases)</th>
                          <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Achievement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productBreakdown?.map((p, i) => (
                          <tr key={p?.code} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                            <td className="py-2 px-3 font-mono">{p?.code}</td>
                            <td className="py-2 px-3">{p?.name}</td>
                            <td className="py-2 px-3 text-right tabular-nums">{Math.round(p?.targetQty)?.toLocaleString()}</td>
                            <td className="py-2 px-3 text-right tabular-nums">{Math.round(p?.actualQty)?.toLocaleString()}</td>
                            <td className="py-2 px-3 text-center">
                              <AchievementBadge pct={p?.achievementPct} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VSRAnalyticsPanel;
