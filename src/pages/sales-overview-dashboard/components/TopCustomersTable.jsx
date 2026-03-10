import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const TopCustomersTable = ({ customers, isLoading, onNewOrder }) => {
  const navigate = useNavigate();
  const data = customers || [];

  return (
    <div className="bg-card border border-border rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-base">Top Customers</h3>
          <p className="text-xs text-muted-foreground mt-0.5">By revenue this month</p>
        </div>
        <button
          onClick={() => navigate('/customer-management')}
          className="text-xs text-primary hover:underline font-medium"
        >
          View All
        </button>
      </div>
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 5 })?.map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
            ))
          : data?.map((customer, idx) => (
              <div key={customer?.id} className="flex items-center gap-3 group">
                <span className="text-xs font-bold text-muted-foreground w-4 flex-shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{customer?.name}</p>
                    <span className="text-xs font-semibold text-foreground ml-2 flex-shrink-0">
                      GHS {customer?.revenue?.toLocaleString('en-GB')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${customer?.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{customer?.percentage}%</span>
                  </div>
                </div>
                <button
                  onClick={() => onNewOrder?.(customer)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-all duration-150 flex-shrink-0"
                  title="New Order"
                >
                  <Icon name="Plus" size={14} />
                </button>
              </div>
            ))}
      </div>
    </div>
  );
};

export default TopCustomersTable;
