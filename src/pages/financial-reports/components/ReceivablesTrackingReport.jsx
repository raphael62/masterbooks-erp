import React, { useState } from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ReceivablesTrackingReport = ({ filters }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('3months');

  // Mock receivables tracking data
  const receivablesData = [
    {
      id: 1,
      customerName: "Accra Supermarket Ltd",
      totalReceivables: 45750.00,
      currentMonth: 12500.00,
      predictedPayment: "2025-09-15",
      paymentProbability: 85,
      averagePaymentDays: 28,
      creditRating: "B+",
      lastPaymentAmount: 18500.00,
      lastPaymentDate: "2025-08-25",
      trend: "improving"
    },
    {
      id: 2,
      customerName: "Tema Trading Company",
      totalReceivables: 28900.00,
      currentMonth: 18900.00,
      predictedPayment: "2025-09-10",
      paymentProbability: 92,
      averagePaymentDays: 22,
      creditRating: "A-",
      lastPaymentAmount: 15200.00,
      lastPaymentDate: "2025-08-28",
      trend: "stable"
    },
    {
      id: 3,
      customerName: "Kumasi Wholesale Hub",
      totalReceivables: 67200.00,
      currentMonth: 8200.00,
      predictedPayment: "2025-10-05",
      paymentProbability: 45,
      averagePaymentDays: 65,
      creditRating: "C+",
      lastPaymentAmount: 12000.00,
      lastPaymentDate: "2025-07-15",
      trend: "declining"
    },
    {
      id: 4,
      customerName: "Cape Coast Distributors",
      totalReceivables: 19850.00,
      currentMonth: 15850.00,
      predictedPayment: "2025-09-08",
      paymentProbability: 95,
      averagePaymentDays: 18,
      creditRating: "A",
      lastPaymentAmount: 22500.00,
      lastPaymentDate: "2025-08-30",
      trend: "improving"
    },
    {
      id: 5,
      customerName: "Takoradi Retail Network",
      totalReceivables: 38450.00,
      currentMonth: 5450.00,
      predictedPayment: "2025-09-20",
      paymentProbability: 70,
      averagePaymentDays: 42,
      creditRating: "B",
      lastPaymentAmount: 8900.00,
      lastPaymentDate: "2025-08-20",
      trend: "stable"
    }
  ];

  const cashFlowProjection = [
    { date: '01/09', projected: 45000, actual: 42000, cumulative: 42000 },
    { date: '08/09', projected: 38000, actual: 35500, cumulative: 77500 },
    { date: '15/09', projected: 52000, actual: null, cumulative: 129500 },
    { date: '22/09', projected: 28000, actual: null, cumulative: 157500 },
    { date: '29/09', projected: 41000, actual: null, cumulative: 198500 },
    { date: '06/10', projected: 33000, actual: null, cumulative: 231500 },
    { date: '13/10', projected: 47000, actual: null, cumulative: 278500 }
  ];

  const paymentTrendData = [
    { month: 'Mar', onTime: 75, late: 20, veryLate: 5 },
    { month: 'Apr', onTime: 78, late: 18, veryLate: 4 },
    { month: 'May', onTime: 82, late: 15, veryLate: 3 },
    { month: 'Jun', onTime: 79, late: 17, veryLate: 4 },
    { month: 'Jul', onTime: 85, late: 12, veryLate: 3 },
    { month: 'Aug', onTime: 88, late: 10, veryLate: 2 }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    })?.format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-GB');
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 80) return 'text-success';
    if (probability >= 60) return 'text-warning';
    return 'text-error';
  };

  const getProbabilityBadge = (probability) => {
    if (probability >= 80) return 'bg-success/10 text-success';
    if (probability >= 60) return 'bg-warning/10 text-warning';
    return 'bg-error/10 text-error';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return 'TrendingUp';
      case 'declining': return 'TrendingDown';
      default: return 'Minus';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return 'text-success';
      case 'declining': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getCreditRatingColor = (rating) => {
    if (rating?.startsWith('A')) return 'bg-success/10 text-success';
    if (rating?.startsWith('B')) return 'bg-warning/10 text-warning';
    return 'bg-error/10 text-error';
  };

  const totalReceivables = receivablesData?.reduce((sum, item) => sum + item?.totalReceivables, 0);
  const averageProbability = receivablesData?.reduce((sum, item) => sum + item?.paymentProbability, 0) / receivablesData?.length;
  const projectedCollections = receivablesData?.reduce((sum, item) => sum + (item?.totalReceivables * item?.paymentProbability / 100), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon name="DollarSign" size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Receivables</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalReceivables)}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <Icon name="TrendingUp" size={20} className="text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Projected Collections</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(projectedCollections)}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Icon name="Percent" size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Payment Probability</p>
              <p className={`text-xl font-bold ${getProbabilityColor(averageProbability)}`}>
                {averageProbability?.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Icon name="Clock" size={20} className="text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Collection Efficiency</p>
              <p className="text-xl font-bold text-foreground">
                {((projectedCollections / totalReceivables) * 100)?.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Cash Flow Projection Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-foreground">Cash Flow Projection</h4>
          <div className="flex items-center space-x-2">
            <Button
              variant={selectedTimeframe === '1month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe('1month')}
            >
              1M
            </Button>
            <Button
              variant={selectedTimeframe === '3months' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe('3months')}
            >
              3M
            </Button>
            <Button
              variant={selectedTimeframe === '6months' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe('6months')}
            >
              6M
            </Button>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlowProjection} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
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
              <Area 
                type="monotone" 
                dataKey="projected" 
                stroke="#1E40AF" 
                fill="#1E40AF" 
                fillOpacity={0.1}
                name="Projected"
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#059669" 
                strokeWidth={3}
                name="Actual"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Trend Analysis */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-md font-medium text-foreground mb-4">Payment Trend Analysis</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={paymentTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, '']}
                  labelStyle={{ color: '#111827' }}
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="onTime" 
                  stackId="1"
                  stroke="#059669" 
                  fill="#059669" 
                  name="On Time"
                />
                <Area 
                  type="monotone" 
                  dataKey="late" 
                  stackId="1"
                  stroke="#F59E0B" 
                  fill="#F59E0B" 
                  name="Late"
                />
                <Area 
                  type="monotone" 
                  dataKey="veryLate" 
                  stackId="1"
                  stroke="#DC2626" 
                  fill="#DC2626" 
                  name="Very Late"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Receivables by Risk */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-md font-medium text-foreground mb-4">Top Receivables by Risk</h4>
          <div className="space-y-3">
            {receivablesData?.sort((a, b) => a?.paymentProbability - b?.paymentProbability)?.slice(0, 5)?.map((customer) => (
                <div key={customer?.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {customer?.customerName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(customer?.totalReceivables)} • Due: {formatDate(customer?.predictedPayment)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProbabilityBadge(customer?.paymentProbability)}`}>
                      {customer?.paymentProbability}%
                    </span>
                    <Icon 
                      name={getTrendIcon(customer?.trend)} 
                      size={16} 
                      className={getTrendColor(customer?.trend)} 
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      {/* Detailed Receivables Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h4 className="text-md font-medium text-foreground">Receivables Tracking Details</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-medium text-foreground">Customer</th>
                <th className="text-right p-4 font-medium text-foreground">Total Receivables</th>
                <th className="text-center p-4 font-medium text-foreground">Predicted Payment</th>
                <th className="text-center p-4 font-medium text-foreground">Probability</th>
                <th className="text-center p-4 font-medium text-foreground">Avg Days</th>
                <th className="text-center p-4 font-medium text-foreground">Credit Rating</th>
                <th className="text-center p-4 font-medium text-foreground">Trend</th>
                <th className="text-center p-4 font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {receivablesData?.map((customer) => (
                <tr key={customer?.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-foreground">{customer?.customerName}</div>
                      <div className="text-sm text-muted-foreground">
                        Last Payment: {formatCurrency(customer?.lastPaymentAmount)} on {formatDate(customer?.lastPaymentDate)}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-medium text-foreground">
                      {formatCurrency(customer?.totalReceivables)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Current: {formatCurrency(customer?.currentMonth)}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="text-sm text-foreground">
                      {formatDate(customer?.predictedPayment)}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProbabilityBadge(customer?.paymentProbability)}`}>
                      {customer?.paymentProbability}%
                    </span>
                  </td>
                  <td className="p-4 text-center text-foreground">
                    {customer?.averagePaymentDays} days
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCreditRatingColor(customer?.creditRating)}`}>
                      {customer?.creditRating}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <Icon 
                      name={getTrendIcon(customer?.trend)} 
                      size={20} 
                      className={getTrendColor(customer?.trend)} 
                    />
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Eye"
                        onClick={() => console.log('View customer details:', customer?.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Mail"
                        onClick={() => console.log('Send payment reminder:', customer?.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReceivablesTrackingReport;