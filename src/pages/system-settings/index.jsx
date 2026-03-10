import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';


// Import all setting components
import TaxConfigurationSettings from './components/TaxConfigurationSettings';
import SystemPreferencesSettings from './components/SystemPreferencesSettings';
import NotificationSettings from './components/NotificationSettings';

const SystemSettings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('tax-configuration');

  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'roles-permissions') {
      navigate('/roles-permissions-management');
      return;
    }
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams, navigate]);

  const tabs = [
    { id: 'roles-permissions', label: 'Roles & Permissions', route: '/roles-permissions-management' },
    { id: 'tax-configuration', label: 'Tax Configuration', component: TaxConfigurationSettings },
    { id: 'system-preferences', label: 'System Preferences', component: SystemPreferencesSettings },
    { id: 'notifications', label: 'Notifications', component: NotificationSettings },
  ];

  const activeTabComponent = tabs?.find(tab => tab?.id === activeTab)?.component;

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">System Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure system preferences, manage user roles, and customize business settings
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-0">
            {tabs?.map((tab) => (
              <button
                key={tab?.id}
                onClick={() => tab?.route ? navigate(tab?.route) : setActiveTab(tab?.id)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab?.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                {tab?.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-4 pt-2">
          <div className="bg-card rounded-lg border border-border p-6">
            {activeTabComponent && React.createElement(activeTabComponent)}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SystemSettings;