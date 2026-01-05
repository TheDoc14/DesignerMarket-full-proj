import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import { Link } from 'react-router-dom';
import '../../App.css';

const AdminDashboard = () => {
    const { user: currentUser } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                // שליפת נתוני ה-stats המורחבים
                const res = await axios.get('http://localhost:5000/api/admin/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setStats(res.data.stats);
            } catch (err) {
                console.error("Error fetching stats", err);
            } finally {
                setLoading(false);
            }
        };
        if (currentUser?.role === 'admin') fetchStats();
    }, [currentUser]);

    if (loading) return <div className="loader">טוען נתונים...</div>;
    if (!stats) return <div className="alert alert-error">לא ניתן לטעון נתונים כרגע.</div>;

    return (
        <div className="admin-container dashboard-enhanced">
            <header className="dashboard-header">
                <h1>סיכום נתוני מערכת</h1>
                <p>מבט על הביצועים והפעילות באתר</p>
            </header>

            {/* שורת כרטיסי פעולה דחופה (Urgent Actions) */}
            <div className="action-cards">
                <Link to="/admin/approvals" className="stat-card highlight-orange">
                    <div className="stat-icon">🔔</div>
                    <div className="stat-content">
                        <h4>אישורי משתמשים</h4>
                        <p className="stat-number">{stats.usersPendingApproval}</p>
                        <span>ממתינים לבדיקה</span>
                    </div>
                </Link>

                <Link to="/admin/projects" className="stat-card highlight-purple">
                    <div className="stat-icon">🚀</div>
                    <div className="stat-content">
                        <h4>פרויקטים חדשים</h4>
                        <p className="stat-number">{stats.projectsPendingPublish}</p>
                        <span>ממתינים לפרסום</span>
                    </div>
                </Link>
            </div>

            {/* שורת סטטיסטיקה כללית */}
            <div className="dashboard-grid">
                <div className="stat-card info-blue">
                    <div className="stat-label">סה"כ משתמשים רשומים</div>
                    <div className="stat-value">{stats.usersTotal}</div>
                    <div className="stat-footer">כולל אדמינים ולקוחות</div>
                </div>
                <div className="stat-card info-green">
                    <div className="stat-label">פרויקטים במאגר</div>
                    <div className="stat-value">{stats.projectsTotal}</div>
                    <div className="stat-footer">פרויקטים שהועלו סה"כ</div>
                </div>
                <div className="stat-card info-gray">
                    <div className="stat-label">תגובות שנכתבו</div>
                    <div className="stat-value">{stats.reviewsTotal}</div>
                    <div className="stat-footer">אינטראקציה בין משתמשים</div>
                </div>
            </div>

            {/* טבלאות דירוג ופופולריות */}
            <div className="analytics-section">
                <div className="analytics-card">
                    <h3>🏆 מובילים בדירוג (Top Rated)</h3>
                    <div className="ranking-list">
                        {stats.topRated.map((p, index) => (
                            <div key={p.id || index} className="ranking-item">
                                <span className="rank-number">{index + 1}</span>
                                <span className="rank-title">{p.title}</span>
                                <span className="rank-score">⭐ {Number(p.averageRating).toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="analytics-card">
                    <h3>🔥 הכי הרבה תגובות (Engaged)</h3>
                    <div className="ranking-list">
                        {stats.mostReviewed.map((p, index) => (
                            <div key={p.id || index} className="ranking-item">
                                <span className="rank-number">{index + 1}</span>
                                <span className="rank-title">{p.title}</span>
                                <span className="rank-score">💬 {p.reviewsCount}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;