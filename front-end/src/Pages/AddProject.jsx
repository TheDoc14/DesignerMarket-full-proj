import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { usePermission } from '../Hooks/usePermission.jsx';
import { useNavigate } from 'react-router-dom';
import { FileText, X, Star, Plus, Tag } from 'lucide-react';

/*
 *The AddProject page is the primary interface for creators (Students and Designers) to upload their industrial design work to the marketplace.
 *It is a comprehensive multi-part form that handles complex data types, including metadata (title, price, category), social tagging,
 *and multiple file uploads with a specialized "Main Image" selection logic.
 */
const AddProject = ({ project }) => {
  const { hasPermission, user, loading: permissionLoading } = usePermission();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    paypalEmail: '',
  });
  const navigate = useNavigate();
  const [newFiles, setNewFiles] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState([]);
  //Manages which file in the newFiles array is designated as the primary image.
  // If a user deletes a file that was set as "Main," the logic automatically shifts the index to maintain a valid selection.
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  //Fetches valid categories from the API on mount. It automatically sets the first available category as the default to improve user experience.
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/api/categories');
      const categoriesData = res.data?.categories || res.data?.data || [];
      setCategories(categoriesData);
      if (categoriesData.length > 0) {
        setFormData((prev) => ({
          ...prev,
          category: categoriesData[0].key,
        }));
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);
  const HE_VALIDATION_MAP = {
    'Title is required': 'חובה להזין שם פרויקט.',
    'Title must be between 2 and 80 characters':
      'שם הפרויקט חייב להיות בין 2 ל־80 תווים.',

    'Description is too long': 'התיאור ארוך מדי (מקסימום 5000 תווים).',

    'Price is required': 'חובה להזין מחיר.',
    'Price must be a valid number': 'המחיר חייב להיות מספר תקין וחיובי.',

    'category must be a string': 'קטגוריה חייבת להיות טקסט.',
    'Invalid category': 'הקטגוריה שנבחרה לא קיימת במערכת.',

    'mainImageIndex is required': 'חובה לבחור תמונה ראשית.',
    'mainImageIndex must be a non-negative integer':
      'בחירת תמונה ראשית אינה תקינה.',
  };
  //A mapping utility that catches technical server errors (e.g., express-validator messages) and translates them into user-friendly Hebrew instructions.
  const translateBackendError = (err) => {
    const errorsArr =
      err?.response?.data?.errors ||
      err?.response?.data?.details ||
      err?.response?.data?.error?.errors;

    if (Array.isArray(errorsArr) && errorsArr.length > 0) {
      const first = errorsArr[0];
      const msg = first?.msg || first?.message || '';
      const param = first?.param;
      if (msg && HE_VALIDATION_MAP[msg]) return HE_VALIDATION_MAP[msg];

      if (param === 'title') return 'בדוק את שם הפרויקט (2–80 תווים).';
      if (param === 'description')
        return 'בדוק את התיאור (מקסימום 5000 תווים).';
      if (param === 'price') return 'בדוק את המחיר (חובה מספר תקין).';
      if (param === 'category') return 'בדוק את הקטגוריה שנבחרה.';
      if (param === 'mainImageIndex') return 'חובה לבחור תמונה ראשית (תמונה).';

      return 'יש שגיאה באחד השדות. בדוק את הטופס.';
    }

    const msg = err?.response?.data?.message || err?.message;
    if (msg && HE_VALIDATION_MAP[msg]) return HE_VALIDATION_MAP[msg];

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
  //Implements a "Chips" style input where pressing Enter or , converts text into a separate tag.
  //It prevents duplicate tags and manages the array for submission.
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
    setError(null);

    if (!formData.title.trim()) return setError('חובה להזין שם פרויקט.');
    if (formData.title.trim().length < 2 || formData.title.trim().length > 80)
      return setError('שם הפרויקט חייב להיות בין 2 ל־80 תווים.');

    if (formData.price === '' || formData.price === null)
      return setError('חובה להזין מחיר.');

    if (newFiles.length === 0) {
      return setError('חובה להעלות לפחות קובץ אחד.');
    }

    const mainFile = newFiles[mainImageIndex];
    if (mainFile && !mainFile.type.startsWith('image/')) {
      return setError(
        'הקובץ שנבחר כתמונה ראשית חייב להיות מסוג תמונה (JPG/PNG/etc).'
      );
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      data.append('tags', tags.join(','));
      data.append('mainImageIndex', mainImageIndex);
      newFiles.forEach((file) => {
        data.append('files', file);
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
                  {/* PREVIEW*/}
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
                    {/* Chosing the main image*/}
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

                    {/* Delete files*/}
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
                onClick={() => navigate('/PersonalDashboard')}
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
          disabled={loading || !formData.paypalEmail}
        >
          {loading ? 'מעלה...' : 'פרסם פרויקט'}
        </button>
      </form>
    </div>
  );
};

export default AddProject;
