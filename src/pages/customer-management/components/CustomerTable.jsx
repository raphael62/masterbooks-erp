import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CustomerTable = ({ customers, onCustomerSelect, selectedCustomer, onEditCustomer, onDeleteCustomer }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig?.key === key && sortConfig?.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCustomers = React.useMemo(() => {
    let sortableCustomers = [...customers];
    if (sortConfig?.key) {
      sortableCustomers?.sort((a, b) => {
        if (a?.[sortConfig?.key] < b?.[sortConfig?.key]) {
          return sortConfig?.direction === 'asc' ? -1 : 1;
        }
        if (a?.[sortConfig?.key] > b?.[sortConfig?.key]) {
          return sortConfig?.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableCustomers;
  }, [customers, sortConfig]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-success bg-success/10';
      case 'Inactive': return 'text-muted-foreground bg-muted';
      case 'Suspended': return 'text-error bg-error/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getCreditStatusColor = (outstanding, creditLimit) => {
    const utilization = (outstanding / creditLimit) * 100;
    if (utilization >= 90) return 'text-error';
    if (utilization >= 75) return 'text-warning';
    return 'text-success';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    })?.format(amount);
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 hover:text-foreground transition-colors"
                >
                  <span>Customer Name</span>
                  <Icon name="ArrowUpDown" size={14} />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">
                <button
                  onClick={() => handleSort('businessType')}
                  className="flex items-center space-x-1 hover:text-foreground transition-colors"
                >
                  <span>Business Type</span>
                  <Icon name="ArrowUpDown" size={14} />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">
                <button
                  onClick={() => handleSort('creditLimit')}
                  className="flex items-center space-x-1 hover:text-foreground transition-colors"
                >
                  <span>Credit Limit</span>
                  <Icon name="ArrowUpDown" size={14} />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">
                <button
                  onClick={() => handleSort('outstandingBalance')}
                  className="flex items-center space-x-1 hover:text-foreground transition-colors"
                >
                  <span>Outstanding</span>
                  <Icon name="ArrowUpDown" size={14} />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">
                <button
                  onClick={() => handleSort('assignedExecutive')}
                  className="flex items-center space-x-1 hover:text-foreground transition-colors"
                >
                  <span>Assigned Executive</span>
                  <Icon name="ArrowUpDown" size={14} />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Status</th>
              <th className="text-right p-4 font-medium text-sm text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCustomers?.map((customer) => (
              <tr
                key={customer?.id}
                onClick={() => onCustomerSelect(customer)}
                className={`
                  border-b border-border hover:bg-accent/50 cursor-pointer transition-colors
                  ${selectedCustomer?.id === customer?.id ? 'bg-accent' : ''}
                `}
              >
                <td className="p-4">
                  <div>
                    <div className="font-medium text-foreground">{customer?.name}</div>
                    <div className="text-sm text-muted-foreground">{customer?.email}</div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm text-foreground">{customer?.businessType}</span>
                </td>
                <td className="p-4">
                  <span className="text-sm font-mono text-foreground">
                    {formatCurrency(customer?.creditLimit)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-mono ${getCreditStatusColor(customer?.outstandingBalance, customer?.creditLimit)}`}>
                      {formatCurrency(customer?.outstandingBalance)}
                    </span>
                    {customer?.outstandingBalance > customer?.creditLimit * 0.9 && (
                      <Icon name="AlertTriangle" size={14} className="text-warning" />
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm text-foreground">{customer?.assignedExecutive}</span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer?.status)}`}>
                    {customer?.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Edit"
                      onClick={(e) => {
                        e?.stopPropagation();
                        onEditCustomer(customer);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Trash2"
                      onClick={(e) => {
                        e?.stopPropagation();
                        onDeleteCustomer(customer);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4 p-4">
        {sortedCustomers?.map((customer) => (
          <div
            key={customer?.id}
            onClick={() => onCustomerSelect(customer)}
            className={`
              p-4 rounded-lg border border-border cursor-pointer transition-all
              ${selectedCustomer?.id === customer?.id ? 'bg-accent border-primary' : 'bg-card hover:bg-accent/50'}
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{customer?.name}</h3>
                <p className="text-sm text-muted-foreground">{customer?.email}</p>
                <p className="text-sm text-muted-foreground">{customer?.businessType}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer?.status)}`}>
                {customer?.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Credit Limit</p>
                <p className="text-sm font-mono text-foreground">{formatCurrency(customer?.creditLimit)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <div className="flex items-center space-x-1">
                  <p className={`text-sm font-mono ${getCreditStatusColor(customer?.outstandingBalance, customer?.creditLimit)}`}>
                    {formatCurrency(customer?.outstandingBalance)}
                  </p>
                  {customer?.outstandingBalance > customer?.creditLimit * 0.9 && (
                    <Icon name="AlertTriangle" size={12} className="text-warning" />
                  )}
                </div>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-xs text-muted-foreground">Assigned Executive</p>
              <p className="text-sm text-foreground">{customer?.assignedExecutive}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Phone"
                  onClick={(e) => {
                    e?.stopPropagation();
                    window.open(`tel:${customer?.phone}`, '_self');
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="MessageSquare"
                  onClick={(e) => {
                    e?.stopPropagation();
                    window.open(`sms:${customer?.phone}`, '_self');
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Edit"
                  onClick={(e) => {
                    e?.stopPropagation();
                    onEditCustomer(customer);
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Trash2"
                  onClick={(e) => {
                    e?.stopPropagation();
                    onDeleteCustomer(customer);
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      {customers?.length === 0 && (
        <div className="p-8 text-center">
          <Icon name="Users" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No customers found</h3>
          <p className="text-muted-foreground">Add your first customer to get started</p>
        </div>
      )}
    </div>
  );
};

export default CustomerTable;