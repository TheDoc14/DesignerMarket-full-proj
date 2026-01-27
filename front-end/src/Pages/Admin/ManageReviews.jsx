import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import '../../App.css';

const ManageReviews = () => {
    const { user: currentUser } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [projectsList, setProjectsList] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // סטייט לעריכה
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editForm, setEditForm] = useState({ text: '', rating: 5 });

    const [filters, setFilters] = useState({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        order: 'desc',
        projectId: ''
    });

    const getAuthHeader = () => ({
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchProjectsNames = useCallback(async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/admin/projects?limit=100`, getAuthHeader());
            setProjectsList(res.data.projects || []);
        } catch (err) {
            console.error("שגיאה בטעינת שמות פרויקטים", err);
        }
    }, []);

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            const queryParams = { ...filters };
            if (!queryParams.projectId) delete queryParams.projectId;

            const params = new URLSearchParams(queryParams).toString();
            const res = await axios.get(`http://localhost:5000/api/admin/reviews?${params}`, getAuthHeader());
            setReviews(res.data.reviews || []);
        } catch (err) {
            console.error("שגיאה בטעינת תגובות", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            fetchProjectsNames();
            fetchReviews();
        }
    }, [currentUser, fetchReviews, fetchProjectsNames]);

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("האם אתה בטוח שברצונך למחוק תגובה זו?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/reviews/${reviewId}`, getAuthHeader());
            alert("התגובה נמחקה בהצלחה");
            fetchReviews();
        } catch (err) {
            alert("מחיקת התגובה נכשלה");
        }
    };

    const handleStartEdit = (review) => {
        setEditingReviewId(review.id || review._id);
        setEditForm({
            text: review.text || review.comment || '', 
            rating: review.rating
        });
    };

    const handleSaveEdit = async (reviewId) => {
        try {
            await axios.put(`http://localhost:5000/api/reviews/${reviewId}`, editForm, getAuthHeader());
            alert("התגובה עודכנה");
            setEditingReviewId(null);
            fetchReviews();
        } catch (err) {
            alert("עדכון התגובה נכשל");
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
    };

    if (!currentUser || currentUser.role !== 'admin') return <div className="container">אין הרשאות אדמין.</div>;

    return (
        <div className="admin-container" style={{ direction: 'rtl', padding: '20px' }}>
            <h1>ניהול תגובות</h1>
            
            <div className="admin-toolbar" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <select name="projectId" value={filters.projectId} onChange={handleFilterChange}>
                    <option value="">כל הפרויקטים</option>
                    {projectsList.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.title}</option>)}
                </select>

                <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
                    <option value="createdAt">תאריך</option>
                    <option value="rating">דירוג</option>
                </select>
            </div>

            {loading ? <p>טוען...</p> : (
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>פרויקט</th>
                                <th>משתמש</th>
                                <th>דירוג</th>
                                <th>תגובה</th>
                                <th>פעולות</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* שים לב לסוגריים המסולסלים כאן שעוטפים את ה-map */}
                            {reviews.map(r => {
                                const rId = r.id || r._id;
                                const isEditing = editingReviewId === rId;

                                return (
                                    <tr key={rId}>
                                        <td>{r.project?.title || 'פרויקט לא ידוע'}</td>
                                        <td>{r.user?.username || 'אנונימי'}</td> 
                                        <td>
                                            {isEditing ? (
                                                <input 
                                                    type="number" min="1" max="5" 
                                                    value={editForm.rating}
                                                    onChange={(e) => setEditForm({...editForm, rating: parseInt(e.target.value)})}
                                                />
                                            ) : (
                                                <span style={{ color: '#f1c40f' }}>{'★'.repeat(r.rating)}</span>
                                            )}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <textarea 
                                                    value={editForm.text}
                                                    onChange={(e) => setEditForm({...editForm, text: e.target.value})}
                                                />
                                            ) : (
                                                r.text || r.comment 
                                            )}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <>
                                                    <button onClick={() => handleSaveEdit(rId)} className="approve-btn">שמור</button>
                                                    <button onClick={() => setEditingReviewId(null)} className="secondary-btn">ביטול</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleStartEdit(r)} className="edit-btn">ערוך</button>
                                                    <button onClick={() => handleDeleteReview(rId)} className="danger-btn">מחק</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageReviews;