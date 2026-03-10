import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import POSearchSidebar from './components/POSearchSidebar';
import POFormPanel from './components/POFormPanel';
import POPreviewPanel from './components/POPreviewPanel';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';

const PurchaseOrderManagement = () => {
  const [selectedPO, setSelectedPO] = useState(null);
  const [poData, setPOData] = useState({
    supplier_id: '',
    supplier_name: '',
    status: 'draft',
    order_date: new Date()?.toISOString()?.split('T')?.[0],
    expected_delivery_date: '',
    delivery_address: '',
    lineItems: [],
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    notes: ''
  });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activePanel, setActivePanel] = useState('form');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleResize = () => setIsMobile(window.innerWidth < 768);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handlePOSelect = async (po) => {
    setSelectedPO(po);
    // Load line items for selected PO
    try {
      const { data: items } = await supabase?.from('purchase_order_items')?.select('*')?.eq('purchase_order_id', po?.id);
      setPOData({ ...po, lineItems: items || [] });
    } catch {
      setPOData({ ...po, lineItems: [] });
    }
    if (isMobile) setActivePanel('form');
  };

  const handleCreateNew = () => {
    setSelectedPO(null);
    setPOData({
      supplier_id: '',
      supplier_name: '',
      status: 'draft',
      order_date: new Date()?.toISOString()?.split('T')?.[0],
      expected_delivery_date: '',
      delivery_address: '',
      lineItems: [],
      subtotal: 0,
      tax_amount: 0,
      total_amount: 0,
      notes: ''
    });
    if (isMobile) setActivePanel('form');
  };

  const handlePOUpdate = (updatedData) => {
    setPOData(prev => ({ ...prev, ...updatedData }));
  };

  const handleSaved = () => {
    setRefreshKey(k => k + 1);
  };

  const renderMobileNav = () => (
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex space-x-2">
        {['search', 'form', 'preview']?.map(panel => (
          <button
            key={panel}
            onClick={() => setActivePanel(panel)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              activePanel === panel
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {panel === 'search' ? 'PO List' : panel === 'form' ? 'Create/Edit' : 'Preview'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="h-screen flex flex-col" style={{ height: 'calc(100vh - 7rem)' }}>
        {/* Page Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border bg-background">
          <BreadcrumbNavigation />
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Create and manage procurement orders</p>
            </div>
            {isOffline && (
              <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-lg text-sm">
                <Icon name="WifiOff" size={16} />
                <span>Offline Mode</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobile && renderMobileNav()}

        {/* Three-Panel Layout */}
        <div className="flex-1 flex overflow-hidden">
          {!isMobile ? (
            <>
              {/* Left: PO List */}
              <div className="w-72 border-r border-border bg-card flex-shrink-0">
                <POSearchSidebar
                  key={refreshKey}
                  onPOSelect={handlePOSelect}
                  onCreateNew={handleCreateNew}
                  selectedPO={selectedPO}
                />
              </div>

              {/* Middle: Form */}
              <div className="flex-1 bg-background overflow-hidden">
                <POFormPanel
                  poData={poData}
                  onPOUpdate={handlePOUpdate}
                  onPreview={() => {}}
                  isOffline={isOffline}
                  onSaved={handleSaved}
                />
              </div>

              {/* Right: Preview */}
              <div className="w-80 border-l border-border bg-card flex-shrink-0">
                <POPreviewPanel poData={poData} isOffline={isOffline} />
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-hidden">
              {activePanel === 'search' && (
                <POSearchSidebar
                  key={refreshKey}
                  onPOSelect={handlePOSelect}
                  onCreateNew={handleCreateNew}
                  selectedPO={selectedPO}
                />
              )}
              {activePanel === 'form' && (
                <POFormPanel
                  poData={poData}
                  onPOUpdate={handlePOUpdate}
                  onPreview={() => setActivePanel('preview')}
                  isOffline={isOffline}
                  onSaved={handleSaved}
                />
              )}
              {activePanel === 'preview' && (
                <POPreviewPanel poData={poData} isOffline={isOffline} />
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default PurchaseOrderManagement;
