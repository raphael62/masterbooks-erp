import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import SyncStatusBanner from './components/SyncStatusBanner';
import KPICard from './components/KPICard';
import SalesChart from './components/SalesChart';
import TopProductsChart from './components/TopProductsChart';
import ReceivablesChart from './components/ReceivablesChart';
import RecentActivities from './components/RecentActivities';
import PendingApprovals from './components/PendingApprovals';
import QuickActions from './components/QuickActions';

const Dashboard = () => {
  const navigate = useNavigate();
  const [kpiData, setKpiData] = useState({
    salesToday: { value: 28750, trend: 'up', trendValue: '+12.5%' },
    outstandingReceivables: { value: 274500, trend: 'down', trendValue: '-3.2%' },
    lowStockAlerts: { value: 8, trend: 'up', trendValue: '+2' },
    activeOrders: { value: 156, trend: 'up', trendValue: '+8.7%' }
  });

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setKpiData(prev => ({
        ...prev,
        salesToday: {
          ...prev?.salesToday,
          value: prev?.salesToday?.value + Math.floor(Math.random() * 500)
        },
        activeOrders: {
          ...prev?.activeOrders,
          value: prev?.activeOrders?.value + Math.floor(Math.random() * 3) - 1
        }
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleKPIClick = (type) => {
    switch (type) {
      case 'sales': navigate('/sales-order-management');
        break;
      case 'receivables': navigate('/financial-reports');
        break;
      case 'inventory': navigate('/inventory-management');
        break;
      case 'orders': navigate('/sales-order-management');
        break;
      default:
        console.log('Navigate to:', type);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation />

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>

        {/* Sync Status Banner */}
        <SyncStatusBanner />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Sales Today"
            value={kpiData?.salesToday?.value}
            currency={true}
            trend={kpiData?.salesToday?.trend}
            trendValue={kpiData?.salesToday?.trendValue}
            icon="TrendingUp"
            color="success"
            subtitle="VAT inclusive"
            onClick={() => handleKPIClick('sales')}
          />
          
          <KPICard
            title="Outstanding Receivables"
            value={kpiData?.outstandingReceivables?.value}
            currency={true}
            trend={kpiData?.outstandingReceivables?.trend}
            trendValue={kpiData?.outstandingReceivables?.trendValue}
            icon="CreditCard"
            color="warning"
            subtitle="Across all customers"
            onClick={() => handleKPIClick('receivables')}
          />
          
          <KPICard
            title="Low Stock Alerts"
            value={kpiData?.lowStockAlerts?.value}
            trend={kpiData?.lowStockAlerts?.trend}
            trendValue={kpiData?.lowStockAlerts?.trendValue}
            icon="AlertTriangle"
            color="error"
            subtitle="Items need restocking"
            onClick={() => handleKPIClick('inventory')}
          />
          
          <KPICard
            title="Active Orders"
            value={kpiData?.activeOrders?.value}
            trend={kpiData?.activeOrders?.trend}
            trendValue={kpiData?.activeOrders?.trendValue}
            icon="ShoppingCart"
            color="primary"
            subtitle="Pending & processing"
            onClick={() => handleKPIClick('orders')}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="xl:col-span-2">
            <SalesChart />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <TopProductsChart />
          <ReceivablesChart />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentActivities />
          </div>
          
          <div className="space-y-6">
            <PendingApprovals />
            <QuickActions />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;