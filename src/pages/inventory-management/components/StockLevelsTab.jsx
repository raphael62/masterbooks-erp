import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { supabase } from '../../../lib/supabase';

const StockLevelsTab = ({ onStockAdjustment, onStockTransfer, selectedLocation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('item_code');
  const [sortOrder, setSortOrder] = useState('asc');
  const [stockData, setStockData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStockData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase?.from('products')?.select('id, product_code, product_name, category, unit_of_measure, cost_price, selling_price, reorder_level, status')?.eq('status', 'active')?.order('product_name');
        if (!error && data) {
          const mapped = data?.map(p => ({
            id: p?.id,
            itemCode: p?.product_code,
            description: p?.product_name,
            category: p?.category,
            currentStock: 0,
            reorderLevel: p?.reorder_level || 0,
            unitPrice: p?.selling_price || 0,
            totalValue: 0,
            lastMovement: new Date(),
            stockStatus: 'adequate'
          }));
          setStockData(mapped);
          const uniqueCategories = [...new Set(data?.map(p => p?.category)?.filter(Boolean))];
          setCategories(uniqueCategories?.sort());
        }
      } catch (err) {
        console.error('Failed to fetch stock data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStockData();
  }, []);

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories?.map(c => ({ value: c, label: c }))
  ];

  const stockStatusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'low', label: 'Low Stock' },
    { value: 'adequate', label: 'Adequate' },
    { value: 'overstock', label: 'Overstock' }
  ];

  const sortOptions = [
    { value: 'item_code', label: 'Item Code' },
    { value: 'description', label: 'Description' },
    { value: 'current_stock', label: 'Current Stock' },
    { value: 'last_movement', label: 'Last Movement' }
  ];

  const filteredAndSortedData = useMemo(() => {
    let filtered = stockData?.filter(item => {
      const matchesSearch = item?.itemCode?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                           item?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item?.category === categoryFilter;
      const matchesStatus = stockStatusFilter === 'all' || item?.stockStatus === stockStatusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    filtered?.sort((a, b) => {
      let aValue = a?.[sortBy];
      let bValue = b?.[sortBy];
      
      if (sortBy === 'last_movement') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [stockData, searchQuery, categoryFilter, stockStatusFilter, sortBy, sortOrder]);

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'low': return 'text-error bg-error/10';
      case 'adequate': return 'text-success bg-success/10';
      case 'overstock': return 'text-warning bg-warning/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getStockStatusIcon = (status) => {
    switch (status) {
      case 'low': return 'AlertTriangle';
      case 'adequate': return 'CheckCircle';
      case 'overstock': return 'TrendingUp';
      default: return 'Package';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    })?.format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })?.format(date);
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <Input
              type="search"
              placeholder="Search by item code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e?.target?.value)}
            />
          </div>
          <Select
            label="Category"
            options={categoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
          />
          <Select
            label="Stock Status"
            options={stockStatusOptions}
            value={stockStatusFilter}
            onChange={setStockStatusFilter}
          />
          <Select
            label="Sort By"
            options={sortOptions}
            value={sortBy}
            onChange={setSortBy}
          />
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Stock Levels</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
              <Icon name={sortOrder === 'asc' ? 'SortAsc' : 'SortDesc'} size={14} />
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader" size={24} className="animate-spin text-primary" />
            </div>
          ) : filteredAndSortedData?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Package" size={32} className="mx-auto mb-2 opacity-50" />
              <p>No stock items found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item Code</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Current Stock</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Reorder Level</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Unit Price</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAndSortedData?.map(item => (
                  <tr key={item?.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{item?.itemCode}</td>
                    <td className="px-4 py-3">{item?.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item?.category}</td>
                    <td className="px-4 py-3 text-right font-medium">{item?.currentStock?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{item?.reorderLevel?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(item?.unitPrice)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(item?.stockStatus)}`}>
                        <Icon name={getStockStatusIcon(item?.stockStatus)} size={10} />
                        {item?.stockStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onStockAdjustment?.(item)}
                          className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          title="Adjust Stock"
                        >
                          <Icon name="Edit" size={14} />
                        </button>
                        <button
                          onClick={() => onStockTransfer?.(item)}
                          className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          title="Transfer Stock"
                        >
                          <Icon name="ArrowRightLeft" size={14} />
                        </button>
                      </div>
                    </td>
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

export default StockLevelsTab;