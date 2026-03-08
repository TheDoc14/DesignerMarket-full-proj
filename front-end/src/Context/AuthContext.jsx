import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import api from '../api/axios';

// The AuthContext is the core authentication and session management layer of the application.
// It utilizes the React Context API to provide a global state for the authenticated user, their metadata,
// and their dynamic permissions. It ensures that user data stays synchronized between the browser's local
// storage and the server's database.
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  //Retrieves the list of granular permissions associated with a specific role directly from the database.
  const fetchDynamicPermissions = async (userRole) => {
    const isManagerial =
      userRole === 'admin' || userRole === 'business_manager';
    if (!isManagerial) {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      return storedUser?.permissions || [];
    }
    try {
      const res = await api.get('/api/admin/roles');
      const allRoles = res.data?.roles || res.data?.data || res.data || [];
      const foundRole = allRoles.find((r) => r.key === userRole);
      return foundRole?.permissions || [];
    } catch (error) {
      console.warn('RBAC Fetch failed for role:', userRole);
      const storedUser = JSON.parse(localStorage.getItem('user'));
      return storedUser?.permissions || [];
    }
  };
  //Acts as a "Security Guard" on application load/refresh.
  const login = async (userData, token) => {
    localStorage.setItem('token', token);
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
  //Terminates the session and cleans up sensitive data.
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
