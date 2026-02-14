import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { usePermission } from '../../Hooks/usePermission.jsx';
import {
  Tag,
  Plus,
  Trash2,
  FolderPlus,
  Info,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import '../PublicPages.css';

const ManageCategories = () => {
  const { hasPermission, user, loading: permissionLoading } = usePermission(); // מוסיפים את user
  const [categories, setCategories] = useState([]);
  const [newCategoryLabel, setNewCategoryLabel] = useState(''); // שם לתצוגה
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  // שליפת קטגוריות מנתיב האדמין כדי לקבל את האובייקטים המלאים (key, label)
  const fetchCategories = useCallback(async () => {
    if (loading === false && categories.length > 0) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(
        'http://localhost:5000/api/admin/categories',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // ה-Backend מחזיר אובייקט עם שדה categories
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setLoading(false);
    }
  }, [categories.length, loading]);

  useEffect(() => {
    if (user && hasPermission('categories.manage')) {
      fetchCategories();
    }
  }, [user, hasPermission]); // שימוש ב-user ו-hasPermission כתלויות יציבות

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryLabel.trim()) return;

    // יצירת KEY אוטומטי מה-Label (למשל: "Jewelry" -> "jewelry")
    const generatedKey = newCategoryLabel
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');

    try {
      await axios.post(
        'http://localhost:5000/api/admin/categories',
        {
          key: generatedKey, // חובה לפי ה-Backend
          label: newCategoryLabel.trim(), // חובה לפי ה-Backend
        },
        getHeaders()
      );

      setMessage({ type: 'success', text: 'הקטגוריה נוספה בהצלחה!' });
      setNewCategoryLabel('');
      await fetchCategories();
      fetchCategories();
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'שגיאה בהוספת קטגוריה',
      });
    }
  };

  const handleDeleteCategory = async (catKey) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק קטגוריה זו?`)) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/admin/categories/${catKey}`,
        getHeaders()
      );
      await fetchCategories();
      fetchCategories();

      setMessage({ type: 'success', text: 'הקטגוריה הוסרה' });
    } catch (err) {
      alert(err.response?.data?.message || 'לא ניתן למחוק קטגוריה זו');
    }
  };

  if (permissionLoading) return <div className="loader">בודק הרשאות...</div>;
  if (!hasPermission('categories.manage')) {
    return (
      <div className="admin-container">אין לך הרשאות לניהול קטגוריות.</div>
    );
  }

  return (
    <div className="admin-container" dir="rtl">
      <header className="dashboard-header">
        <h1>ניהול קטגוריות </h1>
      </header>

      {message.text && (
        <div className={`profile-alert ${message.type}`}>{message.text}</div>
      )}

      <div
        className="category-management-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.5fr',
          gap: '30px',
        }}
      >
        {/* טופס הוספה */}
        <div className="admin-card">
          <form onSubmit={handleAddCategory}>
            <div className="form-group">
              <label>שם הקטגוריה</label>
              <input
                className="form-input"
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                placeholder="למשל: תכשיטים"
                required
              />
            </div>
            <button
              type="submit"
              className="profile-save-btn"
              style={{ width: '100%', marginTop: '10px' }}
            >
              <Plus size={18} /> הוסף קטגוריה
            </button>
          </form>
        </div>

        {/* רשימת קטגוריות */}
        <div className="admin-card">
          <div className="category-list-wrapper">
            {loading ? (
              <p>טוען...</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="category-tag-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '50px',
                    }}
                  >
                    <strong>{cat.label}</strong>
                    {!cat.isSystem && (
                      <button
                        onClick={() => handleDeleteCategory(cat.key)}
                        style={{
                          color: 'red',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCategories;
