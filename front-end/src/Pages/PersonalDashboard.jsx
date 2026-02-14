import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import JSZip from 'jszip'; // ייבוא הספרייה ליצירת ZIP
import { usePermission } from '../Hooks/usePermission.jsx'; // שימוש ב-Hook החדש
import defaultUserPic from '../DefaultPics/userDefault.jpg';
import { useAuth } from '../Context/AuthContext';
import './PublicPages.css';

const PersonalDashboard = () => {
  const { user, login, logout } = useAuth();
  const { hasPermission, loading: permissionLoading } = usePermission();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [projects, setProjects] = useState([]);
  const [purchasedProjects, setPurchasedProjects] = useState([]);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    city: '',
    country: '',
    phone: '',
    paypalEmail: '',
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
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;

    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const profileRes = await axios.get(
        'http://localhost:5000/api/profile/me',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (profileRes.data.user) {
        const u = profileRes.data.user;
        setFormData((prev) => ({
          ...prev,
          username: u.username || '',
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          phone: u.phone || '',
          city: u.city || '',
          country: u.country || '',
          bio: u.bio || '',
          paypalEmail: u.paypalEmail || '',
          birthDate: u.birthDate ? u.birthDate.split('T')[0] : '',
          social: u.social || prev.social,
        }));
        setProfileImagePreview(u.profileImage || defaultUserPic);
      }
      setProjects(profileRes.data.projects || []);

      // שליפת פרויקטים שרכשתי (בדיקה אם קיימים קבצים נגישים)
      const projectsRes = await axios.get(
        'http://localhost:5000/api/projects',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const allProjects = projectsRes.data.projects || [];
      setPurchasedProjects(
        allProjects.filter(
          (p) => p && Array.isArray(p.files) && p.files.length > 0
        )
      );
    } catch (err) {
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  }, [user?.id, logout]);

  useEffect(() => {
    if (!permissionLoading && user?.id) {
      fetchDashboardData();
    }
  }, [user?.id, permissionLoading, fetchDashboardData]);

  // פונקציה להורדת כל קבצי הפרויקט + התמונה כקובץ ZIP אחד
  const downloadAllAsZip = async (project) => {
    const zip = new JSZip();
    const token = localStorage.getItem('token');
    const folder = zip.folder(project.title); // יצירת תיקייה בתוך ה-ZIP

    try {
      setSaving(true);

      // 1. הוספת תמונת הפרויקט ל-ZIP
      if (project.image) {
        try {
          const imgRes = await fetch(project.image);
          const imgBlob = await imgRes.blob();
          folder.file('project-image.png', imgBlob);
        } catch (e) {
          console.error('Could not add image to ZIP', e);
        }
      }

      // 2. הוספת כל קבצי הפרויקט (וורד וכו') ל-ZIP
      const filePromises = project.files.map(async (file) => {
        try {
          const res = await fetch(file.url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const blob = await res.blob();
            folder.file(file.filename, blob);
          }
        } catch (e) {
          console.error(`Error adding file ${file.filename}`, e);
        }
      });

      await Promise.all(filePromises);

      // 3. יצירת והורדת ה-ZIP למחשב
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${project.title}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('ZIP Generation failed', error);
      alert('שגיאה ביצירת קובץ ה-ZIP.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm('האם את בטוחה? כל הפרויקטים והמידע שלך יימחקו לצמיתות!')
    )
      return;
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('החשבון נמחק בהצלחה.');
      logout();
    } catch (err) {
      alert(err.response?.data?.message || 'שגיאה בתהליך המחיקה');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSocialChange = (e) =>
    setFormData({
      ...formData,
      social: { ...formData.social, [e.target.name]: e.target.value },
    });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profileImage: file });
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === 'social') data.append(key, JSON.stringify(formData.social));
        else if (key === 'profileImage' && formData[key] instanceof File)
          data.append(key, formData[key]);
        else if (formData[key] !== null) data.append(key, formData[key]);
      });
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
      await login(res.data.user, token);
      setMessage({ type: 'success', text: 'הפרופיל עודכן!' });
      window.scrollTo(0, 0);
    } catch (err) {
      setMessage({ type: 'error', text: 'שגיאה בעדכון.' });
    } finally {
      setSaving(false);
    }
  };
  if (permissionLoading)
    return <div className="loading-state">מאמת הרשאות...</div>;
  if (!user)
    return <div className="error-container">עליך להתחבר כדי לצפות בדף זה.</div>;

  if (loading) return <div className="loading-state">טוען נתונים...</div>;

  return (
    <div className="profile-container">
      <h1 className="profile-header">הגדרות פרופיל</h1>

      <form onSubmit={handleSubmit} className="profile-card-form">
        {message.text && (
          <div className={`profile-alert ${message.type}`}>{message.text}</div>
        )}

        <div className="profile-info-banner">
          <div className="banner-item">
            <strong>סוג חשבון:</strong>{' '}
            <span className={`role-badge ${user.role}`}>{user.role}</span>
          </div>
        </div>

        <div className="profile-image-section">
          <div
            className="profile-image-wrapper"
            onClick={() => fileInputRef.current.click()}
          >
            <img
              src={profileImagePreview || defaultUserPic}
              alt="Profile"
              className="profile-preview-img"
            />
            <div className="image-overlay">
              <span>החלף תמונה</span>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        <div className="form-grid-3">
          <div className="form-group">
            <label>שם משתמש</label>
            <input
              className="form-input"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
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
            <label>שם משפחה</label>
            <input
              className="form-input"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-grid-3">
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

        <div className="form-group">
          <label>אימייל (לקריאה בלבד)</label>
          <input
            className="form-input readonly-input"
            value={user.email}
            readOnly
          />
        </div>

        <div className="form-group full-width">
          <label>ביוגרפיה</label>
          <textarea
            className="form-textarea"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            maxLength="500"
          />
        </div>

        <h3 className="section-subtitle">נוכחות ברשת</h3>
        <div className="form-grid-3">
          {Object.keys(formData.social).map((key) => (
            <div key={key} className="form-group">
              <label>{key}</label>
              <input
                className="form-input"
                name={key}
                value={formData.social[key]}
                onChange={handleSocialChange}
              />
            </div>
          ))}
        </div>

        {hasPermission('projects.create') && (
          <div className="form-group full-width paypal-highlight">
            <label>אימייל PayPal למשיכת כספים</label>
            <input
              className="form-input"
              name="paypalEmail"
              type="email"
              value={formData.paypalEmail}
              onChange={handleChange}
            />
          </div>
        )}

        <button type="submit" disabled={saving} className="profile-save-btn">
          שמור שינויים
        </button>
      </form>

      <div className="profile-management-grid">
        {hasPermission('projects.create') && (
          <div className="management-section">
            <h3 className="section-title">
              🚀 הפרויקטים שלי ({projects.length})
            </h3>
            {projects.map((p) => (
              <div key={p.id} className="management-item">
                <span>{p.title}</span>
              </div>
            ))}
          </div>
        )}

        <div className="management-section">
          <h3 className="section-title">📦 פרויקטים שרכשתי</h3>
          {purchasedProjects.map((p) => (
            <div key={p.id} className="management-item purchased-card">
              <div className="item-info">
                <span className="item-title">{p.title}</span>
              </div>
              <div className="zip-download-area">
                <button
                  onClick={() => downloadAllAsZip(p)}
                  className="btn-download-action"
                  disabled={saving}
                >
                  {saving ? 'מכין ZIP...' : 'להורדת קבצי הפרויקט לחץ כאן'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {user?.role !== 'admin' && (
        <div className="profile-danger-zone">
          <h3>מחיקת חשבון לצמיתות</h3>
          <button
            onClick={handleDeleteAccount}
            disabled={saving}
            className="btn-delete-account"
          >
            🗑️ מחק חשבון
          </button>
        </div>
      )}
    </div>
  );
};

export default PersonalDashboard;
