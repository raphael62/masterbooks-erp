import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import SupplierPaymentsSpreadsheet from './components/SupplierPaymentsSpreadsheet';
import SupplierPaymentModal from './components/SupplierPaymentModal';


const SupplierPayments = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNew = () => {
    setSelectedPayment(null);
    setShowModal(true);
  };

  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const handleSaved = () => {
    setShowModal(false);
    setSelectedPayment(null);
    setRefreshKey(k => k + 1);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedPayment(null);
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">Supplier Payments</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Record and manage payments to suppliers</p>
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-6 pb-4">
          <SupplierPaymentsSpreadsheet
            key={refreshKey}
            onNew={handleNew}
            onEdit={handleEdit}
          />
        </div>
      </div>
      {showModal && (
        <SupplierPaymentModal
          payment={selectedPayment}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </AppLayout>
  );
};

export default SupplierPayments;
