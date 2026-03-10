import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useActiveModule } from '../../utils/moduleUtils';
import TaskAuthorizationToast from './TaskAuthorizationToast';

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const activeModule = useActiveModule();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleModuleChange = (moduleId) => {
    // Navigate to the primary route for each module
    const moduleRoutes = {
      dashboard: '/dashboard',
      purchases: '/purchase-overview-dashboard',
      sales: '/sales-order-management',
      pos: '/point-of-sale',
      inventory: '/inventory-management',
      production: '/production',
      accounting: '/financial-reports',
      hr: '/employee-management',
      reports: '/reports',
      preferences: '/system-settings'
    };

    const targetRoute = moduleRoutes?.[moduleId];
    if (targetRoute) {
      navigate(targetRoute);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header 
        onMenuToggle={handleToggleMobileMenu}
        isMenuOpen={isMobileMenuOpen}
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
      />

      {/* Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed || isMobileMenuOpen}
        onToggleCollapse={isSidebarCollapsed ? handleToggleSidebar : handleToggleMobileMenu}
        activeModule={activeModule}
      />

      {/* Main Content */}
      <main className={`pt-28 transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}>
        {children}
      </main>

      {/* Real-time Task Authorization Notifications */}
      <TaskAuthorizationToast />
    </div>
  );
};

export default AppLayout;