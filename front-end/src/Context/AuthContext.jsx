import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * שליפת הרשאות מה-DB בזמן אמת.
   * מכיוון שהכל דינמי, אנחנו מושכים את כל רשימת ה-Roles ומחפשים את ה-permissions
   * של ה-role הספציפי שהגיע מהלוגין.
   */

  const fetchDynamicPermissions = async (userRole, token) => {
    // אם המשתמש הוא מנהל עסקי או אדמין, ננסה למשוך הרשאות מהשרת
    const isManagerial =
      userRole === 'admin' || userRole === 'business_manager';

    if (!isManagerial) {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      return storedUser?.permissions || [];
    }

    try {
      // אם כאן את מקבלת 403, סימן שהבקהאנד לא מרשה למנהל עסקי לראות את רשימת התפקידים
      const res = await axios.get('http://localhost:5000/api/admin/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allRoles = res.data.roles || res.data;
      const foundRole = allRoles.find((r) => r.key === userRole);
      return foundRole ? foundRole.permissions : [];
    } catch (error) {
      console.warn('RBAC Fetch failed for role:', userRole);
      const storedUser = JSON.parse(localStorage.getItem('user'));
      return storedUser?.permissions || [];
    }
  };

  const login = async (userData, token) => {
    localStorage.setItem('token', token);

    // שליפה דינמית - אם מחר אדמין יוסיף הרשאה ב-DB, היא תופיע כאן אוטומטית
    const permissions = await fetchDynamicPermissions(userData.role, token);

    const fullUser = { ...userData, permissions };
    setUser(fullUser);
    localStorage.setItem('user', JSON.stringify(fullUser));
  };

  const refreshUserData = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        // קריאה לפרופיל כדי לראות אם ה-Role השתנה
        const profileRes = await axios.get(
          'http://localhost:5000/api/profile/me',
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const serverUser = profileRes.data.user;
        const permissions = await fetchDynamicPermissions(
          serverUser.role,
          token
        );

        const updatedUser = { ...serverUser, permissions };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (err) {
        if (err.response?.status === 401) logout();
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUserData();
  }, []);

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
