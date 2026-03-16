import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

const COL_KEYS = ['ITEM CODE', 'ITEM NAME', 'UNIT', 'OPENING', 'PURCHASES', 'SALES', 'CLOSING', 'ORDER', 'BTLQTY'];

const TemplateEditModal = ({ isOpen, onClose, template, currentColumns, currentSortConfig, onSave, onTemplatesChange }) => {
  const { user: authUser } = useAuth();
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [sortKeyIndex, setSortKeyIndex] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [subtotalBy, setSubtotalBy] = useState('');
  const [columnSettings, setColumnSettings] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!template?.id;

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (template) {
      setName(template.name || '');
      setIsDefault(!!template.is_default);
      const s = template.sort_subtotal_settings || {};
      setSortKeyIndex(s.sortKeyIndex ?? null);
      setSortDirection(s.sortDirection || 'asc');
      setSubtotalBy(s.subtotalBy || '');
      const fromTemplate = Array.isArray(template.column_settings) && template.column_settings.length > 0 ? template.column_settings : currentColumns;
      const byKey = {};
      (fromTemplate || []).forEach(c => { if (c?.key) byKey[c.key] = c; });
      const merged = COL_KEYS.map((key, i) => byKey[key] ? { ...byKey[key], key } : { key, label: key, width: 72 + i * 10, visible: true, order: i });
      setColumnSettings(merged);
    } else {
      setName('');
      setIsDefault(false);
      setSelectedUserIds([]);
      setSelectedRoleIds([]);
      setSortKeyIndex(currentSortConfig?.key ?? null);
      setSortDirection(currentSortConfig?.direction || 'asc');
      setSubtotalBy('');
      const byKeyCur = {};
      (currentColumns || []).forEach(c => { if (c?.key) byKeyCur[c.key] = c; });
      const mergedNew = COL_KEYS.map((key, i) => byKeyCur[key] ? { ...byKeyCur[key], key } : { key, label: key, width: 72 + i * 10, visible: true, order: i });
      setColumnSettings(mergedNew);
    }
  }, [isOpen, template, currentColumns, currentSortConfig]);

  useEffect(() => {
    if (isEdit && template?.id) {
      const loadGrants = async () => {
        const { data } = await supabase.from('inventory_change_history_template_grants').select('user_id, role_id').eq('template_id', template.id);
        const uIds = (data || []).map(r => r.user_id).filter(Boolean);
        const rIds = (data || []).map(r => r.role_id).filter(Boolean);
        setSelectedUserIds(uIds);
        setSelectedRoleIds(rIds);
      };
      loadGrants();
    } else {
      setSelectedUserIds([]);
      setSelectedRoleIds([]);
    }
  }, [isEdit, template?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        const [uRes, rRes] = await Promise.all([
          supabase.from('user_profiles').select('id, full_name').order('full_name'),
          supabase.from('roles').select('id, role_name').eq('status', 'Active').order('role_name'),
        ]);
        setUsers(uRes?.data ?? []);
        setRoles(rRes?.data ?? []);
      } catch (_) {}
    };
    load();
  }, [isOpen]);

  const toggleUser = useCallback((id) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);
  const toggleRole = useCallback((id) => {
    setSelectedRoleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const updateColumnSetting = useCallback((key, field, value) => {
    setColumnSettings(prev => prev.map(c => c.key === key ? { ...c, [field]: value } : c));
  }, []);

  const handleSave = async () => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      setError('Template name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: trimmed,
        is_default: isDefault,
        column_settings: columnSettings,
        sort_subtotal_settings: { sortKeyIndex: sortKeyIndex ?? null, sortDirection, subtotalBy: subtotalBy || null },
        updated_at: new Date().toISOString(),
      };
      if (isEdit) {
        if (isDefault) {
          await supabase.from('inventory_change_history_templates').update({ is_default: false }).eq('created_by', authUser?.id);
        }
        await supabase.from('inventory_change_history_templates').update(payload).eq('id', template.id);
        await supabase.from('inventory_change_history_template_grants').delete().eq('template_id', template.id);
        const grantsEdit = [...selectedUserIds.map(user_id => ({ template_id: template.id, user_id, role_id: null })), ...selectedRoleIds.map(role_id => ({ template_id: template.id, user_id: null, role_id }))].filter(g => g.user_id || g.role_id);
        if (grantsEdit.length > 0) await supabase.from('inventory_change_history_template_grants').insert(grantsEdit);
      } else {
        if (isDefault) {
          await supabase.from('inventory_change_history_templates').update({ is_default: false }).eq('created_by', authUser?.id);
        }
        const { data: inserted, error: insertErr } = await supabase.from('inventory_change_history_templates').insert([{ name: trimmed, is_default: isDefault, column_settings: columnSettings, sort_subtotal_settings: { sortKeyIndex: sortKeyIndex ?? null, sortDirection, subtotalBy: subtotalBy || null }, created_by: authUser?.id }]).select('id').single();
        if (insertErr) throw insertErr;
        if (inserted?.id) {
          const grants = [...selectedUserIds.map(user_id => ({ template_id: inserted.id, user_id, role_id: null })), ...selectedRoleIds.map(role_id => ({ template_id: inserted.id, user_id: null, role_id }))].filter(g => g.user_id || g.role_id);
          if (grants.length > 0) await supabase.from('inventory_change_history_template_grants').insert(grants);
        }
      }
      onTemplatesChange?.();
      const savedTemplate = { id: isEdit ? template.id : inserted?.id, name: trimmed, is_default: isDefault, column_settings: columnSettings, sort_subtotal_settings: { sortKeyIndex: sortKeyIndex ?? null, sortDirection, subtotalBy: subtotalBy || null } };
      onSave?.(savedTemplate);
      onClose();
    } catch (e) {
      setError(e?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{isEdit ? 'Edit Template' : 'New Template'}</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-4">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Template name" className="w-full h-8 px-2 border border-border rounded text-xs bg-background text-foreground" />
          </div>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="rounded border-border" />
            Default template
          </label>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Authorization (users)</p>
            <div className="max-h-32 overflow-y-auto border border-border rounded p-2 space-y-1">
              {users.map(u => (
                <label key={u.id} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={selectedUserIds.includes(u.id)} onChange={() => toggleUser(u.id)} className="rounded border-border" />
                  {u.full_name || u.id}
                </label>
              ))}
              {users.length === 0 && <span className="text-muted-foreground text-xs">No users</span>}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Authorization (roles)</p>
            <div className="max-h-32 overflow-y-auto border border-border rounded p-2 space-y-1">
              {roles.map(r => (
                <label key={r.id} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={selectedRoleIds.includes(r.id)} onChange={() => toggleRole(r.id)} className="rounded border-border" />
                  {r.role_name || r.id}
                </label>
              ))}
              {roles.length === 0 && <span className="text-muted-foreground text-xs">No roles</span>}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Sort & subtotal</p>
            <div className="flex flex-wrap gap-3">
              <div>
                <span className="text-muted-foreground text-xs mr-1">Sort column</span>
                <select value={sortKeyIndex ?? ''} onChange={e => setSortKeyIndex(e.target.value === '' ? null : Number(e.target.value))} className="h-8 px-2 border border-border rounded text-xs bg-background text-foreground">
                  <option value="">None</option>
                  {COL_KEYS.map((k, i) => <option key={k} value={i}>{k}</option>)}
                </select>
              </div>
              <div>
                <span className="text-muted-foreground text-xs mr-1">Direction</span>
                <select value={sortDirection} onChange={e => setSortDirection(e.target.value)} className="h-8 px-2 border border-border rounded text-xs bg-background text-foreground">
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
              <div>
                <span className="text-muted-foreground text-xs mr-1">Subtotal by</span>
                <select value={subtotalBy} onChange={e => setSubtotalBy(e.target.value)} className="h-8 px-2 border border-border rounded text-xs bg-background text-foreground">
                  <option value="">None</option>
                  <option value="category">Category</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Column settings</p>
            <div className="overflow-x-auto border border-border rounded">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-2 py-1.5 border border-border">Column</th>
                    <th className="text-left px-2 py-1.5 border border-border">Display name</th>
                    <th className="text-left px-2 py-1.5 border border-border w-20">Width</th>
                    <th className="text-left px-2 py-1.5 border border-border">Visible</th>
                    <th className="text-left px-2 py-1.5 border border-border w-16">Order</th>
                  </tr>
                </thead>
                <tbody>
                  {columnSettings.map((col, i) => (
                    <tr key={col.key} className="border-t border-border">
                      <td className="px-2 py-1.5 border border-border font-mono">{col.key}</td>
                      <td className="px-2 py-1.5 border border-border">
                        <input type="text" value={col.label || ''} onChange={e => updateColumnSetting(col.key, 'label', e.target.value)} className="w-full h-7 px-1 border border-border rounded bg-background text-foreground" />
                      </td>
                      <td className="px-2 py-1.5 border border-border">
                        <input type="number" min={40} value={col.width ?? 80} onChange={e => updateColumnSetting(col.key, 'width', Number(e.target.value) || 40)} className="w-full h-7 px-1 border border-border rounded bg-background text-foreground" />
                      </td>
                      <td className="px-2 py-1.5 border border-border">
                        <input type="checkbox" checked={col.visible !== false} onChange={e => updateColumnSetting(col.key, 'visible', e.target.checked)} className="rounded border-border" />
                      </td>
                      <td className="px-2 py-1.5 border border-border">
                        <input type="number" min={0} value={col.order ?? i} onChange={e => updateColumnSetting(col.key, 'order', Number(e.target.value) ?? i)} className="w-full h-7 px-1 border border-border rounded bg-background text-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <button type="button" onClick={onClose} className="h-8 px-3 text-xs border border-border rounded hover:bg-muted">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} className="h-8 px-3 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditModal;
