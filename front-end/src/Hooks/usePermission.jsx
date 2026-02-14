import { useAuth } from '../Context/AuthContext';

/**
 * Hook לניהול הרשאות דינמי במערכת DesignerMarket
 */
export const usePermission = () => {
  const { user } = useAuth();

  /**
   * בדיקת הרשאה ספציפית
   * @param {string} permissionKey - המפתח כפי שמופיע ב-DB (למשל 'projects.delete')
   * @returns {boolean}
   */
  const hasPermission = (permissionKey) => {
    // אם אין משתמש מחובר - אין הרשאות
    if (!user) return false;

    // "מפתח מאסטר" - אדמין תמיד מורשה לכל פעולה
    if (user.role === 'admin') return true;

    // בדיקה במערך ה-permissions שמשכנו ב-AuthContext
    return user.permissions?.includes(permissionKey) || false;
  };

  return { hasPermission, user };
};
