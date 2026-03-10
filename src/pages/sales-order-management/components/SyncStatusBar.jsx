import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const SyncStatusBar = ({ isOffline, queuedOrdersCount, lastSyncTime }) => {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [showDetails, setShowDetails] = useState(false);

  const formatLastSync = (date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date?.toLocaleDateString('en-GB');
  };

  const handleManualSync = () => {
    if (isOffline || syncStatus === 'syncing') return;
    
    setSyncStatus('syncing');
    
    // Simulate sync process
    setTimeout(() => {
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }, 3000);
  };

  const getSyncIcon = () => {
    if (syncStatus === 'syncing') return 'RefreshCw';
    if (isOffline) return 'WifiOff';
    if (queuedOrdersCount > 0) return 'Clock';
    return 'CheckCircle';
  };

  const getSyncColor = () => {
    if (syncStatus === 'syncing') return 'text-warning';
    if (isOffline) return 'text-error';
    if (queuedOrdersCount > 0) return 'text-warning';
    return 'text-success';
  };

  const getSyncMessage = () => {
    if (syncStatus === 'syncing') return 'Syncing data...';
    if (isOffline) return 'Working offline';
    if (queuedOrdersCount > 0) return `${queuedOrdersCount} orders queued`;
    return 'All data synchronized';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Icon 
              name={getSyncIcon()} 
              size={20} 
              className={`${getSyncColor()} ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
            />
            {queuedOrdersCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full flex items-center justify-center">
                <span className="text-xs font-mono text-warning-foreground">
                  {queuedOrdersCount > 9 ? '9+' : queuedOrdersCount}
                </span>
              </div>
            )}
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground">
                {getSyncMessage()}
              </span>
              <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-error' : 'bg-success animate-pulse'}`} />
            </div>
            <div className="text-xs text-muted-foreground">
              Last sync: {formatLastSync(lastSyncTime)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 rounded-lg hover:bg-accent transition-colors duration-150 ease-out"
            aria-label="Toggle sync details"
          >
            <Icon 
              name={showDetails ? "ChevronUp" : "ChevronDown"} 
              size={16} 
              className="text-muted-foreground" 
            />
          </button>
          
          <button
            onClick={handleManualSync}
            disabled={isOffline || syncStatus === 'syncing'}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ease-out"
          >
            <Icon 
              name="RefreshCw" 
              size={14} 
              className={syncStatus === 'syncing' ? 'animate-spin' : ''} 
            />
            <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Connection Status</h4>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-error' : 'bg-success'}`} />
                <span className="text-muted-foreground">
                  {isOffline ? 'Offline' : 'Online'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Pending Actions</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Queued orders:</span>
                  <span className="font-mono">{queuedOrdersCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Draft orders:</span>
                  <span className="font-mono">2</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Data Freshness</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customers:</span>
                  <span className="text-success text-xs">Up to date</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Products:</span>
                  <span className="text-success text-xs">Up to date</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prices:</span>
                  <span className="text-warning text-xs">2h old</span>
                </div>
              </div>
            </div>
          </div>

          {/* Offline Instructions */}
          {isOffline && (
            <div className="mt-4 p-3 bg-warning/10 rounded-lg">
              <div className="flex items-start space-x-2">
                <Icon name="Info" size={16} className="text-warning mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning mb-1">Working in offline mode</p>
                  <p className="text-muted-foreground">
                    You can continue creating orders. They will be automatically submitted when connection is restored.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SyncStatusBar;