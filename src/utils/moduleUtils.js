import { useLocation } from 'react-router-dom';

// Module mapping based on routes (order checked: first match wins)
export const MODULE_ROUTES = {
  dashboard: ['/dashboard'],
  purchases: [
    '/purchases', '/purchase-overview-dashboard', '/vendor-management', '/purchase-order-management',
    '/purchase-invoice-management', '/supplier-statement', '/supplier-empties-statement', '/supplier-payments',
    '/empties-dispatch-form', '/open-market-empties-purchase'
  ],
  sales: [
    '/sales', '/sales-order-management', '/customer-management', '/sales-invoice-management',
    '/sales-overview-dashboard', '/sales-promotions-management', '/empties-receive-form',
    '/price-list-management'
  ],
  pos: ['/point-of-sale'],
  inventory: ['/inventory-management', '/product-management', '/returnable-glass-management', '/stock-movements', '/stock-levels-by-location'],
  production: ['/production-overview-dashboard', '/production', '/bill-of-materials-bom-management', '/production-issue-materials'],
  accounting: ['/financial-reports', '/chart-of-accounts-management'],
  hr: ['/employee-management'],
  reports: ['/reports'],
  preferences: [
    '/system-settings', '/company-management', '/location-management', '/price-type-management',
    '/business-executives-management', '/vsr-monthly-targets-management', '/ssr-monthly-targets-management',
    '/price-list-management', '/import-data', '/audit-log', '/payment-accounts-management', '/tax-vat-management',
    '/roles-permissions-management', '/users-management', '/product-categories-management', '/units-of-measure-management',
    '/empties-types-management', '/theme-settings', '/master-data-settings'
  ]
};

// Get current active module based on route
export const useActiveModule = () => {
  const location = useLocation();
  
  for (const [moduleId, routes] of Object.entries(MODULE_ROUTES)) {
    if (routes?.some(route => location?.pathname?.startsWith(route))) {
      return moduleId;
    }
  }
  
  return 'dashboard'; // Default fallback
};

// Get module display name
export const getModuleDisplayName = (moduleId) => {
  const moduleNames = {
    dashboard: 'Dashboard',
    purchases: 'Purchases',
    sales: 'Sales',
    pos: 'Point of Sale',
    inventory: 'Inventory',
    production: 'Production',
    accounting: 'Accounting & Finance',
    hr: 'HR & Payroll',
    reports: 'Reports',
    preferences: 'Preferences'
  };
  
  return moduleNames?.[moduleId] || 'Dashboard';
};