import React from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import ProductCategoriesSpreadsheet from './components/ProductCategoriesSpreadsheet';

const ProductCategoriesManagement = () => {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">Product Categories</h1>
            <p className="text-sm text-muted-foreground">Manage product category codes and names for classification</p>
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-6 pb-4">
          <ProductCategoriesSpreadsheet />
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductCategoriesManagement;
