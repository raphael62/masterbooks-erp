import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import PurchaseInvoiceSpreadsheet from './components/PurchaseInvoiceSpreadsheet';
import PurchaseInvoiceForm from './components/PurchaseInvoiceForm';
import { supabase } from '../../lib/supabase';

const PurchaseInvoiceManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [refreshKey, setRefreshKey] = useState(0);

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

  useEffect(() => {
    const openId = location?.state?.openInvoiceId;
    const returnTo = location?.state?.returnTo;
    if (openId) {
      navigate(location.pathname, { replace: true, state: returnTo ? { returnTo } : {} });
      handleEdit({ id: openId });
    }
  }, [location?.state?.openInvoiceId]);

  const handleNew = () => {
    setSelectedInvoice(null);
    setShowForm(true);
  };

  const handleEdit = async (invoice) => {
    try {
      const [invRes, itemsRes, emptiesRes] = await Promise.all([
        supabase?.from('purchase_invoices')?.select('*')?.eq('id', invoice?.id)?.single(),
        supabase?.from('purchase_invoice_items')?.select('*')?.eq('purchase_invoice_id', invoice?.id)?.order('sort_order'),
        supabase?.from('purchase_invoice_empties')?.select('empties_type, returned_qty')?.eq('invoice_id', invoice?.id),
      ]);
      const fullInvoice = invRes?.data || invoice;
      const items = itemsRes?.data || [];
      const empties = emptiesRes?.data || [];
      setSelectedInvoice({ ...fullInvoice, items, empties });
    } catch {
      setSelectedInvoice({ ...invoice, items: [], empties: [] });
    }
    setShowForm(true);
  };

  const handleView = (invoice) => {
    handleEdit(invoice);
  };

  const handleSaved = () => {
    setShowForm(false);
    setSelectedInvoice(null);
    setRefreshKey(k => k + 1);
    if (location?.state?.returnTo) {
      navigate(location.state.returnTo);
    }
  };

  const handleSaveNew = () => {
    setSelectedInvoice(null);
    setRefreshKey(k => k + 1);
    // Keep form open but reset it
    setShowForm(false);
    setTimeout(() => setShowForm(true), 50);
  };

  const handleClose = () => {
    setShowForm(false);
    setSelectedInvoice(null);
    if (location?.state?.returnTo) {
      navigate(location.state.returnTo);
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-2">Purchase Invoice Management</h1>
          </div>
          {isOffline && (
            <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 flex items-center gap-2">
              <span>⚠</span> You are offline. Changes will sync when connection is restored.
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden px-6 pb-4">
          <PurchaseInvoiceSpreadsheet
            key={refreshKey}
            onNew={handleNew}
            onView={handleView}
            onEdit={handleEdit}
          />
        </div>
      </div>

      {showForm && (
        <PurchaseInvoiceForm
          invoice={selectedInvoice}
          onClose={handleClose}
          onSaved={handleSaved}
          onSaveNew={handleSaveNew}
        />
      )}
    </AppLayout>
  );
};

export default PurchaseInvoiceManagement;
