import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import SalesOrderSpreadsheet from './components/SalesOrderSpreadsheet';
import SalesOrderForm from './components/SalesOrderForm';
import { supabase } from '../../lib/supabase';

const SalesOrderManagement = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNew = () => {
    setSelectedOrder(null);
    setShowForm(true);
  };

  const handleView = async (order) => {
    try {
      const { data: fullOrder, error: orderErr } = await supabase.from('sales_orders').select('*').eq('id', order?.id).single();
      if (orderErr) throw orderErr;
      const { data: items } = await supabase.from('sales_order_items').select('*').eq('order_id', order?.id).order('sort_order');
      setSelectedOrder({ ...(fullOrder || order), items: items || [] });
    } catch {
      setSelectedOrder({ ...order, items: [] });
    }
    setShowForm(true);
  };

  const handleEdit = handleView;

  const handleSaved = () => {
    setShowForm(false);
    setSelectedOrder(null);
    setRefreshKey(k => k + 1);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedOrder(null);
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-2">Sales Order Management</h1>
          </div>
          {isOffline && (
            <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 flex items-center gap-2">
              <span>⚠</span> You are offline. Changes will sync when connection is restored.
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden px-6 pb-4">
          <SalesOrderSpreadsheet
            key={refreshKey}
            onNew={handleNew}
            onView={handleView}
            onEdit={handleEdit}
          />
        </div>
      </div>

      {showForm && (
        <SalesOrderForm
          order={selectedOrder}
          onClose={handleCloseForm}
          onSaved={handleSaved}
        />
      )}
    </AppLayout>
  );
};

export default SalesOrderManagement;