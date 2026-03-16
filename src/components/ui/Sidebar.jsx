import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import { usePermissions } from '../../contexts/PermissionsContext';

const Sidebar = ({ isCollapsed = false, onToggleCollapse, activeModule = 'dashboard' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccess } = usePermissions();

  // Module-specific menu configurations
  const moduleMenus = {
    dashboard: [
      { id: 'overview', label: 'Overview', path: '/dashboard', icon: 'LayoutDashboard' },
      { id: 'kpis', label: 'KPIs', path: '/dashboard/kpis', icon: 'TrendingUp' },
      { id: 'sync-log', label: 'Sync Log', path: '/dashboard/sync-log', icon: 'RefreshCw' },
      { id: 'notifications', label: 'Notifications', path: '/dashboard/notifications', icon: 'Bell' }
    ],
    purchases: [
      { id: 'overview', label: 'Overview', path: '/purchase-overview-dashboard', icon: 'LayoutDashboard' },
      { id: 'vendors', label: 'Vendors', path: '/vendor-management', icon: 'Building2' },
      { id: 'supplier-invoices', label: 'Purchase Invoices', path: '/purchase-invoice-management', icon: 'Receipt' },
      { id: 'supplier-statement', label: 'Supplier Statement', path: '/supplier-statement', icon: 'BookOpen' },
      { id: 'supplier-empties-stmt', label: 'Supplier Empties Stmt', path: '/supplier-empties-statement', icon: 'PackageOpen' },
      { id: 'empties-dispatch', label: 'Empties Dispatch', path: '/empties-dispatch-form', icon: 'PackageMinus' },
      { id: 'open-market-purchase', label: 'Open Market Purchase', path: '/open-market-empties-purchase', icon: 'ShoppingBag' },
      { id: 'supplier-payments', label: 'Supplier Payments', path: '/supplier-payments', icon: 'Banknote' },
      { id: 'landed-cost', label: 'Landed Cost', path: '/purchases/landed-cost', icon: 'DollarSign', badge: 'Future' },
      { id: 'reports', label: 'Reports', path: '/purchases/reports', icon: 'BarChart3' }
    ],
    sales: [
      { id: 'overview', label: 'Overview', path: '/sales-overview-dashboard', icon: 'LayoutDashboard' },
      { id: 'customers', label: 'Customers', path: '/customer-management', icon: 'Users' },
      { id: 'customer-statement', label: 'Customer Statement', path: '/customer-statement', icon: 'FileBarChart' },
      { id: 'customer-value-stmt', label: 'Customer Value Stmt', path: '/sales/customer-value-stmt', icon: 'FileBarChart' },
      { id: 'customer-empties-stmt', label: 'Customer Empties Stmt', path: '/sales/customer-empties-stmt', icon: 'PackageOpen' },
      { id: 'sales-orders', label: 'Sales Orders', path: '/sales-order-management', icon: 'ShoppingCart' },
      { id: 'sales-invoices', label: 'Sales Invoices', path: '/sales-invoice-management', icon: 'FileText' },
      { id: 'deliveries', label: 'Deliveries', path: '/sales/deliveries', icon: 'Truck' },
      { id: 'returns', label: 'Returns', path: '/sales/returns', icon: 'Undo2' },
      { id: 'empties-receive', label: 'Empties Receive', path: '/empties-receive-form', icon: 'PackagePlus' },
      { id: 'price-list', label: 'Price List', path: '/price-list-management', icon: 'Tag' },
      { id: 'promotions', label: 'Promotions', path: '/sales-promotions-management', icon: 'Gift' },
      { id: 'reports', label: 'Reports', path: '/sales/reports', icon: 'BarChart3' }
    ],
    pos: [
      { id: 'overview', label: 'Overview', path: '/point-of-sale', icon: 'LayoutDashboard' },
      { id: 'register', label: 'Register (Sell)', path: '/point-of-sale/register', icon: 'CreditCard' },
      { id: 'shift', label: 'Open/Close Shift', path: '/point-of-sale/shift', icon: 'Clock' },
      { id: 'pos-orders', label: 'POS Orders', path: '/point-of-sale/orders', icon: 'ShoppingBag' },
      { id: 'cashup-reports', label: 'Cashup Reports', path: '/point-of-sale/cashup', icon: 'FileText' }
    ],
    inventory: [
      { id: 'overview', label: 'Overview', path: '/inventory-management', icon: 'LayoutDashboard' },
      { id: 'products', label: 'Products', path: '/product-management', icon: 'Package' },
      { id: 'stock-by-location', label: 'Stock by Location', path: '/stock-levels-by-location', icon: 'MapPin' },
      { id: 'stock-movements', label: 'Stock Movements', path: '/stock-movements', icon: 'ArrowRightLeft' },
      { id: 'change-history', label: 'Change History', path: '/inventory-change-history', icon: 'History' },
      { id: 'returnable-glass', label: 'Returnable Glass', path: '/returnable-glass-management', icon: 'GlassWater' },
      { id: 'stock-on-hand', label: 'Stock on Hand', path: '/inventory/stock-on-hand', icon: 'Boxes' },
      { id: 'adjustments', label: 'Adjustments', path: '/inventory/adjustments', icon: 'Edit3' },
      { id: 'transfers', label: 'Transfers', path: '/stock-transfer', icon: 'ArrowRight' },
      { id: 'empties-ledger', label: 'Empties Ledger', path: '/inventory/empties-ledger', icon: 'BookOpen' }
    ],
    production: [
      { id: 'overview', label: 'Overview', path: '/production-overview-dashboard', icon: 'LayoutDashboard' },
      { id: 'bill-of-materials', label: 'Bill of Materials', path: '/bill-of-materials-bom-management', icon: 'List' },
      { id: 'production-orders', label: 'Production Orders', path: '/production-orders', icon: 'Factory' },
      { id: 'issue-materials', label: 'Issue Materials', path: '/production-issue-materials', icon: 'ArrowDown' },
      { id: 'receive-finished-goods', label: 'Receive Finished Goods', path: '/production-receive-finished-goods', icon: 'ArrowUp' }
    ],
    accounting: [
      { id: 'overview', label: 'Overview', path: '/accounting', icon: 'LayoutDashboard' },
      { id: 'chart-of-accounts', label: 'Chart of Accounts', path: '/chart-of-accounts-management', icon: 'BookOpen' },
      { id: 'customer-payments', label: 'Customer Payments (AR)', path: '/accounting/customer-payments', icon: 'CreditCard' },
      { id: 'supplier-payments', label: 'Supplier Payments (AP)', path: '/accounting/supplier-payments', icon: 'Banknote', badge: 'Future' },
      { id: 'bank-reconciliation', label: 'Bank Reconciliation', path: '/accounting/bank-reconciliation', icon: 'Building', badge: 'Future' },
      { id: 'ar-aging', label: 'AR Aging', path: '/financial-reports', icon: 'Clock' },
      { id: 'ap-aging', label: 'AP Aging', path: '/accounting/ap-aging', icon: 'Clock', badge: 'Future' },
      { id: 'gl-reports', label: 'GL Reports', path: '/accounting/gl-reports', icon: 'BarChart3', badge: 'Future' }
    ],
    hr: [
      { id: 'overview', label: 'Overview', path: '/hr', icon: 'LayoutDashboard' },
      { id: 'employees', label: 'Employees', path: '/employee-management', icon: 'Users' },
      { id: 'attendance', label: 'Attendance', path: '/hr/attendance', icon: 'Clock' },
      { id: 'payroll-runs', label: 'Payroll Runs', path: '/hr/payroll-runs', icon: 'DollarSign' },
      { id: 'payslips', label: 'Payslips', path: '/hr/payslips', icon: 'FileText' },
      { id: 'deductions', label: 'Deductions', path: '/hr/deductions', icon: 'Minus' }
    ],
    reports: [
      { id: 'overview', label: 'Overview', path: '/reports', icon: 'LayoutDashboard' },
      { id: 'sales-reports', label: 'Sales Reports', path: '/financial-reports', icon: 'TrendingUp' },
      { id: 'inventory-reports', label: 'Inventory Reports', path: '/reports/inventory', icon: 'Package' },
      { id: 'receivables', label: 'Receivables', path: '/reports/receivables', icon: 'CreditCard' },
      { id: 'empties', label: 'Empties', path: '/reports/empties', icon: 'Package' },
      { id: 'executives-performance', label: 'Executives Performance', path: '/reports/executives', icon: 'Users' }
    ],
    preferences: [
      { id: 'overview', label: 'Overview', path: '/preferences', icon: 'LayoutDashboard' },
      { id: 'system-settings', label: 'System Settings', path: '/system-settings', icon: 'Settings' },
      { id: 'company-profile', label: 'Company Profile', path: '/company-management', icon: 'Building2' },
      { id: 'locations', label: 'Locations', path: '/location-management', icon: 'MapPin' },
      { id: 'business-execs', label: 'Business Execs', path: '/business-executives-management', icon: 'UserCheck' },
      { id: 'vsr-monthly-targets', label: 'VSR Monthly Targets', path: '/vsr-monthly-targets-management', icon: 'Target' },
      { id: 'ssr-monthly-targets', label: 'SSR Monthly Targets', path: '/ssr-monthly-targets-management', icon: 'Target' },
      { id: 'payment-accounts', label: 'Payment Accounts', path: '/payment-accounts-management', icon: 'CreditCard' },
      { id: 'tax-vat-settings', label: 'Tax & VAT Management', path: '/tax-vat-management', icon: 'Calculator' },
      { id: 'users', label: 'Users', path: '/users-management', icon: 'Users' },
      { id: 'roles-permissions', label: 'Roles & Permissions', path: '/roles-permissions-management', icon: 'Shield' },
      { id: 'master-data-settings', label: 'Master Data Settings', path: '/master-data-settings', icon: 'Database' },
      { id: 'api-integrations', label: 'API & Integrations', path: '/preferences/api-integrations', icon: 'Link' },
      { id: 'import-data', label: 'Import Data', path: '/import-data', icon: 'Upload' },
      { id: 'audit-log', label: 'Audit Log', path: '/audit-log', icon: 'ClipboardList' },
      { id: 'theme-settings', label: 'Theme Settings', path: '/theme-settings', icon: 'Palette' }
    ]
  };

  const rawMenuItems = moduleMenus?.[activeModule] || moduleMenus?.dashboard;
  const currentMenuItems = rawMenuItems?.filter((item) => canAccess(item?.path));

  const handleItemClick = (item) => {
    if (item?.path) {
      navigate(item?.path);
    }
  };

  const isActiveItem = (item) => {
    if (!item?.path) return false;
    const [itemPathname, itemSearch] = item?.path?.split('?');
    if (itemSearch) {
      return location?.pathname === itemPathname && location?.search === `?${itemSearch}`;
    }
    // For paths without query params, match pathname but exclude paths that have query params
    return location?.pathname === item?.path && !location?.search;
  };

  const renderMenuItem = (item) => {
    const isActive = isActiveItem(item);

    return (
      <div key={item?.id}>
        <button
          onClick={() => handleItemClick(item)}
          className={`
            w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg transition-all duration-200 ease-out group relative overflow-hidden
            ${isActive 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'text-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-0.5 active:scale-[0.98]'
            }
          `}
          title={isCollapsed ? item?.label : undefined}
        >
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4/5 bg-primary-foreground/40 rounded-r-full" />
          )}
          {!isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-primary rounded-r-full transition-all duration-200 group-hover:h-4/5" />
          )}
          <div className="flex items-center space-x-3 min-w-0">
            <Icon 
              name={item?.icon} 
              size={20} 
              className={`flex-shrink-0 transition-all duration-200 ${
                isActive 
                  ? 'text-primary-foreground' 
                  : 'text-muted-foreground group-hover:text-accent-foreground group-hover:scale-110'
              }`}
            />
            {!isCollapsed && (
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <span className="font-medium text-sm truncate">{item?.label}</span>
                {item?.badge && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    item?.badge === 'Future' ?'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                  }`}>
                    {item?.badge}
                  </span>
                )}
              </div>
            )}
          </div>
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`
        fixed left-0 top-28 bottom-0 bg-card border-r border-border z-100 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        hidden lg:block
      `}>
        <div className="flex flex-col h-full">
          {/* Module Title & Collapse Toggle */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <h3 className="font-semibold text-foreground text-lg capitalize">
                  {activeModule === 'pos' ? 'Point of Sale' :
                   activeModule === 'hr' ? 'HR & Payroll' :
                   activeModule === 'accounting' ? 'Accounting & Finance' :
                   activeModule}
                </h3>
              )}
              <button
                onClick={onToggleCollapse}
                className={`flex items-center justify-center p-2 rounded-lg hover:bg-accent hover:scale-105 active:scale-95 transition-all duration-150 ease-out group ${isCollapsed ? 'w-full' : ''}`}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Icon
                  name={isCollapsed ? "ChevronRight" : "ChevronLeft"}
                  size={20}
                  className="text-muted-foreground group-hover:text-foreground transition-colors duration-150"
                />
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {currentMenuItems?.map(item => renderMenuItem(item))}
          </nav>

          {/* Footer */}
          {!isCollapsed && (
            <div className="p-4 border-t border-border">
              <div className="text-xs text-muted-foreground text-center">
                MasterBooks ERP v2.1.0
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div className={`
        lg:hidden fixed inset-0 z-300 transition-opacity duration-300 ease-in-out
        ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `}>
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onToggleCollapse} />
        <aside className={`
          absolute left-0 top-0 bottom-0 w-80 bg-card border-r border-border transform transition-transform duration-300 ease-in-out
          ${isCollapsed ? '-translate-x-full' : 'translate-x-0'}
        `}>
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-primary-foreground"
                  >
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">MasterBooks</h1>
                  <p className="text-xs text-muted-foreground capitalize">
                    {activeModule === 'pos' ? 'Point of Sale' : 
                     activeModule === 'hr' ? 'HR & Payroll' :
                     activeModule === 'accounting' ? 'Accounting & Finance' :
                     activeModule}
                  </p>
                </div>
              </div>
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-lg hover:bg-accent hover:scale-105 active:scale-95 transition-all duration-150 ease-out group"
                aria-label="Close navigation menu"
              >
                <Icon name="X" size={20} className="text-muted-foreground group-hover:text-foreground transition-colors duration-150" />
              </button>
            </div>

            {/* Mobile Navigation Menu */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {currentMenuItems?.map(item => renderMenuItem(item))}
            </nav>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-border">
              <div className="text-xs text-muted-foreground text-center">
                MasterBooks ERP v2.1.0
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default Sidebar;