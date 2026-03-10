import React, { useState } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

// Import all components
import StockLevelsTab from './components/StockLevelsTab';
import StockMovementsTab from './components/StockMovementsTab';
import AdjustmentsTab from './components/AdjustmentsTab';
import QuickActionPanel from './components/QuickActionPanel';
import InventorySummaryWidget from './components/InventorySummaryWidget';
import EmptiesTrackingWidget from './components/EmptiesTrackingWidget';
import StockAdjustmentModal from './components/StockAdjustmentModal';
import LocationSelector from './components/LocationSelector';
import NewProductModal from './components/NewProductModal';

const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState('stock-levels');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedItemForAdjustment, setSelectedItemForAdjustment] = useState(null);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  const tabs = [
    {
      id: 'stock-levels',
      label: 'Stock Levels',
      icon: 'Package',
      count: 1247
    },
    {
      id: 'movements',
      label: 'Stock Movements',
      icon: 'Activity',
      count: null
    },
    {
      id: 'adjustments',
      label: 'Adjustments',
      icon: 'Edit',
      count: 23
    }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleStockAdjustment = (item = null) => {
    setSelectedItemForAdjustment(item);
    setIsAdjustmentModalOpen(true);
  };

  const handleStockTransfer = (item) => {
    console.log('Opening stock transfer modal for:', item);
  };

  const handlePhysicalCount = () => {
    console.log('Starting physical count process');
  };

  const handleNewProduct = () => {
    setIsNewProductModalOpen(true);
  };

  const handleBarcodeScanner = () => {
    console.log('Opening barcode scanner');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stock-levels':
        return (
          <StockLevelsTab
            onStockAdjustment={handleStockAdjustment}
            onStockTransfer={handleStockTransfer}
            selectedLocation={selectedLocation}
          />
        );
      case 'movements':
        return (
          <StockMovementsTab
            selectedLocation={selectedLocation}
          />
        );
      case 'adjustments':
        return (
          <AdjustmentsTab
            onNewAdjustment={() => handleStockAdjustment()}
            selectedLocation={selectedLocation}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <BreadcrumbNavigation />
        
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Inventory Management</h1>
            <p className="text-muted-foreground">
              Track stock levels, manage movements, and handle adjustments across all locations
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            {/* Sync Status */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span>Last sync: 2 min ago</span>
            </div>
            
            {/* Quick Actions */}
            <div className="hidden sm:flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('Export inventory')}
              >
                <Icon name="Download" size={16} />
                Export
              </Button>
              <Button
                size="sm"
                onClick={() => handleStockAdjustment()}
              >
                <Icon name="Plus" size={16} />
                New Adjustment
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-card border border-border rounded-lg">
              <div className="border-b border-border">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {tabs?.map((tab) => (
                    <button
                      key={tab?.id}
                      onClick={() => handleTabChange(tab?.id)}
                      className={`
                        flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ease-out
                        ${activeTab === tab?.id
                          ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }
                      `}
                    >
                      <Icon name={tab?.icon} size={16} />
                      <span>{tab?.label}</span>
                      {tab?.count !== null && (
                        <span className={`
                          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                          ${activeTab === tab?.id
                            ? 'bg-primary/10 text-primary' :'bg-muted text-muted-foreground'
                          }
                        `}>
                          {tab?.count?.toLocaleString()}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Tab Content */}
              <div className="p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-6">
            {/* Location Selector */}
            <LocationSelector
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
            />
            
            {/* Quick Actions Panel */}
            <QuickActionPanel
              onStockAdjustment={handleStockAdjustment}
              onStockTransfer={handleStockTransfer}
              onPhysicalCount={handlePhysicalCount}
              onNewProduct={handleNewProduct}
              onBarcodeScanner={handleBarcodeScanner}
            />
            
            {/* Inventory Summary */}
            <InventorySummaryWidget
              selectedLocation={selectedLocation}
            />
            
            {/* Empties Tracking */}
            <EmptiesTrackingWidget
              selectedLocation={selectedLocation}
            />
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setSelectedItemForAdjustment(null);
        }}
        selectedItem={selectedItemForAdjustment}
        selectedLocation={selectedLocation}
      />

      {/* New Product Modal */}
      <NewProductModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onSuccess={() => {
          setIsNewProductModalOpen(false);
        }}
      />

      {/* Mobile Floating Action Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-200">
        <Button
          size="lg"
          onClick={() => handleStockAdjustment()}
          className="rounded-full shadow-lg"
        >
          <Icon name="Plus" size={24} />
        </Button>
      </div>
    </AppLayout>
  );
};

export default InventoryManagement;