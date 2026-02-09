import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import {
  Trash2,
  Edit3,
  Save,
  XCircle,
  Star,
  MessageSquare,
  User,
  Package,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import '../../App.css';
import './AdminDesign.css';

const ManageReviews = () => {
  const { user: currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editForm, setEditForm] = useState({ text: '', rating: 5 });

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    order: 'desc',
    projectId: '',
  });

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const fetchProjectsNames = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/admin/projects?limit=100`,
        getAuthHeader()
      );
      setProjectsList(res.data.projects || []);
    } catch (err) {
      console.error('שגיאה בטעינת שמות פרויקטים', err);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = { ...filters };
      if (!queryParams.projectId) delete queryParams.projectId;
      const params = new URLSearchParams(queryParams).toString();
      const res = await axios.get(
        `http://localhost:5000/api/admin/reviews?${params}`,
        getAuthHeader()
      );
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error('שגיאה בטעינת תגובות', err);
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
    if (!window.confirm('האם למחוק תגובה זו לצמיתות?')) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/reviews/${reviewId}`,
        getAuthHeader()
      );
      fetchReviews();
    } catch (err) {
      alert('מחיקת התגובה נכשלה');
    }
  };

  const handleStartEdit = (review) => {
    setEditingReviewId(review.id || review._id);
    setEditForm({
      text: review.text || review.comment || '',
      rating: review.rating,
    });
  };

  const handleSaveEdit = async (reviewId) => {
    try {
      // הגבלת תווים בביקורת לפי דרישות ה-QA
      if (editForm.text.length > 1500) {
        alert('הביקורת ארוכה מדי. מקסימום 1500 תווים.');
        return;
      }
      await axios.put(
        `http://localhost:5000/api/reviews/${reviewId}`,
        editForm,
        getAuthHeader()
      );
      setEditingReviewId(null);
      fetchReviews();
    } catch (err) {
      alert('עדכון התגובה נכשל');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  if (!currentUser || currentUser.role !== 'admin')
    return <div className="container">אין הרשאות אדמין.</div>;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>
          <MessageSquare size={32} color="#0984e3" /> ניהול תגובות ודירוגים
        </h1>
        <p>פיקוח על איכות התוכן, עריכת ביקורות וניהול דירוגי מוצרים במערכת</p>
      </header>

      {/* סרגל כלים משופר */}
      <div className="admin-toolbar">
        <div>
          <label>
            <Package size={16} /> סנן לפי פרויקט
          </label>
          <select
            name="projectId"
            value={filters.projectId}
            onChange={handleFilterChange}
          >
            <option value="">כל הפרויקטים במערכת</option>
            {projectsList.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>
            <ArrowUpDown size={16} /> מיין תוצאות
          </label>
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
          >
            <option value="createdAt">לפי תאריך (חדש קודם)</option>
            <option value="rating">לפי דירוג כוכבים</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>פרויקט</th>
              <th>כותב התגובה</th>
              <th>דירוג</th>
              <th>תוכן התגובה</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5">טוען נתונים...</td>
              </tr>
            ) : reviews.length > 0 ? (
              reviews.map((r) => {
                const rId = r.id || r._id;
                const isEditing = editingReviewId === rId;

                return (
                  <tr key={rId} className="table-row-hover">
                    <td>
                      <div>{r.project?.title || 'פרויקט לא ידוע'}</div>
                    </td>
                    <td>
                      <div>{r.user?.username || 'אנונימי'}</div>
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          value={editForm.rating}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              rating: parseInt(e.target.value),
                            })
                          }
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n} כוכבים
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < r.rating ? '#f1c40f' : 'none'}
                            />
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <textarea
                          className="form-textarea"
                          value={editForm.text}
                          onChange={(e) =>
                            setEditForm({ ...editForm, text: e.target.value })
                          }
                        />
                      ) : (
                        <div>{r.text || r.comment}</div>
                      )}
                    </td>
                    <td>
                      <div>
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(rId)}
                              className="btn-icon"
                              title="שמור"
                            >
                              <Save size={18} color="#00b894" />
                            </button>
                            <button
                              onClick={() => setEditingReviewId(null)}
                              className="btn-icon"
                              title="ביטול"
                            >
                              <XCircle size={18} color="#d63031" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(r)}
                              className="btn-icon"
                              title="ערוך"
                            >
                              <Edit3 size={18} color="#0984e3" />
                            </button>
                            <button
                              onClick={() => handleDeleteReview(rId)}
                              className="btn-icon"
                              title="מחק"
                            >
                              <Trash2 size={18} color="#e17055" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5">לא נמצאו תגובות התואמות לחיפוש.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageReviews;
