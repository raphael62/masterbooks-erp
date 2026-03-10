import React, { useState } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import CoASpreadsheet from './components/CoASpreadsheet';
import CoAModal from './components/CoAModal';

const ChartOfAccountsManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNew = () => {
    setSelectedAccount(null);
    setShowModal(true);
  };

  const handleEdit = (account) => {
    setSelectedAccount(account);
    setShowModal(true);
  };

  const handleSaved = () => {
    setShowModal(false);
    setSelectedAccount(null);
    setRefreshKey(k => k + 1);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedAccount(null);
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">Chart of Accounts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Ghana GRA-compliant account structure — Assets (1xxx), Liabilities (2xxx), Equity (3xxx), Revenue (4xxx), COGS (5xxx), Expenses (6xxx)</p>
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-6 pb-4">
          <CoASpreadsheet
            key={refreshKey}
            onNew={handleNew}
            onEdit={handleEdit}
            refreshKey={refreshKey}
          />
        </div>
      </div>
      {showModal && (
        <CoAModal
          account={selectedAccount}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </AppLayout>
  );
};

export default ChartOfAccountsManagement;
