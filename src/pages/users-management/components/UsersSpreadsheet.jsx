import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import UserModal from './UserModal';

const COLUMNS = [
  { key: 'full_name', label: 'Name', width: 'w-48' },
  { key: 'email', label: 'Email', width: 'w-56' },
  { key: 'role_name', label: 'Role', width: 'w-36' },
  { key: 'created_at', label: 'Created', width: 'w-32' },
];

const UsersSpreadsheet = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isInvite, setIsInvite] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const profRes = await supabase.from('user_profiles').select('id, full_name, email, created_at').order('full_name');
      if (profRes?.error) throw profRes.error;

      let roleByUserId = {};
      try {
        const rolesRes = await supabase.from('user_roles').select('user_id, role_id, roles(id, role_name)');
        if (!rolesRes?.error) {
          (rolesRes?.data || []).forEach((ur) => {
            const r = Array.isArray(ur?.roles) ? ur?.roles?.[0] : ur?.roles;
            roleByUserId[ur?.user_id] = r;
          });
        }
      } catch (_) {
        // user_roles may not exist before migration
      }

      const mapped = (profRes?.data || []).map((p) => {
        const role = roleByUserId[p?.id];
        return {
          id: p?.id,
          full_name: p?.full_name || '—',
          email: p?.email || '—',
          role_id: role?.id || null,
          role_name: role?.role_name || '—',
          created_at: p?.created_at ? new Date(p?.created_at).toLocaleDateString() : '—',
        };
      });
      setUsers(mapped);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('roles').select('id, role_name').eq('status', 'Active').order('role_name');
      if (error) throw error;
      setRoles((data || []).map((r) => ({ value: r?.id, label: r?.role_name })));
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const filteredUsers = users.filter((u) => {
    const term = (searchTerm || '').toLowerCase();
    if (!term) return true;
    return (
      (u?.full_name || '').toLowerCase().includes(term) ||
      (u?.email || '').toLowerCase().includes(term) ||
      (u?.role_name || '').toLowerCase().includes(term)
    );
  });

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsInvite(false);
    setShowModal(true);
  };

  const handleInvite = () => {
    setEditingUser(null);
    setIsInvite(true);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setIsInvite(false);
  };

  const handleSaved = () => {
    fetchUsers();
    handleCloseModal();
  };

  return (
    <div className="flex flex-col h-full min-h-[200px] bg-card border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="h-9 px-3 text-sm border border-border rounded w-64 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-sm text-muted-foreground">{filteredUsers.length} users</span>
        </div>
        <Button variant="default" size="sm" onClick={handleInvite} iconName="UserPlus" iconPosition="left">
          Invite User
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-muted-foreground text-sm">Loading users...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Icon name="Users" size={48} className="mb-3 opacity-50" />
            <p className="text-sm">No users found</p>
            <p className="text-xs mt-1">Invite users via Supabase Auth or use Invite User</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {COLUMNS.map((col) => (
                  <th key={col.key} className={`px-4 py-2.5 text-left font-medium text-foreground ${col.width || ''}`}>
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-right font-medium text-foreground w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user?.id} className="border-b border-border hover:bg-muted/30">
                  {COLUMNS.map((col) => (
                    <td key={col.key} className={`px-4 py-2.5 text-foreground ${col.width || ''}`}>
                      {user?.[col.key] ?? '—'}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-primary hover:underline text-xs font-medium"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <UserModal
          user={editingUser}
          isInvite={isInvite}
          roles={roles}
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default UsersSpreadsheet;
