import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';

const POSearchSidebar = ({ onPOSelect, onCreateNew, selectedPO }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'received', label: 'Received' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchPurchaseOrders();
  }, [statusFilter]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      let query = supabase?.from('purchase_orders')?.select('*')?.order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query?.eq('status', statusFilter);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setPurchaseOrders(data || []);
    } catch (err) {
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
      sent: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300',
      confirmed: 'text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300',
      received: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
      cancelled: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
    };
    return colors?.[status] || 'text-gray-600 bg-gray-100';
  };

  const filteredPOs = purchaseOrders?.filter(po => {
    const matchesSearch =
      po?.po_number?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      po?.supplier_name?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    return matchesSearch;
  });

  const totalAmount = purchaseOrders?.reduce((sum, po) => sum + (po?.total_amount || 0), 0);
  const pendingCount = purchaseOrders?.filter(po => po?.status === 'sent' || po?.status === 'confirmed')?.length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Purchase Orders</h2>
          <Button onClick={onCreateNew} size="sm" className="flex items-center space-x-1">
            <Icon name="Plus" size={16} />
            <span className="hidden sm:inline">New PO</span>
          </Button>
        </div>
        <div className="space-y-2">
          <Input
            placeholder="Search POs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e?.target?.value)}
            className="w-full"
          />
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={statusOptions}
          />
        </div>
      </div>

      {/* PO List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500 text-sm">
            <Icon name="AlertCircle" size={20} className="mx-auto mb-2" />
            <p>{error}</p>
            <button onClick={fetchPurchaseOrders} className="mt-2 text-primary underline text-xs">Retry</button>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredPOs?.map((po) => (
              <div
                key={po?.id}
                onClick={() => onPOSelect(po)}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-150 hover:bg-accent ${
                  selectedPO?.id === po?.id ? 'border-primary bg-accent' : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-foreground text-sm truncate">{po?.po_number}</h3>
                    <p className="text-xs text-muted-foreground truncate">{po?.supplier_name || 'No supplier'}</p>
                  </div>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(po?.status)}`}>
                    {po?.status?.charAt(0)?.toUpperCase() + po?.status?.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="font-medium text-foreground">
                    GHS {(po?.total_amount || 0)?.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-muted-foreground">
                    {po?.order_date ? new Date(po?.order_date)?.toLocaleDateString('en-GB') : '-'}
                  </span>
                </div>
              </div>
            ))}
            {filteredPOs?.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Icon name="ShoppingCart" size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No purchase orders found</p>
                <button onClick={onCreateNew} className="mt-2 text-primary text-xs underline">Create first PO</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="font-semibold text-foreground text-sm">
              GHS {totalAmount?.toLocaleString('en-GH', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="font-semibold text-amber-600 text-sm">{pendingCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSearchSidebar;
