import React from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import PriceListSpreadsheet from './components/PriceListSpreadsheet';

const PriceListManagement = () => {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">Price List Management</h1>
            <p className="text-sm text-muted-foreground">Manage pricing structures and customer-specific price lists</p>
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-6 pb-4">
          <PriceListSpreadsheet />
        </div>
      </div>
    </AppLayout>
  );
};

export default PriceListManagement;
