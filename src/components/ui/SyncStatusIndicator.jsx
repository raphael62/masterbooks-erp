import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const SyncStatusIndicator = () => {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    pendingCount: 3,
    isSyncing: false
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate periodic sync updates
    const syncInterval = setInterval(() => {
      if (syncStatus?.isOnline && !syncStatus?.isSyncing) {
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date(),
          pendingCount: Math.max(0, prev?.pendingCount - 1)
        }));
      }
    }, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [syncStatus?.isOnline, syncStatus?.isSyncing]);

  const handleManualSync = async () => {
    if (!syncStatus?.isOnline || syncStatus?.isSyncing) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    
    // Simulate sync process
    setTimeout(() => {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date(),
        pendingCount: 0
      }));
    }, 2000);
  };

  const formatLastSync = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date?.toLocaleDateString();
  };

  const getSyncIcon = () => {
    if (syncStatus?.isSyncing) return 'RefreshCw';
    if (!syncStatus?.isOnline) return 'WifiOff';
    if (syncStatus?.pendingCount > 0) return 'Clock';
    return 'CheckCircle';
  };

  const getSyncColor = () => {
    if (syncStatus?.isSyncing) return 'text-warning';
    if (!syncStatus?.isOnline) return 'text-error';
    if (syncStatus?.pendingCount > 0) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent transition-colors duration-150 ease-out"
        aria-label="Sync status"
      >
        <div className="relative">
          <Icon 
            name={getSyncIcon()} 
            size={16} 
            className={`${getSyncColor()} ${syncStatus?.isSyncing ? 'animate-spin' : ''}`}
          />
          {syncStatus?.pendingCount > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full flex items-center justify-center">
              <span className="text-xs font-mono text-warning-foreground">
                {syncStatus?.pendingCount > 9 ? '9+' : syncStatus?.pendingCount}
              </span>
            </div>
          )}
        </div>
        <div className="hidden sm:block">
          <div className={`w-2 h-2 rounded-full ${syncStatus?.isOnline ? 'bg-success animate-pulse' : 'bg-error'}`} />
        </div>
      </button>
      {showDetails && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-popover border border-border rounded-lg shadow-modal z-200 animate-fadeIn">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-popover-foreground">Sync Status</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 rounded hover:bg-accent transition-colors duration-150 ease-out"
              >
                <Icon name="X" size={14} className="text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connection</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${syncStatus?.isOnline ? 'bg-success' : 'bg-error'}`} />
                  <span className="text-sm font-medium">
                    {syncStatus?.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Last Sync */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last sync</span>
                <span className="text-sm font-mono">
                  {formatLastSync(syncStatus?.lastSync)}
                </span>
              </div>

              {/* Pending Items */}
              {syncStatus?.pendingCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-sm font-mono text-warning">
                    {syncStatus?.pendingCount} items
                  </span>
                </div>
              )}

              {/* Manual Sync Button */}
              <div className="pt-2 border-t border-border">
                <button
                  onClick={handleManualSync}
                  disabled={!syncStatus?.isOnline || syncStatus?.isSyncing}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ease-out"
                >
                  <Icon 
                    name="RefreshCw" 
                    size={14} 
                    className={syncStatus?.isSyncing ? 'animate-spin' : ''} 
                  />
                  <span>{syncStatus?.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatusIndicator;