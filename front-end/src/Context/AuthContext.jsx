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
    try {
      // הנתיב לניהול תפקידים דינמיים
      const res = await axios.get('http://localhost:5000/api/admin/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // המפתח מחזיר מערך תחת roles או ישירות
      const allRoles = res.data.roles || res.data;

      // מציאת הרשומה של התפקיד ב-DB לפי ה-Key שלו
      const foundRole = allRoles.find((r) => r.key === userRole);

      // מחזירים את מערך הסטרינגים מה-DB
      return foundRole ? foundRole.permissions : [];
    } catch (error) {
      console.warn('RBAC Fetch failed, falling back to empty permissions');
      return [];
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
