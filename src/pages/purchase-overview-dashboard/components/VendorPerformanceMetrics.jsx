import React from 'react';


const fallbackMetrics = [
  { id: 1, name: 'Accra Beverages Ltd', deliveryRating: 94, paymentCompliance: 98, onTimeDeliveries: 47, totalOrders: 50 },
  { id: 2, name: 'Ghana Supplies Co.', deliveryRating: 87, paymentCompliance: 92, onTimeDeliveries: 39, totalOrders: 45 },
  { id: 3, name: 'West Africa Traders', deliveryRating: 79, paymentCompliance: 85, onTimeDeliveries: 31, totalOrders: 39 },
  { id: 4, name: 'Kumasi Distributors', deliveryRating: 91, paymentCompliance: 96, onTimeDeliveries: 41, totalOrders: 45 },
];

const getRatingColor = (rating) => {
  if (rating >= 90) return 'text-emerald-600';
  if (rating >= 75) return 'text-amber-600';
  return 'text-red-500';
};

const getRatingBg = (rating) => {
  if (rating >= 90) return 'bg-emerald-50';
  if (rating >= 75) return 'bg-amber-50';
  return 'bg-red-50';
};

const VendorPerformanceMetrics = ({ metrics, isLoading }) => {
  const displayMetrics = metrics?.length ? metrics : fallbackMetrics;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Vendor Performance</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Delivery ratings & payment compliance</p>
      </div>
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4]?.map((i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {displayMetrics?.map((vendor) => (
            <div key={vendor?.id} className="border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground truncate">{vendor?.name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getRatingColor(vendor?.deliveryRating)} ${getRatingBg(vendor?.deliveryRating)}`}>
                    {vendor?.deliveryRating}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Delivery Rating</p>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${vendor?.deliveryRating}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Payment Compliance</p>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${vendor?.paymentCompliance}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {vendor?.onTimeDeliveries}/{vendor?.totalOrders} on-time deliveries
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorPerformanceMetrics;
