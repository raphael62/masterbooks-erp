import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ARAgingReport = ({ filters }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'totalOutstanding', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock AR Aging data
  const arAgingData = [
    {
      id: 1,
      customerName: "Accra Supermarket Ltd",
      customerCode: "CUST-001",
      businessExecutive: "Kwame Asante",
      totalOutstanding: 45750.00,
      current: 12500.00,
      days1to30: 15250.00,
      days31to60: 8750.00,
      days61to90: 5500.00,
      over90Days: 3750.00,
      creditLimit: 50000.00,
      lastPayment: "2025-08-25",
      riskLevel: "medium"
    },
    {
      id: 2,
      customerName: "Tema Trading Company",
      customerCode: "CUST-002",
      businessExecutive: "Ama Osei",
      totalOutstanding: 28900.00,
      current: 18900.00,
      days1to30: 6500.00,
      days31to60: 2800.00,
      days61to90: 700.00,
      over90Days: 0.00,
      creditLimit: 35000.00,
      lastPayment: "2025-08-28",
      riskLevel: "low"
    },
    {
      id: 3,
      customerName: "Kumasi Wholesale Hub",
      customerCode: "CUST-003",
      businessExecutive: "Kofi Mensah",
      totalOutstanding: 67200.00,
      current: 8200.00,
      days1to30: 12000.00,
      days31to60: 18500.00,
      days61to90: 15800.00,
      over90Days: 12700.00,
      creditLimit: 60000.00,
      lastPayment: "2025-07-15",
      riskLevel: "high"
    },
    {
      id: 4,
      customerName: "Cape Coast Distributors",
      customerCode: "CUST-004",
      businessExecutive: "Akosua Boateng",
      totalOutstanding: 19850.00,
      current: 15850.00,
      days1to30: 4000.00,
      days31to60: 0.00,
      days61to90: 0.00,
      over90Days: 0.00,
      creditLimit: 25000.00,
      lastPayment: "2025-08-30",
      riskLevel: "low"
    },
    {
      id: 5,
      customerName: "Takoradi Retail Network",
      customerCode: "CUST-005",
      businessExecutive: "Yaw Oppong",
      totalOutstanding: 38450.00,
      current: 5450.00,
      days1to30: 8900.00,
      days31to60: 12100.00,
      days61to90: 7200.00,
      over90Days: 4800.00,
      creditLimit: 40000.00,
      lastPayment: "2025-08-20",
      riskLevel: "medium"
    }
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

  const getRiskBadge = (riskLevel) => {
    const configs = {
      low: { color: 'bg-success/10 text-success', label: 'Low Risk' },
      medium: { color: 'bg-warning/10 text-warning', label: 'Medium Risk' },
      high: { color: 'bg-error/10 text-error', label: 'High Risk' }
    };
    
    const config = configs?.[riskLevel] || configs?.low;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
        {config?.label}
      </span>
    );
  };

  const getCreditUtilization = (outstanding, limit) => {
    const utilization = (outstanding / limit) * 100;
    return Math.min(utilization, 100);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig?.key === key && sortConfig?.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...arAgingData]?.sort((a, b) => {
    if (sortConfig?.direction === 'asc') {
      return a?.[sortConfig?.key] > b?.[sortConfig?.key] ? 1 : -1;
    }
    return a?.[sortConfig?.key] < b?.[sortConfig?.key] ? 1 : -1;
  });

  const totalPages = Math.ceil(sortedData?.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData?.slice(startIndex, startIndex + itemsPerPage);

  const getSortIcon = (columnKey) => {
    if (sortConfig?.key !== columnKey) {
      return <Icon name="ArrowUpDown" size={14} className="text-muted-foreground" />;
    }
    return (
      <Icon 
        name={sortConfig?.direction === 'asc' ? "ArrowUp" : "ArrowDown"} 
        size={14} 
        className="text-primary" 
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon name="DollarSign" size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Outstanding</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(arAgingData?.reduce((sum, item) => sum + item?.totalOutstanding, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <Icon name="CheckCircle" size={20} className="text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(arAgingData?.reduce((sum, item) => sum + item?.current, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Icon name="Clock" size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">1-30 Days</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(arAgingData?.reduce((sum, item) => sum + item?.days1to30, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-error/10 rounded-lg">
              <Icon name="AlertTriangle" size={20} className="text-error" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">31-90 Days</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(arAgingData?.reduce((sum, item) => sum + item?.days31to60 + item?.days61to90, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-error/20 rounded-lg">
              <Icon name="AlertCircle" size={20} className="text-error" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Over 90 Days</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(arAgingData?.reduce((sum, item) => sum + item?.over90Days, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* AR Aging Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-medium text-foreground">
                  <button
                    onClick={() => handleSort('customerName')}
                    className="flex items-center space-x-2 hover:text-primary transition-colors"
                  >
                    <span>Customer</span>
                    {getSortIcon('customerName')}
                  </button>
                </th>
                <th className="text-left p-4 font-medium text-foreground">
                  <button
                    onClick={() => handleSort('businessExecutive')}
                    className="flex items-center space-x-2 hover:text-primary transition-colors"
                  >
                    <span>Executive</span>
                    {getSortIcon('businessExecutive')}
                  </button>
                </th>
                <th className="text-right p-4 font-medium text-foreground">
                  <button
                    onClick={() => handleSort('totalOutstanding')}
                    className="flex items-center space-x-2 hover:text-primary transition-colors ml-auto"
                  >
                    <span>Total Outstanding</span>
                    {getSortIcon('totalOutstanding')}
                  </button>
                </th>
                <th className="text-right p-4 font-medium text-foreground">Current</th>
                <th className="text-right p-4 font-medium text-foreground">1-30 Days</th>
                <th className="text-right p-4 font-medium text-foreground">31-60 Days</th>
                <th className="text-right p-4 font-medium text-foreground">61-90 Days</th>
                <th className="text-right p-4 font-medium text-foreground">Over 90 Days</th>
                <th className="text-center p-4 font-medium text-foreground">Risk Level</th>
                <th className="text-center p-4 font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData?.map((customer) => (
                <tr key={customer?.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-foreground">{customer?.customerName}</div>
                      <div className="text-sm text-muted-foreground">{customer?.customerCode}</div>
                      <div className="text-xs text-muted-foreground">
                        Credit: {formatCurrency(customer?.creditLimit)} | 
                        Utilization: {getCreditUtilization(customer?.totalOutstanding, customer?.creditLimit)?.toFixed(1)}%
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-foreground">{customer?.businessExecutive}</div>
                    <div className="text-xs text-muted-foreground">
                      Last Payment: {formatDate(customer?.lastPayment)}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-medium text-foreground">
                      {formatCurrency(customer?.totalOutstanding)}
                    </div>
                    <div className="w-full bg-muted rounded-full h-1 mt-1">
                      <div 
                        className={`h-1 rounded-full ${
                          getCreditUtilization(customer?.totalOutstanding, customer?.creditLimit) > 90 
                            ? 'bg-error' 
                            : getCreditUtilization(customer?.totalOutstanding, customer?.creditLimit) > 75 
                            ? 'bg-warning' :'bg-success'
                        }`}
                        style={{ 
                          width: `${getCreditUtilization(customer?.totalOutstanding, customer?.creditLimit)}%` 
                        }}
                      />
                    </div>
                  </td>
                  <td className="p-4 text-right text-success font-medium">
                    {formatCurrency(customer?.current)}
                  </td>
                  <td className="p-4 text-right text-warning font-medium">
                    {formatCurrency(customer?.days1to30)}
                  </td>
                  <td className="p-4 text-right text-error font-medium">
                    {formatCurrency(customer?.days31to60)}
                  </td>
                  <td className="p-4 text-right text-error font-medium">
                    {formatCurrency(customer?.days61to90)}
                  </td>
                  <td className="p-4 text-right text-error font-bold">
                    {formatCurrency(customer?.over90Days)}
                  </td>
                  <td className="p-4 text-center">
                    {getRiskBadge(customer?.riskLevel)}
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
                        onClick={() => console.log('Send reminder:', customer?.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData?.length)} of {sortedData?.length} customers
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              iconName="ChevronLeft"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)?.map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              iconName="ChevronRight"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARAgingReport;