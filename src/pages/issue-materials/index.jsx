import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import IssueMaterialsKPICards from './components/IssueMaterialsKPICards';
import IssueMaterialsSpreadsheet from './components/IssueMaterialsSpreadsheet';
import IssueMaterialsModal from './components/IssueMaterialsModal';

const IssueMaterials = () => {
  const [issues, setIssues] = useState([]);
  const [productionOrders, setProductionOrders] = useState([]);
  const [locations, setLocations] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);

  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        ?.from('material_issues')
        ?.select('*')
        ?.order('created_at', { ascending: false });
      if (err) throw err;
      setIssues(data || []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Error fetching issues:', e);
      setError(e?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProductionOrders = useCallback(async () => {
    try {
      const { data } = await supabase
        ?.from('production_orders')
        ?.select('id, order_no, product_id, product_name, product_code, status')
        ?.in('status', ['Planned', 'In Progress'])
        ?.order('order_no');
      setProductionOrders(data || []);
    } catch (e) { console.error(e); }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const { data } = await supabase
        ?.from('locations')
        ?.select('id, name, code')
        ?.eq('is_active', true)
        ?.order('name');
      setLocations(data || []);
    } catch (e) { console.error(e); }
  }, []);

  const fetchExecutives = useCallback(async () => {
    try {
      const { data } = await supabase
        ?.from('business_executives')
        ?.select('id, full_name, exec_code')
        ?.eq('status', 'Active')
        ?.order('full_name');
      setExecutives(data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchIssues();
    fetchProductionOrders();
    fetchLocations();
    fetchExecutives();
  }, [fetchIssues, fetchProductionOrders, fetchLocations, fetchExecutives]);

  const kpis = useMemo(() => {
    const today = new Date()?.toISOString()?.split('T')?.[0];
    const thisMonth = today?.substring(0, 7);
    const totalToday = issues?.filter(i => i?.issue_date === today)?.length || 0;
    const totalQtyIssued = issues
      ?.filter(i => i?.issue_date === today && i?.status === 'Confirmed')
      ?.reduce((s, i) => s + (parseInt(i?.total_items_issued) || 0), 0);
    const totalThisMonth = issues?.filter(i => i?.issue_date?.startsWith(thisMonth))?.length || 0;
    const pendingConfirmations = issues?.filter(i => i?.status === 'Draft')?.length || 0;
    return { totalToday, totalQtyIssued, totalThisMonth, pendingConfirmations };
  }, [issues]);

  const handleNew = () => {
    setEditingIssue(null);
    setModalOpen(true);
  };

  const handleEdit = (issue) => {
    setEditingIssue(issue);
    setModalOpen(true);
  };

  const handleSave = async (formData, lineItems) => {
    try {
      if (editingIssue?.id) {
        const { error: upErr } = await supabase
          ?.from('material_issues')
          ?.update({ ...formData, updated_at: new Date()?.toISOString() })
          ?.eq('id', editingIssue?.id);
        if (upErr) throw upErr;
        await supabase?.from('material_issue_items')?.delete()?.eq('material_issue_id', editingIssue?.id);
        if (lineItems?.length > 0) {
          const { error: itemErr } = await supabase?.from('material_issue_items')?.insert(
            lineItems?.map((item, i) => ({ ...item, material_issue_id: editingIssue?.id, sort_order: i }))
          );
          if (itemErr) throw itemErr;
        }
      } else {
        const { data: newIssue, error: insErr } = await supabase
          ?.from('material_issues')
          ?.insert([formData])
          ?.select()
          ?.single();
        if (insErr) throw insErr;
        if (lineItems?.length > 0 && newIssue?.id) {
          const { error: itemErr } = await supabase?.from('material_issue_items')?.insert(
            lineItems?.map((item, i) => ({ ...item, material_issue_id: newIssue?.id, sort_order: i }))
          );
          if (itemErr) throw itemErr;
        }
      }
      await fetchIssues();
    } catch (e) {
      console.error('Save error:', e);
      throw e;
    }
  };

  const handleConfirmIssue = async (formData, lineItems) => {
    try {
      let issueId = editingIssue?.id;

      // Save or update the issue first
      if (issueId) {
        const { error: upErr } = await supabase
          ?.from('material_issues')
          ?.update({
            ...formData,
            status: 'Confirmed',
            confirmed_at: new Date()?.toISOString(),
            confirmed_by: formData?.issued_by || 'System',
            updated_at: new Date()?.toISOString()
          })
          ?.eq('id', issueId);
        if (upErr) throw upErr;
        await supabase?.from('material_issue_items')?.delete()?.eq('material_issue_id', issueId);
      } else {
        const { data: newIssue, error: insErr } = await supabase
          ?.from('material_issues')
          ?.insert([{
            ...formData,
            status: 'Confirmed',
            confirmed_at: new Date()?.toISOString(),
            confirmed_by: formData?.issued_by || 'System'
          }])
          ?.select()
          ?.single();
        if (insErr) throw insErr;
        issueId = newIssue?.id;
      }

      // Insert line items
      if (lineItems?.length > 0 && issueId) {
        const { error: itemErr } = await supabase?.from('material_issue_items')?.insert(
          lineItems?.map((item, i) => ({ ...item, material_issue_id: issueId, sort_order: i }))
        );
        if (itemErr) throw itemErr;
      }

      // Deduct stock for each ingredient
      for (const item of lineItems) {
        const qty = parseFloat(item?.qty_to_issue) || 0;
        if (qty <= 0) continue;

        // Find product by ingredient code
        let productId = null;
        if (item?.ingredient_code) {
          const { data: prod } = await supabase?.from('products')
            ?.select('id')
            ?.eq('product_code', item?.ingredient_code)
            ?.single();
          productId = prod?.id;
        }

        // Insert stock movement (negative quantity = outgoing)
        await supabase?.from('stock_movements')?.insert([{
          movement_date: formData?.issue_date,
          product_id: productId,
          product_code: item?.ingredient_code,
          product_name: item?.ingredient_name,
          location: formData?.from_location_name,
          transaction_type: 'issue',
          quantity: -Math.abs(qty),
          unit_cost: parseFloat(item?.unit_cost) || 0,
          reference_no: formData?.issue_no,
          reason: `Production Issue: ${formData?.production_order_no || ''}`,
          created_by: formData?.issued_by || 'System'
        }]);

        // Update stock_levels_by_location
        if (productId && formData?.from_location_id) {
          const { data: existing } = await supabase?.from('stock_levels_by_location')
            ?.select('id, stock_on_hand')
            ?.eq('product_id', productId)
            ?.eq('location_id', formData?.from_location_id)
            ?.single();

          if (existing?.id) {
            const newQty = Math.max(0, (parseFloat(existing?.stock_on_hand) || 0) - qty);
            await supabase?.from('stock_levels_by_location')
              ?.update({ stock_on_hand: newQty, last_movement_date: new Date()?.toISOString(), updated_at: new Date()?.toISOString() })
              ?.eq('id', existing?.id);
          }
        }
      }

      // Create audit log entry
      await supabase?.from('audit_logs')?.insert([{
        action: 'INSERT',
        table_name: 'material_issues',
        record_id: issueId,
        new_data: {
          issue_no: formData?.issue_no,
          production_order_no: formData?.production_order_no,
          product_being_produced: formData?.product_being_produced,
          from_location: formData?.from_location_name,
          issued_by: formData?.issued_by,
          total_items: lineItems?.length,
          total_cost: formData?.total_cost,
          status: 'Confirmed',
          confirmed_at: new Date()?.toISOString()
        },
        changed_fields: { status: { from: 'Draft', to: 'Confirmed' } }
      }]);

      await fetchIssues();
    } catch (e) {
      console.error('Confirm error:', e);
      throw e;
    }
  };

  const handleConfirmFromSpreadsheet = async (issue) => {
    setEditingIssue(issue);
    setModalOpen(true);
  };

  const handleCancelIssue = async (issue) => {
    if (!window.confirm(`Cancel issue ${issue?.issue_no}?`)) return;
    try {
      const { error: err } = await supabase
        ?.from('material_issues')
        ?.update({ status: 'Cancelled', updated_at: new Date()?.toISOString() })
        ?.eq('id', issue?.id);
      if (err) throw err;
      await fetchIssues();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (ids) => {
    if (!window.confirm(`Delete ${ids?.length} issue(s)? This cannot be undone.`)) return;
    try {
      await supabase?.from('material_issue_items')?.delete()?.in('material_issue_id', ids);
      const { error: err } = await supabase?.from('material_issues')?.delete()?.in('id', ids);
      if (err) throw err;
      await fetchIssues();
    } catch (e) { console.error(e); }
  };

  const handleExport = () => {
    const headers = ['Issue No', 'Production Order No', 'Product Being Produced', 'Issue Date', 'Location', 'Issued By', 'Total Items', 'Total Cost', 'Status'];
    const rows = issues?.map(r => [
      r?.issue_no, r?.production_order_no, r?.product_being_produced, r?.issue_date,
      r?.from_location_name, r?.issued_by, r?.total_items_issued, r?.total_cost, r?.status
    ]);
    const csv = [headers, ...rows]?.map(r => r?.map(v => `"${v ?? ''}"`)?.join(','))?.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `material-issues-${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
    a?.click();
    URL.revokeObjectURL(url);
  };

  const breadcrumbs = [
    { label: 'Production', path: '/production-overview-dashboard' },
    { label: 'Issue Materials', path: '/production-issue-materials', active: true }
  ];

  return (
    <AppLayout activeModule="production">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div>
            <BreadcrumbNavigation items={breadcrumbs} />
            <h1 className="text-xl font-bold text-foreground mt-1 flex items-center gap-2">
              <Icon name="ClipboardList" size={22} className="text-primary" />
              Issue Materials
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">Updated {lastUpdated?.toLocaleTimeString()}</span>
            )}
            <button onClick={fetchIssues} disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-60">
              <Icon name="RefreshCw" size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <Icon name="Plus" size={14} />New Issue
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
              <Icon name="AlertCircle" size={16} />
              <span>{error}</span>
              <button onClick={fetchIssues} className="ml-auto text-xs underline">Retry</button>
            </div>
          )}

          {/* KPI Cards */}
          <IssueMaterialsKPICards kpis={kpis} isLoading={isLoading} />

          {/* Spreadsheet */}
          <IssueMaterialsSpreadsheet
            issues={issues}
            isLoading={isLoading}
            onNew={handleNew}
            onEdit={handleEdit}
            onConfirm={handleConfirmFromSpreadsheet}
            onCancel={handleCancelIssue}
            onDelete={handleDelete}
            onExport={handleExport}
          />
        </div>
      </div>

      {/* Modal */}
      <IssueMaterialsModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingIssue(null); }}
        issue={editingIssue}
        productionOrders={productionOrders}
        locations={locations}
        executives={executives}
        onSave={handleSave}
        onConfirmIssue={handleConfirmIssue}
      />
    </AppLayout>
  );
};

export default IssueMaterials;
