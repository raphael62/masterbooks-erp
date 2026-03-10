import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import ProductionKPICards from './components/ProductionKPICards';
import ProductionOrdersTable from './components/ProductionOrdersTable';
import ProductionOrderModal from './components/ProductionOrderModal';
import ProductionAnalytics from './components/ProductionAnalytics';

const ProductionOverviewDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        ?.from('production_orders')
        ?.select('*')
        ?.order('created_at', { ascending: false });
      if (err) throw err;
      setOrders(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching production orders:', err);
      setError(err?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [prodRes, locRes, execRes] = await Promise.all([
        supabase?.from('products')?.select('id, product_code, product_name, unit_of_measure, pack_unit')?.eq('status', 'active')?.order('product_name'),
        supabase?.from('locations')?.select('id, name, code')?.eq('is_active', true)?.order('name'),
        supabase?.from('business_executives')?.select('id, full_name, exec_code')?.eq('status', 'Active')?.order('full_name'),
      ]);
      setProducts(prodRes?.data || []);
      setLocations(locRes?.data || []);
      setExecutives(execRes?.data || []);
    } catch (err) {
      console.error('Error fetching reference data:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchReferenceData();
  }, [fetchOrders, fetchReferenceData]);

  // KPI calculations
  const kpiData = React.useMemo(() => {
    const totalOrders = orders?.length;
    const planned = orders?.filter(o => o?.status === 'Planned')?.length;
    const inProgress = orders?.filter(o => o?.status === 'In Progress')?.length;
    const completed = orders?.filter(o => o?.status === 'Completed')?.length;
    const onHold = orders?.filter(o => o?.status === 'On Hold')?.length;
    const plannedUnits = orders?.reduce((s, o) => s + (parseFloat(o?.planned_qty) || 0), 0);
    const actualUnits = orders?.reduce((s, o) => s + (parseFloat(o?.actual_qty) || 0), 0);
    const achievementPct = plannedUnits > 0 ? (actualUnits / plannedUnits) * 100 : 0;
    const totalCost = orders?.reduce((s, o) => s + (parseFloat(o?.total_cost) || 0), 0);
    const totalMaterialCost = orders?.reduce((s, o) => s + (parseFloat(o?.total_material_cost) || 0), 0);
    const materialUtilization = plannedUnits > 0 ? Math.min(100, (actualUnits / plannedUnits) * 100) : 0;
    const wasteLoss = plannedUnits > 0 ? Math.max(0, ((plannedUnits - actualUnits) / plannedUnits) * 100) : 0;
    return { totalOrders, planned, inProgress, completed, onHold, plannedUnits, actualUnits, achievementPct, totalCost, totalMaterialCost, materialUtilization, wasteLoss };
  }, [orders]);

  const handleNew = () => {
    setEditingOrder(null);
    setModalOpen(true);
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setModalOpen(true);
  };

  const handleSave = async (formData, bomItems) => {
    try {
      if (editingOrder) {
        // Update
        const { error: updateErr } = await supabase
          ?.from('production_orders')
          ?.update({ ...formData, updated_at: new Date()?.toISOString() })
          ?.eq('id', editingOrder?.id);
        if (updateErr) throw updateErr;

        // Delete old BOM items and re-insert
        await supabase?.from('production_order_items')?.delete()?.eq('production_order_id', editingOrder?.id);
        if (bomItems?.length > 0) {
          const { error: bomErr } = await supabase
            ?.from('production_order_items')
            ?.insert(bomItems?.map((item, idx) => ({ ...item, production_order_id: editingOrder?.id, sort_order: idx })));
          if (bomErr) throw bomErr;
        }
      } else {
        // Insert new
        const { data: newOrder, error: insertErr } = await supabase
          ?.from('production_orders')
          ?.insert([formData])
          ?.select()
          ?.single();
        if (insertErr) throw insertErr;

        if (bomItems?.length > 0 && newOrder?.id) {
          const { error: bomErr } = await supabase
            ?.from('production_order_items')
            ?.insert(bomItems?.map((item, idx) => ({ ...item, production_order_id: newOrder?.id, sort_order: idx })));
          if (bomErr) throw bomErr;
        }
      }
      await fetchOrders();
    } catch (err) {
      console.error('Save error:', err);
      throw err;
    }
  };

  const handleDelete = async (ids) => {
    if (!window.confirm(`Delete ${ids?.length} production order(s)?`)) return;
    try {
      await supabase?.from('production_order_items')?.delete()?.in('production_order_id', ids);
      const { error: delErr } = await supabase?.from('production_orders')?.delete()?.in('id', ids);
      if (delErr) throw delErr;
      await fetchOrders();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleExport = () => {
    const headers = ['Order No', 'Product', 'Planned Qty', 'Actual Qty', 'UOM', 'Start Date', 'End Date', 'Status', 'Location', 'Assigned To', 'Total Cost'];
    const rows = orders?.map(o => [
      o?.order_no, o?.product_name, o?.planned_qty, o?.actual_qty, o?.uom,
      o?.start_date, o?.end_date, o?.status, o?.location_name, o?.assigned_to, o?.total_cost
    ]);
    const csv = [headers, ...rows]?.map(r => r?.map(v => `"${v ?? ''}"`)?.join(','))?.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production-orders-${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
    a?.click();
    URL.revokeObjectURL(url);
  };

  const breadcrumbs = [
    { label: 'Production', path: '/production-overview-dashboard' },
    { label: 'Overview', path: '/production-overview-dashboard', active: true }
  ];

  return (
    <AppLayout activeModule="production">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div>
            <BreadcrumbNavigation items={breadcrumbs} />
            <h1 className="text-xl font-bold text-foreground mt-1 flex items-center gap-2">
              <Icon name="Factory" size={22} className="text-primary" />
              Production Overview
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdated?.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchOrders}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-60"
            >
              <Icon name="RefreshCw" size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Icon name="Plus" size={14} />
              New Order
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
              <Icon name="AlertCircle" size={16} />
              <span>{error}</span>
              <button onClick={fetchOrders} className="ml-auto text-xs underline">Retry</button>
            </div>
          )}

          {/* KPI Cards */}
          <ProductionKPICards data={kpiData} isLoading={isLoading} />

          {/* Production Orders Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Icon name="Table" size={15} className="text-primary" />
                Production Orders
                {!isLoading && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-semibold">
                    {orders?.length}
                  </span>
                )}
              </h2>
            </div>
            <ProductionOrdersTable
              orders={orders}
              isLoading={isLoading}
              onNew={handleNew}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onExport={handleExport}
            />
          </div>

          {/* Analytics Section */}
          <ProductionAnalytics orders={orders} isLoading={isLoading} />
        </div>
      </div>

      {/* Modal */}
      <ProductionOrderModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingOrder(null); }}
        order={editingOrder}
        products={products}
        locations={locations}
        executives={executives}
        onSave={handleSave}
      />
    </AppLayout>
  );
};

export default ProductionOverviewDashboard;
