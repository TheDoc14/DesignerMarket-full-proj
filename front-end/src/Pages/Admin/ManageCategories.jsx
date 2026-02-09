import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
// הוספת Lightbulb לרשימת הייבוא כאן:
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
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        'http://localhost:5000/api/projects/categories'
      );
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchCategories();
  }, [user]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      // שליחה לראוט הניהול המיועד להרשאת categories.manage
      await axios.post(
        'http://localhost:5000/api/admin/categories',
        { name: newCategory },
        getHeaders()
      );

      setMessage({ type: 'success', text: 'הקטגוריה נוספה בהצלחה!' });
      setNewCategory('');
      fetchCategories();
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'שגיאה בהוספת קטגוריה',
      });
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הקטגוריה "${catName}"?`))
      return;

    try {
      await axios.delete(
        `http://localhost:5000/api/admin/categories/${catName}`,
        getHeaders()
      );
      fetchCategories();
      setMessage({ type: 'success', text: 'הקטגוריה הוסרה' });
    } catch (err) {
      alert('לא ניתן למחוק קטגוריה המכילה פרויקטים פעילים');
    }
  };

  if (authLoading) return <div className="loader">טוען...</div>;
  if (!user) return null;

  return (
    <div className="admin-container" dir="rtl">
      <header className="dashboard-header">
        <h1>ניהול קטגוריות ותוויות</h1>
        <p>הגדרת סיווגים חדשים לפרויקטים במערכת Designer Market</p>
      </header>

      {message.text && (
        <div
          className={`profile-alert ${message.type}`}
          style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {message.type === 'success' ? (
            <CheckCircle size={18} />
          ) : (
            <Info size={18} />
          )}
          {message.text}
        </div>
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
          <div
            className="card-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <FolderPlus size={24} color="#0984e3" />
            <h3 style={{ margin: 0 }}>הוספת קטגוריה</h3>
          </div>
          <form onSubmit={handleAddCategory} className="admin-vertical-form">
            <div className="form-group">
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                }}
              >
                שם הקטגוריה החדשה
              </label>
              <input
                className="form-input"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="למשל: יודאיקה, תכשיטים..."
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #dfe6e9',
                }}
              />
            </div>
            <button
              type="submit"
              className="profile-save-btn"
              style={{
                width: '100%',
                marginTop: '15px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Plus size={18} /> הוסף קטגוריה
            </button>
          </form>

          <div
            className="advice-box"
            style={{
              marginTop: '25px',
              padding: '15px',
              backgroundColor: '#fff9db',
              borderRadius: '10px',
              fontSize: '0.9rem',
              color: '#856404',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <Lightbulb size={20} style={{ flexShrink: 0 }} />
            <span>
              <strong>טיפ למנהל:</strong> הוספת קטגוריות מדויקות עוזרת ללקוחות
              למצוא פרויקטים מהר יותר ומגדילה את המכירות באתר.
            </span>
          </div>
        </div>

        {/* רשימת קטגוריות קיימות */}
        <div className="admin-card">
          <div
            className="card-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <Tag size={24} color="#00b894" />
            <h3 style={{ margin: 0 }}>
              קטגוריות פעילות במערכת ({categories.length})
            </h3>
          </div>
          <div className="category-list-wrapper" style={{ minHeight: '200px' }}>
            {categories.length > 0 ? (
              <div
                className="tags-container"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}
              >
                {categories.map((cat, index) => (
                  <div
                    key={index}
                    className="category-tag-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 18px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '50px',
                      border: '1px solid #e9ecef',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontWeight: '600', color: '#2d3436' }}>
                      {cat}
                    </span>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: '#fab1a0',
                        display: 'flex',
                        padding: '2px',
                      }}
                      title="מחק קטגוריה"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#b2bec3',
                }}
              >
                <Info
                  size={40}
                  style={{ marginBottom: '10px', opacity: 0.5 }}
                />
                <p>טרם הוגדרו קטגוריות. התחל בלהוסיף אחת מימין!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCategories;
