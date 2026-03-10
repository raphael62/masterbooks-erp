import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { supabase } from '../../../lib/supabase';

const AdjustmentsTab = ({ onNewAdjustment, selectedLocation }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d?.setMonth(d?.getMonth() - 1);
    return d?.toISOString()?.split('T')?.[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date()?.toISOString()?.split('T')?.[0]);
  const [adjustmentData, setAdjustmentData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAdjustments = async () => {
      setIsLoading(true);
      try {
        let query = supabase?.from('stock_movements')?.select('id, created_at, product_id, quantity, reference_no, location_id, performed_by, notes, status, products(product_code, product_name), locations(name)')?.eq('movement_type', 'adjustment')?.order('created_at', { ascending: false });
        if (dateFrom) query = query?.gte('created_at', dateFrom);
        if (dateTo) query = query?.lte('created_at', dateTo + 'T23:59:59');
        const { data, error } = await query;
        if (!error && data) {
          setAdjustmentData(data?.map((m, idx) => ({
            id: m?.id,
            adjustmentNumber: m?.reference_no || `ADJ-${String(idx + 1)?.padStart(4, '0')}`,
            date: new Date(m?.created_at),
            itemCode: m?.products?.product_code || '',
            description: m?.products?.product_name || '',
            location: m?.locations?.name || '',
            adjustmentQuantity: m?.quantity || 0,
            status: m?.status || 'pending',
            createdBy: m?.performed_by || '',
            notes: m?.notes || ''
          })));
        }
      } catch (err) {
        console.error('Failed to fetch adjustments:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdjustments();
  }, [dateFrom, dateTo]);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const filteredAdjustments = useMemo(() => {
    return adjustmentData?.filter(adjustment => {
      const matchesStatus = statusFilter === 'all' || adjustment?.status === statusFilter;
      const matchesSearch = adjustment?.adjustmentNumber?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                           adjustment?.itemCode?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                           adjustment?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase());
      const matchesLocation = selectedLocation === 'all' || adjustment?.location === selectedLocation;
      
      return matchesStatus && matchesSearch && matchesLocation;
    });
  }, [adjustmentData, statusFilter, searchQuery, selectedLocation]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-warning bg-warning/10';
      case 'approved': return 'text-success bg-success/10';
      case 'rejected': return 'text-error bg-error/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'Clock';
      case 'approved': return 'CheckCircle';
      case 'rejected': return 'XCircle';
      default: return 'AlertCircle';
    }
  };

  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })?.format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header with New Adjustment Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Stock Adjustments</h3>
          <p className="text-sm text-muted-foreground">Manage stock corrections and adjustments</p>
        </div>
        <Button onClick={onNewAdjustment}>
          <Icon name="Plus" size={16} />
          New Adjustment
        </Button>
      </div>
      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            type="date"
            label="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e?.target?.value)}
          />
          <Input
            type="date"
            label="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e?.target?.value)}
          />
          <Select
            label="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <div className="lg:col-span-2">
            <Input
              type="search"
              label="Search"
              placeholder="Adjustment number, item code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e?.target?.value)}
            />
          </div>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Adjustment Records</h3>
          <span className="text-sm text-muted-foreground">{filteredAdjustments?.length} records</span>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader" size={24} className="animate-spin text-primary" />
            </div>
          ) : filteredAdjustments?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Edit" size={32} className="mx-auto mb-2 opacity-50" />
              <p>No adjustments found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Adj. Number</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty Change</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAdjustments?.map(adj => (
                  <tr key={adj?.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{adj?.adjustmentNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(adj?.date)}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-muted-foreground">{adj?.itemCode}</div>
                      <div className="text-sm">{adj?.description}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{adj?.location}</td>
                    <td className={`px-4 py-3 text-right font-medium ${adj?.adjustmentQuantity < 0 ? 'text-error' : 'text-success'}`}>
                      {adj?.adjustmentQuantity > 0 ? '+' : ''}{adj?.adjustmentQuantity}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(adj?.status)}`}>
                        <Icon name={getStatusIcon(adj?.status)} size={10} />
                        {adj?.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{adj?.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdjustmentsTab;