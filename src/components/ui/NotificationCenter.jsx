import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Low Stock Alert',
      message: 'Coca-Cola 500ml has only 12 units remaining',
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      isRead: false,
      category: 'inventory'
    },
    {
      id: 2,
      type: 'error',
      title: 'Credit Limit Exceeded',
      message: 'Customer "Accra Supermarket" has exceeded credit limit by GHS 2,500',
      timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
      isRead: false,
      category: 'finance'
    },
    {
      id: 3,
      type: 'success',
      title: 'Sync Completed',
      message: 'All pending transactions have been synchronized successfully',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      isRead: true,
      category: 'system'
    },
    {
      id: 4,
      type: 'info',
      title: 'New Sales Order',
      message: 'Order #SO-2025-001 received from Tema Trading Co.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: true,
      category: 'sales'
    }
  ]);

  const unreadCount = notifications?.filter(n => !n?.isRead)?.length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error': return 'AlertCircle';
      case 'warning': return 'AlertTriangle';
      case 'success': return 'CheckCircle';
      case 'info': return 'Info';
      default: return 'Bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'error': return 'text-error';
      case 'warning': return 'text-warning';
      case 'success': return 'text-success';
      case 'info': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const formatTimestamp = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date?.toLocaleDateString();
  };

  const handleNotificationClick = (notification) => {
    if (!notification?.isRead) {
      setNotifications(prev => 
        prev?.map(n => 
          n?.id === notification?.id ? { ...n, isRead: true } : n
        )
      );
    }
    
    // Handle notification action based on category
    switch (notification?.category) {
      case 'inventory': console.log('Navigate to inventory management');
        break;
      case 'finance': console.log('Navigate to customer credit details');
        break;
      case 'sales': console.log('Navigate to sales order details');
        break;
      default:
        console.log('Handle notification:', notification);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev?.map(n => ({ ...n, isRead: true }))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-accent transition-all duration-200 ease-out hover:scale-110 active:scale-95"
        aria-label="Notifications"
      >
        <Icon name="Bell" size={20} className="text-white transition-transform duration-200 group-hover:rotate-12" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-error-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
      </button>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-150" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-lg shadow-modal z-200 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-medium text-popover-foreground">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:text-primary/80 transition-colors duration-150 ease-out"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-accent transition-colors duration-150 ease-out"
                >
                  <Icon name="X" size={14} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications?.length === 0 ? (
                <div className="p-8 text-center">
                  <Icon name="Bell" size={32} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div className="py-2">
                  {notifications?.map((notification) => (
                    <button
                      key={notification?.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`
                        w-full flex items-start space-x-3 p-4 text-left hover:bg-accent transition-colors duration-150 ease-out
                        ${!notification?.isRead ? 'bg-accent/50' : ''}
                      `}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <Icon 
                          name={getNotificationIcon(notification?.type)} 
                          size={16} 
                          className={getNotificationColor(notification?.type)} 
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm font-medium truncate ${!notification?.isRead ? 'text-popover-foreground' : 'text-muted-foreground'}`}>
                            {notification?.title}
                          </h4>
                          {!notification?.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {notification?.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification?.timestamp)}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {notification?.category}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications?.length > 0 && (
              <div className="p-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 ease-out"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => {
                      console.log('Navigate to all notifications');
                      setIsOpen(false);
                    }}
                    className="text-xs text-primary hover:text-primary/80 transition-colors duration-150 ease-out"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;