import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const SyncStatus = () => {
  const [syncData, setSyncData] = useState({
    lastSync: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
    isOnline: navigator.onLine,
    pendingItems: 5,
    isSyncing: false
  });

  useEffect(() => {
    const handleOnline = () => setSyncData(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncData(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatLastSync = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date?.toLocaleDateString('en-GB');
  };

  const getSyncStatusColor = () => {
    if (!syncData?.isOnline) return 'text-error';
    if (syncData?.pendingItems > 0) return 'text-warning';
    return 'text-success';
  };

  const getSyncStatusIcon = () => {
    if (syncData?.isSyncing) return 'RefreshCw';
    if (!syncData?.isOnline) return 'WifiOff';
    if (syncData?.pendingItems > 0) return 'Clock';
    return 'CheckCircle';
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <div className="flex items-center space-x-1">
        <Icon 
          name={getSyncStatusIcon()} 
          size={14} 
          className={`${getSyncStatusColor()} ${syncData?.isSyncing ? 'animate-spin' : ''}`}
        />
        <span className="hidden sm:inline">
          {syncData?.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      <span className="text-muted-foreground/60">•</span>
      <span className="text-xs">
        Last sync: {formatLastSync(syncData?.lastSync)}
      </span>
      {syncData?.pendingItems > 0 && (
        <>
          <span className="text-muted-foreground/60">•</span>
          <span className="text-xs text-warning">
            {syncData?.pendingItems} pending
          </span>
        </>
      )}
    </div>
  );
};

export default SyncStatus;