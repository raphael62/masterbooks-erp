import React from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import PromotionsSpreadsheet from './components/PromotionsSpreadsheet';

const SalesPromotionsManagement = () => {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">Promotions</h1>
            <p className="text-sm text-muted-foreground">Manage promotions. Promotions auto-apply in Sales Invoice entry.</p>
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-6 pb-4">
          <PromotionsSpreadsheet />
        </div>
      </div>
    </AppLayout>
  );
};

export default SalesPromotionsManagement;
