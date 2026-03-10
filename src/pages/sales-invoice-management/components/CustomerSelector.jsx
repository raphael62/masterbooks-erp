import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const CustomerSelector = ({ onCustomerSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const mockCustomers = [
    {
      id: '1',
      name: 'Ashanti Gold Company Ltd.',
      email: 'procurement@ashgold.com.gh',
      phone: '+233 32 202 8000',
      address: 'Obuasi, Ashanti Region, Ghana'
    },
    {
      id: '2',
      name: 'Tema Oil Refinery',
      email: 'admin@tor.gov.gh',
      phone: '+233 30 320 2001',
      address: 'Tema, Greater Accra Region, Ghana'
    },
    {
      id: '3',
      name: 'Ghana Commercial Bank',
      email: 'info@gcb.com.gh',
      phone: '+233 30 266 4910',
      address: 'Thorpe Road, Accra, Ghana'
    },
    {
      id: '4',
      name: 'Accra Mall Limited',
      email: 'management@accramall.com.gh',
      phone: '+233 30 281 3204',
      address: 'Tetteh Quarshie Interchange, Accra, Ghana'
    },
    {
      id: '5',
      name: 'Vodafone Ghana',
      email: 'corporate@vodafone.com.gh',
      phone: '+233 50 200 0000',
      address: 'Airport City, Accra, Ghana'
    }
  ];

  const filteredCustomers = mockCustomers?.filter(customer =>
    customer?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
    customer?.email?.toLowerCase()?.includes(searchQuery?.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Select Customer</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e?.target?.value)}
            icon="Search"
            className="w-full"
          />
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredCustomers?.map((customer) => (
              <div
                key={customer?.id}
                onClick={() => onCustomerSelect(customer)}
                className="p-4 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{customer?.name}</h3>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Icon name="Mail" size={14} />
                        <span>{customer?.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Icon name="Phone" size={14} />
                        <span>{customer?.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Icon name="MapPin" size={14} />
                        <span>{customer?.address}</span>
                      </div>
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
                </div>
              </div>
            ))}

            {filteredCustomers?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
                <p>No customers found</p>
                <p className="text-sm">Try adjusting your search</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-border">
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button>
              <Icon name="Plus" size={16} className="mr-2" />
              Add New Customer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSelector;