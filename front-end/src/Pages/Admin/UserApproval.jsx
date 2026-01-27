import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../PublicPages.css';

const UserApproval = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        'http://localhost:5000/api/admin/users?approved=false',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Error fetching users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/approval`,
        { isApproved: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert('המשתמש אושר בהצלחה');
    } catch (err) {
      alert('שגיאה בתהליך האישור');
    }
  };

  const handleViewDocument = async (documentUrl, username) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(documentUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // קריטי לקבלת קובץ גולמי
      });

      // יצירת אובייקט URL מהמידע שהתקבל
      const blob = new Blob([response.data], {
        type: response.headers['content-type'],
      });
      const url = window.URL.createObjectURL(blob);

      // יצירת אלמנט קישור זמני לביצוע ההורדה/פתיחה
      const link = document.createElement('a');
      link.href = url;

      // שם הקובץ שיוצג בהורדה
      link.setAttribute('download', `Approval_${username}.pdf`);

      document.body.appendChild(link);
      link.click();

      // ניקוי המשאבים
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error viewing document:', err);
      alert('לא ניתן לגשת למסמך. וודא שהטוקן תקין ושאתה מחובר כאדמין.');
    }
  };

  if (loading)
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        טוען משתמשים ממתינים...
      </div>
    );

  return (
    <div className="admin-container">
      <h2 className="admin-header">אישור משתמשים חדשים</h2>
      <p>יש לאשר את זהות המעצבים לפני שהם יוכלו למכור פרויקטים במערכת.</p>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr
              style={{
                background: '#f8f9fa',
                borderBottom: '2px solid #dee2e6',
              }}
            >
              <th>שם משתמש</th>
              <th>אימייל</th>
              <th>תפקיד</th>
              <th>מסמך אישור</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{u.username}</td>
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
                      📄 הורד/צפה במסמך
                    </button>
                  ) : (
                    <span className="no-doc">אין מסמך</span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => handleApprove(u.id)}
                    className="btn-approve"
                  >
                    אשר
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="empty-table-msg">
          <p>אין כרגע משתמשים הממתינים לאישור.</p>
        </div>
      )}
    </div>
  );
};

export default UserApproval;
