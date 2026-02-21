import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import JSZip from 'jszip';
import { usePermission } from '../Hooks/usePermission.jsx';
import defaultUserPic from '../DefaultPics/userDefault.jpg';
import { useAuth } from '../Context/AuthContext';
import Popup from '../Components/Popup';
import './PublicPages.css';

const PersonalDashboard = () => {
  // --- Hooks & Auth ---
  const { user, login, logout } = useAuth();
  const {
    hasPermission,
    loading: permissionLoading,
    user: currentUser,
  } = usePermission();
  const navigate = useNavigate();
  const { userId } = useParams();
  const fileInputRef = useRef(null);

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [projects, setProjects] = useState([]);
  const [purchasedProjects, setPurchasedProjects] = useState([]);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [aiHistory, setAiHistory] = useState([]);
  const [aiQuota, setAiQuota] = useState({ used: 0, limit: 20, remaining: 20 });
  const [historyLoading, setHistoryLoading] = useState(false);

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

  // --- Logic Helpers ---
  const isOwnProfile =
    !userId || String(userId) === String(currentUser?.id || user?.id);

  // --- API Functions ---

  // שליפת היסטוריית AI ומכסה מתוך ה-meta
  const fetchMyAiHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/ai-chats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // עדכון היסטוריית הצ'אטים
      setAiHistory(res.data.data || []);

      // שליפת המכסה מתוך ה-meta של התגובה
      const quota = res.data.meta?.quota || res.data.meta?.dailyQuota;
      if (quota) {
        setAiQuota({
          used: Number(quota.used) || 0,
          limit: Number(quota.limit) || 20,
          remaining: Number(quota.remaining) || 0,
        });
      }
      console.log(res.data.data);
    } catch (err) {
      console.error('Failed to fetch AI history', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    const token = localStorage.getItem('token');

    try {
      setLoading(true);
      // 1. שליפת פרופיל אישי
      const profileRes = await axios.get(
        'http://localhost:5000/api/profile/me',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProjects(profileRes.data.projects || []);

      // עדכון ה-formData עם נתוני המשתמש שחזרו
      if (profileRes.data.user) {
        const u = profileRes.data.user;
        setFormData((prev) => ({
          ...prev,
          username: u.username || '',
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          bio: u.bio || '',
          city: u.city || '',
          country: u.country || '',
          paypalEmail: u.paypalEmail || '',
          social: u.social || prev.social,
        }));
      }

      // 2. שליפת פרויקטים לרכישות
      const projectsRes = await axios.get(
        'http://localhost:5000/api/projects',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const allProjects = projectsRes.data.projects || [];
      const purchased = allProjects.filter((p) => {
        const isOwner = p.createdBy === user.id || p.createdBy?._id === user.id;
        return !isOwner && Array.isArray(p.files) && p.files.length > 0;
      });
      setPurchasedProjects(purchased);
    } catch (err) {
      console.error('Dashboard data fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // --- Effects ---

  useEffect(() => {
    if (!permissionLoading && user?.id) {
      fetchDashboardData();
    }
  }, [user?.id, permissionLoading, fetchDashboardData]);

  useEffect(() => {
    if (isOwnProfile && user?.id) {
      fetchMyAiHistory();
    }
  }, [isOwnProfile, user?.id, fetchMyAiHistory]);

  // --- Handlers ---

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

  const downloadAllAsZip = async (project) => {
    const zip = new JSZip();
    const token = localStorage.getItem('token');
    const folder = zip.folder(project.title);

    try {
      setSaving(true);
      if (project.mainImageUrl) {
        const imgRes = await fetch(project.mainImageUrl);
        const imgBlob = await imgRes.blob();
        folder.file('project-main-image.png', imgBlob);
      }

      const filePromises = (project.files || []).map(async (file) => {
        const res = await fetch(file.url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const blob = await res.blob();
          folder.file(file.filename, blob);
        }
      });

      await Promise.all(filePromises);
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${project.title}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('שגיאה ביצירת קובץ ה-ZIP');
    } finally {
      setSaving(false);
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
      setMessage({ type: 'success', text: 'הפרופיל עודכן בהצלחה!' });
      window.scrollTo(0, 0);
    } catch (err) {
      setMessage({ type: 'error', text: 'עדכון הפרופיל נכשל' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('אזהרה: מחיקת החשבון היא סופית! האם להמשיך?')) return;
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logout();
    } catch (err) {
      alert('מחיקת החשבון נכשלה');
    } finally {
      setSaving(false);
    }
  };

  // --- Render ---
  if (permissionLoading || loading)
    return <div className="loading-state">טוען נתונים...</div>;
  if (!user)
    return <div className="error-container">עליך להתחבר כדי לצפות בדף זה.</div>;

  return (
    <div className="profile-container" dir="rtl">
      <h1 className="profile-header">הגדרות פרופיל</h1>

      {/* תקציר מכסה AI בראש הדף */}
      <div className="ai-quota-summary-banner">
        <div className="quota-info">
          <strong>סטטוס מנטור AI:</strong>
          <span>
            {' '}
            {aiQuota.used} / {aiQuota.limit} שאילתות נוצלו
          </span>
          <span className="remaining-tag">
            ({aiQuota.remaining} נותרו להיום)
          </span>
        </div>
        <div className="quota-progress-bg">
          <div
            className="quota-progress-fill"
            style={{ width: `${(aiQuota.used / aiQuota.limit) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-card-form">
        {message.text && (
          <div className={`profile-alert ${message.type}`}>{message.text}</div>
        )}

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

        <button type="submit" disabled={saving} className="profile-save-btn">
          {saving ? 'שומר...' : 'שמור שינויים'}
        </button>
      </form>

      <div className="profile-management-grid">
        <div className="management-section">
          <h3 className="section-title">
            🚀 הפרויקטים שלי ({projects.length})
          </h3>
          {projects.length > 0 ? (
            projects.map((p) => (
              <div key={p.id || p._id} className="management-item">
                <span>{p.title}</span>
              </div>
            ))
          ) : (
            <p>טרם יצרת פרויקטים.</p>
          )}
        </div>

        <div className="management-section">
          <h3 className="section-title">📦 פרויקטים שרכשתי</h3>
          {purchasedProjects.length > 0 ? (
            purchasedProjects.map((p) => (
              <div key={p._id} className="management-item purchased-card">
                <div
                  className="item-info"
                  onClick={() => setSelectedProject(p)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="item-title">{p.title} 🔍</span>
                </div>
                <button
                  onClick={() => downloadAllAsZip(p)}
                  className="btn-download-action"
                >
                  הורד ZIP
                </button>
              </div>
            ))
          ) : (
            <p>טרם רכשת פרויקטים.</p>
          )}
        </div>
      </div>

      <section className="profile-ai-history">
        <h3 className="section-title">📜 היסטוריית ייעוץ AI</h3>
        {historyLoading ? (
          <p>טוען שיחות...</p>
        ) : aiHistory.length > 0 ? (
          <div className="ai-chats-grid">
            {aiHistory.map((chat) => {
              const targetProject = chat.projectId;
              const pId = chat.projectId?._id || chat.projectId;
              const linkedProject = projects.find(
                (p) => (p._id || p.id) === pId
              );
              const projectId = targetProject?._id || targetProject; // תמיכה גם אם זה אובייקט וגם אם זה ID בלבד
              const projectTitle = targetProject?.title || 'פרויקט ללא שם';
              const displayTitle =
                linkedProject?.title ||
                chat.projectId?.title ||
                'פרויקט ללא שם';

              return (
                <div key={chat._id} className="ai-chat-card">
                  <div className="chat-card-header">
                    <h4>{chat.title || `ייעוץ עבור ${projectTitle}`}</h4>
                    <span className="chat-date">
                      {new Date(chat.createdAt).toLocaleDateString('he-IL')}
                    </span>
                  </div>

                  {/* הצגת כותרת הפרויקט - אם targetProject קיים, הוא לא יציג "הוסר" */}
                  <p>
                    פרויקט: <strong>{displayTitle}</strong>
                  </p>
                  <button
                    className="view-chat-btn"
                    onClick={() => {
                      // 1. מציאת אובייקט הפרויקט המלא מתוך רשימת הפרויקטים שלך
                      const projectToOpen = projects.find(
                        (p) => (p._id || p.id) === projectId
                      );

                      if (projectToOpen) {
                        // 2. עדכון ה-chatId בתוך הפרויקט לפני הפתיחה
                        const updatedProject = {
                          ...projectToOpen,
                          initialChatId: chat._id,
                        };

                        // 3. פתיחת הפופאפ עם הפרויקט הנכון
                        setSelectedProject(updatedProject);
                      } else {
                        // אם הפרויקט לא ברשימה הכללית, נפתח אותו כאובייקט מינימלי
                        setSelectedProject({
                          ...chat.projectId,
                          initialChatId: chat._id,
                        });
                      }
                    }}
                  >
                    צפה בשיחה ←
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p>עדיין לא התייעצת עם המנטור לגבי הפרויקטים שלך.</p>
        )}
      </section>

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

      {selectedProject && (
        <Popup
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          isLoggedIn={true}
        />
      )}
    </div>
  );
};

export default PersonalDashboard;
