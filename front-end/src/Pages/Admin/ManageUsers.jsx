//src/Pages/Admin/ManageUsers.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { UserCog, Trash2 } from 'lucide-react';
import './AdminDesign.css';
import { usePermission } from '../../Hooks/usePermission.jsx';

const ManageUsers = () => {
  const { hasPermission, loading: permissionLoading } = usePermission();

  const canReadUsers = hasPermission('users.read');
  const canAssignRole = hasPermission('users.assignRole');
  const canManageRoles = hasPermission('roles.manage');
  const canAccessAdmin = hasPermission('admin.panel.access');

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    q: '',
    role: '',
    approved: '',
    page: 1,
    limit: 10,
  });

  // ✅ טעינת roles (דינמי) – רק אם מותר
  useEffect(() => {
    if (permissionLoading) return;
    if (!canManageRoles) return;

    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/api/admin/roles');
        const rows = res.data?.roles || [];
        if (mounted) setRoles(rows);
      } catch (err) {
        console.error('טעינת תפקידים נכשלה', err);
        if (mounted) setRoles([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [permissionLoading, canManageRoles]);

  // ✅ אם נבחר role שלא קיים יותר — ננקה (כדי לא לקבל 400)
  useEffect(() => {
    if (!filters.role) return;
    if (!canManageRoles) return;
    if (roles.length === 0) return;

    const keys = roles.map((r) => r.key);
    if (!keys.includes(filters.role)) {
      setFilters((prev) => ({ ...prev, role: '', page: 1 }));
    }
  }, [filters.role, roles, canManageRoles]);

  // ✅ טעינת users לפי filters (עם debounce)
  useEffect(() => {
    if (permissionLoading) return;
    if (!canReadUsers) return;

    const t = setTimeout(async () => {
      try {
        setLoading(true);

        const params = Object.fromEntries(
          Object.entries(filters).filter(
            ([_, v]) => v !== '' && v !== null && v !== undefined
          )
        );

        const res = await api.get('/api/admin/users', { params });
        setUsers(res.data?.users || res.data?.data || res.data || []);
      } catch (err) {
        console.error('טעינת משתמשים נכשלה', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [filters, permissionLoading, canReadUsers]);

  const handleRoleUpdate = async (userId, newRole) => {
    if (!canAssignRole) {
      alert('אין לך הרשאה לשנות תפקידי משתמשים');
      return;
    }
    if (!window.confirm(`האם לשנות את תפקיד המשתמש ל-${newRole}?`)) return;

    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) =>
          (u._id || u.id) === userId ? { ...u, role: newRole } : u
        )
      );
      alert('התפקיד עודכן בהצלחה');
    } catch (err) {
      alert(err.response?.data?.message || 'שגיאה בעדכון התפקיד');
    }
  };

  const handleDelete = async (userId) => {
    if (!canAccessAdmin) {
      alert('אין לך הרשאות למחיקת משתמשים');
      return;
    }
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) return;

    try {
      await api.delete(`/api/profile/${userId}`);
      setUsers((prev) => prev.filter((u) => (u._id || u.id) !== userId));
    } catch (err) {
      alert('שגיאה במחיקת המשתמש');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  if (permissionLoading) return <div className="loader">בודק הרשאות...</div>;
  if (!canAccessAdmin)
    return <div className="error-container">אין לך הרשאות גישה לדף זה.</div>;

  return (
    <div className="admin-container" dir="rtl">
      <header className="dashboard-header">
        <h1>
          <UserCog className="line" size={30} /> ניהול משתמשים
        </h1>
        <p>עדכון תפקידים, אישור חשבונות וניהול הרשאות צוות</p>
      </header>

      <div className="admin-toolbar-card">
        <div className="input-with-icon">
          <input
            name="q"
            placeholder="חיפוש משתמש..."
            value={filters.q}
            onChange={handleFilterChange}
            className="form-input-search"
          />
        </div>

        <br />

        {/* ✅ פילטר Role דינמי – רק אם יש הרשאה לקרוא roles */}
        {canManageRoles && (
          <select
            name="role"
            value={filters.role}
            onChange={handleFilterChange}
            className="form-input"
          >
            <option value="">כל התפקידים</option>
            {roles.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label} ({r.key})
              </option>
            ))}
          </select>
        )}

        <select
          name="approved"
          value={filters.approved}
          onChange={handleFilterChange}
          className="form-input"
        >
          <option value="">כל הסטטוסים</option>
          <option value="true">✅ מאושרים</option>
          <option value="false">⏳ ממתינים</option>
        </select>
      </div>

      {loading ? (
        <div>טוען משתמשים...</div>
      ) : (
        <div className="table-wrapper card-shadow">
          <table className="admin-table">
            <thead>
              <tr>
                <th>שם משתמש</th>
                <th>אימייל</th>
                <th>תפקיד נוכחי</th>
                <th>שינוי תפקיד</th>
                <th>סטטוס</th>
                <th>פעולות</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => {
                const id = u._id || u.id;
                const roleLabel =
                  roles.find((r) => r.key === u.role)?.label || u.role;

                return (
                  <tr key={id}>
                    <td className="bold">{u.username}</td>
                    <td>{u.email}</td>

                    <td>
                      <span className={`role-badge ${u.role}`}>
                        {roleLabel}
                      </span>
                    </td>

                    <td>
                      {canAssignRole ? (
                        <select
                          className="role-selector-inline"
                          value={u.role}
                          onChange={(e) => handleRoleUpdate(id, e.target.value)}
                        >
                          {/* אם התפקיד לא נמצא ברשימה */}
                          {canManageRoles &&
                            roles.every((r) => r.key !== u.role) && (
                              <option value={u.role}>
                                {u.role} (לא קיים בבאק)
                              </option>
                            )}

                          {/* אם אין הרשאת roles.manage אז לא נציג רשימה דינמית */}
                          {canManageRoles ? (
                            roles.map((r) => (
                              <option key={r.key} value={r.key}>
                                {r.label}
                              </option>
                            ))
                          ) : (
                            <option value={u.role}>{u.role}</option>
                          )}
                        </select>
                      ) : (
                        <span>{roleLabel} (אין הרשאת שינוי)</span>
                      )}
                    </td>

                    <td>
                      <span
                        className={`status-tag ${
                          u.isApproved ? 'approved' : 'pending'
                        }`}
                      >
                        {u.isApproved ? 'מאושר' : 'ממתין'}
                      </span>
                    </td>

                    <td className="actions-cell">
                      <button
                        onClick={() => handleDelete(id)}
                        className="btn-icon-delete"
                        title="מחק משתמש"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 16 }}>
                    אין משתמשים להצגה לפי הסינון.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
