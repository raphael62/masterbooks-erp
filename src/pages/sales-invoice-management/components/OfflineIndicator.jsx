import React from 'react';
import Icon from '../../../components/AppIcon';

const OfflineIndicator = () => {
  return (
    <div className="bg-orange-100 border border-orange-200 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <Icon name="WifiOff" size={20} className="text-orange-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-orange-800">
            Working Offline
          </h3>
          <p className="text-sm text-orange-700">
            You're currently offline. Invoice changes will be saved locally and synced when connection is restored.
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;