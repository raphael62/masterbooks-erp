import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';

const CustomerSelector = ({ selectedCustomer, onCustomerSelect, isOffline }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Mock customer data
  useEffect(() => {
    const mockCustomers = [
      {
        id: 'CUST001',
        name: 'Accra Supermarket Ltd',
        code: 'ASL001',
        creditLimit: 50000,
        currentBalance: 35000,
        businessExec: 'Kwame Asante',
        phone: '+233 24 123 4567',
        location: 'Accra Central',
        status: 'active',
        lastOrderDate: '2025-08-28'
      },
      {
        id: 'CUST002',
        name: 'Tema Trading Company',
        code: 'TTC002',
        creditLimit: 75000,
        currentBalance: 12000,
        businessExec: 'Ama Osei',
        phone: '+233 26 987 6543',
        location: 'Tema Industrial Area',
        status: 'active',
        lastOrderDate: '2025-08-30'
      },
      {
        id: 'CUST003',
        name: 'Kumasi Wholesale Hub',
        code: 'KWH003',
        creditLimit: 30000,
        currentBalance: 28500,
        businessExec: 'Kofi Mensah',
        phone: '+233 20 555 7890',
        location: 'Kumasi Central Market',
        status: 'active',
        lastOrderDate: '2025-08-25'
      },
      {
        id: 'CUST004',
        name: 'Cape Coast Distributors',
        code: 'CCD004',
        creditLimit: 40000,
        currentBalance: 5000,
        businessExec: 'Efua Adjei',
        phone: '+233 24 444 1122',
        location: 'Cape Coast',
        status: 'active',
        lastOrderDate: '2025-08-29'
      }
    ];
    setCustomers(mockCustomers);
    setFilteredCustomers(mockCustomers);
  }, []);

  useEffect(() => {
    if (searchQuery?.trim()) {
      const filtered = customers?.filter(customer =>
        customer?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        customer?.code?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        customer?.phone?.includes(searchQuery)
      );
      setFilteredCustomers(filtered);
      setShowDropdown(true);
    } else {
      setFilteredCustomers(customers);
      setShowDropdown(false);
    }
  }, [searchQuery, customers]);

  const getCreditStatus = (customer) => {
    const utilization = (customer?.currentBalance / customer?.creditLimit) * 100;
    if (utilization >= 90) return { status: 'critical', color: 'text-error' };
    if (utilization >= 75) return { status: 'warning', color: 'text-warning' };
    return { status: 'good', color: 'text-success' };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    })?.format(amount);
  };

  const handleCustomerSelect = (customer) => {
    onCustomerSelect(customer);
    setSearchQuery(customer?.name);
    setShowDropdown(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Customer Selection</h3>
        {isOffline && (
          <div className="flex items-center space-x-2 text-warning">
            <Icon name="WifiOff" size={16} />
            <span className="text-xs">Offline Mode</span>
          </div>
        )}
      </div>
      {/* Customer Search */}
      <div className="relative mb-4">
        <Input
          label="Search Customer"
          type="text"
          placeholder="Search by name, code, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e?.target?.value)}
          className="mb-0"
        />
        <div className="absolute right-3 top-9 text-muted-foreground">
          <Icon name="Search" size={16} />
        </div>

        {/* Customer Dropdown */}
        {showDropdown && filteredCustomers?.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-modal z-50 max-h-64 overflow-y-auto">
            {filteredCustomers?.map((customer) => {
              const creditStatus = getCreditStatus(customer);
              return (
                <button
                  key={customer?.id}
                  onClick={() => handleCustomerSelect(customer)}
                  className="w-full p-3 text-left hover:bg-accent transition-colors duration-150 ease-out border-b border-border last:border-b-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{customer?.name}</span>
                    <span className="text-xs text-muted-foreground">{customer?.code}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{customer?.location}</span>
                    <span className={`font-medium ${creditStatus?.color}`}>
                      {formatCurrency(customer?.creditLimit - customer?.currentBalance)} available
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {/* Selected Customer Details */}
      {selectedCustomer && (
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground">{selectedCustomer?.name}</h4>
              <span className="text-sm text-muted-foreground">{selectedCustomer?.code}</span>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business Exec:</span>
                <span className="font-medium">{selectedCustomer?.businessExec}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{selectedCustomer?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">{selectedCustomer?.location}</span>
              </div>
            </div>
          </div>

          {/* Credit Information */}
          <div className="bg-muted rounded-lg p-4">
            <h5 className="font-medium text-foreground mb-3">Credit Information</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credit Limit:</span>
                <span className="font-medium">{formatCurrency(selectedCustomer?.creditLimit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-medium">{formatCurrency(selectedCustomer?.currentBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available Credit:</span>
                <span className={`font-medium ${getCreditStatus(selectedCustomer)?.color}`}>
                  {formatCurrency(selectedCustomer?.creditLimit - selectedCustomer?.currentBalance)}
                </span>
              </div>
            </div>

            {/* Credit Status Warning */}
            {getCreditStatus(selectedCustomer)?.status !== 'good' && (
              <div className={`mt-3 p-2 rounded-md ${getCreditStatus(selectedCustomer)?.status === 'critical' ? 'bg-error/10' : 'bg-warning/10'}`}>
                <div className="flex items-center space-x-2">
                  <Icon 
                    name={getCreditStatus(selectedCustomer)?.status === 'critical' ? 'AlertCircle' : 'AlertTriangle'} 
                    size={16} 
                    className={getCreditStatus(selectedCustomer)?.color} 
                  />
                  <span className={`text-xs font-medium ${getCreditStatus(selectedCustomer)?.color}`}>
                    {getCreditStatus(selectedCustomer)?.status === 'critical' ?'Credit limit nearly exceeded' :'High credit utilization'
                    }
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors duration-150 ease-out">
              <Icon name="User" size={14} />
              <span>View Profile</span>
            </button>
            <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 text-sm bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors duration-150 ease-out">
              <Icon name="FileText" size={14} />
              <span>Order History</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSelector;