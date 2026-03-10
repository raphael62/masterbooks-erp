import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const ReportSidebar = ({ selectedReport, onReportSelect, isCollapsed, onToggleCollapse }) => {
  const [expandedCategories, setExpandedCategories] = useState(['sales', 'financial']);

  const reportCategories = [
    {
      id: 'sales',
      label: 'Sales Reports',
      icon: 'TrendingUp',
      reports: [
        {
          id: 'sales-performance',
          label: 'Sales Performance',
          description: 'Executive performance and targets'
        },
        {
          id: 'sales-summary',
          label: 'Sales Summary',
          description: 'Daily, weekly, monthly summaries'
        },
        {
          id: 'product-analysis',
          label: 'Product Analysis',
          description: 'Top selling products and trends'
        },
        {
          id: 'customer-sales',
          label: 'Customer Sales',
          description: 'Sales by customer analysis'
        }
      ]
    },
    {
      id: 'financial',
      label: 'Financial Reports',
      icon: 'DollarSign',
      reports: [
        {
          id: 'ar-aging',
          label: 'AR Aging Analysis',
          description: 'Outstanding receivables by age'
        },
        {
          id: 'receivables-tracking',
          label: 'Receivables Tracking',
          description: 'Payment predictions and trends'
        },
        {
          id: 'payment-analysis',
          label: 'Payment Analysis',
          description: 'Payment methods and patterns'
        },
        {
          id: 'credit-control',
          label: 'Credit Control',
          description: 'Credit limits and exposures'
        }
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory Reports',
      icon: 'Package',
      reports: [
        {
          id: 'stock-movement',
          label: 'Stock Movement',
          description: 'Inventory transactions and transfers'
        },
        {
          id: 'stock-levels',
          label: 'Stock Levels',
          description: 'Current inventory positions'
        },
        {
          id: 'empties-reconciliation',
          label: 'Empties Reconciliation',
          description: 'Bottle returns and tracking'
        },
        {
          id: 'reorder-analysis',
          label: 'Reorder Analysis',
          description: 'Stock replenishment recommendations'
        }
      ]
    },
    {
      id: 'hr',
      label: 'HR Reports',
      icon: 'Users',
      reports: [
        {
          id: 'attendance-summary',
          label: 'Attendance Summary',
          description: 'Employee attendance tracking'
        },
        {
          id: 'payroll-summary',
          label: 'Payroll Summary',
          description: 'Salary and deductions analysis'
        },
        {
          id: 'performance-review',
          label: 'Performance Review',
          description: 'Employee performance metrics'
        }
      ]
    }
  ];

  const toggleCategory = (categoryId) => {
    if (isCollapsed) return;
    
    setExpandedCategories(prev =>
      prev?.includes(categoryId)
        ? prev?.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleReportSelect = (report, categoryId) => {
    onReportSelect({ ...report, categoryId });
  };

  return (
    <div className={`bg-card border-r border-border transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-80'}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-foreground">Reports</h2>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-accent transition-colors duration-150 ease-out"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon 
              name={isCollapsed ? "ChevronRight" : "ChevronLeft"} 
              size={20} 
              className="text-muted-foreground" 
            />
          </button>
        </div>
      </div>
      {/* Report Categories */}
      <div className="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
        {reportCategories?.map((category) => {
          const isExpanded = expandedCategories?.includes(category?.id);
          
          return (
            <div key={category?.id}>
              <button
                onClick={() => toggleCategory(category?.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors duration-150 ease-out group"
                title={isCollapsed ? category?.label : undefined}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon 
                    name={category?.icon} 
                    size={20} 
                    className="text-muted-foreground group-hover:text-accent-foreground flex-shrink-0" 
                  />
                  {!isCollapsed && (
                    <span className="font-medium text-sm text-foreground truncate">
                      {category?.label}
                    </span>
                  )}
                </div>
                
                {!isCollapsed && (
                  <Icon 
                    name={isExpanded ? "ChevronDown" : "ChevronRight"} 
                    size={16} 
                    className="text-muted-foreground flex-shrink-0" 
                  />
                )}
              </button>
              {!isCollapsed && isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {category?.reports?.map((report) => (
                    <button
                      key={report?.id}
                      onClick={() => handleReportSelect(report, category?.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors duration-150 ease-out ${
                        selectedReport?.id === report?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className={`text-sm font-medium ${
                          selectedReport?.id === report?.id
                            ? 'text-primary-foreground'
                            : 'text-foreground'
                        }`}>
                          {report?.label}
                        </div>
                        <div className={`text-xs ${
                          selectedReport?.id === report?.id
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground'
                        }`}>
                          {report?.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportSidebar;