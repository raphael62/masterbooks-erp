import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import { supabase } from '../../../lib/supabase';

const LocationSelector = ({ selectedLocation, onLocationChange, className = '' }) => {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase?.from('locations')?.select('id, name')?.eq('is_active', true)?.order('name');
      if (!error && data) {
        setLocations(data);
      }
    };
    fetchLocations();
  }, []);

  const locationOptions = [
    { value: 'all', label: 'All Locations' },
    ...locations?.map(l => ({ value: l?.id, label: l?.name }))
  ];

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="MapPin" size={20} className="text-primary" />
        <h3 className="font-semibold text-foreground">Location</h3>
      </div>
      <div className="space-y-4">
        <Select
          options={locationOptions}
          value={selectedLocation}
          onChange={onLocationChange}
          placeholder="Select location"
        />
        
        {/* Location Status Indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-muted-foreground">Online</span>
            </div>
            <span className="text-success font-medium">Connected</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
              <span className="text-muted-foreground">Sync Status</span>
            </div>
            <span className="text-warning font-medium">Syncing</span>
          </div>
        </div>
        
        {/* Quick Location Actions */}
        <div className="pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">Quick Actions</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => console.log('View location details')}
              className="flex items-center justify-center space-x-1 py-2 px-3 text-xs bg-accent hover:bg-accent/80 rounded-md transition-colors duration-150 ease-out"
            >
              <Icon name="Eye" size={12} />
              <span>View</span>
            </button>
            <button
              onClick={() => console.log('Transfer stock')}
              className="flex items-center justify-center space-x-1 py-2 px-3 text-xs bg-accent hover:bg-accent/80 rounded-md transition-colors duration-150 ease-out"
            >
              <Icon name="ArrowRightLeft" size={12} />
              <span>Transfer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;