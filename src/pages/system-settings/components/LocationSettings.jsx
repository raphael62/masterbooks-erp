import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const LocationSettings = () => {
  const [locations, setLocations] = useState([
    {
      id: 1,
      name: "Main Warehouse",
      code: "MW001",
      type: "warehouse",
      address: "Industrial Area, Accra",
      phone: "+233 24 123 4567",
      manager: "Kwame Asante",
      isActive: true,
      isDefault: true,
      inventoryEnabled: true
    },
    {
      id: 2,
      name: "Tema Branch",
      code: "TB002",
      type: "branch",
      address: "Tema Community 1",
      phone: "+233 24 234 5678",
      manager: "Ama Serwaa",
      isActive: true,
      isDefault: false,
      inventoryEnabled: true
    },
    {
      id: 3,
      name: "Kumasi Outlet",
      code: "KO003",
      type: "outlet",
      address: "Kejetia Market, Kumasi",
      phone: "+233 24 345 6789",
      manager: "Kofi Mensah",
      isActive: false,
      isDefault: false,
      inventoryEnabled: false
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "branch",
    address: "",
    phone: "",
    manager: "",
    isActive: true,
    inventoryEnabled: true
  });

  const locationTypes = [
    { value: "warehouse", label: "Warehouse" },
    { value: "branch", label: "Branch Office" },
    { value: "outlet", label: "Sales Outlet" },
    { value: "factory", label: "Production Factory" }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddLocation = () => {
    setFormData({
      name: "",
      code: "",
      type: "branch",
      address: "",
      phone: "",
      manager: "",
      isActive: true,
      inventoryEnabled: true
    });
    setEditingLocation(null);
    setShowAddForm(true);
  };

  const handleEditLocation = (location) => {
    setFormData({
      name: location?.name,
      code: location?.code,
      type: location?.type,
      address: location?.address,
      phone: location?.phone,
      manager: location?.manager,
      isActive: location?.isActive,
      inventoryEnabled: location?.inventoryEnabled
    });
    setEditingLocation(location);
    setShowAddForm(true);
  };

  const handleSaveLocation = () => {
    if (editingLocation) {
      setLocations(prev => prev?.map(loc => 
        loc?.id === editingLocation?.id 
          ? { ...loc, ...formData }
          : loc
      ));
    } else {
      const newLocation = {
        id: Date.now(),
        ...formData,
        isDefault: false
      };
      setLocations(prev => [...prev, newLocation]);
    }
    setShowAddForm(false);
    setEditingLocation(null);
  };

  const handleToggleStatus = (locationId) => {
    setLocations(prev => prev?.map(loc =>
      loc?.id === locationId
        ? { ...loc, isActive: !loc?.isActive }
        : loc
    ));
  };

  const handleSetDefault = (locationId) => {
    setLocations(prev => prev?.map(loc => ({
      ...loc,
      isDefault: loc?.id === locationId
    })));
  };

  const getLocationTypeColor = (type) => {
    switch (type) {
      case 'warehouse': return 'bg-primary/10 text-primary';
      case 'branch': return 'bg-secondary/10 text-secondary';
      case 'outlet': return 'bg-warning/10 text-warning';
      case 'factory': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Location Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage business locations and inventory assignments
          </p>
        </div>
        <Button 
          variant="default" 
          onClick={handleAddLocation}
          iconName="Plus"
          iconPosition="left"
        >
          Add Location
        </Button>
      </div>
      {/* Locations List */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h4 className="font-medium text-foreground">Business Locations</h4>
        </div>
        <div className="divide-y divide-border">
          {locations?.map((location) => (
            <div key={location?.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h5 className="font-medium text-foreground">{location?.name}</h5>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLocationTypeColor(location?.type)}`}>
                      {location?.type}
                    </span>
                    {location?.isDefault && (
                      <span className="px-2 py-1 text-xs font-medium bg-success/10 text-success rounded-full">
                        Default
                      </span>
                    )}
                    <div className={`w-2 h-2 rounded-full ${location?.isActive ? 'bg-success' : 'bg-error'}`} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Code:</span> {location?.code}
                    </div>
                    <div>
                      <span className="font-medium">Manager:</span> {location?.manager}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {location?.phone}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium">Address:</span> {location?.address}
                  </div>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-2">
                      <Icon name="Package" size={14} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Inventory: {location?.inventoryEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditLocation(location)}
                    iconName="Edit"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(location?.id)}
                    iconName={location?.isActive ? "Pause" : "Play"}
                  />
                  {!location?.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(location?.id)}
                      iconName="Star"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Add/Edit Location Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-400 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {editingLocation ? 'Edit Location' : 'Add New Location'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  iconName="X"
                />
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Location Name"
                  type="text"
                  value={formData?.name}
                  onChange={(e) => handleInputChange('name', e?.target?.value)}
                  required
                />
                <Input
                  label="Location Code"
                  type="text"
                  value={formData?.code}
                  onChange={(e) => handleInputChange('code', e?.target?.value)}
                  description="Unique identifier for this location"
                  required
                />
              </div>
              
              <Select
                label="Location Type"
                options={locationTypes}
                value={formData?.type}
                onChange={(value) => handleInputChange('type', value)}
                required
              />
              
              <Input
                label="Address"
                type="text"
                value={formData?.address}
                onChange={(e) => handleInputChange('address', e?.target?.value)}
                required
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData?.phone}
                  onChange={(e) => handleInputChange('phone', e?.target?.value)}
                />
                <Input
                  label="Location Manager"
                  type="text"
                  value={formData?.manager}
                  onChange={(e) => handleInputChange('manager', e?.target?.value)}
                />
              </div>
              
              <div className="space-y-3">
                <Checkbox
                  label="Location is Active"
                  description="Active locations can process transactions"
                  checked={formData?.isActive}
                  onChange={(e) => handleInputChange('isActive', e?.target?.checked)}
                />
                <Checkbox
                  label="Enable Inventory Management"
                  description="Track stock levels at this location"
                  checked={formData?.inventoryEnabled}
                  onChange={(e) => handleInputChange('inventoryEnabled', e?.target?.checked)}
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-border flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSaveLocation}
                iconName="Save"
                iconPosition="left"
              >
                {editingLocation ? 'Update Location' : 'Add Location'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSettings;