import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CustomerSummaryPanel = ({ customer, onNewSale, onPayment, onCreditAdjustment }) => {
  if (!customer) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="text-center">
          <Icon name="Users" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Select a Customer</h3>
          <p className="text-muted-foreground">Choose a customer from the table to view details and recent activity</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    })?.format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })?.format(new Date(date));
  };

  const getCreditUtilization = () => {
    return (customer?.outstandingBalance / customer?.creditLimit) * 100;
  };

  const getCreditStatusColor = () => {
    const utilization = getCreditUtilization();
    if (utilization >= 90) return 'text-error';
    if (utilization >= 75) return 'text-warning';
    return 'text-success';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-success bg-success/10';
      case 'Inactive': return 'text-muted-foreground bg-muted';
      case 'Suspended': return 'text-error bg-error/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{customer?.name}</h2>
            <p className="text-muted-foreground">{customer?.businessType}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(customer?.status)}`}>
            {customer?.status}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm">
            <Icon name="Mail" size={16} className="text-muted-foreground" />
            <span className="text-foreground">{customer?.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Icon name="Phone" size={16} className="text-muted-foreground" />
            <span className="text-foreground">{customer?.phone}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Icon name="MapPin" size={16} className="text-muted-foreground" />
            <span className="text-foreground">{customer?.address}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Icon name="User" size={16} className="text-muted-foreground" />
            <span className="text-foreground">Assigned to: {customer?.assignedExecutive}</span>
          </div>
        </div>
      </div>
      {/* Key Metrics */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Key Metrics</h3>
        
        <div className="space-y-4">
          {/* Credit Information */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Credit Limit</span>
              <span className="text-sm font-mono text-foreground">{formatCurrency(customer?.creditLimit)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Outstanding Balance</span>
              <span className={`text-sm font-mono ${getCreditStatusColor()}`}>
                {formatCurrency(customer?.outstandingBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Available Credit</span>
              <span className="text-sm font-mono text-foreground">
                {formatCurrency(customer?.creditLimit - customer?.outstandingBalance)}
              </span>
            </div>
            
            {/* Credit Utilization Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Credit Utilization</span>
                <span className={`text-xs font-medium ${getCreditStatusColor()}`}>
                  {getCreditUtilization()?.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    getCreditUtilization() >= 90 ? 'bg-error' :
                    getCreditUtilization() >= 75 ? 'bg-warning' : 'bg-success'
                  }`}
                  style={{ width: `${Math.min(getCreditUtilization(), 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Other Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{customer?.totalOrders}</div>
              <div className="text-xs text-muted-foreground">Total Orders</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{customer?.daysSinceLastOrder}</div>
              <div className="text-xs text-muted-foreground">Days Since Last Order</div>
            </div>
          </div>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Quick Actions</h3>
        
        <div className="space-y-3">
          <Button
            variant="default"
            fullWidth
            iconName="ShoppingCart"
            iconPosition="left"
            onClick={() => onNewSale(customer)}
          >
            Create New Sale
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            iconName="CreditCard"
            iconPosition="left"
            onClick={() => onPayment(customer)}
          >
            Record Payment
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            iconName="DollarSign"
            iconPosition="left"
            onClick={() => onCreditAdjustment(customer)}
          >
            Credit Adjustment
          </Button>
          
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              iconName="Phone"
              onClick={() => window.open(`tel:${customer?.phone}`, '_self')}
            >
              Call
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconName="MessageSquare"
              onClick={() => window.open(`sms:${customer?.phone}`, '_self')}
            >
              SMS
            </Button>
          </div>
        </div>
      </div>
      {/* Recent Transactions */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Recent Transactions</h3>
        
        <div className="space-y-3">
          {customer?.recentTransactions?.map((transaction) => (
            <div key={transaction?.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  transaction?.type === 'sale' ? 'bg-primary' :
                  transaction?.type === 'payment' ? 'bg-success' : 'bg-warning'
                }`} />
                <div>
                  <div className="text-sm font-medium text-foreground">{transaction?.description}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(transaction?.date)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-mono ${
                  transaction?.type === 'payment' ? 'text-success' : 'text-foreground'
                }`}>
                  {transaction?.type === 'payment' ? '+' : ''}{formatCurrency(transaction?.amount)}
                </div>
              </div>
            </div>
          ))}
          
          {customer?.recentTransactions?.length === 0 && (
            <div className="text-center py-4">
              <Icon name="FileText" size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent transactions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerSummaryPanel;