import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import ProductCategoriesSpreadsheet from '../product-categories-management/components/ProductCategoriesSpreadsheet';
import EmptiesTypesSpreadsheet from '../empties-types-management/components/EmptiesTypesSpreadsheet';
import PriceTypeSpreadsheet from '../price-type-management/components/PriceTypeSpreadsheet';
import UOMSpreadsheet from '../units-of-measure-management/components/UOMSpreadsheet';
import PaymentMethodSettings from '../system-settings/components/PaymentMethodSettings';
import SimpleLookupTab from './components/SimpleLookupTab';

const TABS = [
  { id: 'brand-categories', label: 'Brand Categories', component: 'ProductCategories' },
  { id: 'empties-types', label: 'Empties Types', component: 'EmptiesTypes' },
  { id: 'price-types', label: 'Price Types', component: 'PriceTypes' },
  { id: 'units-of-measure', label: 'Units of Measure', component: 'UOM' },
  { id: 'payment-methods', label: 'Payment Methods', component: 'PaymentMethods' },
  { id: 'location-types', label: 'Location Types', component: 'LocationTypes' },
  { id: 'customer-groups', label: 'Customer Groups', component: 'CustomerGroups' },
  { id: 'customer-types', label: 'Customer Types', component: 'CustomerTypes' },
];

const LOCATION_TYPES_COLS = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
];

const CUSTOMER_GROUPS_COLS = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
];

const CUSTOMER_TYPES_COLS = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
];

const MasterDataSettings = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('brand-categories');

  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'brand-categories':
        return (
          <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
            <ProductCategoriesSpreadsheet />
          </div>
        );
      case 'empties-types':
        return (
          <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
            <EmptiesTypesSpreadsheet />
          </div>
        );
      case 'price-types':
        return (
          <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
            <PriceTypeSpreadsheet />
          </div>
        );
      case 'units-of-measure':
        return (
          <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
            <UOMSpreadsheet />
          </div>
        );
      case 'payment-methods':
        return (
          <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden p-6">
            <PaymentMethodSettings />
          </div>
        );
      case 'location-types':
        return (
          <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
            <SimpleLookupTab table="location_types" columns={LOCATION_TYPES_COLS} title="Location Types" />
          </div>
        );
      case 'customer-groups':
        return (
          <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
            <SimpleLookupTab table="customer_groups" columns={CUSTOMER_GROUPS_COLS} title="Customer Groups" />
          </div>
        );
      case 'customer-types':
        return (
          <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
            <SimpleLookupTab table="customer_types" columns={CUSTOMER_TYPES_COLS} title="Customer Types" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">Master Data Settings</h1>
            <p className="text-sm text-muted-foreground">Manage brand categories, empties types, price types, units of measure, payment methods, location types, customer groups, and customer types</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-6 pb-4 pt-2">
          {renderTabContent()}
        </div>
      </div>
    </AppLayout>
  );
};

export default MasterDataSettings;
