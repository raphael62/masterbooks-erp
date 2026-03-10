import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SalesPerformanceReport = ({ filters }) => {
  const [viewMode, setViewMode] = useState('chart');

  // Mock sales performance data
  const salesData = [
    {
      executive: 'Kwame Asante',
      target: 150000,
      achieved: 142500,
      achievement: 95.0,
      customers: 45,
      orders: 128,
      avgOrderValue: 1113.28,
      region: 'Greater Accra',
      trend: [120000, 125000, 135000, 142500]
    },
    {
      executive: 'Ama Osei',
      target: 120000,
      achieved: 134800,
      achievement: 112.3,
      customers: 38,
      orders: 156,
      avgOrderValue: 864.10,
      region: 'Tema',
      trend: [95000, 108000, 125000, 134800]
    },
    {
      executive: 'Kofi Mensah',
      target: 180000,
      achieved: 165200,
      achievement: 91.8,
      customers: 52,
      orders: 189,
      avgOrderValue: 874.07,
      region: 'Ashanti',
      trend: [140000, 152000, 158000, 165200]
    },
    {
      executive: 'Akosua Boateng',
      target: 100000,
      achieved: 98750,
      achievement: 98.8,
      customers: 29,
      orders: 87,
      avgOrderValue: 1135.06,
      region: 'Central',
      trend: [75000, 82000, 91000, 98750]
    },
    {
      executive: 'Yaw Oppong',
      target: 130000,
      achieved: 118900,
      achievement: 91.5,
      customers: 34,
      orders: 102,
      avgOrderValue: 1166.67,
      region: 'Western',
      trend: [95000, 105000, 112000, 118900]
    }
  ];

  const monthlyTrendData = [
    { month: 'May', target: 680000, achieved: 625000 },
    { month: 'Jun', target: 680000, achieved: 672000 },
    { month: 'Jul', target: 680000, achieved: 721000 },
    { month: 'Aug', target: 680000, achieved: 660150 }
  ];

  const regionData = [
    { name: 'Greater Accra', value: 142500, color: '#1E40AF' },
    { name: 'Tema', value: 134800, color: '#059669' },
    { name: 'Ashanti', value: 165200, color: '#DC2626' },
    { name: 'Central', value: 98750, color: '#F59E0B' },
    { name: 'Western', value: 118900, color: '#7C3AED' }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const getAchievementColor = (achievement) => {
    if (achievement >= 100) return 'text-success';
    if (achievement >= 90) return 'text-warning';
    return 'text-error';
  };

  const getAchievementBadge = (achievement) => {
    if (achievement >= 100) return 'bg-success/10 text-success';
    if (achievement >= 90) return 'bg-warning/10 text-warning';
    return 'bg-error/10 text-error';
  };

  const totalTarget = salesData?.reduce((sum, item) => sum + item?.target, 0);
  const totalAchieved = salesData?.reduce((sum, item) => sum + item?.achieved, 0);
  const overallAchievement = (totalAchieved / totalTarget) * 100;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon name="Target" size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Target</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalTarget)}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <Icon name="TrendingUp" size={20} className="text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Achieved</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalAchieved)}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Icon name="Percent" size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Achievement Rate</p>
              <p className={`text-xl font-bold ${getAchievementColor(overallAchievement)}`}>
                {overallAchievement?.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Icon name="Users" size={20} className="text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Executives</p>
              <p className="text-xl font-bold text-foreground">{salesData?.length}</p>
            </div>
          </div>
        </div>
      </div>
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Sales Performance Analysis</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'chart' ? 'default' : 'outline'}
            size="sm"
            iconName="BarChart3"
            onClick={() => setViewMode('chart')}
          >
            Charts
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            iconName="Table"
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
        </div>
      </div>
      {viewMode === 'chart' ? (
        <div className="space-y-6">
          {/* Performance Bar Chart */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-md font-medium text-foreground mb-4">Target vs Achievement by Executive</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="executive" 
                    stroke="#6B7280"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), '']}
                    labelStyle={{ color: '#111827' }}
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="target" fill="#E5E7EB" name="Target" />
                  <Bar dataKey="achieved" fill="#1E40AF" name="Achieved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-md font-medium text-foreground mb-4">Monthly Performance Trend</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), '']}
                      labelStyle={{ color: '#111827' }}
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#E5E7EB" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="achieved" 
                      stroke="#1E40AF" 
                      strokeWidth={3}
                      name="Achieved"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Regional Distribution */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-md font-medium text-foreground mb-4">Sales by Region</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100)?.toFixed(0)}%`}
                      labelLine={false}
                    >
                      {regionData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry?.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Sales']}
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Performance Table */
        (<div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-medium text-foreground">Executive</th>
                  <th className="text-left p-4 font-medium text-foreground">Region</th>
                  <th className="text-right p-4 font-medium text-foreground">Target</th>
                  <th className="text-right p-4 font-medium text-foreground">Achieved</th>
                  <th className="text-center p-4 font-medium text-foreground">Achievement</th>
                  <th className="text-right p-4 font-medium text-foreground">Customers</th>
                  <th className="text-right p-4 font-medium text-foreground">Orders</th>
                  <th className="text-right p-4 font-medium text-foreground">Avg Order Value</th>
                  <th className="text-center p-4 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {salesData?.map((executive, index) => (
                  <tr key={index} className="border-t border-border hover:bg-accent/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-foreground">{executive?.executive}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-foreground">{executive?.region}</div>
                    </td>
                    <td className="p-4 text-right font-medium text-foreground">
                      {formatCurrency(executive?.target)}
                    </td>
                    <td className="p-4 text-right font-medium text-foreground">
                      {formatCurrency(executive?.achieved)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAchievementBadge(executive?.achievement)}`}>
                        {executive?.achievement?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-4 text-right text-foreground">
                      {executive?.customers}
                    </td>
                    <td className="p-4 text-right text-foreground">
                      {executive?.orders}
                    </td>
                    <td className="p-4 text-right text-foreground">
                      {formatCurrency(executive?.avgOrderValue)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName="Eye"
                          onClick={() => console.log('View executive details:', executive?.executive)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName="TrendingUp"
                          onClick={() => console.log('View performance trend:', executive?.executive)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>)
      )}
    </div>
  );
};

export default SalesPerformanceReport;