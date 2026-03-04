import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api/axios';
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
    // אם כבר טוען או שכבר שלפנו נתונים - אל תעשה כלום
    if (loading || isInitialFetched.current) return;

    try {
      setLoading(true);
      const res = await api.get('/api/admin/users', {
        params: { approved: false },
      });
      setUsers(res.data?.users || res.data?.data || []);
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
  const handleViewDocument = async (documentUrl, username) => {
    try {
      // 1. חילוץ שם הקובץ מהנתיב המלא שנשמר ב-DB
      const rawFilename = documentUrl.split('/').pop();

      // 2. פענוח תווים מיוחדים (כמו עברית) לפני השליחה
      const filename = rawFilename;

      // 3. קריאה לשרת - שימי לב לנתיב המדויק
      // אנחנו מוסיפים /files/ כי ככה ה-Backend הגדיר את הראוטים שלו
      const response = await api.get(
        `api/files/approvalDocuments/${filename}`,
        {
          responseType: 'blob', // קריטי כדי לקבל קובץ ולא טקסט
        }
      );

      // 4. יצירת לינק זמני לצפייה בקובץ
      const blob = new Blob([response.data], {
        type: response.headers['content-type'],
      });
      const url = window.URL.createObjectURL(blob);

      // פתיחה בחלון חדש
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        alert('הדפדפן חסם את הפופ-אפ, אנא אפשרי הצגת פופ-אפים');
      }

      // ניקוי זיכרון אחרי 10 שניות
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error('Download error:', err);
      alert('שגיאה בטעינת המסמך. וודאי שהקובץ קיים בשרת.');
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
