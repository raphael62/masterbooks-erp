import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { getModuleForPath, canViewModule, MODULE_PARENT } from '../utils/permissionsUtils';

const PermissionsContext = createContext({});

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  const { user } = useAuth();
  const [permissionsMap, setPermissionsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async (userId) => {
    if (!userId) {
      setPermissionsMap({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: userRole, error: urErr } = await supabase
        ?.from('user_roles')
        ?.select('role_id')
        ?.eq('user_id', userId)
        ?.maybeSingle();
      if (urErr || !userRole?.role_id) {
        // No role assigned: allow all (backward compat; admin can assign roles later)
        setPermissionsMap(null);
        setLoading(false);
        return;
      }
      const { data: perms, error: rpErr } = await supabase
        ?.from('role_permissions')
        ?.select('module_name, can_view, can_create, can_edit, can_delete, can_export')
        ?.eq('role_id', userRole.role_id);
      if (rpErr) {
        setPermissionsMap({});
        setLoading(false);
        return;
      }
      const map = {};
      (perms || []).forEach((p) => {
        map[p.module_name] = {
          can_view: p.can_view || false,
          can_create: p.can_create || false,
          can_edit: p.can_edit || false,
          can_delete: p.can_delete || false,
          can_export: p.can_export || false,
        };
      });
      setPermissionsMap(map);
    } catch (err) {
      console.error('Permissions load error:', err);
      setPermissionsMap({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadPermissions(user.id);
    } else {
      setPermissionsMap({});
      setLoading(false);
    }
  }, [user?.id, loadPermissions]);

  /** Check if user can access a route or module (View permission) */
  const canAccess = useCallback(
    (routeOrModule) => {
      if (!user) return false;
      if (permissionsMap === null) return true; // No role: allow all
      const moduleName = routeOrModule?.startsWith('/') ? getModuleForPath(routeOrModule) : routeOrModule;
      if (!moduleName) return true; // Unknown route: allow (e.g. 404)
      return canViewModule(permissionsMap, moduleName);
    },
    [user, permissionsMap]
  );

  /** Check specific permission for module */
  const hasPermission = useCallback(
    (moduleName, permKey) => {
      if (!user || !moduleName) return false;
      if (permissionsMap === null) return true; // No role: allow all
      const p = permissionsMap[moduleName];
      if (p?.[permKey]) return true;
      const parent = MODULE_PARENT[moduleName];
      if (parent && permissionsMap[parent]?.[permKey]) return true;
      return false;
    },
    [user, permissionsMap]
  );

  const value = {
    permissionsMap,
    loading,
    canAccess,
    hasPermission,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};
