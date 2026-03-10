import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActions = () => {
  const navigate = useNavigate();
  
  const quickActions = [
    {
      id: 'new-sale',
      title: 'New Sale',
      description: 'Create sales order',
      icon: 'Plus',
      color: 'bg-primary text-primary-foreground',
      hoverColor: 'hover:bg-primary/90',
      action: () => navigate('/sales-order-management')
    },
    {
      id: 'receive-payment',
      title: 'Receive Payment',
      description: 'Record customer payment',
      icon: 'CreditCard',
      color: 'bg-success text-success-foreground',
      hoverColor: 'hover:bg-success/90',
      action: () => console.log('Open payment modal')
    },
    {
      id: 'stock-adjustment',
      title: 'Stock Adjustment',
      description: 'Adjust inventory levels',
      icon: 'Package',
      color: 'bg-warning text-warning-foreground',
      hoverColor: 'hover:bg-warning/90',
      action: () => navigate('/inventory-management')
    },
    {
      id: 'add-customer',
      title: 'Add Customer',
      description: 'Register new customer',
      icon: 'UserPlus',
      color: 'bg-secondary text-secondary-foreground',
      hoverColor: 'hover:bg-secondary/90',
      action: () => navigate('/customer-management')
    }
  ];

  const recentShortcuts = [
    {
      id: 'pos',
      title: 'Point of Sale',
      icon: 'Calculator',
      path: '/point-of-sale'
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: 'BarChart3',
      path: '/financial-reports'
    },
    {
      id: 'employees',
      title: 'Employees',
      icon: 'Users',
      path: '/employee-management'
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'Settings',
      path: '/system-settings'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
          <p className="text-sm text-muted-foreground">Common tasks and shortcuts</p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          iconName="Grid3X3"
          onClick={() => console.log('Customize quick actions')}
        >
          Customize
        </Button>
      </div>
      {/* Primary Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {quickActions?.map((action) => (
          <button
            key={action?.id}
            onClick={action?.action}
            className={`p-4 rounded-lg transition-all duration-200 ease-out ${action?.color} ${action?.hoverColor} group`}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Icon 
                  name={action?.icon} 
                  size={20}
                  className="text-current"
                />
              </div>
              <div className="text-left">
                <div className="font-medium text-current">
                  {action?.title}
                </div>
                <div className="text-sm opacity-90">
                  {action?.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      {/* Secondary Shortcuts */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Quick Access</h4>
        <div className="grid grid-cols-2 gap-2">
          {recentShortcuts?.map((shortcut) => (
            <button
              key={shortcut?.id}
              onClick={() => navigate(shortcut?.path)}
              className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent transition-colors duration-150 ease-out group"
            >
              <Icon 
                name={shortcut?.icon} 
                size={16} 
                className="text-muted-foreground group-hover:text-foreground"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground">
                {shortcut?.title}
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* Recent Actions */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-muted-foreground">Recent Actions</h4>
          <Button
            variant="ghost"
            size="sm"
            iconName="History"
            onClick={() => console.log('View action history')}
          >
            History
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Icon name="ShoppingCart" size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">Sales Order Created</span>
            </div>
            <span className="text-xs text-muted-foreground">5m ago</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Icon name="CreditCard" size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">Payment Received</span>
            </div>
            <span className="text-xs text-muted-foreground">12m ago</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Icon name="Package" size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">Stock Adjusted</span>
            </div>
            <span className="text-xs text-muted-foreground">1h ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;