import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EmptiesTrackingWidget = ({ selectedLocation }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Mock empties data
  const emptiesData = {
    totalBottles: 2450,
    totalDeposits: 3675.00, // GHS 1.50 per bottle
    pendingReturns: 180,
    reconciliationStatus: 'pending',
    lastReconciliation: new Date('2025-08-30T16:00:00'),
    byLocation: {
      'main-warehouse': {
        bottles: 1200,
        deposits: 1800.00,
        pending: 50
      },
      'retail-store': {
        bottles: 850,
        deposits: 1275.00,
        pending: 80
      },
      'distribution-center': {
        bottles: 400,
        deposits: 600.00,
        pending: 50
      }
    },
    recentMovements: [
      {
        id: 1,
        date: new Date('2025-09-01T09:30:00'),
        type: 'return',
        quantity: 24,
        customer: 'Accra Supermarket',
        location: 'retail-store'
      },
      {
        id: 2,
        date: new Date('2025-08-31T14:15:00'),
        type: 'collection',
        quantity: -48,
        customer: 'Supplier Collection',
        location: 'main-warehouse'
      },
      {
        id: 3,
        date: new Date('2025-08-31T11:20:00'),
        type: 'return',
        quantity: 12,
        customer: 'Tema Trading Co.',
        location: 'distribution-center'
      }
    ]
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    })?.format(amount);
  };

  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })?.format(date);
  };

  const getLocationData = () => {
    if (selectedLocation === 'all') {
      return {
        bottles: emptiesData?.totalBottles,
        deposits: emptiesData?.totalDeposits,
        pending: emptiesData?.pendingReturns
      };
    }
    return emptiesData?.byLocation?.[selectedLocation] || {
      bottles: 0,
      deposits: 0,
      pending: 0
    };
  };

  const locationData = getLocationData();

  const getReconciliationStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success bg-success/10';
      case 'pending': return 'text-warning bg-warning/10';
      case 'overdue': return 'text-error bg-error/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getMovementTypeColor = (type) => {
    switch (type) {
      case 'return': return 'text-success';
      case 'collection': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getMovementTypeIcon = (type) => {
    switch (type) {
      case 'return': return 'RotateCcw';
      case 'collection': return 'Truck';
      default: return 'Package';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon name="Recycle" size={20} className="text-secondary" />
          <h3 className="font-semibold text-foreground">Empties Tracking</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          <Icon name={showDetails ? "ChevronUp" : "ChevronDown"} size={16} />
        </Button>
      </div>
      {/* Summary Stats */}
      <div className="space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Bottles</span>
          <span className="font-semibold text-foreground">
            {locationData?.bottles?.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Deposit Value</span>
          <span className="font-mono font-semibold text-foreground">
            {formatCurrency(locationData?.deposits)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Pending Returns</span>
          <span className="font-semibold text-warning">
            {locationData?.pending?.toLocaleString()}
          </span>
        </div>
      </div>
      {/* Reconciliation Status */}
      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Reconciliation</span>
          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getReconciliationStatusColor(emptiesData?.reconciliationStatus)}`}>
            <Icon name="Clock" size={12} />
            <span className="capitalize">{emptiesData?.reconciliationStatus}</span>
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Last: {formatDateTime(emptiesData?.lastReconciliation)}
        </div>
      </div>
      {/* Recent Movements - Expandable */}
      {showDetails && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground">Recent Movements</div>
          <div className="space-y-2">
            {emptiesData?.recentMovements?.map((movement) => (
              <div key={movement?.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div className="flex items-center space-x-2">
                  <Icon 
                    name={getMovementTypeIcon(movement?.type)} 
                    size={14} 
                    className={getMovementTypeColor(movement?.type)} 
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {movement?.customer}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(movement?.date)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${getMovementTypeColor(movement?.type)}`}>
                    {movement?.quantity > 0 ? '+' : ''}{movement?.quantity}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {movement?.location?.replace('-', ' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-border space-y-2">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={() => console.log('Record bottle return')}
        >
          <Icon name="RotateCcw" size={14} />
          Record Return
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={() => console.log('Start reconciliation')}
        >
          <Icon name="CheckSquare" size={14} />
          Reconcile Empties
        </Button>
      </div>
      {/* Last Updated */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Icon name="Clock" size={12} />
          <span>Updated: {new Date()?.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</span>
        </div>
      </div>
    </div>
  );
};

export default EmptiesTrackingWidget;