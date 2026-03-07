import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api/axios';
import { UserCog } from 'lucide-react';
import { usePermission } from '../../Hooks/usePermission.jsx';
import './AdminDesign.css';

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
    // שימוש ב-Ref כדי למנוע כפילויות ללא תלות ב-State של loading
    if (isInitialFetched.current) return;

    try {
      setLoading(true);
      const res = await api.get('/api/admin/users', {
        params: { approved: false },
      });

      const data = res.data?.users || res.data?.data || [];
      setUsers(data);
      isInitialFetched.current = true;
    } catch (err) {
      console.error('Error fetching users', err);
    } finally {
      setLoading(false);
    }
  }, []); // רשימת תלויות ריקה - הפונקציה יציבה

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
      await api.put(`/api/admin/users/${userId}/approval`, {
        isApproved: true,
      });
      setUsers((prev) => prev.filter((u) => (u._id || u.id) !== userId));
      alert('המשתמש אושר בהצלחה');
    } catch (err) {
      alert('שגיאה בתהליך האישור');
    }
  };

  // UserApproval.jsx - עדכון פונקציית הצפייה
  const handleViewDocument = async (documentUrl, username, role) => {
    try {
      // 1. חילוץ שם הקובץ הגולמי כפי ששמור ב-DB
      const rawFilename = documentUrl.split('/').pop();

      // 2. קריאה לשרת
      const response = await api.get(
        `api/files/approvalDocuments/${rawFilename}`, // שולחים את השם הגולמי
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream',
      });
      const url = window.URL.createObjectURL(blob);

      // 3. יצירת שם הורדה "נקי" למשתמש
      // כאן אנחנו משתמשים בפורמט שביקשת
      const extension = rawFilename.split('.').pop();
      const customFileName = `DesignerMarket_${username}-${role}.${extension}`;

      const link = document.createElement('a');
      link.href = url;
      link.download = customFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error('Download error:', err);
      alert('לא ניתן למצוא את הקובץ בשרת. ייתכן שיש בעיית קידוד בשם הקובץ.');
    }
  };
  // אבטחת גישה ברמת העמוד
  if (permissionLoading)
    return <div className="loader">בודק הרשאות אבטחה...</div>;
  if (!hasPermission('admin.panel.access')) {
    return <div className="error-container">אין לך הרשאה לצפות בדף זה.</div>;
  }

  return (
    <div className="admin-container" dir="rtl">
      <header className="dashboard-header">
        <h1>
          <UserCog size={30} /> אישור משתמשים
        </h1>{' '}
        <p>ניהול בקשות הצטרפות של מעצבים וסטודנטים למערכת Designer Market.</p>
      </header>
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
                              handleViewDocument(
                                u.approvalDocument,
                                u.username,
                                u.role
                              )
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
