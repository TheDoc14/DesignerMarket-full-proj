import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import { UserCog, Trash2, ShieldCheck, Search } from 'lucide-react';
import './AdminDesign.css';

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: '',
    role: '',
    approved: '',
    page: 1,
    limit: 10,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      ).toString();

      const res = await axios.get(
        `http://localhost:5000/api/admin/users?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(res.data.users || res.data || []);
    } catch (err) {
      console.error('טעינת משתמשים נכשלה', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      const delayDebounceFn = setTimeout(() => fetchUsers(), 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [fetchUsers, currentUser]);

  const handleRoleUpdate = async (userId, newRole) => {
    if (!window.confirm(`האם לשנות את תפקיד המשתמש ל-${newRole}?`)) return;

    try {
      const token = localStorage.getItem('token');
      // עדכון הראוט לכתובת הנכונה לפי הקבצים ששלחת קודם
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((u) => (u._id || u.id) !== userId));
    } catch (err) {
      alert('שגיאה במחיקת המשתמש');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  if (!currentUser) return <div className="loader">טוען...</div>;
  if (currentUser.role !== 'admin')
    return <div className="error-container">אין הרשאות גישה.</div>;

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
        <br></br>
        <select
          name="role"
          value={filters.role}
          onChange={handleFilterChange}
          className="form-input"
        >
          <option value="">כל התפקידים</option>
          <option value="student">סטודנט</option>
          <option value="designer">מעצב</option>
          <option value="customer">לקוח</option>
          <option value="systemmanager">מנהל מערכת</option>
          <option value="admin">אדמין</option>
        </select>
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
            {users.map((u) => (
              <tr key={u._id || u.id}>
                <td className="bold">{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`role-badge ${u.role}`}>{u.role}</span>
                </td>
                <td>
                  <select
                    className="role-selector-inline"
                    value={u.role}
                    onChange={(e) =>
                      handleRoleUpdate(u._id || u.id, e.target.value)
                    }
                  >
                    <option value="customer">לקוח</option>
                    <option value="student">סטודנט</option>
                    <option value="designer">מעצב</option>
                    <option value="systemmanager">מנהל מערכת</option>
                    <option value="admin">אדמין</option>
                  </select>
                </td>
                <td>
                  <span
                    className={`status-tag ${u.isApproved ? 'approved' : 'pending'}`}
                  >
                    {u.isApproved ? 'מאושר' : 'ממתין'}
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    onClick={() => handleDelete(u._id || u.id)}
                    className="btn-icon-delete"
                    title="מחק משתמש"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
