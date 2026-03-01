//src/Pages/Admin/ManageCategories.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { usePermission } from '../../Hooks/usePermission.jsx';
import { getFriendlyError } from '../../Constants/errorMessages';
import { Plus, Trash2 } from 'lucide-react';
import '../PublicPages.css';

const ManageCategories = () => {
  const { hasPermission, user, loading: permissionLoading } = usePermission(); // מוסיפים את user
  const [categories, setCategories] = useState([]);
  const [newCategoryLabel, setNewCategoryLabel] = useState(''); // שם לתצוגה
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // שליפת קטגוריות מנתיב האדמין כדי לקבל את האובייקטים המלאים (key, label)
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/categories');
      setCategories(res.data?.categories || res.data?.data || []);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.friendlyMessage || 'טעינת קטגוריות נכשלה',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && hasPermission('categories.manage')) {
      fetchCategories();
    }
  }, [user, hasPermission, fetchCategories]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryLabel.trim()) return;

    const generatedKey = newCategoryLabel
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');

    try {
      await api.post('/api/admin/categories', {
        key: generatedKey,
        label: newCategoryLabel.trim(),
      });

      setMessage({ type: 'success', text: 'הקטגוריה נוספה בהצלחה!' });
      setNewCategoryLabel('');
      await fetchCategories();
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      setMessage({ type: 'error', text: getFriendlyError(serverMsg) });
    }
  };

  const handleDeleteCategory = async (catKey) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק קטגוריה זו?')) return;

    try {
      await api.delete(`/api/admin/categories/${catKey}`);
      setMessage({ type: 'success', text: 'הקטגוריה הוסרה בהצלחה' });
      await fetchCategories();
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      alert(getFriendlyError(serverMsg));
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

      <div className="category-management-grid">
        {/* טופס הוספה */}
        <div className="admin-card add-category-section">
          <form onSubmit={handleAddCategory}>
            <div className="form-group">
              <label>שם הקטגוריה</label>
              <input
                className="form-input"
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                placeholder="למשל: Jewlery"
                required
              />
            </div>
            <button
              type="submit"
              className="profile-save-btn submit-category-btn"
            >
              <Plus size={18} /> הוסף קטגוריה
            </button>
          </form>
        </div>

        {/* רשימת קטגוריות */}
        <div className="admin-card list-category-section">
          <div className="category-list-wrapper">
            {loading ? (
              <p className="loading-spinner">טוען...</p>
            ) : (
              <div className="category-tags-flex">
                {categories.map((cat) => (
                  <div key={cat._id} className="category-tag-item">
                    <strong>{cat.label}</strong>
                    {!cat.isSystem && (
                      <button
                        onClick={() => handleDeleteCategory(cat.key)}
                        className="delete-category-inline"
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
