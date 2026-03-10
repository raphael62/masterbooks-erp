import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SyncStatusBanner = () => {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    lastSync: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
    pendingCount: 7,
    isSyncing: false,
    hasErrors: false
  });

  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!syncStatus?.isOnline || syncStatus?.isSyncing) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    
    // Simulate sync process
    setTimeout(() => {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date(),
        pendingCount: Math.max(0, prev?.pendingCount - 3)
      }));
    }, 3000);
  };

  const formatLastSync = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date?.toLocaleDateString('en-GB');
  };

  const getBannerStyle = () => {
    if (!syncStatus?.isOnline) return 'bg-error/10 border-error/20';
    if (syncStatus?.pendingCount > 10) return 'bg-warning/10 border-warning/20';
    if (syncStatus?.pendingCount > 0) return 'bg-warning/5 border-warning/10';
    return 'bg-success/10 border-success/20';
  };

  const getStatusIcon = () => {
    if (!syncStatus?.isOnline) return 'WifiOff';
    if (syncStatus?.isSyncing) return 'RefreshCw';
    if (syncStatus?.pendingCount > 0) return 'Clock';
    return 'CheckCircle';
  };

  const getStatusColor = () => {
    if (!syncStatus?.isOnline) return 'text-error';
    if (syncStatus?.pendingCount > 10) return 'text-warning';
    if (syncStatus?.pendingCount > 0) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className={`rounded-lg border p-4 mb-6 ${getBannerStyle()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Icon 
              name={getStatusIcon()} 
              size={20} 
              className={`${getStatusColor()} ${syncStatus?.isSyncing ? 'animate-spin' : ''}`}
            />
            <div>
              <div className="font-medium text-foreground">
                {!syncStatus?.isOnline ? 'Offline Mode' : syncStatus?.isSyncing ?'Syncing...' :
                 syncStatus?.pendingCount > 0 ? 'Sync Pending' : 'All Synced'}
              </div>
              <div className="text-sm text-muted-foreground">
                Last sync: {formatLastSync(syncStatus?.lastSync)}
              </div>
            </div>
          </div>

          {syncStatus?.pendingCount > 0 && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-warning/20 rounded-full">
              <Icon name="Clock" size={14} className="text-warning" />
              <span className="text-sm font-medium text-warning">
                {syncStatus?.pendingCount} pending
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {!syncStatus?.isOnline && (
            <div className="text-sm text-muted-foreground">
              Working offline - changes will sync when connected
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            disabled={!syncStatus?.isOnline || syncStatus?.isSyncing}
            loading={syncStatus?.isSyncing}
            iconName="RefreshCw"
            iconPosition="left"
          >
            {syncStatus?.isSyncing ? 'Syncing' : 'Sync Now'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SyncStatusBanner;