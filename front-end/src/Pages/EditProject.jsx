import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // נתונים קיימים מהשרת
  const [existingFiles, setExistingFiles] = useState([]);
  const [currentMainImageId, setCurrentMainImageId] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    tags: '',
    paypalEmail: '',
  });

  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `http://localhost:5000/api/projects/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const p = res.data.project;
        setFormData({
          title: p.title || '',
          description: p.description || '',
          category: p.category || '',
          price: p.price || '',
          tags: p.tags ? p.tags.join(', ') : '',
          paypalEmail: p.paypalEmail || '',
        });

        // שמירת הקבצים הקיימים לצורך בחירת תמונה ראשית
        setExistingFiles(p.media || []); // media מכיל תמונות/וידאו לפי הסריאלייזר
        setCurrentMainImageId(p.mainImageId); // מזהה התמונה הנוכחית מהשרת
      } catch (err) {
        alert('שגיאה בטעינת נתוני הפרויקט');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id, navigate]);

  const handleNewFilesChange = (e) => {
    const selected = Array.from(e.target.files);
    setNewFiles(selected);
    const newPreviews = selected.map((file) =>
      file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    );
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();

      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('price', formData.price);
      data.append('mainImageId', currentMainImageId); // שליחת ה-ID של התמונה שנבחרה כראשית

      const tagsArray = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      tagsArray.forEach((tag) => data.append('tags[]', tag));

      if (newFiles.length > 0) {
        newFiles.forEach((file) => data.append('files', file));
      }

      await axios.put(`http://localhost:5000/api/projects/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('הפרויקט עודכן בהצלחה!');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'שגיאה בעדכון');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>טוען נתונים...</div>;

  return (
    <div>
      <h2>עריכת פרויקט: {formData.title}</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>כותרת</label>
          <input
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />
        </div>

        {/* --- ניהול תמונת תצוגה (Main Image) --- */}
        <div>
          <label>בחר תמונת תצוגה מתוך הקבצים הקיימים:</label>
          <div>
            {existingFiles.map((file) => (
              <div key={file.id} onClick={() => setCurrentMainImageId(file.id)}>
                <img src={file.url} alt="existing" />
                <div></div>
                {currentMainImageId === file.id && <span>ראשי</span>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label>
            הוספת קבצים חדשים (אם תעלה תמונה חדשה, תוכל להפוך אותה לראשית לאחר
            השמירה):
          </label>
          <input type="file" multiple onChange={handleNewFilesChange} />
        </div>

        <label>תגיות (מופרדות בפסיקים)</label>
        <input
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
        />
        <label>אימייל PayPal למשיכת כספים</label>
        <input
          type="email"
          value={formData.paypalEmail}
          onChange={(e) =>
            setFormData({ ...formData, paypalEmail: e.target.value })
          }
          required
        />
        <label>קטגוריה</label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
        >
          <option value="architecture">ארכיטקטורה</option>
          <option value="graphic">גרפיקה</option>
          <option value="product">מוצר</option>
        </select>
        <label>מחיר (ב₪)</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
        />
        {/* שאר השדות (תיאור, מחיר וכו') */}
        <div>
          <label>תיאור</label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        <div>
          <button type="submit" disabled={saving}>
            {saving ? 'שומר שינויים...' : 'עדכן פרויקט'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard')}>
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProject;
