import { useAuth } from '../Context/AuthContext';

/**
 * מפת הרשאות מקומית (מכיוון שה-Backend לא שולח אותן)
 * המפתחות כאן חייבים להתאים בדיוק ל-key של ה-Role ב-DB
 */
const ROLE_PERMISSIONS = {
  admin: ['*'], // אדמין מקבל הכל (מטופל בנפרד ב-Hook)
  businessmanager: ['business.panel.access', 'stats.read'],
  designer: [
    'projects.create',
    'projects.edit',
    // הוסיפי כאן הרשאות נוספות לפי הצורך
  ],
  student: ['projects.create'],
};

export const usePermission = () => {
  const { user } = useAuth();

  const hasPermission = (permissionKey) => {
    if (!user) return false;

    // 1. הגנת אדמין (Master Key)
    if (user.role === 'admin') return true;

    // 2. בדיקה אם ההרשאות הגיעו בכל זאת מהשרת (עתידי)
    if (user.permissions?.includes(permissionKey)) return true;

    // 3. מיפוי לפי תפקיד (הפתרון לבעיה שלך)
    // אנחנו מנרמלים את ה-role כדי למנוע בעיות של אותיות גדולות/קווים תחתיים
    const normalizedRole = user.role?.replace(/_/g, '').toLowerCase();
    const permissionsForRole = ROLE_PERMISSIONS[normalizedRole] || [];

    return permissionsForRole.includes(permissionKey);
  };

  return { hasPermission, user };
};
