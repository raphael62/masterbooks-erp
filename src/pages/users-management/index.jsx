import React from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import UsersSpreadsheet from './components/UsersSpreadsheet';

const UsersManagement = () => {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">Users</h1>
            <p className="text-sm text-muted-foreground">Manage system users, roles, and access</p>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden px-6 pb-4">
          <UsersSpreadsheet />
        </div>
      </div>
    </AppLayout>
  );
};

export default UsersManagement;
