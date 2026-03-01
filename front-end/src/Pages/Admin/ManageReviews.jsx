//src/Pages/Admin/ManageReviews.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { usePermission } from '../../Hooks/usePermission.jsx';
import { Trash2, Edit3, Save, MessageSquare } from 'lucide-react';
import '../../App.css';
import './AdminDesign.css';

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

      const res = await api.get('/api/admin/reviews', { params: queryParams });
      setReviews(res.data?.reviews || res.data?.data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, hasPermission]);

  const fetchProjectsNames = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/projects', {
        params: { limit: 100 },
      });
      setProjectsList(res.data?.projects || res.data?.data || []);
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
  }, [
    permissionLoading,
    currentUser?.id,
    hasPermission,
    fetchProjectsNames,
    fetchReviews,
  ]);

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
      await api.put(`/api/reviews/${reviewId}`, editForm);
      setEditingReviewId(null);
      fetchReviews();
    } catch (err) {
      console.error(err);
      alert('עדכון התגובה נכשל. וודא שהשרת תומך בעדכון תגובות בנתיב זה.');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId || !window.confirm('למחוק תגובה זו?')) return;
    try {
      await api.delete(`/api/reviews/${reviewId}`);
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
          {projectsList.map((p, idx) => {
            const id = p?._id || p?.id;
            const key = id ? `proj-${id}` : `proj-idx-${idx}`; // ✅ תמיד ייחודי

            return (
              <option key={key} value={id || ''}>
                {p?.title || `Project ${idx + 1}`}
              </option>
            );
          })}
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
