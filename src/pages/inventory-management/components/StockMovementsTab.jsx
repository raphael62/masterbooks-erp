import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { supabase } from '../../../lib/supabase';

const StockMovementsTab = ({ selectedLocation }) => {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d?.setMonth(d?.getMonth() - 1);
    return d?.toISOString()?.split('T')?.[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date()?.toISOString()?.split('T')?.[0]);
  const [movementTypeFilter, setMovementTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [movementData, setMovementData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMovements = async () => {
      setIsLoading(true);
      try {
        let query = supabase?.from('stock_movements')?.select('id, created_at, product_id, movement_type, quantity, reference_no, location_id, performed_by, notes, products(product_code, product_name), locations(name)')?.order('created_at', { ascending: false })?.limit(100);
        if (dateFrom) query = query?.gte('created_at', dateFrom);
        if (dateTo) query = query?.lte('created_at', dateTo + 'T23:59:59');
        const { data, error } = await query;
        if (!error && data) {
          setMovementData(data?.map(m => ({
            id: m?.id,
            date: new Date(m?.created_at),
            itemCode: m?.products?.product_code || '',
            description: m?.products?.product_name || '',
            movementType: m?.movement_type || 'other',
            quantity: m?.quantity || 0,
            unitPrice: 0,
            totalValue: 0,
            reference: m?.reference_no || '',
            location: m?.locations?.name || '',
            performedBy: m?.performed_by || '',
            notes: m?.notes || ''
          })));
        }
      } catch (err) {
        console.error('Failed to fetch stock movements:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMovements();
  }, [dateFrom, dateTo]);

  const movementTypeOptions = [
    { value: 'all', label: 'All Movements' },
    { value: 'sale', label: 'Sales' },
    { value: 'receipt', label: 'Receipts' },
    { value: 'transfer', label: 'Transfers' },
    { value: 'adjustment', label: 'Adjustments' },
    { value: 'return', label: 'Returns' }
  ];

  const filteredMovements = useMemo(() => {
    return movementData?.filter(movement => {
      const matchesType = movementTypeFilter === 'all' || movement?.movementType === movementTypeFilter;
      const matchesSearch = movement?.itemCode?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                           movement?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                           movement?.reference?.toLowerCase()?.includes(searchQuery?.toLowerCase());
      const matchesLocation = selectedLocation === 'all' || movement?.location === selectedLocation;
      
      return matchesType && matchesSearch && matchesLocation;
    });
  }, [movementData, movementTypeFilter, searchQuery, selectedLocation]);

  const getMovementTypeColor = (type) => {
    switch (type) {
      case 'sale': return 'text-error bg-error/10';
      case 'receipt': return 'text-success bg-success/10';
      case 'transfer': return 'text-primary bg-primary/10';
      case 'adjustment': return 'text-warning bg-warning/10';
      case 'return': return 'text-secondary bg-secondary/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getMovementTypeIcon = (type) => {
    switch (type) {
      case 'sale': return 'TrendingDown';
      case 'receipt': return 'TrendingUp';
      case 'transfer': return 'ArrowRightLeft';
      case 'adjustment': return 'Edit';
      case 'return': return 'RotateCcw';
      default: return 'Package';
    }
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })?.format(date);
  };

  return (
    <div className="space-y-6">
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
            label="Movement Type"
            options={movementTypeOptions}
            value={movementTypeFilter}
            onChange={setMovementTypeFilter}
          />
          
          <Input
            type="search"
            label="Search"
            placeholder="Item code, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e?.target?.value)}
          />
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Stock Movements</h3>
          <span className="text-sm text-muted-foreground">{filteredMovements?.length} records</span>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader" size={24} className="animate-spin text-primary" />
            </div>
          ) : filteredMovements?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="ArrowRightLeft" size={32} className="mx-auto mb-2 opacity-50" />
              <p>No stock movements found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date/Time</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item Code</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Quantity</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reference</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMovements?.map(movement => (
                  <tr key={movement?.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(movement?.date)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{movement?.itemCode}</td>
                    <td className="px-4 py-3">{movement?.description}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getMovementTypeColor(movement?.movementType)}`}>
                        <Icon name={getMovementTypeIcon(movement?.movementType)} size={10} />
                        {movement?.movementType}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${movement?.quantity < 0 ? 'text-error' : 'text-success'}`}>
                      {movement?.quantity > 0 ? '+' : ''}{movement?.quantity}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{movement?.reference}</td>
                    <td className="px-4 py-3 text-muted-foreground">{movement?.location}</td>
                    <td className="px-4 py-3 text-muted-foreground">{movement?.performedBy}</td>
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

export default StockMovementsTab;