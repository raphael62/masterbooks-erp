import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const BreadcrumbNavigation = ({ customBreadcrumbs = null }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Route to label mapping
  const routeLabels = {
    '/dashboard': 'Dashboard',
    '/sales-order-management': 'Sales Orders',
    '/sales-promotions-management': 'Promotions',
    '/master-data-settings': 'Master Data Settings',
    '/customer-management': 'Customers',
    '/point-of-sale': 'Point of Sale',
    '/inventory-management': 'Inventory',
    '/inventory-change-history': 'Change History',
    '/financial-reports': 'Reports',
    '/employee-management': 'People',
    '/system-settings': 'Settings',
    '/users-management': 'Users',
    '/roles-permissions-management': 'Roles & Permissions',
    '/import-data': 'Import Data'
  };

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }

    const pathSegments = location?.pathname?.split('/')?.filter(Boolean);
    const breadcrumbs = [];

    // Always start with Dashboard if not already there
    if (location?.pathname !== '/dashboard') {
      breadcrumbs?.push({
        label: 'Dashboard',
        path: '/dashboard',
        isClickable: true
      });
    }

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments?.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = routeLabels?.[currentPath] || segment?.replace(/-/g, ' ')?.replace(/\b\w/g, l => l?.toUpperCase());
      
      breadcrumbs?.push({
        label,
        path: currentPath,
        isClickable: index < pathSegments?.length - 1 // Last item is not clickable
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't render breadcrumbs on dashboard or if only one item
  if (location?.pathname === '/dashboard' || breadcrumbs?.length <= 1) {
    return null;
  }

  const handleBreadcrumbClick = (breadcrumb) => {
    if (breadcrumb?.isClickable && breadcrumb?.path) {
      navigate(breadcrumb?.path);
    }
  };

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs?.map((breadcrumb, index) => (
          <li key={index} className="flex items-center space-x-2">
            {index > 0 && (
              <Icon 
                name="ChevronRight" 
                size={14} 
                className="text-muted-foreground/60" 
              />
            )}
            
            {breadcrumb?.isClickable ? (
              <button
                onClick={() => handleBreadcrumbClick(breadcrumb)}
                className="hover:text-foreground transition-colors duration-150 ease-out focus:outline-none focus:text-foreground"
                aria-label={`Navigate to ${breadcrumb?.label}`}
              >
                {breadcrumb?.label}
              </button>
            ) : (
              <span 
                className="text-foreground font-medium"
                aria-current="page"
              >
                {breadcrumb?.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default BreadcrumbNavigation;