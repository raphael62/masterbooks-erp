import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const POPreviewPanel = ({ poData, isOffline }) => {
  const getStatusConfig = (status) => {
    const configs = {
      draft: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'DRAFT' },
      sent: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'SENT' },
      confirmed: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'CONFIRMED' },
      received: { color: 'text-green-600', bg: 'bg-green-100', label: 'RECEIVED' },
      cancelled: { color: 'text-red-600', bg: 'bg-red-100', label: 'CANCELLED' }
    };
    return configs?.[status] || configs?.draft;
  };

  const statusConfig = getStatusConfig(poData?.status);
  const subtotal = poData?.subtotal || 0;
  const taxAmount = poData?.tax_amount || 0;
  const total = poData?.total_amount || 0;

  const approvalRequired = total > 5000;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">PO Preview</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="flex items-center space-x-1">
              <Icon name="Printer" size={14} />
              <span className="hidden sm:inline text-xs">Print</span>
            </Button>
            <Button variant="outline" size="sm" disabled={isOffline} className="flex items-center space-x-1">
              <Icon name="Download" size={14} />
              <span className="hidden sm:inline text-xs">PDF</span>
            </Button>
            <Button variant="outline" size="sm" disabled={isOffline} className="flex items-center space-x-1">
              <Icon name="Mail" size={14} />
              <span className="hidden sm:inline text-xs">Email</span>
            </Button>
          </div>
        </div>
        {poData?.status && (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig?.color} ${statusConfig?.bg}`}>
            {statusConfig?.label}
          </span>
        )}
      </div>
      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white dark:bg-gray-900 border border-border rounded-xl shadow-sm">
          {/* PO Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">PURCHASE ORDER</h1>
                <div className="mt-2 space-y-0.5 text-sm text-gray-600 dark:text-gray-400">
                  <p>PO #: <span className="font-medium">{poData?.po_number || 'Draft'}</span></p>
                  <p>Date: {poData?.order_date ? new Date(poData?.order_date)?.toLocaleDateString('en-GB') : new Date()?.toLocaleDateString('en-GB')}</p>
                  {poData?.expected_delivery_date && (
                    <p>Expected: {new Date(poData?.expected_delivery_date)?.toLocaleDateString('en-GB')}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <h2 className="font-bold text-gray-900 dark:text-white text-sm">MasterBooks ERP</h2>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                  <p>Accra, Ghana</p>
                  <p>+233 20 123 4567</p>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Supplier</p>
            {poData?.supplier_name ? (
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{poData?.supplier_name}</p>
                {poData?.delivery_address && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{poData?.delivery_address}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No supplier selected</p>
            )}
          </div>

          {/* Line Items */}
          <div className="p-6">
            {poData?.lineItems?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Item</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Unit Cost</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {poData?.lineItems?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2">
                          <p className="font-medium text-gray-900 dark:text-white">{item?.product_name}</p>
                          {item?.product_code && <p className="text-xs text-gray-500">{item?.product_code}</p>}
                        </td>
                        <td className="py-2 text-right text-gray-700 dark:text-gray-300">{item?.quantity}</td>
                        <td className="py-2 text-right text-gray-700 dark:text-gray-300">GHS {parseFloat(item?.unit_cost || 0)?.toFixed(2)}</td>
                        <td className="py-2 text-right font-medium text-gray-900 dark:text-white">GHS {parseFloat(item?.line_total || 0)?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Icon name="Package" size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No items added</p>
              </div>
            )}

            {/* Totals */}
            {poData?.lineItems?.length > 0 && (
              <div className="mt-4 flex justify-end">
                <div className="w-56 space-y-1.5">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Subtotal:</span>
                    <span>GHS {subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Tax:</span>
                    <span>GHS {taxAmount?.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5 flex justify-between font-bold text-gray-900 dark:text-white">
                    <span>Total:</span>
                    <span>GHS {total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {poData?.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Notes</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{poData?.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Approval Workflow */}
        <div className="mt-4 bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center space-x-2">
            <Icon name="GitBranch" size={16} className="text-primary" />
            <span>Approval Workflow</span>
          </h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                poData?.status !== 'draft' ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm text-muted-foreground">PO Created</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                poData?.status === 'sent' || poData?.status === 'confirmed' || poData?.status === 'received' ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm text-muted-foreground">Sent to Supplier</span>
            </div>
            {approvalRequired && (
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  poData?.approved_by ? 'bg-green-500' : 'bg-amber-400'
                }`} />
                <div>
                  <span className="text-sm text-muted-foreground">Manager Approval Required</span>
                  <p className="text-xs text-amber-600">(Amount exceeds GHS 5,000)</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                poData?.status === 'confirmed' || poData?.status === 'received' ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm text-muted-foreground">Confirmed</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                poData?.status === 'received' ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm text-muted-foreground">Goods Received</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POPreviewPanel;
