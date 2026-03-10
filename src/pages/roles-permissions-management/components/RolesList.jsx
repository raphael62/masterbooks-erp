import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import NewRoleModal from './NewRoleModal';

const RolesList = ({ roles, selectedRoleId, onSelectRole, onRoleCreated, isLoading }) => {
  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const handleCreateRole = async (e) => {
    e?.preventDefault();
    if (!newRoleName?.trim()) { setError('Role name is required'); return; }
    setIsSaving(true);
    setError('');
    try {
      const roleName = newRoleName?.trim();
      const roleCode = roleName?.replace(/\s+/g, '_')?.toUpperCase() || 'CUSTOM';
      const payload = {
        role_name: roleName,
        role_code: roleCode,
        description: newRoleDesc?.trim() || null,
        status: 'Active',
        is_system: false,
      };
      const { data, error: err } = await supabase?.from('roles')?.insert([payload])?.select()?.single();
      if (err) throw err;
      setNewRoleName('');
      setNewRoleDesc('');
      setShowNewRoleForm(false);
      onRoleCreated?.(data);
    } catch (err) {
      setError(err?.message || 'Failed to create role');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleIcon = (roleName) => {
    const icons = {
      'Admin': '👑', 'Manager': '🏢', 'Cashier': '💰',
      'Sales Rep': '📊', 'Warehouse': '📦', 'Accountant': '📋',
    };
    return icons?.[roleName] || '👤';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Roles</h3>
          <span className="text-xs text-muted-foreground">{roles?.length} roles</span>
        </div>
        <button
          onClick={() => setShowNewRoleForm(prev => !prev)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Role
        </button>
      </div>

      {showNewRoleForm && (
        <div className="p-4 border-b border-border bg-muted/20">
          <form onSubmit={handleCreateRole} className="space-y-2">
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div>
              <label className="text-xs font-medium text-foreground">Role Name *</label>
              <input
                type="text" value={newRoleName} onChange={e => setNewRoleName(e?.target?.value)}
                placeholder="e.g. Supervisor"
                className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Description</label>
              <input
                type="text" value={newRoleDesc} onChange={e => setNewRoleDesc(e?.target?.value)}
                placeholder="Optional description"
                className="mt-1 w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isSaving}
                className="flex-1 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {isSaving ? 'Creating...' : 'Create'}
              </button>
              <button type="button" onClick={() => { setShowNewRoleForm(false); setError(''); setNewRoleName(''); setNewRoleDesc(''); }}
                className="flex-1 py-1.5 text-xs font-medium border border-border rounded hover:bg-accent transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="text-center py-8 text-xs text-muted-foreground">Loading roles...</div>
        ) : roles?.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">No roles found</div>
        ) : (
          roles?.map(role => (
            <div key={role?.id} className="group relative">
              <button
                onClick={() => onSelectRole?.(role?.id)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-150 border ${
                  selectedRoleId === role?.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background hover:bg-muted/60 border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{getRoleIcon(role?.role_name)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold truncate">{role?.role_name}</span>
                      <div className="flex items-center gap-1">
                        {role?.is_system && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            selectedRoleId === role?.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>System</span>
                        )}
                        {!role?.is_system && (
                          <button
                            onClick={e => { e?.stopPropagation(); setEditItem(role); setShowModal(true); }}
                            className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity ${
                              selectedRoleId === role?.id ? 'hover:bg-primary-foreground/20 text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                            title="Edit role"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    {role?.description && (
                      <p className={`text-xs mt-0.5 truncate ${
                        selectedRoleId === role?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>{role?.description}</p>
                    )}
                    <div className={`flex items-center gap-1 mt-1 text-xs ${
                      selectedRoleId === role?.id ? 'text-primary-foreground/60' : 'text-muted-foreground'
                    }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{role?.user_count || 0} users</span>
                      <span className={`ml-1 w-1.5 h-1.5 rounded-full inline-block ${
                        role?.status === 'Active' ? 'bg-green-400' : 'bg-gray-400'
                      }`}></span>
                      <span>{role?.status}</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <NewRoleModal
          key={editItem?.id ?? 'new'}
          editItem={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={() => { setShowModal(false); setEditItem(null); onRoleCreated?.(); }}
        />
      )}
    </div>
  );
};

export default RolesList;
