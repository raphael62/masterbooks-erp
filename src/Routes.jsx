import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";
import NotFound from "pages/NotFound";
import InventoryManagement from './pages/inventory-management';
import LoginPage from './pages/login';
import FinancialReports from './pages/financial-reports';
import Dashboard from './pages/dashboard';
import EmployeeManagement from './pages/employee-management';
import CustomerManagement from './pages/customer-management';
import PointOfSale from './pages/point-of-sale';
import SystemSettings from './pages/system-settings';
import SalesOrderManagement from './pages/sales-order-management';
import SalesInvoiceManagement from './pages/sales-invoice-management';
import SalesOverviewDashboard from './pages/sales-overview-dashboard';
import PurchaseOverviewDashboard from './pages/purchase-overview-dashboard';
import VendorManagement from './pages/vendor-management';
import PurchaseOrderManagement from './pages/purchase-order-management';
import PurchaseInvoiceManagement from './pages/purchase-invoice-management';
import ThemeSettings from './pages/theme-settings';
import ProductManagement from './pages/product-management';
import ReturnableGlassManagement from './pages/returnable-glass-management';
import StockMovements from './pages/stock-movements';
import StockLevelsByLocation from './pages/stock-levels-by-location';
import LocationManagement from './pages/location-management';
import CompanyManagement from './pages/company-management';
import ImportData from './pages/import-data';
import AuditLog from './pages/audit-log';
import PriceListManagement from './pages/price-list-management';
import PriceTypeManagement from './pages/price-type-management';
import BusinessExecutivesManagement from './pages/business-executives-management';
import VSRMonthlyTargetsManagement from './pages/vsr-monthly-targets-management';
import SSRMonthlyTargetsManagement from './pages/ssr-monthly-targets-management';
import PaymentAccountsManagement from './pages/payment-accounts-management';
import TaxVatManagement from './pages/tax-vat-management';
import RolesPermissionsManagement from './pages/roles-permissions-management';
import UsersManagement from './pages/users-management';
import ProductionOverviewDashboard from './pages/production-overview-dashboard';
import BillOfMaterialsManagement from './pages/bill-of-materials-bom-management';
import IssueMaterials from './pages/issue-materials';
import ProductCategoriesManagement from './pages/product-categories-management';
import UnitsOfMeasureManagement from './pages/units-of-measure-management';
import EmptiesTypesManagement from './pages/empties-types-management';
import SupplierStatement from './pages/supplier-statement';
import SupplierEmptiesStatement from './pages/supplier-empties-statement';
import SupplierPayments from './pages/supplier-payments';
import ChartOfAccountsManagement from './pages/chart-of-accounts-management';
import EmptiesReceiveForm from './pages/empties-receive-form';
import EmptiesDispatchForm from './pages/empties-dispatch-form';
import OpenMarketEmptiesPurchase from './pages/open-market-empties-purchase';
import SalesPromotionsManagement from './pages/sales-promotions-management';
import MasterDataSettings from './pages/master-data-settings';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/inventory-management" element={<InventoryManagement />} />
        <Route path="/product-management" element={<ProductManagement />} />
        <Route path="/returnable-glass-management" element={<ReturnableGlassManagement />} />
        <Route path="/stock-movements" element={<StockMovements />} />
        <Route path="/stock-levels-by-location" element={<StockLevelsByLocation />} />
        <Route path="/financial-reports" element={<FinancialReports />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employee-management" element={<EmployeeManagement />} />
        <Route path="/customer-management" element={<CustomerManagement />} />
        <Route path="/point-of-sale" element={<PointOfSale />} />
        <Route path="/system-settings" element={<SystemSettings />} />
        <Route path="/sales-order-management" element={<SalesOrderManagement />} />
        <Route path="/sales-invoice-management" element={<SalesInvoiceManagement />} />
        <Route path="/sales-overview-dashboard" element={<SalesOverviewDashboard />} />
        <Route path="/sales-promotions-management" element={<SalesPromotionsManagement />} />
        <Route path="/purchase-overview-dashboard" element={<PurchaseOverviewDashboard />} />
        <Route path="/vendor-management" element={<VendorManagement />} />
        <Route path="/purchase-order-management" element={<PurchaseOrderManagement />} />
        <Route path="/purchase-invoice-management" element={<PurchaseInvoiceManagement />} />
        <Route path="/theme-settings" element={<ThemeSettings />} />
        <Route path="/master-data-settings" element={<MasterDataSettings />} />
        <Route path="/location-management" element={<LocationManagement />} />
        <Route path="/company-management" element={<CompanyManagement />} />
        <Route path="/import-data" element={<ImportData />} />
        <Route path="/audit-log" element={<AuditLog />} />
        <Route path="/price-list-management" element={<PriceListManagement />} />
        <Route path="/price-type-management" element={<PriceTypeManagement />} />
        <Route path="/business-executives-management" element={<BusinessExecutivesManagement />} />
        <Route path="/vsr-monthly-targets-management" element={<VSRMonthlyTargetsManagement />} />
        <Route path="/ssr-monthly-targets-management" element={<SSRMonthlyTargetsManagement />} />
        <Route path="/payment-accounts-management" element={<PaymentAccountsManagement />} />
        <Route path="/tax-vat-management" element={<TaxVatManagement />} />
        <Route path="/roles-permissions-management" element={<RolesPermissionsManagement />} />
        <Route path="/users-management" element={<UsersManagement />} />
        <Route path="/production-overview-dashboard" element={<ProductionOverviewDashboard />} />
        <Route path="/bill-of-materials-bom-management" element={<BillOfMaterialsManagement />} />
        <Route path="/production-issue-materials" element={<IssueMaterials />} />
        <Route path="/product-categories-management" element={<ProductCategoriesManagement />} />
        <Route path="/units-of-measure-management" element={<UnitsOfMeasureManagement />} />
        <Route path="/empties-types-management" element={<EmptiesTypesManagement />} />
        <Route path="/supplier-statement" element={<SupplierStatement />} />
        <Route path="/supplier-empties-statement" element={<SupplierEmptiesStatement />} />
        <Route path="/supplier-payments" element={<SupplierPayments />} />
        <Route path="/chart-of-accounts-management" element={<ChartOfAccountsManagement />} />
        <Route path="/empties-receive-form" element={<EmptiesReceiveForm />} />
        <Route path="/empties-dispatch-form" element={<EmptiesDispatchForm />} />
        <Route path="/open-market-empties-purchase" element={<OpenMarketEmptiesPurchase />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;