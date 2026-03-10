import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const TopVendorsTable = ({ vendors, isLoading }) => {
  const navigate = useNavigate();

  const formatGHS = (val) =>
    `GHS ${(val || 0)?.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const displayVendors = vendors || [];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Top Vendors</h3>
          <p className="text-xs text-muted-foreground mt-0.5">By purchase volume this month</p>
        </div>
        <button
          onClick={() => navigate('/vendor-management')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-150"
        >
          <Icon name="Plus" size={12} />
          New PO
        </button>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5]?.map((i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {displayVendors?.map((vendor, idx) => (
            <div key={vendor?.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground w-5 text-right">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground truncate">{vendor?.name}</span>
                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{vendor?.percentage?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${vendor?.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{formatGHS(vendor?.volume)}</span>
                  <span className="text-xs text-muted-foreground">{vendor?.orders} orders</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => navigate('/vendor-management')}
        className="w-full mt-4 py-2 text-xs font-medium text-primary hover:text-primary/80 border border-border rounded-lg hover:bg-accent transition-all duration-150"
      >
        View All Vendors
      </button>
    </div>
  );
};

export default TopVendorsTable;
