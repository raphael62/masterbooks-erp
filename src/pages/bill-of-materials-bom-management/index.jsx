import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import BOMKPICards from './components/BOMKPICards';
import BOMSpreadsheet from './components/BOMSpreadsheet';
import BOMModal from './components/BOMModal';
import BOMAnalytics from './components/BOMAnalytics';

const BillOfMaterialsManagement = () => {
  const [boms, setBoms] = useState([]);
  const [bomItems, setBomItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState(null);
  const [versionPrompt, setVersionPrompt] = useState(null);

  const fetchBOMs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        ?.from('bom_headers')
        ?.select('*')
        ?.order('created_at', { ascending: false });
      if (err) throw err;
      setBoms(data || []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Error fetching BOMs:', e);
      setError(e?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBOMItems = useCallback(async () => {
    try {
      const { data } = await supabase?.from('bom_items')?.select('*');
      setBomItems(data || []);
    } catch (e) { console.error(e); }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await supabase?.from('products')?.select('id, product_code, product_name, unit_of_measure')?.eq('status', 'active')?.order('product_name');
      setProducts(data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchBOMs();
    fetchBOMItems();
    fetchProducts();
  }, [fetchBOMs, fetchBOMItems, fetchProducts]);

  const kpis = useMemo(() => {
    const totalBOMs = boms?.length || 0;
    const activeBOMs = boms?.filter(b => b?.status === 'Active')?.length || 0;
    const totalCost = boms?.reduce((s, b) => s + (parseFloat(b?.total_cost) || 0), 0);
    const avgCost = totalBOMs > 0 ? totalCost / totalBOMs : 0;
    const uniqueProductsWithBOM = new Set(boms?.map(b => b?.product_id).filter(Boolean))?.size;
    const totalProducts = products?.length || 0;
    const coveragePct = totalProducts > 0 ? (uniqueProductsWithBOM / totalProducts) * 100 : 0;
    return { totalBOMs, activeBOMs, avgCost, coveragePct };
  }, [boms, products]);

  const handleNew = () => {
    setEditingBOM(null);
    setModalOpen(true);
  };

  const handleEdit = (bom) => {
    if (bom?.status === 'Active') {
      setVersionPrompt(bom);
    } else {
      setEditingBOM(bom);
      setModalOpen(true);
    }
  };

  const handleVersionPromptConfirm = (createNew) => {
    const bom = versionPrompt;
    setVersionPrompt(null);
    if (createNew) {
      // Create new version
      const versionParts = (bom?.version || '1.0')?.split('.');
      const newMinor = parseInt(versionParts?.[1] || 0) + 1;
      const newVersion = `${versionParts?.[0]}.${newMinor}`;
      setEditingBOM(null);
      setModalOpen(true);
      // Pre-populate with new version data
      setTimeout(() => {
        setEditingBOM({ ...bom, id: null, version: newVersion, status: 'Draft', bom_code: `BOM-${new Date()?.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` });
      }, 50);
    } else {
      setEditingBOM(bom);
      setModalOpen(true);
    }
  };

  const handleClone = (bom) => {
    const versionParts = (bom?.version || '1.0')?.split('.');
    const newMinor = parseInt(versionParts?.[1] || 0) + 1;
    const cloned = {
      ...bom,
      id: null,
      bom_code: `BOM-${new Date()?.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      version: `${versionParts?.[0]}.${newMinor}`,
      status: 'Draft'
    };
    setEditingBOM(cloned);
    setModalOpen(true);
  };

  const handleSave = async (formData, items) => {
    try {
      if (editingBOM?.id) {
        const { error: upErr } = await supabase?.from('bom_headers')?.update({ ...formData, updated_at: new Date()?.toISOString() })?.eq('id', editingBOM?.id);
        if (upErr) throw upErr;
        await supabase?.from('bom_items')?.delete()?.eq('bom_header_id', editingBOM?.id);
        if (items?.length > 0) {
          const { error: itemErr } = await supabase?.from('bom_items')?.insert(items?.map((item, i) => ({ ...item, bom_header_id: editingBOM?.id, sort_order: i })));
          if (itemErr) throw itemErr;
        }
      } else {
        const { data: newBOM, error: insErr } = await supabase?.from('bom_headers')?.insert([formData])?.select()?.single();
        if (insErr) throw insErr;
        if (items?.length > 0 && newBOM?.id) {
          const { error: itemErr } = await supabase?.from('bom_items')?.insert(items?.map((item, i) => ({ ...item, bom_header_id: newBOM?.id, sort_order: i })));
          if (itemErr) throw itemErr;
        }
      }
      await fetchBOMs();
      await fetchBOMItems();
    } catch (e) {
      console.error('Save error:', e);
      throw e;
    }
  };

  const handleActivate = async (ids) => {
    try {
      const { error: err } = await supabase?.from('bom_headers')?.update({ status: 'Active', updated_at: new Date()?.toISOString() })?.in('id', ids);
      if (err) throw err;
      await fetchBOMs();
    } catch (e) { console.error(e); }
  };

  const handleArchive = async (ids) => {
    try {
      const { error: err } = await supabase?.from('bom_headers')?.update({ status: 'Archived', updated_at: new Date()?.toISOString() })?.in('id', ids);
      if (err) throw err;
      await fetchBOMs();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (ids) => {
    if (!window.confirm(`Delete ${ids?.length} BOM(s)? This cannot be undone.`)) return;
    try {
      await supabase?.from('bom_items')?.delete()?.in('bom_header_id', ids);
      const { error: err } = await supabase?.from('bom_headers')?.delete()?.in('id', ids);
      if (err) throw err;
      await fetchBOMs();
      await fetchBOMItems();
    } catch (e) { console.error(e); }
  };

  const handleExport = () => {
    const headers = ['BOM Code', 'Product Name', 'Version', 'Effective Date', 'Expiry Date', 'Material Cost', 'Labor Cost', 'Overhead Cost', 'Total Cost', 'Status'];
    const rows = boms?.map(b => [
      b?.bom_code, b?.product_name, b?.version, b?.effective_date, b?.expiry_date,
      b?.total_material_cost, b?.labor_cost, b?.overhead_cost, b?.total_cost, b?.status
    ]);
    const csv = [headers, ...rows]?.map(r => r?.map(v => `"${v ?? ''}"`)?.join(','))?.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bom-export-${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
    a?.click();
    URL.revokeObjectURL(url);
  };

  const breadcrumbs = [
    { label: 'Production', path: '/production-overview-dashboard' },
    { label: 'Bill of Materials', path: '/bill-of-materials-bom-management', active: true }
  ];

  return (
    <AppLayout activeModule="production">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div>
            <BreadcrumbNavigation items={breadcrumbs} />
            <h1 className="text-xl font-bold text-foreground mt-1 flex items-center gap-2">
              <Icon name="FileText" size={22} className="text-primary" />
              Bill of Materials (BOM) Management
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">Updated {lastUpdated?.toLocaleTimeString()}</span>
            )}
            <button onClick={fetchBOMs} disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-60">
              <Icon name="RefreshCw" size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <Icon name="Plus" size={14} />New BOM
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
              <Icon name="AlertCircle" size={16} />
              <span>{error}</span>
              <button onClick={fetchBOMs} className="ml-auto text-xs underline">Retry</button>
            </div>
          )}

          {/* KPI Cards */}
          <BOMKPICards kpis={kpis} isLoading={isLoading} />

          {/* BOM Spreadsheet */}
          <BOMSpreadsheet
            boms={boms}
            isLoading={isLoading}
            onNew={handleNew}
            onEdit={handleEdit}
            onClone={handleClone}
            onActivate={handleActivate}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onExport={handleExport}
          />

          {/* Analytics */}
          <BOMAnalytics boms={boms} bomItems={bomItems} />
        </div>
      </div>

      {/* BOM Modal */}
      <BOMModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingBOM(null); }}
        bom={editingBOM}
        products={products}
        onSave={handleSave}
        isVersionPrompt={false}
      />

      {/* Version Prompt Dialog */}
      {versionPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Icon name="AlertTriangle" size={20} className="text-yellow-600" />
              </div>
              <h3 className="font-semibold text-foreground">Active BOM — Version Control</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              <strong>{versionPrompt?.bom_code}</strong> is currently <strong>Active</strong>. 
              Do you want to create a new version (recommended) or edit the existing BOM directly?
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleVersionPromptConfirm(true)}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                Create New Version
              </button>
              <button onClick={() => handleVersionPromptConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent">
                Edit Directly
              </button>
              <button onClick={() => setVersionPrompt(null)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default BillOfMaterialsManagement;
