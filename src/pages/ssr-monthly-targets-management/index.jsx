import React, { useState } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import SSRTargetsSpreadsheet from './components/SSRTargetsSpreadsheet';
import SSRAnalyticsPanel from './components/SSRAnalyticsPanel';

const SSRMonthlyTargetsManagement = () => {
  const [analyticsVisible, setAnalyticsVisible] = useState(true);

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">SSR Monthly Targets</h1>
            <p className="text-sm text-muted-foreground">Manage Shop Sales Rep monthly value targets</p>
          </div>
          <SSRAnalyticsPanel
            isVisible={analyticsVisible}
            onToggle={() => setAnalyticsVisible(prev => !prev)}
          />
        </div>
        <div className="flex-1 overflow-hidden px-6 pb-4">
          <SSRTargetsSpreadsheet />
        </div>
      </div>
    </AppLayout>
  );
};

export default SSRMonthlyTargetsManagement;
