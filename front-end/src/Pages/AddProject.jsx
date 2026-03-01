//src/Pages/AddProject.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { usePermission } from '../Hooks/usePermission.jsx';
// הוסיפי את Plus ו-Star לתוך הרשימה
import { FileText, X, Star, Plus, Tag } from 'lucide-react';
const AddProject = () => {
  const { hasPermission, user, loading: permissionLoading } = usePermission();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '', // מתחיל ריק ומתעדכן מהשרת
    paypalEmail: '',
  });

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState([]); // רשימת קטגוריות דינמית
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. שליפת קטגוריות דינמית מהשרת
  // 1. עדכון הנתיב ל-api/admin/categories
  const fetchCategories = useCallback(async () => {
    try {
      // הוספת /admin לנתיב ושימוש ב-Token כי הראוט מוגן
      const res = await api.get('/api/categories');
      const categoriesData = res.data?.categories || res.data?.data || [];
      setCategories(categoriesData);

      // בחירת קטגוריה ראשונה כברירת מחדל
      if (categoriesData.length > 0) {
        setFormData((prev) => ({
          ...prev,
          category: categoriesData[0].key, // השרת משתמש ב-key ולא ב-slug
        }));
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    if (user?.paypalEmail) {
      setFormData((prev) => ({ ...prev, paypalEmail: user.paypalEmail }));
    }
  }, [user, fetchCategories]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validNewFiles = [];

    selectedFiles.forEach((file) => {
      if (file.size <= 5 * 1024 * 1024) {
        validNewFiles.push(file);
      }
    });

    setFiles((prev) => [...prev, ...validNewFiles]);
    const newPreviews = validNewFiles.map((file) =>
      file.type.startsWith('image/') ? URL.createObjectURL(file) : 'document'
    );
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, i) => i !== indexToRemove));
    setPreviews(previews.filter((_, i) => i !== indexToRemove));
    if (mainImageIndex === indexToRemove) setMainImageIndex(0);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = tagInput.trim().replace(',', '');

      if (value && !tags.includes(value)) {
        setTags([...tags, value]);
        setTagInput('');
      }
    }
  };
  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      files[mainImageIndex] &&
      !files[mainImageIndex].type.startsWith('image/')
    ) {
      setError('הקובץ הראשי חייב להיות תמונה!');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();

      // 1. הוספת השדות הרגילים
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));

      // 2. התיקון: הוספת התגיות (הן היו חסרות כאן!)
      // אנחנו הופכים את המערך למחרוזת מופרדת בפסיקים
      data.append('tags', tags.join(','));

      data.append('mainImageIndex', mainImageIndex);
      files.forEach((file) => data.append('files', file));

      await api.post('/api/projects', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('הפרויקט הועלה בהצלחה!');
      // אופציונלי: איפוס הטופס או ניווט דף
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה בהעלאה.');
    } finally {
      setLoading(false);
    }
  };

  if (permissionLoading) return <div className="loader">בודק הרשאות...</div>;
  if (!hasPermission('projects.create'))
    return <div className="admin-container">אין הרשאה.</div>;

  return (
    <div className="add-project-container" dir="rtl">
      <form onSubmit={handleSubmit} className="add-project-form card-shadow">
        <h2 className="add-project-title">העלאת פרויקט חדש</h2>

        <div className="form-section">
          <input
            className="form-input"
            name="title"
            placeholder="שם הפרויקט"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <textarea
            className="form-textarea"
            name="description"
            placeholder="תיאור הפרויקט..."
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>מחיר (₪)</label>
            <input
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label>קטגוריה</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {categories.map((cat) => (
                <option key={cat._id} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="tags-section">
          <label>תגיות (לחץ Enter להוספה)</label>
          <div className="tags-input-wrapper">
            <Tag size={18} className="tag-icon" />
            <div className="tags-list">
              {tags.map((tag, index) => (
                <span key={index} className="tag-chip">
                  {tag}
                  <X
                    size={12}
                    onClick={() => removeTag(index)}
                    className="remove-tag"
                  />
                </span>
              ))}
              <input
                type="text"
                className="tag-bare-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={
                  tags.length === 0 ? 'למשל: לוגו, React, מיתוג...' : ''
                }
              />
            </div>
          </div>
        </div>

        <div className="file-upload-section">
          <label className="upload-dropzone">
            <Plus size={24} />
            <span>לחץ להוספת תמונות וקבצים (עד 10)</span>
            <input type="file" multiple onChange={handleFileChange} hidden />
          </label>

          {/* גריד קבצים מתוקן - מונע פריצה של העיצוב */}
          <div className="files-preview-wrapper">
            {previews.map((src, index) => (
              <div
                key={index}
                className={`file-card ${mainImageIndex === index ? 'is-main' : ''}`}
              >
                <button
                  type="button"
                  className="delete-file"
                  onClick={() => removeFile(index)}
                >
                  <X size={14} />
                </button>

                <div
                  className="file-content"
                  onClick={() => setMainImageIndex(index)}
                >
                  {src !== 'document' ? (
                    <img src={src} alt="preview" className="img-fit" />
                  ) : (
                    <div className="doc-placeholder">
                      <FileText size={32} />
                      <span>{files[index]?.name}</span>
                    </div>
                  )}
                </div>

                {mainImageIndex === index && (
                  <div className="main-label">
                    <Star size={10} /> תמונה ראשית
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'מעלה...' : 'פרסם פרויקט'}
        </button>
      </form>
    </div>
  );
};

export default AddProject;
