import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-300">
      <div className="bg-warning text-warning-foreground px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <Icon name="WifiOff" size={20} className="text-warning-foreground" />
            <div>
              <p className="font-medium text-sm">You're currently offline</p>
              <p className="text-xs opacity-90">
                Limited functionality available. Data will sync when connection returns.
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 rounded-lg hover:bg-warning/20 transition-colors duration-150 ease-out"
            aria-label="Toggle offline details"
          >
            <Icon 
              name={showDetails ? "ChevronUp" : "ChevronDown"} 
              size={16} 
              className="text-warning-foreground" 
            />
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-warning-foreground/20 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <h4 className="font-medium mb-2">Available Features:</h4>
                <ul className="space-y-1 opacity-90">
                  <li>• View cached data</li>
                  <li>• Create offline entries</li>
                  <li>• Basic calculations</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Limited Features:</h4>
                <ul className="space-y-1 opacity-90">
                  <li>• Real-time sync</li>
                  <li>• New data updates</li>
                  <li>• External integrations</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Auto-Sync When Online:</h4>
                <ul className="space-y-1 opacity-90">
                  <li>• Pending transactions</li>
                  <li>• Updated inventory</li>
                  <li>• Customer changes</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;