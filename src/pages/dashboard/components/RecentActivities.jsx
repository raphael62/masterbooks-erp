import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecentActivities = () => {
  const [filter, setFilter] = useState('all');
  
  const activities = [
    {
      id: 1,
      type: 'sale',
      title: 'New Sales Order',
      description: 'SO-2025-0089 created by Kwame Asante',
      amount: 'GHS 2,450.00',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      icon: 'ShoppingCart',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      id: 2,
      type: 'payment',
      title: 'Payment Received',
      description: 'Accra Supermarket - Invoice #INV-2025-0156',
      amount: 'GHS 8,750.00',
      timestamp: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
      icon: 'CreditCard',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      id: 3,
      type: 'inventory',
      title: 'Low Stock Alert',
      description: 'Coca-Cola 500ml - Only 15 units remaining',
      timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
      icon: 'AlertTriangle',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      id: 4,
      type: 'customer',
      title: 'New Customer Added',
      description: 'Tema Trading Co. registered by Ama Osei',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      icon: 'UserPlus',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      id: 5,
      type: 'sync',
      title: 'Data Synchronized',
      description: '23 transactions synced successfully',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      icon: 'RefreshCw',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      id: 6,
      type: 'sale',
      title: 'Order Delivered',
      description: 'SO-2025-0087 delivered to Kumasi Market',
      amount: 'GHS 5,200.00',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      icon: 'Truck',
      color: 'text-success',
      bgColor: 'bg-success/10'
    }
  ];

  const filterOptions = [
    { value: 'all', label: 'All Activities', count: activities?.length },
    { value: 'sale', label: 'Sales', count: activities?.filter(a => a?.type === 'sale')?.length },
    { value: 'payment', label: 'Payments', count: activities?.filter(a => a?.type === 'payment')?.length },
    { value: 'inventory', label: 'Inventory', count: activities?.filter(a => a?.type === 'inventory')?.length }
  ];

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities?.filter(activity => activity?.type === filter);

  const formatTimestamp = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date?.toLocaleDateString('en-GB');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Activities</h3>
          <p className="text-sm text-muted-foreground">Latest business activities and updates</p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          iconName="ExternalLink"
          iconPosition="right"
          onClick={() => console.log('Navigate to activity log')}
        >
          View All
        </Button>
      </div>
      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 mb-4 p-1 bg-muted rounded-lg">
        {filterOptions?.map((option) => (
          <button
            key={option?.value}
            onClick={() => setFilter(option?.value)}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-out ${
              filter === option?.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{option?.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filter === option?.value
                ? 'bg-primary/10 text-primary' :'bg-muted-foreground/10 text-muted-foreground'
            }`}>
              {option?.count}
            </span>
          </button>
        ))}
      </div>
      {/* Activities List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredActivities?.map((activity) => (
          <div
            key={activity?.id}
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors duration-150 ease-out cursor-pointer"
            onClick={() => console.log('Navigate to activity details:', activity)}
          >
            <div className={`p-2 rounded-lg ${activity?.bgColor}`}>
              <Icon 
                name={activity?.icon} 
                size={16} 
                className={activity?.color}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-foreground truncate">
                  {activity?.title}
                </h4>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {formatTimestamp(activity?.timestamp)}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                {activity?.description}
              </p>
              
              {activity?.amount && (
                <div className="text-sm font-medium text-success">
                  {activity?.amount}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {filteredActivities?.length === 0 && (
        <div className="text-center py-8">
          <Icon name="Activity" size={32} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No activities found for this filter</p>
        </div>
      )}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          Last updated: {new Date()?.toLocaleString('en-GB')}
        </div>
      </div>
    </div>
  );
};

export default RecentActivities;