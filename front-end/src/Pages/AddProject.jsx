//src/Pages/AddProject.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { usePermission } from '../Hooks/usePermission.jsx';
import { useNavigate } from 'react-router-dom'; // וודאי שזה מותקן
// הוסיפי את Plus ו-Star לתוך הרשימה
import { FileText, X, Star, Plus, Tag } from 'lucide-react';
const AddProject = ({ project }) => {
  const { hasPermission, user, loading: permissionLoading } = usePermission();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '', // מתחיל ריק ומתעדכן מהשרת
    paypalEmail: '',
  });
  const navigate = useNavigate(); // הוספה כאן
  const [existingFiles, setExistingFiles] = useState(project?.files || []);
  const [newFiles, setNewFiles] = useState([]); // קבצים נוספים להעלאה
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
  const HE_VALIDATION_MAP = {
    // title
    'Title is required': 'חובה להזין שם פרויקט.',
    'Title must be between 2 and 80 characters':
      'שם הפרויקט חייב להיות בין 2 ל־80 תווים.',

    // description
    'Description is too long': 'התיאור ארוך מדי (מקסימום 5000 תווים).',

    // price
    'Price is required': 'חובה להזין מחיר.',
    'Price must be a valid number': 'המחיר חייב להיות מספר תקין וחיובי.',

    // category
    'category must be a string': 'קטגוריה חייבת להיות טקסט.',
    'Invalid category': 'הקטגוריה שנבחרה לא קיימת במערכת.',

    // mainImageIndex
    'mainImageIndex is required': 'חובה לבחור תמונה ראשית.',
    'mainImageIndex must be a non-negative integer':
      'בחירת תמונה ראשית אינה תקינה.',
  };
  const handleOpenFile = async (file) => {
    const filename = file.filename || file.name || 'download.txt';
    const fileUrl = file.url || file.fileUrl;

    if (!fileUrl) return window.alert('כתובת קובץ חסרה');

    try {
      window.alert(`מוריד את ${filename}...`);

      const response = await api.get(fileUrl, {
        responseType: 'blob',
        skipAuthRefresh: true,
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
      window.alert('הקובץ ירד בהצלחה');
    } catch (err) {
      console.error('Download failed, preventing logout:', err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        window.alert(
          'אין לך הרשאה להוריד את קובץ המקור הזה (ייתכן שלא רכשת את הפרויקט).'
        );
      } else {
        window.alert('שגיאה בהורדת הקובץ');
      }
    }
  };
  const translateBackendError = (err) => {
    // 1) אם הבק מחזיר מערך שגיאות של express-validator
    const errorsArr =
      err?.response?.data?.errors ||
      err?.response?.data?.details ||
      err?.response?.data?.error?.errors;

    if (Array.isArray(errorsArr) && errorsArr.length > 0) {
      // express-validator לרוב מחזיר { msg, param, ... }
      const first = errorsArr[0];
      const msg = first?.msg || first?.message || '';
      const param = first?.param;

      // תרגום לפי msg
      if (msg && HE_VALIDATION_MAP[msg]) return HE_VALIDATION_MAP[msg];

      // fallback לפי param (במקרה שה-msg משתנה)
      if (param === 'title') return 'בדוק את שם הפרויקט (2–80 תווים).';
      if (param === 'description')
        return 'בדוק את התיאור (מקסימום 5000 תווים).';
      if (param === 'price') return 'בדוק את המחיר (חובה מספר תקין).';
      if (param === 'category') return 'בדוק את הקטגוריה שנבחרה.';
      if (param === 'mainImageIndex') return 'חובה לבחור תמונה ראשית (תמונה).';

      return 'יש שגיאה באחד השדות. בדוק את הטופס.';
    }

    // 2) אם הבק מחזיר message בודד
    const msg = err?.response?.data?.message || err?.message;
    if (msg && HE_VALIDATION_MAP[msg]) return HE_VALIDATION_MAP[msg];

    // 3) fallback כללי
    const status = err?.response?.status;
    if (status === 400) return 'הנתונים שנשלחו לא תקינים. בדוק את הטופס.';
    if (status === 401) return 'אין לך הרשאה לבצע פעולה זו. התחבר מחדש.';
    if (status === 403) return 'אין לך הרשאה להעלות פרויקט.';
    if (status >= 500) return 'שגיאת שרת. נסה שוב בעוד רגע.';

    return 'שגיאה בהעלאה.';
  };

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
    e.preventDefault(); // חשוב: להעביר להתחלה כדי למנוע ריענון דף בשגיאות ולידציה
    setError(null);

    // 1. ולידציות בסיסיות
    if (!formData.title.trim()) return setError('חובה להזין שם פרויקט.');
    if (formData.title.trim().length < 2 || formData.title.trim().length > 80)
      return setError('שם הפרויקט חייב להיות בין 2 ל־80 תווים.');

    if (formData.price === '' || formData.price === null)
      return setError('חובה להזין מחיר.');

    // 2. בדיקת קבצים - משתמשים ב-newFiles כי זה מה שמתעדכן ב-JSX
    if (newFiles.length === 0) {
      return setError('חובה להעלות לפחות קובץ אחד.');
    }

    // 3. בדיקה שהתמונה הראשית היא אכן תמונה
    const mainFile = newFiles[mainImageIndex];
    if (mainFile && !mainFile.type.startsWith('image/')) {
      return setError(
        'הקובץ שנבחר כתמונה ראשית חייב להיות מסוג תמונה (JPG/PNG/etc).'
      );
    }

    setLoading(true);
    try {
      const data = new FormData();

      // הוספת שדות הטופס
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      // הוספת תגיות כמחרוזת
      data.append('tags', tags.join(','));

      // הוספת אינדקס תמונה ראשית
      data.append('mainImageIndex', mainImageIndex);

      // הוספת הקבצים מהמערך הנכון
      newFiles.forEach((file) => {
        data.append('files', file);
      });

      const response = await api.post('/api/projects', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('הפרויקט הועלה בהצלחה!');
      navigate('/projects');
    } catch (err) {
      console.error('Upload error:', err.response?.data);
      setError(translateBackendError(err));
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

        <div className="project-files-manager">
          <h4>📁 ניהול קבצי מקור ותמונות</h4>
          <div className="files-grid-preview">
            {newFiles.map((file, idx) => {
              const isImage = file.type.startsWith('image/');
              const isMain = mainImageIndex === idx;

              return (
                <div
                  key={`new-${idx}`}
                  className={`file-preview-card ${isMain ? 'main-selected' : ''}`}
                >
                  {/* תצוגה מקדימה - אם זו תמונה מציגים אותה, אם לא מציגים אייקון מסמך */}
                  <div className="preview-content">
                    {isImage ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="img-thumb"
                      />
                    ) : (
                      <FileText size={40} className="doc-icon" />
                    )}
                  </div>

                  <div className="preview-actions">
                    {/* כפתור בחירה כתמונה ראשית - פעיל רק אם זה קובץ תמונה */}
                    {isImage && (
                      <button
                        type="button"
                        className={`main-toggle-btn ${isMain ? 'active' : ''}`}
                        onClick={() => setMainImageIndex(idx)}
                        title={isMain ? 'תמונה ראשית' : 'קבע כתמונה ראשית'}
                      >
                        <Star
                          size={16}
                          fill={isMain ? 'currentColor' : 'none'}
                        />
                      </button>
                    )}

                    {/* כפתור מחיקה */}
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => {
                        const updatedFiles = newFiles.filter(
                          (_, i) => i !== idx
                        );
                        setNewFiles(updatedFiles);
                        if (mainImageIndex === idx) setMainImageIndex(0);
                        else if (mainImageIndex > idx)
                          setMainImageIndex((prev) => prev - 1);
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <span className="file-name-tag">{file.name}</span>
                </div>
              );
            })}
          </div>

          <label className="btn-add-files">
            <Plus size={18} /> הוסף קבצים (תמונות, ZIP, PDF...)
            <input
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) =>
                setNewFiles([...newFiles, ...Array.from(e.target.files)])
              }
            />
          </label>
        </div>
        {!formData.paypalEmail && (
          <div className="note-container">
            <div className="note">
              <p>
                ⚠️ <strong>שים לב:</strong> לא הגדרת כתובת PayPal לקבלת תשלומים.
              </p>
              <p>עליך להגדיר אימייל תקין כדי שתוכל למכור את הפרויקט.</p>
              <button
                type="button"
                className="profile-link-btn"
                onClick={() => navigate('/PersonalDashboard')} // וודאי שזה הנתיב הנכון אצלך
              >
                להגדרת תשלומים בפרופיל האישי
              </button>
            </div>
          </div>
        )}
        {error && <div className="error-banner">{error}</div>}

        <button
          type="submit"
          className="submit-btn"
          disabled={loading || !formData.paypalEmail} // חוסם את הכפתור אם אין מייל
        >
          {loading ? 'מעלה...' : 'פרסם פרויקט'}
        </button>
      </form>
    </div>
  );
};

export default AddProject;
