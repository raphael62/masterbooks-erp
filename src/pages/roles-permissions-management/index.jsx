import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import RolesList from './components/RolesList';
import PermissionsMatrix from './components/PermissionsMatrix';

const RolesPermissionsManagement = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase?.from('roles')?.select('*')?.order('role_name');
      if (error) throw error;
      setRoles(data || []);
      if (data?.length > 0 && !selectedRoleId) {
        setSelectedRoleId(data?.[0]?.id);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRoleId]);

  useEffect(() => { fetchRoles(); }, []);

  const handleRoleCreated = (newRole) => {
    setRoles(prev => [...prev, newRole]?.sort((a, b) => a?.role_name?.localeCompare(b?.role_name)));
    setSelectedRoleId(newRole?.id);
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">Roles & Permissions</h1>
            <p className="text-sm text-muted-foreground">Manage user roles and configure module access permissions</p>
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-6 pb-4">
          <div className="flex h-full gap-4">
            {/* Left Panel - Roles List (30%) */}
            <div className="w-72 flex-shrink-0 bg-card border border-border rounded-lg overflow-hidden">
              <RolesList
                roles={roles}
                selectedRoleId={selectedRoleId}
                onSelectRole={setSelectedRoleId}
                onRoleCreated={handleRoleCreated}
                isLoading={isLoading}
              />
            </div>
            {/* Right Panel - Permissions Matrix (70%) */}
            <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden">
              <PermissionsMatrix
                selectedRoleId={selectedRoleId}
                roles={roles}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default RolesPermissionsManagement;
