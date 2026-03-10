import React, { useState } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import VSRTargetsSpreadsheet from './components/VSRTargetsSpreadsheet';
import VSRAnalyticsPanel from './components/VSRAnalyticsPanel';

const VSRMonthlyTargetsManagement = () => {
  const [analyticsVisible, setAnalyticsVisible] = useState(true);

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">VSR Monthly Targets</h1>
            <p className="text-sm text-muted-foreground">Manage Van Sales Rep monthly product targets</p>
          </div>
          <VSRAnalyticsPanel
            isVisible={analyticsVisible}
            onToggle={() => setAnalyticsVisible(prev => !prev)}
          />
        </div>
        <div className="flex-1 overflow-hidden px-6 pb-4">
          <VSRTargetsSpreadsheet />
        </div>
      </div>
    </AppLayout>
  );
};

export default VSRMonthlyTargetsManagement;
