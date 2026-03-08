// src/Hooks/usePermission.jsx
import { useCallback } from 'react';
import { useAuth } from '../Context/AuthContext';

const ROLE_PERMISSIONS = {
  admin: ['*'],
  businessmanager: ['business.panel.access', 'stats.read'],
  designer: ['projects.create', 'projects.update', 'ai.consult'],
  student: ['projects.create', 'projects.update', 'ai.consult'],
  customer: [],
};

/*The usePermission hook is a core security utility used for Role-Based Access Control (RBAC) throughout the frontend application.
 *It provides a simple, unified interface to determine whether the current authenticated user has the authority to view a specific UI
 *element or perform a specific action.
 */

export const usePermission = () => {
  const { user } = useAuth();
  //This is the primary function returned by the hook. It follows a hierarchical "Water-Fall" logic to validate access:
  const hasPermission = useCallback(
    (permissionKey) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      if (
        Array.isArray(user.permissions) &&
        user.permissions.includes(permissionKey)
      )
        return true;

      const normalizedRole = user.role?.replace(/_/g, '').toLowerCase();
      const permissionsForRole = ROLE_PERMISSIONS[normalizedRole] || [];

      return permissionsForRole.includes(permissionKey);
    },
    [user]
  );

  return { hasPermission, user };
};
