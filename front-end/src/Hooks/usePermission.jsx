import { useCallback } from 'react';
import { useAuth } from '../Context/AuthContext';

const ROLE_PERMISSIONS = {
  admin: ['*'],
  businessmanager: ['business.panel.access', 'stats.read'],

  // ⚠️ התאמה לשמות האמיתיים בבאק:
  designer: ['projects.create', 'projects.update', 'ai.consult', ],
  student: ['projects.create','projects.update','ai.consult', ],
  customer: [],
};

export const usePermission = () => {
  const { user } = useAuth();

  const hasPermission = useCallback(
    (permissionKey) => {
      if (!user) return false;

      // אדמין הכל
      if (user.role === 'admin') return true;

      // אם בעתיד השרת ישלח permissions
      if (
        Array.isArray(user.permissions) &&
        user.permissions.includes(permissionKey)
      )
        return true;

      const normalizedRole = user.role?.replace(/_/g, '').toLowerCase();
      const permissionsForRole = ROLE_PERMISSIONS[normalizedRole] || [];

      return permissionsForRole.includes(permissionKey);
    },
    // ✅ התלות היא רק במשתמש. אז הפונקציה נשארת יציבה ולא נוצרת מחדש סתם.
    [user]
  );

  return { hasPermission, user };
};
