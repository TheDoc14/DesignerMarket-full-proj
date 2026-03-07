//src/Pages/Admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import './AdminDesign.css';
import { usePermission } from '../../Hooks/usePermission.jsx'; // ייבוא ה-Hook החדש

const AdminDashboard = () => {
  const { hasPermission } = usePermission();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/admin/stats');
        setStats(res.data?.stats || res.data?.data?.stats);
      } catch (err) {
        console.error('Error fetching stats', err);
      } finally {
        setLoading(false);
      }
    };

    if (hasPermission('stats.read')) fetchStats();
    else setLoading(false);
  }, [hasPermission]);
  // אם אין הרשאה כללית לפאנל האדמין, נחסום את הגישה מיד
  if (!hasPermission('admin.panel.access')) {
    return <div className="alert alert-error">אין לך הרשאות לצפות בדף זה.</div>;
  }

  if (loading) return <div className="loader">טוען נתונים...</div>;
  if (!stats)
    return <div className="alert alert-error">לא ניתן לטעון נתונים כרגע.</div>;

  return (
    <div className="admin-container dashboard-enhanced">
      <header className="dashboard-header">
        <h1>לוח בקרה למנהל</h1>
        <p>סיכום פעילות המערכת וביצועים</p>
      </header>

      {/* שורת פעולות דחופות - אישורים ממתינים */}
      <div className="action-cards">
        {/* הצגת כרטיס אישורי משתמשים רק למי שמורשה לאשר משתמשים */}
        {hasPermission('users.approve') && (
          <Link to="/admin/user-approval" className="stat-card">
            <div className="stat-icon">🔔</div>
            <div className="stat-content">
              <h4>אישורי משתמשים</h4>
              <p>{stats.usersPendingApproval}</p>
              <span>ממתינים לבדיקה</span>
            </div>
          </Link>
        )}

        {hasPermission('projects.publish') && (
          <Link to="/admin/manage-projects" className="stat-card">
            <div className="stat-icon">🚀</div>
            <div className="stat-content">
              <h4>פרויקטים חדשים</h4>
              <p>{stats.projectsPendingPublish}</p>
              <span>ממתינים לפרסום</span>
            </div>
          </Link>
        )}
      </div>

      {/* נתונים כלליים */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div>סה"כ משתמשים</div>
          <div>{stats.usersTotal}</div>
          <small>מנהלי מערכת, מנהלים עסקיים, סטודנטים, מעצבים ולקוחות</small>
        </div>
        <div className="stat-card">
          <div>פרויקטים באתר</div>
          <div>{stats.projectsTotal}</div>
          <small>סה"כ פרויקטים שהועלו</small>
        </div>
        <div className="stat-card">
          <div>תגובות ודירוגים</div>
          <div>{stats.reviewsTotal}</div>
          <small>אינטראקציה בקהילה</small>
        </div>
      </div>

      {/* ניתוח נתונים ודירוגים */}
      <div className="analytics-section">
        <div className="analytics-card">
          <h3>🏆 מובילים בדירוג</h3>
          <div className="ranking-list">
            {stats.topRated.map((p, index) => (
              <div key={p._id || index}>
                <span>
                  {index + 1}. {p.title}
                </span>
                <span>⭐ {Number(p.averageRating).toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <h3>🔥 הכי פופולריים</h3>
          <div className="ranking-list">
            {stats.mostReviewed.map((p, index) => (
              <div key={p._id || index}>
                <span>
                  {index + 1}. {p.title}
                </span>
                <span className="review-count">💬 {p.reviewsCount} תגובות</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
