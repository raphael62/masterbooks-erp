import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/ui/AppLayout';


import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import ReportSidebar from './components/ReportSidebar';
import ReportFilters from './components/ReportFilters';
import ReportSummaryCards from './components/ReportSummaryCards';
import ARAgingReport from './components/ARAgingReport';
import SalesPerformanceReport from './components/SalesPerformanceReport';
import ReceivablesTrackingReport from './components/ReceivablesTrackingReport';
import InventoryMovementReport from './components/InventoryMovementReport';


const FinancialReports = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isReportSidebarCollapsed, setIsReportSidebarCollapsed] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportFilters, setReportFilters] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeReport, setActiveReport] = useState('sales-performance');
  const [dateRange, setDateRange] = useState('last-30-days');
  const [filters, setFilters] = useState({});

  useEffect(() => {
    // Set default report on component mount
    setSelectedReport({
      id: 'ar-aging',
      label: 'AR Aging Analysis',
      description: 'Outstanding receivables by age',
      categoryId: 'financial'
    });
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleReportSidebarToggle = () => {
    setIsReportSidebarCollapsed(!isReportSidebarCollapsed);
  };

  const handleReportSelect = (report) => {
    setIsLoading(true);
    setSelectedReport(report);
    
    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
      setLastUpdated(new Date());
    }, 800);
  };

  const handleFiltersChange = (filters) => {
    setReportFilters(filters);
    setLastUpdated(new Date());
  };

  const handleExport = (format) => {
    console.log(`Exporting ${selectedReport?.label} as ${format}`);
    // Simulate export process
    const exportData = {
      report: selectedReport?.label,
      format: format,
      filters: reportFilters,
      timestamp: new Date()?.toISOString()
    };
    
    // In a real application, this would trigger the actual export
    alert(`Export initiated: ${selectedReport?.label} (${format?.toUpperCase()})`);
  };

  const handlePrint = () => {
    console.log(`Printing ${selectedReport?.label}`);
    // Simulate print process
    window.print();
  };

  const getSummaryData = () => {
    if (!selectedReport) return null;

    switch (selectedReport?.id) {
      case 'ar-aging':
        return [
          {
            icon: 'DollarSign',
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
            label: 'Total Outstanding',
            value: 200150,
            type: 'currency',
            change: -2.5,
            subtitle: 'Across all customers'
          },
          {
            icon: 'CheckCircle',
            iconBg: 'bg-success/10',
            iconColor: 'text-success',
            label: 'Current (0-30 days)',
            value: 60900,
            type: 'currency',
            change: 5.2,
            subtitle: '30.4% of total'
          },
          {
            icon: 'Clock',
            iconBg: 'bg-warning/10',
            iconColor: 'text-warning',
            label: 'Overdue (31+ days)',
            value: 139250,
            type: 'currency',
            change: -8.1,
            subtitle: '69.6% of total'
          },
          {
            icon: 'AlertTriangle',
            iconBg: 'bg-error/10',
            iconColor: 'text-error',
            label: 'High Risk Accounts',
            value: 3,
            type: 'number',
            change: 0,
            subtitle: 'Require immediate attention'
          }
        ];

      case 'sales-performance':
        return [
          {
            icon: 'Target',
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
            label: 'Total Target',
            value: 680000,
            type: 'currency',
            progress: 97.1,
            subtitle: 'Monthly target'
          },
          {
            icon: 'TrendingUp',
            iconBg: 'bg-success/10',
            iconColor: 'text-success',
            label: 'Total Achieved',
            value: 660150,
            type: 'currency',
            change: 8.5,
            subtitle: '97.1% of target'
          },
          {
            icon: 'Users',
            iconBg: 'bg-secondary/10',
            iconColor: 'text-secondary',
            label: 'Top Performer',
            value: 'Ama Osei',
            type: 'text',
            subtitle: '112.3% achievement'
          },
          {
            icon: 'Award',
            iconBg: 'bg-warning/10',
            iconColor: 'text-warning',
            label: 'Avg Achievement',
            value: 97.9,
            type: 'percentage',
            change: 3.2,
            subtitle: 'Across all executives'
          }
        ];

      case 'receivables-tracking':
        return [
          {
            icon: 'DollarSign',
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
            label: 'Total Receivables',
            value: 200150,
            type: 'currency',
            change: -1.8,
            subtitle: 'Outstanding amount'
          },
          {
            icon: 'TrendingUp',
            iconBg: 'bg-success/10',
            iconColor: 'text-success',
            label: 'Projected Collections',
            value: 154320,
            type: 'currency',
            change: 12.5,
            subtitle: 'Next 30 days'
          },
          {
            icon: 'Percent',
            iconBg: 'bg-warning/10',
            iconColor: 'text-warning',
            label: 'Collection Efficiency',
            value: 77.1,
            type: 'percentage',
            change: 4.3,
            subtitle: 'Payment probability'
          },
          {
            icon: 'Clock',
            iconBg: 'bg-secondary/10',
            iconColor: 'text-secondary',
            label: 'Avg Payment Days',
            value: 35,
            type: 'number',
            change: -2.1,
            subtitle: 'Days to collect'
          }
        ];

      default:
        return null;
    }
  };

  const renderReportContent = () => {
    switch (activeReport) {
      case 'sales-performance':
        return <SalesPerformanceReport dateRange={dateRange} filters={filters} />;
      case 'ar-aging':
        return <ARAgingReport dateRange={dateRange} filters={filters} />;
      case 'receivables-tracking':
        return <ReceivablesTrackingReport dateRange={dateRange} filters={filters} />;
      case 'inventory-movement':
        return <InventoryMovementReport dateRange={dateRange} filters={filters} />;
      default:
        return <SalesPerformanceReport dateRange={dateRange} filters={filters} />;
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <BreadcrumbNavigation />
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Financial Reports</h1>
          <p className="text-muted-foreground">
            Analyze business performance with comprehensive financial reports and insights
          </p>
        </div>

        <ReportSummaryCards 
          selectedReport={selectedReport}
          summaryData={getSummaryData()}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div>
            <ReportSidebar 
              activeReport={activeReport}
              onReportChange={setActiveReport}
              selectedReport={selectedReport}
              onReportSelect={handleReportSelect}
              isCollapsed={isReportSidebarCollapsed}
              onToggleCollapse={handleReportSidebarToggle}
            />
          </div>
          
          <div className="lg:col-span-3 space-y-6">
            <ReportFilters
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              filters={filters}
              onFiltersChange={setFilters}
              selectedReport={selectedReport}
              onExport={handleExport}
              onPrint={handlePrint}
            />
            
            <div className="bg-card rounded-lg border border-border p-6">
              {renderReportContent()}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default FinancialReports;