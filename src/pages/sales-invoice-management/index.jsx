import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import SalesInvoiceSpreadsheet from './components/SalesInvoiceSpreadsheet';
import SalesInvoiceForm from './components/SalesInvoiceForm';
import { supabase } from '../../lib/supabase';

const SalesInvoiceManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const returnToRef = useRef(null);
  const returnStateRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const openId = location?.state?.openInvoiceId;
    const returnTo = location?.state?.returnTo;
    const returnState = location?.state?.returnState;
    if (openId) {
      if (returnTo) returnToRef.current = returnTo;
      if (returnState != null) returnStateRef.current = returnState;
      navigate(location.pathname, { replace: true, state: returnTo ? { returnTo, returnState } : {} });
      handleEdit({ id: openId });
    }
  }, [location?.state?.openInvoiceId]);

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
    setSelectedInvoice(null);
    setShowForm(true);
  };

  const handleEdit = async (invoice) => {
    try {
      const [invRes, itemsRes, emptiesRes] = await Promise.all([
        supabase?.from('sales_invoices')?.select('*')?.eq('id', invoice?.id)?.single(),
        supabase?.from('sales_invoice_items')?.select('*')?.eq('invoice_id', invoice?.id)?.order('sort_order'),
        supabase?.from('sales_invoice_empties')?.select('empties_type, received_qty, sold_qty')?.eq('invoice_id', invoice?.id),
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

  const handleView = (invoice) => handleEdit(invoice);

  const handleSaved = () => {
    setShowForm(false);
    setSelectedInvoice(null);
    setRefreshKey(k => k + 1);
    const returnTo = returnToRef.current || location?.state?.returnTo;
    const returnState = returnStateRef.current ?? location?.state?.returnState;
    if (returnTo) {
      returnToRef.current = null;
      returnStateRef.current = null;
      navigate(returnTo, { state: returnState != null ? returnState : undefined });
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setSelectedInvoice(null);
    const returnTo = returnToRef.current || location?.state?.returnTo;
    const returnState = returnStateRef.current ?? location?.state?.returnState;
    if (returnTo) {
      returnToRef.current = null;
      returnStateRef.current = null;
      navigate(returnTo, { state: returnState != null ? returnState : undefined });
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-2">Sales Invoice Management</h1>
          </div>
          {isOffline && (
            <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 flex items-center gap-2">
              <span>⚠</span> You are offline. Changes will sync when connection is restored.
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden px-6 pb-4">
          <SalesInvoiceSpreadsheet
            key={refreshKey}
            onNew={handleNew}
            onView={handleView}
            onEdit={handleEdit}
          />
        </div>
      </div>

      {showForm && (
        <SalesInvoiceForm
          invoice={selectedInvoice}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </AppLayout>
  );
};

export default SalesInvoiceManagement;