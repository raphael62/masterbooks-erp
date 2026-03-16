import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import SyncStatusIndicator from './SyncStatusIndicator';
import UserProfileDropdown from './UserProfileDropdown';
import NotificationCenter from './NotificationCenter';
import CompanySelector from './CompanySelector';
import LocationSelector from './LocationSelector';

const Header = ({ onMenuToggle, isMenuOpen = false, activeModule, onModuleChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const navigate = useNavigate();

  const coreModules = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'LayoutDashboard'
    },
    {
      id: 'purchases',
      label: 'Purchases',
      path: '/purchase-overview-dashboard',
      icon: 'ShoppingCart'
    },
    {
      id: 'sales',
      label: 'Sales',
      path: '/sales-order-management',
      icon: 'TrendingUp'
    },
    {
      id: 'pos',
      label: 'Point of Sale',
      path: '/point-of-sale',
      icon: 'Monitor'
    },
    {
      id: 'inventory',
      label: 'Inventory',
      path: '/inventory-management',
      icon: 'Package'
    },
    {
      id: 'production',
      label: 'Production',
      path: '/production-overview-dashboard',
      icon: 'Factory'
    },
    {
      id: 'accounting',
      label: 'Accounting & Finance',
      path: '/financial-reports',
      icon: 'Calculator'
    },
    {
      id: 'hr',
      label: 'HR & Payroll',
      path: '/employee-management',
      icon: 'Users'
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/financial-reports',
      icon: 'BarChart2'
    },
    {
      id: 'preferences',
      label: 'Preferences',
      path: '/system-settings',
      icon: 'Settings'
    }
  ];

  const handleModuleClick = (module) => {
    navigate(module?.path);
    if (onModuleChange) {
      onModuleChange(module?.id);
    }
  };

  const handleSearchKeyDown = (e) => {
    if ((e?.metaKey || e?.ctrlKey) && e?.key === 'k') {
      e?.preventDefault();
      setIsCommandPaletteOpen(true);
    }
    if (e?.key === 'Escape') {
      setSearchQuery('');
      e?.target?.blur();
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery?.trim()) {
      console.log('Search query:', searchQuery);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-primary border-b border-primary/20 z-100">
      {/* Top Section - Logo, Search, User Controls */}
      <div className="h-16 flex items-center justify-between px-4">
        {/* Left Section - Menu Toggle & Logo */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-md hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-150 ease-out"
            aria-label="Toggle navigation menu"
          >
            <Icon 
              name={isMenuOpen ? "X" : "Menu"} 
              size={20} 
              className="text-white" 
            />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-200 cursor-pointer">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
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
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-white">MasterBooks ERP</h1>
            </div>
          </div>
        </div>

        {/* Center Section - Company/Location Selectors + Search */}
        <div className="hidden md:flex flex-1 items-center space-x-2 mx-8">
          <CompanySelector />
          <LocationSelector />
          <form onSubmit={handleSearchSubmit} className="max-w-xs w-full relative">
            <div className="relative">
              <Icon 
                name="Search" 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" 
              />
              <input
                type="text"
                placeholder="Search or press Cmd+K"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e?.target?.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white/10 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent hover:border-white/30 hover:bg-white/15 transition-all duration-200 ease-out text-white placeholder:text-white/50"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono text-white/50 bg-white/10 border border-white/20 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>
          </form>
        </div>

        {/* Right Section - Status & User Controls */}
        <div className="flex items-center space-x-3">
          <SyncStatusIndicator />
          <NotificationCenter />
          <UserProfileDropdown />
        </div>
      </div>

      {/* Bottom Section - Core Module Navigation */}
      <div className="h-12 bg-white border-t border-gray-200">
        <div className="h-full px-4 overflow-x-auto">
          <div className="flex items-center h-full space-x-1 min-w-max">
            {coreModules?.map((module) => (
              <button
                key={module?.id}
                onClick={() => handleModuleClick(module)}
                className={`
                  relative flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-out whitespace-nowrap group
                  ${
                    activeModule === module?.id
                      ? 'bg-primary/10 text-primary shadow-sm scale-[1.02]'
                      : 'text-gray-600 hover:text-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98]'
                  }
                `}
                title={module?.label}
              >
                <Icon 
                  name={module?.icon} 
                  size={15} 
                  className={`transition-transform duration-200 ${
                    activeModule === module?.id 
                      ? 'text-primary' :'text-gray-500 group-hover:text-primary group-hover:scale-110'
                  }`} 
                />
                <span>{module?.label}</span>
                {activeModule === module?.id && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Command Palette Modal */}
      {isCommandPaletteOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[400] flex items-start justify-center pt-20"
          onClick={() => setIsCommandPaletteOpen(false)}
        >
          <div 
            className="bg-card rounded-lg shadow-modal w-full max-w-2xl mx-4 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Icon 
                  name="Search" 
                  size={16} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
                />
                <input
                  type="text"
                  placeholder="Type a command or search..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 text-sm bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground"
                  onKeyDown={(e) => {
                    if (e?.key === 'Escape') {
                      setIsCommandPaletteOpen(false);
                    }
                  }}
                />
              </div>
            </div>
            <div className="p-2 max-h-96 overflow-y-auto">
              <div className="text-xs font-medium text-muted-foreground px-3 py-2">Quick Actions</div>
              <div className="space-y-1">
                <button 
                  onClick={() => { navigate('/sales-order-management'); setIsCommandPaletteOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md cursor-pointer"
                >
                  Create New Sales Order
                </button>
                <button 
                  onClick={() => { navigate('/customer-management'); setIsCommandPaletteOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md cursor-pointer"
                >
                  Add Customer
                </button>
                <button 
                  onClick={() => { navigate('/inventory-management'); setIsCommandPaletteOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md cursor-pointer"
                >
                  View Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
