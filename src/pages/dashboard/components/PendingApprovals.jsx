import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PendingApprovals = () => {
  const [approvals, setApprovals] = useState([
    {
      id: 1,
      type: 'credit_limit',
      title: 'Credit Limit Increase',
      description: 'Accra Supermarket requesting increase from GHS 50,000 to GHS 75,000',
      requestedBy: 'Kwame Asante',
      amount: 'GHS 25,000.00',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      priority: 'high',
      icon: 'CreditCard',
      color: 'text-warning'
    },
    {
      id: 2,
      type: 'discount',
      title: 'Special Discount Approval',
      description: 'SO-2025-0089 - 15% discount on bulk order (500+ units)',
      requestedBy: 'Ama Osei',
      amount: 'GHS 1,200.00',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      priority: 'medium',
      icon: 'Percent',
      color: 'text-primary'
    },
    {
      id: 3,
      type: 'return',
      title: 'Product Return Authorization',
      description: 'Tema Trading Co. - 50 units Coca-Cola 500ml (damaged packaging)',
      requestedBy: 'Kofi Mensah',
      amount: 'GHS 750.00',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      priority: 'low',
      icon: 'RotateCcw',
      color: 'text-error'
    },
    {
      id: 4,
      type: 'payment_terms',
      title: 'Payment Terms Extension',
      description: 'Kumasi Market requesting 60-day payment terms instead of 30-day',
      requestedBy: 'Akosua Frimpong',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      priority: 'medium',
      icon: 'Calendar',
      color: 'text-secondary'
    }
  ]);

  const handleApproval = (approvalId, action) => {
    setApprovals(prev => prev?.filter(approval => approval?.id !== approvalId));
    console.log(`${action} approval:`, approvalId);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-error/10 text-error border-error/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatTimestamp = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date?.toLocaleDateString('en-GB');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Pending Approvals</h3>
          <p className="text-sm text-muted-foreground">
            {approvals?.length} items requiring your attention
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 px-2 py-1 bg-warning/10 rounded-full">
            <Icon name="Clock" size={14} className="text-warning" />
            <span className="text-xs font-medium text-warning">
              {approvals?.filter(a => a?.priority === 'high')?.length} urgent
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            iconName="ExternalLink"
            iconPosition="right"
            onClick={() => console.log('Navigate to approvals page')}
          >
            View All
          </Button>
        </div>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {approvals?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="CheckCircle" size={32} className="text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All caught up! No pending approvals.</p>
          </div>
        ) : (
          approvals?.map((approval) => (
            <div
              key={approval?.id}
              className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow duration-150 ease-out"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Icon 
                      name={approval?.icon} 
                      size={16} 
                      className={approval?.color}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-foreground">
                        {approval?.title}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(approval?.priority)}`}>
                        {approval?.priority}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {approval?.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Requested by {approval?.requestedBy}</span>
                      <span>{formatTimestamp(approval?.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {approval?.amount && (
                <div className="mb-3 px-3 py-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="text-sm font-medium text-foreground">
                      {approval?.amount}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Button
                  variant="default"
                  size="sm"
                  iconName="Check"
                  iconPosition="left"
                  onClick={() => handleApproval(approval?.id, 'approve')}
                  className="flex-1"
                >
                  Approve
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  iconName="X"
                  iconPosition="left"
                  onClick={() => handleApproval(approval?.id, 'reject')}
                  className="flex-1"
                >
                  Reject
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Eye"
                  onClick={() => console.log('View approval details:', approval)}
                >
                  Details
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      {approvals?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {approvals?.filter(a => a?.priority === 'high')?.length} high priority, {' '}
              {approvals?.filter(a => a?.priority === 'medium')?.length} medium priority
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => console.log('Bulk approve/reject')}
            >
              Bulk Actions
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;