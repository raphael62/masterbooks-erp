import React from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import ProductSpreadsheet from './components/ProductSpreadsheet';

const ProductManagement = () => {
  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-200">
          <BreadcrumbNavigation />
          <div className="flex items-center justify-between mt-1">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Inventory</h1>
              <p className="text-xs text-gray-500">Manage your product catalog and inventory</p>
            </div>
          </div>
          {/* Module Tab Navigation */}
          <div className="flex items-end gap-0 mt-3 -mb-px">
            <a
              href="/inventory-management"
              className="px-4 py-2 text-xs font-medium border border-b-0 border-gray-300 rounded-t text-gray-600 hover:bg-gray-50 bg-white mr-0.5"
            >
              Overview
            </a>
            <span
              className="px-4 py-2 text-xs font-semibold border border-b-0 rounded-t mr-0.5"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' }}
            >
              Products
            </span>
            <a
              href="/stock-levels-by-location"
              className="px-4 py-2 text-xs font-medium border border-b-0 border-gray-300 rounded-t text-gray-600 hover:bg-gray-50 bg-white mr-0.5"
            >
              Stock by Location
            </a>
            <a
              href="/stock-movements"
              className="px-4 py-2 text-xs font-medium border border-b-0 border-gray-300 rounded-t text-gray-600 hover:bg-gray-50 bg-white mr-0.5"
            >
              Stock Movements
            </a>
            <a
              href="/returnable-glass-management"
              className="px-4 py-2 text-xs font-medium border border-b-0 border-gray-300 rounded-t text-gray-600 hover:bg-gray-50 bg-white"
            >
              Returnable Glass
            </a>
          </div>
        </div>

        {/* Spreadsheet Content */}
        <div className="flex-1 overflow-hidden">
          <ProductSpreadsheet />
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductManagement;
