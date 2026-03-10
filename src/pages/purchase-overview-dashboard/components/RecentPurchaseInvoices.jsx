import React from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  posted: { label: 'Posted', color: 'bg-emerald-100 text-emerald-700' },
  draft: { label: 'Draft', color: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

const RecentPurchaseInvoices = ({ invoices, isLoading }) => {
  const navigate = useNavigate();

  const formatGHS = (val) =>
    `GHS ${(val || 0)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const displayInvoices = invoices || [];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Recent Purchase Invoices</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Latest supplier invoices</p>
        </div>
        <button
          onClick={() => navigate('/purchase-invoice-management')}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View All
        </button>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6]?.map((i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : displayInvoices?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No invoices found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground pb-2">Invoice #</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-2">Supplier</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">Amount</th>
                <th className="text-center text-xs font-medium text-muted-foreground pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayInvoices?.map((inv) => {
                const statusCfg = STATUS_CONFIG?.[inv?.status] || STATUS_CONFIG?.posted;
                return (
                  <tr
                    key={inv?.id}
                    className="hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => navigate('/purchase-invoice-management')}
                  >
                    <td className="py-2.5">
                      <span className="text-xs font-mono font-medium text-primary">{inv?.invoice_no}</span>
                    </td>
                    <td className="py-2.5">
                      <span className="text-xs text-foreground truncate max-w-[120px] block">{inv?.vendor}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="text-xs font-medium text-foreground">{formatGHS(inv?.amount)}</span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg?.color}`}>
                        {statusCfg?.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentPurchaseInvoices;
