import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { usePermission } from '../../Hooks/usePermission.jsx';
import './AdminDesign.css';

// פונקציית עזר מחוץ לקומפוננטה
const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const UserApproval = () => {
  const {
    hasPermission,
    user: currentUser,
    loading: permissionLoading,
  } = usePermission();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false); // התחלה מ-false

  // שימוש ב-Ref כדי לוודא שלא נכנסים ללולאה אינסופית
  const isInitialFetched = useRef(false);

  const fetchUsers = useCallback(async () => {
    // אם כבר טוען או שכבר שלפנו נתונים - אל תעשה כלום
    if (loading || isInitialFetched.current) return;

    try {
      setLoading(true);
      const res = await axios.get(
        'http://localhost:5000/api/admin/users?approved=false',
        getAuthHeader()
      );
      setUsers(res.data.users || []);
      isInitialFetched.current = true; // סימון שהשליפה הצליחה
    } catch (err) {
      console.error('Error fetching users', err);
    } finally {
      setLoading(false);
    }
  }, [loading]); // תלות מינימלית בלבד

  useEffect(() => {
    // התנאי הקריטי: מריצים רק אם ההרשאות מוכנות, המשתמש מורשה, וטרם שלפנו נתונים
    if (
      !permissionLoading &&
      currentUser?.id &&
      hasPermission('users.read') &&
      !isInitialFetched.current
    ) {
      fetchUsers();
    }
  }, [currentUser?.id, permissionLoading, hasPermission, fetchUsers]);

  const handleApprove = async (userId) => {
    if (!hasPermission('users.approve')) {
      alert('אין לך הרשאה לאשר משתמשים');
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/approval`,
        { isApproved: true },
        getAuthHeader()
      );
      // עדכון ה-State המקומי - מונע צורך ב-fetchUsers מחדש
      setUsers((prev) => prev.filter((u) => (u._id || u.id) !== userId));
      alert('המשתמש אושר בהצלחה');
    } catch (err) {
      alert('שגיאה בתהליך האישור');
    }
  };

  const handleViewDocument = async (documentUrl, username) => {
    if (!hasPermission('files.approvalDocs.read')) {
      alert('אין לך הרשאה לצפות במסמכים');
      return;
    }
    // ... לוגיקת הורדה (כפי שהייתה קודם) ...
  };

  // אבטחת גישה ברמת העמוד
  if (permissionLoading)
    return <div className="loader">בודק הרשאות אבטחה...</div>;
  if (!hasPermission('admin.panel.access')) {
    return <div className="error-container">אין לך הרשאה לצפות בדף זה.</div>;
  }

  return (
    <div className="admin-container" dir="rtl">
      <h2 className="admin-header">אישור משתמשים חדשים</h2>
      <p>ניהול בקשות הצטרפות של מעצבים וסטודנטים למערכת Designer Market.</p>

      {loading && users.length === 0 ? (
        <div className="fetching-msg">טוען נתונים מהשרת...</div>
      ) : (
        <div className="table-wrapper card-shadow">
          <table className="admin-table">
            <thead>
              <tr>
                <th>שם משתמש</th>
                <th>אימייל</th>
                <th>תפקיד</th>
                <th>מסמך אישור</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((u) => {
                  const userId = u._id || u.id;
                  return (
                    <tr key={userId}>
                      <td className="bold">{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge ${u.role}`}>{u.role}</span>
                      </td>
                      <td>
                        {u.approvalDocument ? (
                          <button
                            onClick={() =>
                              handleViewDocument(u.approvalDocument, u.username)
                            }
                            className="btn-link"
                          >
                            📄 צפה במסמך
                          </button>
                        ) : (
                          <span className="no-doc">אין מסמך</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleApprove(userId)}
                          className="btn-approve-action"
                        >
                          אשר משתמש
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="empty-msg">
                    אין משתמשים הממתינים לאישור כרגע.
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

export default UserApproval;
