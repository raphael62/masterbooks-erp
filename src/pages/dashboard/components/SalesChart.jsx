import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';



const SalesChart = () => {
  const [timeRange, setTimeRange] = useState('7d');
  
  const salesData = {
    '7d': [
      { name: 'Mon', sales: 12500, orders: 45 },
      { name: 'Tue', sales: 15800, orders: 52 },
      { name: 'Wed', sales: 18200, orders: 61 },
      { name: 'Thu', sales: 14600, orders: 48 },
      { name: 'Fri', sales: 22400, orders: 73 },
      { name: 'Sat', sales: 28900, orders: 89 },
      { name: 'Sun', sales: 19300, orders: 67 }
    ],
    '30d': [
      { name: 'Week 1', sales: 89500, orders: 285 },
      { name: 'Week 2', sales: 95200, orders: 312 },
      { name: 'Week 3', sales: 102800, orders: 341 },
      { name: 'Week 4', sales: 118600, orders: 389 }
    ],
    '90d': [
      { name: 'Jan', sales: 385000, orders: 1250 },
      { name: 'Feb', sales: 420000, orders: 1380 },
      { name: 'Mar', sales: 465000, orders: 1520 }
    ]
  };

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-700 rounded-full" />
              <span className="text-sm text-gray-600">Sales:</span>
              <span className="text-sm font-medium">
                GHS {payload?.[0]?.value?.toLocaleString('en-GB')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600">Orders:</span>
              <span className="text-sm font-medium">{payload?.[1]?.value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleViewDetails = () => {
    console.log('Navigate to detailed sales report');
  };

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
  };

  // Error boundary for the chart rendering
  if (!salesData?.[timeRange]) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">Unable to load sales data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sales Performance</h3>
          <p className="text-sm text-gray-600">Revenue and order trends</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {timeRangeOptions?.map((option) => (
            <button
              key={option?.value}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeRange === option?.value 
                  ? 'bg-purple-700 text-white' :'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => handleTimeRangeChange(option?.value)}
            >
              {option?.label}
            </button>
          ))}
          
          <button
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            onClick={handleViewDetails}
          >
            View Details
          </button>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={salesData?.[timeRange] || []} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              yAxisId="left"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000)?.toFixed(0)}k`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="sales" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="orders" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-700 rounded-full" />
            <span className="text-sm text-gray-600">Sales Revenue (GHS)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm text-gray-600">Order Count</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          Last updated: {new Date()?.toLocaleString('en-GB')}
        </div>
      </div>
    </div>
  );
};

export default SalesChart;