/**
 * Granular permission modules: each route maps to a specific module.
 * Permission check: use granular module first, then fall back to parent (e.g. Sales).
 */
export const ROUTE_TO_MODULE = {
  '/dashboard': 'Dashboard',
  '/dashboard/kpis': 'Dashboard',
  '/dashboard/sync-log': 'Dashboard',
  '/dashboard/notifications': 'Dashboard',

  '/purchase-overview-dashboard': 'Purchase Overview',
  '/vendor-management': 'Vendors',
  '/purchase-invoice-management': 'Purchase Invoices',
  '/purchase-order-management': 'Purchase Orders',
  '/supplier-statement': 'Supplier Statement',
  '/supplier-empties-statement': 'Supplier Empties Statement',
  '/empties-dispatch-form': 'Empties Dispatch',
  '/open-market-empties-purchase': 'Open Market Purchase',
  '/supplier-payments': 'Supplier Payments',
  '/purchases/landed-cost': 'Landed Cost',
  '/purchases/reports': 'Purchase Reports',

  '/sales-overview-dashboard': 'Sales Overview',
  '/customer-management': 'Customers',
  '/sales/customer-value-stmt': 'Customer Value Stmt',
  '/sales/customer-empties-stmt': 'Customer Empties Stmt',
  '/sales-order-management': 'Sales Orders',
  '/sales-invoice-management': 'Sales Invoices',
  '/sales/deliveries': 'Deliveries',
  '/sales/returns': 'Returns',
  '/empties-receive-form': 'Empties Receive',
  '/price-list-management': 'Price List',
  '/sales-promotions-management': 'Sales Promotions',
  '/sales/reports': 'Sales Reports',

  '/point-of-sale': 'Point of Sale',
  '/point-of-sale/register': 'Point of Sale',
  '/point-of-sale/shift': 'Point of Sale',
  '/point-of-sale/orders': 'Point of Sale',
  '/point-of-sale/cashup': 'Point of Sale',

  '/inventory-management': 'Inventory Overview',
  '/product-management': 'Products',
  '/stock-levels-by-location': 'Stock by Location',
  '/stock-movements': 'Stock Movements',
  '/returnable-glass-management': 'Returnable Glass',
  '/inventory/stock-on-hand': 'Inventory Overview',
  '/inventory/adjustments': 'Inventory Overview',
  '/inventory/transfers': 'Inventory Overview',
  '/inventory/empties-ledger': 'Inventory Overview',

  '/production-overview-dashboard': 'Production Overview',
  '/bill-of-materials-bom-management': 'Bill of Materials',
  '/production-orders': 'Production Orders',
  '/production-issue-materials': 'Issue Materials',
  '/production-receive-finished-goods': 'Receive Finished Goods',

  '/accounting': 'Accounting Overview',
  '/chart-of-accounts-management': 'Chart of Accounts',
  '/accounting/customer-payments': 'Accounting Overview',
  '/accounting/supplier-payments': 'Accounting Overview',
  '/accounting/bank-reconciliation': 'Accounting Overview',
  '/financial-reports': 'Financial Reports',
  '/accounting/ap-aging': 'Accounting Overview',
  '/accounting/gl-reports': 'Accounting Overview',

  '/hr': 'HR Overview',
  '/employee-management': 'Employees',
  '/hr/attendance': 'HR Overview',
  '/hr/payroll-runs': 'HR Overview',
  '/hr/payslips': 'HR Overview',
  '/hr/deductions': 'HR Overview',

  '/reports': 'Reports',
  '/reports/inventory': 'Reports',
  '/reports/receivables': 'Reports',
  '/reports/empties': 'Reports',
  '/reports/executives': 'Reports',

  '/preferences': 'Preferences',
  '/preferences/api-integrations': 'Preferences',
  '/system-settings': 'System Settings',
  '/company-management': 'Company Profile',
  '/location-management': 'Locations',
  '/business-executives-management': 'Business Execs',
  '/vsr-monthly-targets-management': 'VSR Monthly Targets',
  '/ssr-monthly-targets-management': 'SSR Monthly Targets',
  '/business-executives-management': 'Business Execs',
  '/payment-accounts-management': 'Payment Accounts',
  '/tax-vat-management': 'Tax & VAT',
  '/users-management': 'Users',
  '/roles-permissions-management': 'Roles & Permissions',
  '/master-data-settings': 'Master Data Settings',
  '/product-categories-management': 'Master Data Settings',
  '/units-of-measure-management': 'Master Data Settings',
  '/empties-types-management': 'Master Data Settings',
  '/price-type-management': 'Master Data Settings',
  '/import-data': 'Import Data',
  '/audit-log': 'Audit Log',
  '/theme-settings': 'Theme Settings',
};

/** Parent module for fallback: if no granular permission, check parent (e.g. Sales) */
export const MODULE_PARENT = {
  'Purchase Overview': 'Purchases', 'Vendors': 'Purchases', 'Purchase Invoices': 'Purchases',
  'Purchase Orders': 'Purchases', 'Supplier Statement': 'Purchases', 'Supplier Empties Statement': 'Purchases',
  'Empties Dispatch': 'Purchases', 'Open Market Purchase': 'Purchases', 'Supplier Payments': 'Purchases',
  'Landed Cost': 'Purchases', 'Purchase Reports': 'Purchases',

  'Sales Overview': 'Sales', 'Customers': 'Sales', 'Customer Value Stmt': 'Sales',
  'Customer Empties Stmt': 'Sales', 'Sales Orders': 'Sales', 'Sales Invoices': 'Sales',
  'Deliveries': 'Sales', 'Returns': 'Sales', 'Empties Receive': 'Sales', 'Price List': 'Sales',
  'Sales Promotions': 'Sales', 'Sales Reports': 'Sales',

  'Inventory Overview': 'Inventory', 'Products': 'Inventory', 'Stock by Location': 'Inventory',
  'Stock Movements': 'Inventory', 'Returnable Glass': 'Inventory',

  'Production Overview': 'Production', 'Bill of Materials': 'Production', 'Production Orders': 'Production',
  'Issue Materials': 'Production', 'Receive Finished Goods': 'Production',

  'Accounting Overview': 'Accounting', 'Chart of Accounts': 'Accounting', 'Financial Reports': 'Accounting',

  'HR Overview': 'HR', 'Employees': 'HR',

  'System Settings': 'Preferences', 'Company Profile': 'Preferences', 'Locations': 'Preferences',
  'Business Execs': 'Preferences', 'VSR Monthly Targets': 'Preferences', 'SSR Monthly Targets': 'Preferences',
  'Payment Accounts': 'Preferences', 'Tax & VAT': 'Preferences', 'Users': 'Preferences',
  'Roles & Permissions': 'Preferences', 'Master Data Settings': 'Preferences', 'Import Data': 'Preferences',
  'Audit Log': 'Preferences', 'Theme Settings': 'Preferences',
};

/** Sections with parent (full-access) and child modules. Parent selection grants full access to all children. */
export const MODULES_BY_SECTION = [
  { section: 'Dashboard', parent: 'Dashboard', modules: [] },
  {
    section: 'Sales',
    parent: 'Sales',
    modules: ['Sales Orders', 'Sales Invoices', 'Sales Promotions', 'Customers', 'Price List', 'Sales Overview', 'Empties Receive'],
  },
  {
    section: 'Purchases',
    parent: 'Purchases',
    modules: ['Vendors', 'Purchase Invoices', 'Purchase Orders', 'Supplier Statement', 'Supplier Empties Statement', 'Supplier Payments', 'Empties Dispatch', 'Open Market Purchase'],
  },
  {
    section: 'Inventory',
    parent: 'Inventory',
    modules: ['Products', 'Stock by Location', 'Stock Movements', 'Returnable Glass', 'Inventory Overview'],
  },
  {
    section: 'Point of Sale',
    parent: 'Point of Sale',
    modules: [],
  },
  {
    section: 'Production',
    parent: 'Production',
    modules: ['Production Overview', 'Bill of Materials', 'Production Orders', 'Issue Materials', 'Receive Finished Goods'],
  },
  {
    section: 'Accounting',
    parent: 'Accounting',
    modules: ['Accounting Overview', 'Chart of Accounts', 'Financial Reports'],
  },
  {
    section: 'HR',
    parent: 'HR',
    modules: ['HR Overview', 'Employees'],
  },
  {
    section: 'Reports',
    parent: 'Reports',
    modules: [],
  },
  {
    section: 'Preferences',
    parent: 'Preferences',
    modules: ['System Settings', 'Company Profile', 'Locations', 'Business Execs', 'VSR Monthly Targets', 'SSR Monthly Targets', 'Users', 'Roles & Permissions', 'Payment Accounts', 'Tax & VAT', 'Import Data', 'Audit Log', 'Theme Settings', 'Master Data Settings'],
  },
];

/** All modules (parents + children) for persistence */
export const FLAT_MODULES = MODULES_BY_SECTION.flatMap((s) =>
  s.modules?.length ? [s.parent, ...s.modules] : [s.parent]
);

export const PERMISSIONS = [
  { key: 'can_view', label: 'View' },
  { key: 'can_create', label: 'Create' },
  { key: 'can_edit', label: 'Edit' },
  { key: 'can_delete', label: 'Delete' },
  { key: 'can_export', label: 'Export' },
];

/**
 * Resolve module for a path (handles pathname prefix match)
 */
export function getModuleForPath(pathname) {
  if (!pathname) return null;
  // Exact match first
  if (ROUTE_TO_MODULE[pathname]) return ROUTE_TO_MODULE[pathname];
  // Prefix match (e.g. /sales-order-management/123)
  const sorted = Object.entries(ROUTE_TO_MODULE).sort((a, b) => b[0].length - a[0].length);
  for (const [route, mod] of sorted) {
    if (pathname === route || pathname.startsWith(route + '/')) return mod;
  }
  return null;
}

/**
 * Check if permissions object grants can_view for the given module (or its parent)
 */
export function canViewModule(permissionsMap, moduleName) {
  if (!permissionsMap || !moduleName) return false;
  const p = permissionsMap[moduleName];
  if (p?.can_view) return true;
  const parent = MODULE_PARENT[moduleName];
  if (parent && permissionsMap[parent]?.can_view) return true;
  return false;
}
