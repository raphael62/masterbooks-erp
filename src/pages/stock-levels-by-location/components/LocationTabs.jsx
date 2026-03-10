import React from 'react';
import Icon from '../../../components/AppIcon';

const LocationTabs = ({ locations, activeLocation, onLocationChange }) => {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onLocationChange('all')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border whitespace-nowrap transition-colors ${
          activeLocation === 'all' ?'text-white border-transparent' :'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
        }`}
        style={activeLocation === 'all' ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' } : {}}
      >
        <Icon name="Layers" size={12} />
        All Locations
      </button>
      {locations?.map(loc => (
        <button
          key={loc?.id}
          onClick={() => onLocationChange(loc?.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border whitespace-nowrap transition-colors ${
            activeLocation === loc?.id
              ? 'text-white border-transparent' :'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
          style={activeLocation === loc?.id ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' } : {}}
        >
          <Icon name={loc?.location_type === 'warehouse' ? 'Warehouse' : 'Building2'} size={12} />
          {loc?.location_name}
        </button>
      ))}
    </div>
  );
};

export default LocationTabs;
