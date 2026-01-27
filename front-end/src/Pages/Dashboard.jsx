import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import defaultUserPic from '../DefaultPics/userDefault.jpg';
import './PublicPages.css'; // מוודא שזה מחובר ל-CSS האחוד

const Dashboard = () => {
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [projects, setProjects] = useState([]);
  const [purchasedProjects, setPurchasedProjects] = useState([]);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    paypalEmail: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    city: '',
    country: '',
    phone: '',
    bio: '',
    social: {
      website: '',
      instagram: '',
      behance: '',
      dribbble: '',
      linkedin: '',
      github: '',
    },
    profileImage: null,
  });

  // פונקציה מרכזית לטעינת כל נתוני הדשבורד
  // Dashboard.jsx

  // Dashboard.jsx

  useEffect(() => {
    const fetchPurchasedProjects = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profileRes = await axios.get(
          'http://localhost:5000/api/profile/me',
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const { user: fetchedUser, projects: userProjects } = profileRes.data;

        // עדכון נתוני הטופס
        if (fetchedUser) {
          setFormData((prev) => ({
            ...prev,
            username: fetchedUser.username || '',
            email: fetchedUser.email || '',
            paypalEmail: fetchedUser.paypalEmail || '',
            firstName: fetchedUser.firstName || '',
            lastName: fetchedUser.lastName || '',
            phone: fetchedUser.phone || '',
            city: fetchedUser.city || '',
            country: fetchedUser.country || '',
            bio: fetchedUser.bio || '',
            birthDate: fetchedUser.birthDate
              ? fetchedUser.birthDate.split('T')[0]
              : '',
            social: fetchedUser.social || prev.social,
          }));

          if (fetchedUser.profileImage) {
            setProfileImagePreview(fetchedUser.profileImage); // הסרת השרשור הידני כי הסריאלייזר בבק בונה URL מלא
          } else {
            setProfileImagePreview(defaultUserPic);
          }
        }
        setProjects(userProjects || []); // הצגת הפרויקטים שהעלית
        // שליפת כל הפרויקטים - השרת מזהה את המשתמש לפי ה-Token
        const res = await axios.get('http://localhost:5000/api/projects', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allProjects = res.data.projects || [];

        // סינון: רק פרויקטים שהמשתמש הנוכחי רכש בהצלחה.
        // השרת מחזיר את המערך 'files' רק אם ה-buyerId תואם והתשלום בוצע
        const purchased = allProjects.filter(
          (p) =>
            p &&
            p.files !== undefined &&
            Array.isArray(p.files) &&
            p.files.length > 0
        );

        setPurchasedProjects(purchased);
      } catch (err) {
        console.error('Error loading purchased projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedProjects();
  }, []);

  // פונקציות עזר לשינוי שדות
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSocialChange = (e) => {
    setFormData({
      ...formData,
      social: { ...formData.social, [e.target.name]: e.target.value },
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profileImage: file });
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  // --- חדש: פונקציה למחיקת פרויקט ספציפי מהרשימה ---
  const handleDeleteProject = async (projectId) => {
    const isConfirmed = window.confirm(
      'האם אתה בטוח שברצונך למחוק את הפרויקט הזה?'
    );
    if (!isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // עדכון הסטייט המקומי להסרת הפרויקט מהתצוגה
      setProjects(projects.filter((p) => p.id !== projectId));
      alert('הפרויקט נמחק בהצלחה.');
    } catch (err) {
      alert(err.response?.data?.message || 'שגיאה במחיקת הפרויקט.');
    }
  };
  // פונקציית עזר להורדה מאולצת (Force Download)
  const downloadFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename; // שם הקובץ שיישמר במחשב
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('שגיאה בהורדת הקובץ. נסה שנית.');
    }
  };

  // מחיקת חשבון משתמש לצמיתות
  const handleDeleteAccount = async () => {
    const targetId = user?.id;
    if (!targetId) return;

    if (user?.role === 'admin') {
      alert('לא ניתן למחוק חשבון מנהל דרך הממשק.');
      return;
    }

    const isConfirmed = window.confirm(
      'האם את בטוחה? כל הפרויקטים והמידע שלך יימחקו לצמיתות!'
    );
    if (isConfirmed) {
      try {
        setSaving(true);
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/profile/${targetId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('החשבון נמחק בהצלחה.');
        logout();
      } catch (err) {
        alert(err.response?.data?.message || 'שגיאה בתהליך המחיקה');
      } finally {
        setSaving(false);
      }
    }
  };

  // שמירת שינויים בפרופיל
  // שמירת שינויים בפרופיל
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        // טיפול מיוחד בתאריך לידה: אם הוא ריק, לא נשלח אותו או נשלח null כדי למנוע שגיאת פורמט
        if (key === 'birthDate') {
          if (formData[key] && formData[key].trim() !== '') {
            data.append(key, formData[key]);
          }
          return; // ממשיך לאיטרציה הבאה
        }

        if (
          key !== 'social' &&
          key !== 'profileImage' &&
          formData[key] !== null
        ) {
          data.append(key, formData[key]);
        }
      });

      data.append('social', JSON.stringify(formData.social));

      if (formData.profileImage instanceof File) {
        data.append('profileImage', formData.profileImage);
      }

      const res = await axios.put(
        'http://localhost:5000/api/profile/me',
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      updateUser(res.data.user);
      setMessage({ type: 'success', text: 'הפרופיל עודכן בהצלחה!' });

      // גלילה לראש העמוד כדי לראות את הודעת ההצלחה
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Update error:', err.response?.data);

      // לוגיקת הודעות שגיאה מותאמת אישית
      let errorText = 'אירעה שגיאה בעדכון הפרופיל.';

      if (err.response?.status === 400) {
        const serverMsg = err.response?.data?.message;
        if (serverMsg?.includes('birthDate')) {
          errorText = 'תאריך הלידה שהוזן אינו תקין. נא לבחור תאריך מהיומן.';
        } else {
          errorText = serverMsg || 'נתונים לא תקינים, אנא בדקו את השדות.';
        }
      }

      setMessage({
        type: 'error',
        text: errorText,
      });

      // גלילה לראש העמוד כדי לראות את הודעת השגיאה
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const getPlaceholderImage = () => {
    const initial = user?.username
      ? user.username.charAt(0).toUpperCase()
      : '?';
    return (
      <div className="profile-placeholder">
        <span style={{ fontSize: '40px', color: '#666' }}>{initial}</span>
      </div>
    );
  };

  if (loading)
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px' }}>
        טוען את הפרופיל שלך...
      </div>
    );
  if (!user)
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px' }}>
        אינך מחובר/ת. אנא התחבר/י.
      </div>
    );

  return (
    <div className="profile-container">
      <h1 className="profile-header">הפרופיל האישי של {user.username}</h1>

      {/* תמונת פרופיל */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div
          onClick={() => fileInputRef.current.click()}
          className="profile-avatar-wrapper"
        >
          {profileImagePreview ? (
            <img
              src={profileImagePreview}
              alt="Profile"
              className="profile-avatar-large"
            />
          ) : (
            getPlaceholderImage()
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          hidden
          onChange={handleFileChange}
          accept="image/*"
        />
        <p className="avatar-hint">לחץ/י על התמונה לעדכון</p>
      </div>

      {/* טופס עריכה */}
      <form onSubmit={handleSubmit} className="profile-card-form">
        {message.text && (
          <div className={`profile-alert ${message.type}`}>{message.text}</div>
        )}

        <div className="form-grid-3">
          <div className="form-group">
            <label>שם פרטי</label>
            <input
              className="form-input"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">שם משפחה</label>
            <input
              className="form-input"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>תאריך לידה</label>
            <input
              className="form-input"
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>טלפון</label>
            <input
              className="form-input"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>עיר</label>
            <input
              className="form-input"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>מדינה</label>
            <input
              className="form-input"
              name="country"
              value={formData.country}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label>ביוגרפיה (עד 500 תווים)</label>
          <textarea
            className="form-textarea"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            maxLength="500"
          />
        </div>

        <h3 className="section-subtitle">קישורים חברתיים</h3>
        <div className="form-grid-3">
          {Object.keys(formData.social).map((key) => (
            <div key={key} className="form-group">
              <label
                className="form-label"
                style={{ textTransform: 'capitalize' }}
              >
                {key}
              </label>
              <input
                className="form-input"
                name={key}
                placeholder={`https://${key}.com/...`}
                value={formData.social[key]}
                onChange={handleSocialChange}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '20px' }}>
          <label>אימייל PayPal לקבלת תשלומים (חובה למוכרים)</label>
          <p>שים לב - עלייך למלא שדה זה טרם הוספת פרויקט חדש</p>
          <input
            className="form-input paypal-input"
            name="paypalEmail"
            type="email"
            value={formData.paypalEmail}
            onChange={handleChange}
            placeholder="your-paypal@example.com"
          />
        </div>

        <div style={{ marginTop: '40px' }}>
          <button type="submit" disabled={saving} className="profile-save-btn">
            {saving ? 'שומר שינויים...' : 'שמור שינויים'}
          </button>
        </div>
      </form>

      {/* --- אזור ניהול פרויקטים --- */}
      <div className="profile-management-grid">
        {/* צד ימין: פרויקטים שהעליתי */}
        <div className="management-section">
          <h3 className="section-title seller">
            🚀 פרויקטים שהעליתי ({projects.length})
          </h3>
          {projects.length > 0 ? (
            projects.map((p) => (
              <div key={p.id} className="management-item">
                <div className="item-details">
                  <span className="item-title">{p.title}</span>
                  <span className="item-status">
                    {p.isPublished ? '✅ פורסם' : '⏳ ממתין לאישור'}
                  </span>
                </div>
                <div className="item-actions">
                  <button
                    onClick={() =>
                      (window.location.href = `/edit-project/${p.id}`)
                    }
                    className="btn-edit-small"
                  >
                    ✏️ ערוך
                  </button>
                  <button
                    onClick={() => handleDeleteProject(p.id)}
                    className="btn-delete-small"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">עוד לא העלית פרויקטים.</p>
          )}
        </div>

        {/* צד שמאל: פרויקטים שרכשתי */}
        <div className="management-section">
          <h3 className="section-title buyer">
            📦 פרויקטים שרכשתי ({purchasedProjects.length})
          </h3>

          <div className="items-list">
            {purchasedProjects.length > 0 ? (
              purchasedProjects.map((p) => (
                <div key={p.id} className="management-item purchased">
                  <div className="purchase-info-row">
                    <span className="item-title">{p.title}</span>
                    <span className="purchase-date">
                      נרכש ב-{new Date(p.createdAt).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                  <div className="files-container">
                    {p.files?.map((file, idx) => (
                      <div key={idx} className="file-row">
                        <span className="file-name">📁 {file.filename}</span>
                        <button
                          onClick={() => downloadFile(file.url, file.filename)}
                          className="btn-download"
                        >
                          📥 הורד למחשב
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">לא נמצאו פרויקטים שרכשת.</p>
            )}
          </div>
        </div>
      </div>

      {/* אזור מחיקת חשבון */}
      <div className="profile-danger-zone">
        <h3>מחיקת חשבון</h3>
        <p>
          מחיקת החשבון תסיר לצמיתות את כל המידע שלך, הפרויקטים וההגדרות מהמערכת.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={saving}
          className="btn-delete-account"
        >
          {saving ? 'מבצע מחיקה...' : '🗑️ מחק את החשבון שלי לצמיתות'}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
