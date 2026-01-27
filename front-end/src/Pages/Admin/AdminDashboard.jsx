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
                // פנייה לנתיב הסטטיסטיקות שהגדרת ב-Routes
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
        // וידוא שהמשתמש הוא אדמין לפני השליפה
        if (currentUser?.role === 'admin') fetchStats();
    }, [currentUser]);

    if (loading) return <div className="loader">טוען נתונים...</div>;
    if (!stats) return <div className="alert alert-error">לא ניתן לטעון נתונים כרגע.</div>;

    return (
        <div className="admin-container dashboard-enhanced" style={{ direction: 'rtl', padding: '20px' }}>
            <header className="dashboard-header" style={{ marginBottom: '30px', textAlign: 'center' }}>
                <h1 style={{ color: '#2c3e50' }}>לוח בקרה למנהל</h1>
                <p style={{ color: '#7f8c8d' }}>סיכום פעילות המערכת וביצועים</p>
            </header>

            {/* שורת פעולות דחופות - אישורים ממתינים */}
            <div className="action-cards" style={styles.flexRow}>
                <Link to="/admin/user-approval" className="stat-card" style={{ ...styles.card, borderRight: '5px solid #f39c12' }}>
                    <div className="stat-icon" style={{ fontSize: '2rem' }}>🔔</div>
                    <div className="stat-content">
                        <h4 style={{ margin: '5px 0' }}>אישורי משתמשים</h4>
                        <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '5px 0' }}>{stats.usersPendingApproval}</p>
                        <span style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>ממתינים לבדיקה</span>
                    </div>
                </Link>

                <Link to="/admin/manage-projects" className="stat-card" style={{ ...styles.card, borderRight: '5px solid #9b59b6' }}>
                    <div className="stat-icon" style={{ fontSize: '2rem' }}>🚀</div>
                    <div className="stat-content">
                        <h4 style={{ margin: '5px 0' }}>פרויקטים חדשים</h4>
                        <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '5px 0' }}>{stats.projectsPendingPublish}</p>
                        <span style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>ממתינים לפרסום</span>
                    </div>
                </Link>
            </div>

            {/* נתונים כלליים */}
            <div className="dashboard-grid" style={styles.grid}>
                <div className="stat-card" style={{ ...styles.card, backgroundColor: '#e3f2fd' }}>
                    <div style={{ color: '#1976d2', fontWeight: 'bold' }}>סה"כ משתמשים</div>
                    <div style={{ fontSize: '2rem', margin: '10px 0' }}>{stats.usersTotal}</div>
                    <small>אדמינים, מעצבים ולקוחות</small>
                </div>
                <div className="stat-card" style={{ ...styles.card, backgroundColor: '#e8f5e9' }}>
                    <div style={{ color: '#388e3c', fontWeight: 'bold' }}>פרויקטים באתר</div>
                    <div style={{ fontSize: '2rem', margin: '10px 0' }}>{stats.projectsTotal}</div>
                    <small>סה"כ פרויקטים שהועלו</small>
                </div>
                <div className="stat-card" style={{ ...styles.card, backgroundColor: '#f5f5f5' }}>
                    <div style={{ color: '#616161', fontWeight: 'bold' }}>תגובות ודירוגים</div>
                    <div style={{ fontSize: '2rem', margin: '10px 0' }}>{stats.reviewsTotal}</div>
                    <small>אינטראקציה בקהילה</small>
                </div>
            </div>

            {/* ניתוח נתונים ודירוגים */}
            <div className="analytics-section" style={{ ...styles.grid, gridTemplateColumns: '1fr 1fr' }}>
                <div className="analytics-card" style={styles.card}>
                    <h3 style={{ borderBottom: '2px solid #f1c40f', paddingBottom: '10px' }}>🏆 מובילים בדירוג</h3>
                    <div className="ranking-list" style={{ marginTop: '15px' }}>
                        {stats.topRated.map((p, index) => (
                            <div key={p._id || index} style={styles.rankingItem}>
                                <span>{index + 1}. {p.title}</span>
                                <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>⭐ {Number(p.averageRating).toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="analytics-card" style={styles.card}>
                    <h3 style={{ borderBottom: '2px solid #e67e22', paddingBottom: '10px' }}>🔥 הכי פופולריים</h3>
                    <div className="ranking-list" style={{ marginTop: '15px' }}>
                        {stats.mostReviewed.map((p, index) => (
                            <div key={p._id || index} style={styles.rankingItem}>
                                <span>{index + 1}. {p.title}</span>
                                <span style={{ color: '#e67e22', fontWeight: 'bold' }}>💬 {p.reviewsCount} תגובות</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    flexRow: { display: 'flex', gap: '20px', marginBottom: '30px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' },
    card: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textDecoration: 'none', color: 'inherit' },
    rankingItem: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }
};

export default AdminDashboard;