import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import '../../App.css';

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

      // המרת האובייקט ל-Query String בצורה נקייה
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      ).toString();

      const res = await axios.get(
        `http://localhost:5000/api/admin/users?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // התאמה למבנה הנתונים (וודא שהבאקנד מחזיר { users: [...] })
      setUsers(res.data.users || res.data || []);
    } catch (err) {
      console.error('טעינת משתמשים נכשלה', err);
      alert('שגיאה בטעינת משתמשים');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // שליפה בכל שינוי פילטר
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      const delayDebounceFn = setTimeout(() => {
        fetchUsers();
      }, 500); // השהיה של חצי שנייה כדי לא להציף בבקשות בזמן הקלדה

      return () => clearTimeout(delayDebounceFn);
    }
  }, [fetchUsers, currentUser]);

  // פונקציית מחיקה
  const handleDelete = async (userId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) return;

    try {
      const token = localStorage.getItem('token');
      // שימוש בנתיב הפרופיל הקיים שתומך במחיקה
      await axios.delete(`http://localhost:5000/api/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prev) => prev.filter((u) => (u._id || u.id) !== userId));
      alert('משתמש נמחק בהצלחה');
    } catch (err) {
      console.error('מחיקה נכשלה', err);
      alert(err.response?.data?.message || 'שגיאה במחיקת המשתמש');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  if (!currentUser) return <div className="container">טוען נתוני משתמש...</div>;
  if (currentUser.role !== 'admin')
    return <div className="container">אין הרשאות גישה לדף זה.</div>;
  const handleRoleUpdate = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      // הנתיב צריך להתאים לראוט האדמין לעדכון משתמש (למשל /api/admin/users/:id)
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // עדכון הסטייט המקומי כדי להציג את השינוי מיד
      setUsers((prev) =>
        prev.map((u) =>
          (u._id || u.id) === userId ? { ...u, role: newRole } : u
        )
      );
      alert('התפקיד עודכן בהצלחה');
    } catch (err) {
      console.error('עדכון תפקיד נכשל', err);
      alert(err.response?.data?.message || 'שגיאה בעדכון התפקיד');
    }
  };
  return (
    <div className="admin-container">
      <h1>ניהול משתמשים</h1>

      <div className="admin-toolbar-card">
        <div className="toolbar-search">
          <input
            name="q"
            placeholder="חיפוש לפי שם או אימייל..."
            value={filters.q}
            onChange={handleFilterChange}
            className="form-input"
          />
        </div>
        <select
          name="role"
          value={filters.role}
          onChange={handleFilterChange}
          className="toolbar-filters"
        >
          <option value="">כל התפקידים</option>
          <option value="student">סטודנט</option>
          <option value="designer">מעצב</option>
          <option value="customer">לקוח</option>
          <option value="admin">אדמין</option>
        </select>
        <select
          name="approved"
          value={filters.approved}
          onChange={handleFilterChange}
          className="toolbar-filters"
        >
          <option value="">כל הסטטוסים</option>
          <option value="true">מאושרים</option>
          <option value="false">ממתינים</option>
        </select>
      </div>

      {loading ? (
        <p>מעדכן רשימה...</p>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>שם משתמש</th>
                <th>אימייל</th>
                <th>תפקיד</th>
                <th>סטטוס</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u._id || u.id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td className={`role-badge ${u.role}`}>{u.role}</td>
                    <td
                      className={`status-tag ${u.isApproved ? 'approved' : 'pending'}`}
                    >
                      {u.isApproved ? '✅ מאושר' : '⏳ ממתין'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(u._id || u.id)}
                        className="btn-delete-small"
                      >
                        מחק
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-table-msg">
                    לא נמצאו משתמשים
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
