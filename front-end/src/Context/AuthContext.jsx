// /src/Context/AuthContext.jsx
import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   *
   * שליפת הרשאות מה-DB בזמן אמת.
   * מכיוון שהכל דינמי, אנחנו מושכים את כל רשימת ה-Roles ומחפשים את ה-permissions
   * של ה-role הספציפי שהגיע מהלוגין.
   */

  const fetchDynamicPermissions = async (userRole) => {
    const isManagerial =
      userRole === 'admin' || userRole === 'business_manager';

    if (!isManagerial) {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      return storedUser?.permissions || [];
    }

    try {
      // Authorization מגיע אוטומטית מה-interceptor של api
      const res = await api.get('/api/admin/roles');

      // לפי המבנה אצלכם: לפעמים roles, לפעמים data
      const allRoles = res.data?.roles || res.data?.data || res.data || [];
      const foundRole = allRoles.find((r) => r.key === userRole);

      return foundRole?.permissions || [];
    } catch (error) {
      console.warn('RBAC Fetch failed for role:', userRole);
      const storedUser = JSON.parse(localStorage.getItem('user'));
      return storedUser?.permissions || [];
    }
  };

  const login = async (userData, token) => {
    localStorage.setItem('token', token);

    // שליפה דינמית - אם מחר אדמין יוסיף הרשאה ב-DB, היא תופיע כאן אוטומטית
    const permissions = await fetchDynamicPermissions(userData.role);

    const fullUser = { ...userData, permissions };
    setUser(fullUser);
    localStorage.setItem('user', JSON.stringify(fullUser));
  };

  const refreshUserData = useCallback(async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        // קריאה לפרופיל כדי לראות אם ה-Role השתנה
        const profileRes = await api.get('/api/profile/me');
        const serverUser = profileRes.data?.user || profileRes.data?.data?.user;

        if (!serverUser) throw new Error('Profile response missing user');

        const permissions = await fetchDynamicPermissions(serverUser.role);
        const updatedUser = { ...serverUser, permissions };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (err) {
        if (err.response?.status === 401) logout();
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading ? (
        children
      ) : (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          טוען הרשאות דינמיות...
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
