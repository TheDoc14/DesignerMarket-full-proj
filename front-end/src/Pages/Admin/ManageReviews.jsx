import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { usePermission } from '../../Hooks/usePermission.jsx';
import {
  Trash2,
  Edit3,
  Save,
  XCircle,
  Star,
  MessageSquare,
} from 'lucide-react';
import '../../App.css';
import './AdminDesign.css';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const ManageReviews = () => {
  const {
    hasPermission,
    user: currentUser,
    loading: permissionLoading,
  } = usePermission();
  const [reviews, setReviews] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editForm, setEditForm] = useState({ text: '', rating: 5 });

  const [filters, setFilters] = useState({
    page: 1,
    sortBy: 'createdAt',
    projectId: '',
  });

  // 1. שליפת תגובות - שימוש בנתיב המדויק של האדמין
  const fetchReviews = useCallback(async () => {
    if (!hasPermission('reviews.manage')) return;
    try {
      setLoading(true);
      const queryParams = { ...filters };
      if (!queryParams.projectId) delete queryParams.projectId;

      const params = new URLSearchParams(queryParams).toString();
      const res = await axios.get(
        `http://localhost:5000/api/admin/reviews?${params}`,
        getAuthHeader()
      );
      // עדכון ה-State עם המידע החדש בלבד כדי למנוע "שכפולים"
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, hasPermission]);

  const fetchProjectsNames = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/admin/projects?limit=100`,
        getAuthHeader()
      );
      setProjectsList(res.data.projects || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (
      !permissionLoading &&
      currentUser?.id &&
      hasPermission('reviews.manage')
    ) {
      fetchProjectsNames();
      fetchReviews();
    }
  }, [currentUser?.id, permissionLoading, filters.projectId, filters.sortBy]);

  // 2. תיקון קריטי: שליפת ה-ID הנכון (_id)
  const handleStartEdit = (review) => {
    const rId = review._id || review.id; // פתרון לשגיאת undefined
    setEditingReviewId(rId);
    setEditForm({
      text: review.text || '',
      rating: review.rating || 5,
    });
  };

  const handleSaveEdit = async (reviewId) => {
    if (!reviewId) return alert('שגיאה: מזהה תגובה חסר');
    try {
      // שליחה לנתיב הכללי של עדכון תגובות
      await axios.put(
        `http://localhost:5000/api/reviews/${reviewId}`,
        editForm,
        getAuthHeader()
      );
      setEditingReviewId(null);
      fetchReviews(); // ריענון הרשימה
    } catch (err) {
      console.error(err);
      alert('עדכון התגובה נכשל. וודא שהשרת תומך בעדכון תגובות בנתיב זה.');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId || !window.confirm('למחוק תגובה זו?')) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/reviews/${reviewId}`,
        getAuthHeader()
      );
      fetchReviews();
    } catch (err) {
      alert('המחיקה נכשלה');
    }
  };

  if (permissionLoading) return <div className="loader">בודק הרשאות...</div>;

  return (
    <div className="admin-container" dir="rtl">
      <header className="admin-header">
        <h1>
          <MessageSquare size={32} /> ניהול תגובות
        </h1>
      </header>

      <div className="admin-toolbar">
        <select
          name="projectId"
          value={filters.projectId}
          onChange={(e) =>
            setFilters({ ...filters, projectId: e.target.value, page: 1 })
          }
        >
          <option value="">כל הפרויקטים</option>
          {projectsList.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>פרויקט</th>
              <th>כותב</th>
              <th>דירוג</th>
              <th>תוכן</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              reviews.map((r) => {
                const rId = r._id || r.id; // שימוש ב-Key ייחודי לכל שורה
                return (
                  <tr key={rId}>
                    <td>{r.project?.title || 'פרויקט כללי'}</td>
                    <td>
                      {r.userId?.username || r.user?.username || 'אנונימי'}
                    </td>
                    <td>
                      {editingReviewId === rId ? (
                        <select
                          value={editForm.rating}
                          onChange={(e) =>
                            setEditForm({ ...editForm, rating: e.target.value })
                          }
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      ) : (
                        '⭐'.repeat(r.rating)
                      )}
                    </td>
                    <td>
                      {editingReviewId === rId ? (
                        <textarea
                          value={editForm.text}
                          onChange={(e) =>
                            setEditForm({ ...editForm, text: e.target.value })
                          }
                        />
                      ) : (
                        r.text
                      )}
                    </td>
                    <td>
                      <div className="admin-actions-cell">
                        {editingReviewId === rId ? (
                          <button
                            onClick={() => handleSaveEdit(rId)}
                            className="btn-icon"
                          >
                            <Save size={18} color="#00b894" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(r)}
                              className="btn-icon"
                            >
                              <Edit3 size={18} color="#0984e3" />
                            </button>
                            <button
                              onClick={() => handleDeleteReview(rId)}
                              className="btn-icon"
                            >
                              <Trash2 size={18} color="#e17055" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageReviews;
