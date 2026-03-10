import React from 'react';
import { useNavigate } from 'react-router-dom';


const statusConfig = {
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  processing: { label: 'Processing', color: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600', dot: 'bg-red-500' }
};

const RecentSalesOrders = ({ orders, isLoading }) => {
  const navigate = useNavigate();
  const data = orders || [];

  return (
    <div className="bg-card border border-border rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-base">Recent Sales Orders</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Latest transactions</p>
        </div>
        <button
          onClick={() => navigate('/sales-order-management')}
          className="text-xs text-primary hover:underline font-medium"
        >
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-3">Order ID</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-3">Customer</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2 pr-3">Amount</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 6 })?.map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="py-2">
                      <div className="h-8 bg-muted animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              : data?.map((order) => {
                  const status = statusConfig?.[order?.status] || statusConfig?.pending;
                  return (
                    <tr
                      key={order?.id}
                      className="hover:bg-muted/40 cursor-pointer transition-colors duration-100"
                      onClick={() => navigate('/sales-order-management')}
                    >
                      <td className="py-2.5 pr-3">
                        <span className="text-xs font-mono font-medium text-primary">{order?.id}</span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="text-xs text-foreground truncate max-w-[120px] block">{order?.customer}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        <span className="text-xs font-semibold text-foreground">
                          GHS {order?.amount?.toLocaleString('en-GB')}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status?.dot}`} />
                          {status?.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentSalesOrders;
