import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { FLAT_MODULES, MODULES_BY_SECTION, PERMISSIONS } from '../../../utils/permissionsUtils';

const MODULE_ICONS = {
  Dashboard: '📊', Sales: '💼', 'Sales Orders': '🛒', 'Sales Invoices': '📄', 'Sales Promotions': '🎁',
  Customers: '👥', 'Price List': '🏷️', 'Sales Overview': '📈', 'Empties Receive': '📦',
  Purchases: '🛒', Vendors: '🏭', 'Purchase Invoices': '📄', 'Purchase Orders': '📋',
  'Supplier Statement': '📊', 'Supplier Payments': '💳', 'Empties Dispatch': '📤',
  'Open Market Purchase': '🛍️',
  Inventory: '📦', Products: '📦', 'Stock by Location': '📍', 'Stock Movements': '↔️',
  'Returnable Glass': '🥤', 'Inventory Overview': '📦',
  'Point of Sale': '💳',
  Production: '🏭', 'Production Overview': '🏭', 'Bill of Materials': '📋', 'Production Orders': '🏭',
  'Issue Materials': '📤', 'Receive Finished Goods': '📥',
  Accounting: '📊', 'Accounting Overview': '📊', 'Chart of Accounts': '📒', 'Financial Reports': '📈',
  HR: '👥', 'HR Overview': '👥', Employees: '👤',
  Reports: '📈',
  Preferences: '⚙️', 'System Settings': '⚙️', 'Company Profile': '🏢', Locations: '📍',
  Users: '👤', 'Roles & Permissions': '🛡️', 'Payment Accounts': '💳', 'Tax & VAT': '🧮',
  'Import Data': '📤', 'Audit Log': '📋', 'Theme Settings': '🎨', 'Master Data Settings': '🗄️',
};

const defaultPerms = () => FLAT_MODULES?.reduce((acc, m) => ({
  ...acc,
  [m]: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false }
}), {});

const PermissionsMatrix = ({ selectedRoleId, roles }) => {
  const [permissions, setPermissions] = useState(() => defaultPerms());
  const [originalPermissions, setOriginalPermissions] = useState(() => defaultPerms());
  const [expandedSections, setExpandedSections] = useState(() =>
    MODULES_BY_SECTION?.reduce((acc, s) => ({ ...acc, [s.section]: true }), {})
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const selectedRole = roles?.find(r => r?.id === selectedRoleId);

  const fetchPermissions = useCallback(async () => {
    if (!selectedRoleId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase?.from('role_permissions')?.select('*')?.eq('role_id', selectedRoleId);
      if (error) throw error;
      const perms = defaultPerms();
      data?.forEach(p => {
        if (perms?.[p?.module_name]) {
          perms[p?.module_name] = {
            can_view: p?.can_view || false,
            can_create: p?.can_create || false,
            can_edit: p?.can_edit || false,
            can_delete: p?.can_delete || false,
            can_export: p?.can_export || false,
          };
        }
      });
      setPermissions(perms);
      setOriginalPermissions(JSON.parse(JSON.stringify(perms)));
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRoleId]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const checkHasChanges = (newPerms) => {
    return JSON.stringify(newPerms) !== JSON.stringify(originalPermissions);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleToggle = (module, permKey) => {
    setPermissions(prev => {
      const updated = { ...prev, [module]: { ...prev?.[module], [permKey]: !prev?.[module]?.[permKey] } };
      setHasChanges(checkHasChanges(updated));
      return updated;
    });
    setSaveSuccess(false);
  };

  /** Grant full access to section: set all permissions for parent + all children */
  const handleSectionFullAccess = (section) => {
    const config = MODULES_BY_SECTION?.find(s => s?.section === section);
    if (!config) return;
    const allModules = config?.modules?.length ? [config.parent, ...config.modules] : [config.parent];
    const full = PERMISSIONS?.every(p => allModules?.every(m => permissions?.[m]?.[p?.key]));
    setPermissions(prev => {
      const updated = { ...prev };
      allModules?.forEach(m => {
        updated[m] = {};
        PERMISSIONS?.forEach(p => { updated[m][p.key] = !full; });
      });
      setHasChanges(checkHasChanges(updated));
      return updated;
    });
    setSaveSuccess(false);
  };

  const handleSelectAllColumn = (permKey) => {
    const allChecked = FLAT_MODULES?.every(m => permissions?.[m]?.[permKey]);
    setPermissions(prev => {
      const updated = { ...prev };
      FLAT_MODULES?.forEach(m => { updated[m] = { ...updated?.[m], [permKey]: !allChecked }; });
      setHasChanges(checkHasChanges(updated));
      return updated;
    });
    setSaveSuccess(false);
  };

  const handleSelectAllRow = (module) => {
    const allChecked = PERMISSIONS?.every(p => permissions?.[module]?.[p?.key]);
    setPermissions(prev => {
      const updated = { ...prev, [module]: {} };
      PERMISSIONS?.forEach(p => { updated[module][p?.key] = !allChecked; });
      setHasChanges(checkHasChanges(updated));
      return updated;
    });
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const upsertData = FLAT_MODULES?.map(module => ({
        role_id: selectedRoleId,
        module_name: module,
        can_view: permissions?.[module]?.can_view || false,
        can_create: permissions?.[module]?.can_create || false,
        can_edit: permissions?.[module]?.can_edit || false,
        can_delete: permissions?.[module]?.can_delete || false,
        can_export: permissions?.[module]?.can_export || false,
        updated_at: new Date()?.toISOString(),
      }));
      const { error } = await supabase?.from('role_permissions')?.upsert(upsertData, { onConflict: 'role_id,module_name' });
      if (error) throw error;
      setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err?.message || 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const isSectionFullAccess = (section) => {
    const config = MODULES_BY_SECTION?.find(s => s?.section === section);
    if (!config) return false;
    const allModules = config?.modules?.length ? [config.parent, ...config.modules] : [config.parent];
    return PERMISSIONS?.every(p => allModules?.every(m => permissions?.[m]?.[p?.key]));
  };

  if (!selectedRoleId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Select a Role</h3>
        <p className="text-xs text-muted-foreground">Choose a role from the left panel to manage its permissions</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Permissions: {selectedRole?.role_name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Select a module for full section access. Expand to configure individual pages.</p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Unsaved changes
              </span>
            )}
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved!
              </span>
            )}
          </div>
        </div>
        {saveError && (
          <div className="mt-2 px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">{saveError}</div>
        )}
      </div>

      {/* Matrix */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading permissions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-foreground w-48">Module / Page</th>
                  {PERMISSIONS?.map(perm => (
                    <th key={perm?.key} className="px-3 py-3 text-center font-semibold text-foreground w-20">
                      <div className="flex flex-col items-center gap-1">
                        <span>{perm?.label}</span>
                        <button
                          onClick={() => handleSelectAllColumn(perm?.key)}
                          title={`Toggle all ${perm?.label}`}
                          className="w-4 h-4 rounded border-2 border-primary/50 hover:border-primary flex items-center justify-center transition-colors"
                        >
                          {FLAT_MODULES?.every(m => permissions?.[m]?.[perm?.key]) && (
                            <svg className="w-2.5 h-2.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center font-semibold text-foreground w-20">All</th>
                  <th className="px-3 py-3 text-center font-semibold text-foreground w-20">Full</th>
                </tr>
              </thead>
              <tbody>
                {MODULES_BY_SECTION?.map(({ section, parent, modules }) => (
                  <React.Fragment key={section}>
                    {/* Section header: expandable + parent row */}
                    <tr
                      className="bg-muted/60 border-b border-border cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => toggleSection(section)}
                    >
                      <td className="px-4 py-2 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <span className={`transition-transform ${expandedSections[section] ? 'rotate-90' : ''}`}>
                            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                          <span className="text-base">{MODULE_ICONS?.[parent] || '📁'}</span>
                          <span>{parent}</span>
                          <span className="text-muted-foreground font-normal">(full access)</span>
                        </div>
                      </td>
                      {PERMISSIONS?.map(perm => (
                        <td key={perm?.key} className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={permissions?.[parent]?.[perm?.key] || false}
                              onChange={() => handleToggle(parent, perm?.key)}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
                            />
                          </label>
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleSelectAllRow(parent)}
                          title={`Toggle all for ${parent}`}
                          className={`px-2 py-0.5 text-xs rounded transition-colors ${
                            PERMISSIONS?.every(p => permissions?.[parent]?.[p?.key])
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border hover:bg-accent'
                          }`}
                        >
                          All
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleSectionFullAccess(section)}
                          title={`Full access for entire ${section} section`}
                          className={`px-2 py-0.5 text-xs rounded transition-colors ${
                            isSectionFullAccess(section)
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border hover:bg-accent'
                          }`}
                        >
                          Full
                        </button>
                      </td>
                    </tr>
                    {/* Child modules (expandable) */}
                    {expandedSections[section] && modules?.map((module, idx) => (
                      <tr
                        key={module}
                        className={`border-b border-border transition-colors hover:bg-muted/30 ${
                          idx % 2 === 0 ? 'bg-background' : 'bg-muted/5'
                        }`}
                      >
                        <td className="px-4 py-2.5 pl-10">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{MODULE_ICONS?.[module] || '📄'}</span>
                            <span className="font-medium text-foreground">{module}</span>
                          </div>
                        </td>
                        {PERMISSIONS?.map(perm => (
                          <td key={perm?.key} className="px-3 py-2.5 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={permissions?.[module]?.[perm?.key] || false}
                                onChange={() => handleToggle(module, perm?.key)}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
                              />
                            </label>
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => handleSelectAllRow(module)}
                            title={`Toggle all for ${module}`}
                            className={`px-2 py-0.5 text-xs rounded transition-colors ${
                              PERMISSIONS?.every(p => permissions?.[module]?.[p?.key])
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border hover:bg-accent'
                            }`}
                          >
                            All
                          </button>
                        </td>
                        <td className="px-3 py-2.5" />
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {PERMISSIONS?.reduce((total, perm) =>
              total + FLAT_MODULES?.filter(m => permissions?.[m]?.[perm?.key])?.length, 0
            )} permissions granted across {FLAT_MODULES?.length} modules
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Permissions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsMatrix;
