import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import projectDefault from '../DefaultPics/projectDefault.png';

const AddProject = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'architecture',
    paypalEmail: '',
    tags: '',
  });

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // בדיקת הרשאות דינמית מה-AuthContext
  const canCreate = user?.permissions?.includes('projects.create');

  useEffect(() => {
    if (user?.paypalEmail) {
      setFormData((prev) => ({ ...prev, paypalEmail: user.paypalEmail }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // פונקציית הטיפול בשגיאות תמונה שביקשת
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = projectDefault;
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const MAX_TOTAL_SIZE = 25 * 1024 * 1024;

    let currentTotalSize = files.reduce((sum, file) => sum + file.size, 0);
    const validNewFiles = [];
    const errors = [];

    selectedFiles.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`הקובץ "${file.name}" חורג מ-5MB.`);
      } else if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
        errors.push(`חריגה מהנפח הכולל (25MB).`);
      } else {
        validNewFiles.push(file);
        currentTotalSize += file.size;
      }
    });

    if (errors.length > 0) {
      setError(errors.join(' | '));
      return;
    }

    setFiles((prev) => [...prev, ...validNewFiles]);
    const newPreviews = validNewFiles.map((file) =>
      file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : 'document-icon'
    );
    setPreviews((prev) => [...prev, ...newPreviews]);
    setError(null);
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
    setPreviews(previews.filter((_, index) => index !== indexToRemove));
    if (mainImageIndex === indexToRemove) setMainImageIndex(0);
    else if (mainImageIndex > indexToRemove)
      setMainImageIndex(mainImageIndex - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreate) {
      setError('אין לך הרשאות להעלאת פרויקט.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));
      data.append('mainImageIndex', mainImageIndex);
      files.forEach((file) => data.append('files', file));

      await axios.post('http://localhost:5000/api/projects', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('הפרויקט הועלה בהצלחה!');
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה בהעלאה.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      category: 'architecture',
      paypalEmail: user?.paypalEmail || '',
      tags: '',
    });
    setFiles([]);
    setPreviews([]);
    setMainImageIndex(0);
  };

  if (!user) return <div>עליך להתחבר כדי להעלות פרויקט.</div>;

  return (
    <div className="add-project-container">
      <form onSubmit={handleSubmit} className="add-project-form">
        <h2 className="add-project-title">העלאת פרויקט חדש</h2>

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
          placeholder="תיאור"
          value={formData.description}
          onChange={handleChange}
          required
        />

        <div className="form-row">
          <input
            name="price"
            type="number"
            placeholder="מחיר"
            value={formData.price}
            onChange={handleChange}
            required
          />
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="architecture">ארכיטקטורה</option>
            <option value="graphic">גרפיקה</option>
            <option value="product">מוצר</option>
          </select>
        </div>

        <div>
          <label className="paypal-highlight">PayPal למשיכת כספים:</label>
          <input
            name="paypalEmail"
            type="email"
            value={formData.paypalEmail}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="file-upload-zone">
            <strong>+ הוסף קבצים (עד 10)</strong>
            <input type="file" multiple onChange={handleFileChange} />
          </label>
        </div>

        {previews.length > 0 && (
          <div>
            <div className="previews-grid">
              {previews.map((src, index) => (
                <div key={index}>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="remove-file-btn"
                  >
                    ×
                  </button>
                  <div onClick={() => setMainImageIndex(index)}>
                    {src !== 'document-icon' ? (
                      <img
                        src={src}
                        alt="preview"
                        onError={handleImageError} // הטמעת התיקון שביקשת כאן
                      />
                    ) : (
                      <div className="doc-icon">
                        📄
                        <br />
                        <small>{files[index]?.name}</small>
                      </div>
                    )}
                    {mainImageIndex === index && (
                      <div className="second-badge">תמונה ראשית</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          className="submit-project-btn"
          disabled={loading || !canCreate}
        >
          {loading ? 'מעלה...' : 'פרסם פרויקט'}
        </button>
      </form>
    </div>
  );
};

export default AddProject;
