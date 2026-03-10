import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const InventoryMovementReport = ({ filters }) => {
  const [viewMode, setViewMode] = useState('summary');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock inventory movement data
  const inventoryData = [
    {
      id: 1,
      productCode: "COCA-500ML",
      productName: "Coca-Cola 500ml",
      category: "Beverages",
      location: "Accra Main",
      openingStock: 2400,
      received: 1800,
      sold: 1950,
      transferred: 150,
      adjusted: -25,
      closingStock: 2075,
      unitCost: 2.50,
      totalValue: 5187.50,
      turnoverRate: 8.2,
      daysOnHand: 44
    },
    {
      id: 2,
      productCode: "FANTA-500ML",
      productName: "Fanta Orange 500ml",
      category: "Beverages",
      location: "Accra Main",
      openingStock: 1800,
      received: 1200,
      sold: 1450,
      transferred: 100,
      adjusted: 0,
      closingStock: 1450,
      unitCost: 2.30,
      totalValue: 3335.00,
      turnoverRate: 6.8,
      daysOnHand: 54
    },
    {
      id: 3,
      productCode: "SPRITE-500ML",
      productName: "Sprite 500ml",
      category: "Beverages",
      location: "Tema Depot",
      openingStock: 1500,
      received: 900,
      sold: 1100,
      transferred: 0,
      adjusted: 15,
      closingStock: 1315,
      unitCost: 2.40,
      totalValue: 3156.00,
      turnoverRate: 5.9,
      daysOnHand: 62
    },
    {
      id: 4,
      productCode: "WATER-1.5L",
      productName: "Voltic Water 1.5L",
      category: "Water",
      location: "Kumasi Branch",
      openingStock: 3200,
      received: 2400,
      sold: 2800,
      transferred: 200,
      adjusted: 0,
      closingStock: 2600,
      unitCost: 1.80,
      totalValue: 4680.00,
      turnoverRate: 12.5,
      daysOnHand: 29
    },
    {
      id: 5,
      productCode: "BEER-650ML",
      productName: "Star Beer 650ml",
      category: "Alcoholic",
      location: "Takoradi Outlet",
      openingStock: 800,
      received: 600,
      sold: 720,
      transferred: 50,
      adjusted: -10,
      closingStock: 620,
      unitCost: 4.50,
      totalValue: 2790.00,
      turnoverRate: 9.8,
      daysOnHand: 37
    }
  ];

  const movementTrendData = [
    { month: 'Mar', inbound: 45000, outbound: 42000, net: 3000 },
    { month: 'Apr', inbound: 48000, outbound: 45500, net: 2500 },
    { month: 'May', inbound: 52000, outbound: 49800, net: 2200 },
    { month: 'Jun', inbound: 47000, outbound: 48200, net: -1200 },
    { month: 'Jul', inbound: 51000, outbound: 50100, net: 900 },
    { month: 'Aug', inbound: 49500, outbound: 47800, net: 1700 }
  ];

  const categoryData = [
    { category: 'Beverages', value: 15420000, percentage: 65 },
    { category: 'Water', value: 4680000, percentage: 20 },
    { category: 'Alcoholic', value: 2790000, percentage: 12 },
    { category: 'Snacks', value: 712000, percentage: 3 }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    })?.format(amount);
  };

  const getMovementColor = (value) => {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-error';
    return 'text-muted-foreground';
  };

  const getTurnoverColor = (rate) => {
    if (rate >= 10) return 'text-success';
    if (rate >= 6) return 'text-warning';
    return 'text-error';
  };

  const getTurnoverBadge = (rate) => {
    if (rate >= 10) return 'bg-success/10 text-success';
    if (rate >= 6) return 'bg-warning/10 text-warning';
    return 'bg-error/10 text-error';
  };

  const categories = ['all', ...new Set(inventoryData.map(item => item.category))];
  const filteredData = selectedCategory === 'all' 
    ? inventoryData 
    : inventoryData?.filter(item => item?.category === selectedCategory);

  const totalValue = filteredData?.reduce((sum, item) => sum + item?.totalValue, 0);
  const totalMovement = filteredData?.reduce((sum, item) => sum + Math.abs(item?.received - item?.sold), 0);
  const averageTurnover = filteredData?.reduce((sum, item) => sum + item?.turnoverRate, 0) / filteredData?.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon name="Package" size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Inventory Value</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <Icon name="TrendingUp" size={20} className="text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Movement</p>
              <p className="text-xl font-bold text-foreground">{totalMovement?.toLocaleString()} units</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Icon name="RotateCcw" size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Turnover Rate</p>
              <p className={`text-xl font-bold ${getTurnoverColor(averageTurnover)}`}>
                {averageTurnover?.toFixed(1)}x
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
              <p className="text-sm text-muted-foreground">Active Products</p>
              <p className="text-xl font-bold text-foreground">{filteredData?.length}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-foreground">Inventory Movement Analysis</h3>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e?.target?.value)}
            className="px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {categories?.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'summary' ? 'default' : 'outline'}
            size="sm"
            iconName="BarChart3"
            onClick={() => setViewMode('summary')}
          >
            Summary
          </Button>
          <Button
            variant={viewMode === 'detailed' ? 'default' : 'outline'}
            size="sm"
            iconName="Table"
            onClick={() => setViewMode('detailed')}
          >
            Detailed
          </Button>
        </div>
      </div>
      {viewMode === 'summary' ? (
        <div className="space-y-6">
          {/* Movement Trend Chart */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-md font-medium text-foreground mb-4">Monthly Movement Trend</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip 
                    formatter={(value) => [value?.toLocaleString(), '']}
                    labelStyle={{ color: '#111827' }}
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="inbound" fill="#059669" name="Inbound" />
                  <Bar dataKey="outbound" fill="#DC2626" name="Outbound" />
                  <Bar dataKey="net" fill="#1E40AF" name="Net Movement" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-md font-medium text-foreground mb-4">Inventory by Category</h4>
              <div className="space-y-4">
                {categoryData?.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{category?.category}</span>
                      <span className="text-sm text-muted-foreground">{category?.percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${category?.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(category?.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Movers */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-md font-medium text-foreground mb-4">Top Moving Products</h4>
              <div className="space-y-3">
                {filteredData?.sort((a, b) => b?.turnoverRate - a?.turnoverRate)?.slice(0, 5)?.map((product) => (
                    <div key={product?.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {product?.productName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {product?.location} • {product?.sold} units sold
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTurnoverBadge(product?.turnoverRate)}`}>
                          {product?.turnoverRate}x
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Table */
        (<div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-medium text-foreground">Product</th>
                  <th className="text-left p-4 font-medium text-foreground">Location</th>
                  <th className="text-right p-4 font-medium text-foreground">Opening</th>
                  <th className="text-right p-4 font-medium text-foreground">Received</th>
                  <th className="text-right p-4 font-medium text-foreground">Sold</th>
                  <th className="text-right p-4 font-medium text-foreground">Transferred</th>
                  <th className="text-right p-4 font-medium text-foreground">Adjusted</th>
                  <th className="text-right p-4 font-medium text-foreground">Closing</th>
                  <th className="text-right p-4 font-medium text-foreground">Value</th>
                  <th className="text-center p-4 font-medium text-foreground">Turnover</th>
                  <th className="text-center p-4 font-medium text-foreground">Days on Hand</th>
                </tr>
              </thead>
              <tbody>
                {filteredData?.map((product) => (
                  <tr key={product?.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-foreground">{product?.productName}</div>
                        <div className="text-sm text-muted-foreground">{product?.productCode}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-foreground">{product?.location}</div>
                      <div className="text-xs text-muted-foreground">{product?.category}</div>
                    </td>
                    <td className="p-4 text-right text-foreground">
                      {product?.openingStock?.toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-success font-medium">
                      +{product?.received?.toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-error font-medium">
                      -{product?.sold?.toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-warning font-medium">
                      {product?.transferred > 0 ? '-' : ''}{Math.abs(product?.transferred)?.toLocaleString()}
                    </td>
                    <td className={`p-4 text-right font-medium ${getMovementColor(product?.adjusted)}`}>
                      {product?.adjusted > 0 ? '+' : ''}{product?.adjusted?.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-bold text-foreground">
                      {product?.closingStock?.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-medium text-foreground">
                      {formatCurrency(product?.totalValue)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTurnoverBadge(product?.turnoverRate)}`}>
                        {product?.turnoverRate}x
                      </span>
                    </td>
                    <td className="p-4 text-center text-foreground">
                      {product?.daysOnHand} days
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

export default InventoryMovementReport;