//src/Pages/Admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import './AdminDesign.css';
import { usePermission } from '../../Hooks/usePermission.jsx';

/*The AdminDashboard serves as the primary oversight interface for platform administrators.
 *It provides a high-level summary of system activity, user growth, and content performance.
 *The page is heavily protected by the Role-Based Access Control (RBAC) system, ensuring that only authorized personnel
 *can view sensitive statistics or access administrative management tools.
 */
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
    //Statistics are only fetched if the user has the stats.read permission.
    if (hasPermission('stats.read')) fetchStats();
    else setLoading(false);
  }, [hasPermission]);
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

      <div className="action-cards">
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

      {/* General Data*/}
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

      {/* Data and rank analyze*/}
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
