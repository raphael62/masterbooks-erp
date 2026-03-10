import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';
import { useCompanyLocation } from '../../contexts/CompanyLocationContext';

const LocationSelector = () => {
  const { activeLocations, selectedLocation, setSelectedLocation, selectedCompany, loading } = useCompanyLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(e?.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading || !selectedCompany) return null;
  if (!activeLocations?.length) return null;

  const getLocationTypeIcon = (type) => {
    switch (type) {
      case 'warehouse': return 'Warehouse';
      case 'factory': return 'Factory';
      case 'outlet': return 'Store';
      default: return 'MapPin';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-secondary/10 border border-secondary/20 rounded-md hover:bg-secondary/15 transition-colors duration-150 max-w-[160px] group"
        title={selectedLocation?.name || 'Select Location'}
      >
        <Icon
          name={getLocationTypeIcon(selectedLocation?.location_type)}
          size={13}
          className="text-white/80 flex-shrink-0"
        />
        <span className="text-xs font-medium text-white truncate flex-1 text-left">
          {selectedLocation?.name || 'Select Location'}
        </span>
        <Icon
          name={isOpen ? 'ChevronUp' : 'ChevronDown'}
          size={12}
          className="text-white/70 flex-shrink-0 group-hover:text-white transition-colors"
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg z-200 animate-fadeIn">
          <div className="p-2 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">
              Select Location
            </p>
            {selectedCompany && (
              <p className="text-xs text-muted-foreground px-2 mt-0.5">{selectedCompany?.name}</p>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {activeLocations?.map((location) => (
              <button
                key={location?.id}
                onClick={() => {
                  setSelectedLocation(location);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 text-left hover:bg-accent transition-colors duration-100 ${
                  selectedLocation?.id === location?.id ? 'bg-secondary/10' : ''
                }`}
              >
                <div className="w-7 h-7 rounded bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Icon
                    name={getLocationTypeIcon(location?.location_type)}
                    size={13}
                    className="text-secondary"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{location?.name}</p>
                  <p className="text-xs text-muted-foreground">{location?.code} · {location?.location_type}</p>
                </div>
                {selectedLocation?.id === location?.id && (
                  <Icon name="Check" size={14} className="text-secondary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
