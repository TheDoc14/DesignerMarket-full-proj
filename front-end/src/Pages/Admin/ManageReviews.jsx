import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import '../../App.css';

const ManageReviews = () => {
    const { user: currentUser } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // ניהול פילטרים לפי הפרמטרים שהבאקנד מקבל (page, limit, sortBy, order)
    const [filters, setFilters] = useState({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        order: 'desc'
    });

    const getAuthHeader = () => ({
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams(filters).toString();
            // קריאה לראוט המדויק מהבאקנד
            const res = await axios.get(`http://localhost:5000/api/admin/reviews?${params}`, getAuthHeader());
            setReviews(res.data.reviews || []);
        } catch (err) {
            console.error("שגיאה בטעינת תגובות", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (currentUser?.role === 'admin') fetchReviews();
    }, [currentUser, fetchReviews]);

    if (!currentUser || currentUser.role !== 'admin') return <div className="container">אין הרשאות אדמין.</div>;

    return (
        <div className="admin-container">
            <h1>ניהול תגובות</h1>
            <p>צפייה וניטור של כל התגובות שנכתבו על פרויקטים באתר.</p>
            
            <div className="admin-toolbar" style={{ marginBottom: '20px' }}>
                <label>מיין לפי: </label>
                <select value={filters.sortBy} onChange={(e) => setFilters({...filters, sortBy: e.target.value})}>
                    <option value="createdAt">תאריך יצירה</option>
                    <option value="rating">דירוג כוכבים</option>
                </select>
            </div>

            {loading ? <p>טוען תגובות...</p> : (
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>פרויקט</th>
                                <th>משתמש</th>
                                <th>דירוג</th>
                                <th>תוכן התגובה</th>
                                <th>תאריך</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.length > 0 ? (
                                reviews.map(r => (
                                    <tr key={r.id}>
                                        <td><strong>{r.project?.title || 'פרויקט כללי'}</strong></td>
                                        <td>{r.userId?.username || 'משתמש'}</td>
                                        <td style={{ color: '#f1c40f' }}>
                                            {/* מציג כוכבים לפי הדירוג המספרי */}
                                            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                                        </td>
                                        <td>{r.comment || r.text}</td>
                                        <td>{new Date(r.createdAt).toLocaleDateString('he-IL')}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="no-data-msg">לא נמצאו תגובות במערכת.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageReviews;