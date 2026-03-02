//src/Pages/PersonalDashboard.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
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
      const res = await api.get('/api/ai-chats');

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
    } catch (err) {
      if (err.response?.status === 403) {
        setAiHistory([]);
        return;
      }
      console.error('Failed to fetch AI history', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const myId = String(user.id || user._id);

      // 1. שליפת פרופיל
      const profileRes = await api.get('/api/profile/me');
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
          phone: u.phone || '',
          birthDate: u.birthDate ? u.birthDate.split('T')[0] : '',
          profileImage: u.profileImage,
        }));
        if (u.profileImage) {
          setProfileImagePreview(u.profileImage);
        }
      }

      // 2. שליפת כל הפרויקטים
      const projectsRes = await api.get('/api/projects');
      const allProjects =
        projectsRes.data?.projects ||
        projectsRes.data?.data ||
        projectsRes.data ||
        [];

      // 3. פרויקטים שיצרתי
      const myOwn = allProjects.filter((p) => {
        const creatorId = p.createdBy?._id || p.createdBy?.id || p.createdBy;
        return String(creatorId) === myId;
      });

      // 4. פרויקטים שלא יצרתי - בדיקה אם רכשתי
      const notMine = allProjects.filter((p) => {
        const creatorId = p.createdBy?._id || p.createdBy?.id || p.createdBy;
        return String(creatorId) !== myId;
      });

      // ✅ שליפת כל פרויקט בנפרד - הבאק מחזיר files רק אם רכשת
      const purchasedResults = await Promise.allSettled(
        notMine.map((p) => {
          const pId = p._id || p.id;
          return api.get(`/api/projects/${pId}`);
        })
      );

      const purchased = purchasedResults
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value.data?.project || r.value.data?.data || r.value.data)
        .filter((p) => {
          // ✅ הבאק מחזיר files (כולל קבצים לא-תמונות) רק לקונה/בעלים/אדמין
          const hasSourceFiles =
            Array.isArray(p?.files) &&
            p.files.some(
              (f) => f.fileType !== 'image' && f.fileType !== 'video'
            );
          return hasSourceFiles;
        });

      setProjects(myOwn);
      setPurchasedProjects(purchased);
    } catch (err) {
      console.error('Dashboard data fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [user]);
  // --- Effects ---

  useEffect(() => {
    if (!permissionLoading && user?.id) {
      fetchDashboardData();
    }
  }, [user?.id, permissionLoading, fetchDashboardData]);

  useEffect(() => {
    if (
      isOwnProfile &&
      user?.id &&
      !permissionLoading &&
      hasPermission('ai.consult')
    ) {
      fetchMyAiHistory();
    }
  }, [
    isOwnProfile,
    user?.id,
    permissionLoading,
    hasPermission,
    fetchMyAiHistory,
  ]);

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
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === 'social') data.append(key, JSON.stringify(formData.social));
        else if (key === 'profileImage' && formData[key] instanceof File)
          data.append(key, formData[key]);
        else if (formData[key] !== null) data.append(key, formData[key]);
      });

      const res = await api.put('/api/profile/me', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await login(
        res.data?.user || res.data?.data?.user,
        localStorage.getItem('token')
      );
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
      await api.delete(`/api/profile/${user.id}`);
      logout();
    } catch (err) {
      alert('מחיקת החשבון נכשלה');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את הפרויקט לצמיתות?'))
      return;

    try {
      setSaving(true);
      // קריאה ל-API המחיקה (וודאי שזה הנתיב אצלך ב-Backend)
      await api.delete(`/api/projects/${projectId}`);

      // עדכון ה-State המקומי כדי להסיר את הפרויקט מהמסך
      setProjects((prev) => prev.filter((p) => (p._id || p.id) !== projectId));

      alert('הפרויקט נמחק בהצלחה');
    } catch (err) {
      console.error('Delete project failed', err);
      alert(err.response?.data?.message || 'שגיאה במחיקת הפרויקט');
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
            value={formData.profileImage ? undefined : ''} // כדי לאפשר בחירה חוזרת באותו קובץ
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
        <div className="form-grid-3">
          <div className="form-group">
            <label>עיר</label>
            <input
              className="form-input"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-grid-3">
          <div className="form-group">
            <label>מדינה</label>
            <input
              className="form-input"
              name="country"
              value={formData.country}
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
            <label>אימייל PayPal</label>
            <input
              className="form-input"
              name="paypalEmail"
              value={formData.paypalEmail}
              onChange={handleChange}
            />
          </div>
          <div className="form-group full-width">
            <label>אימייל</label>
            <input
              className="form-input"
              name="email"
              value={user.email}
              onChange={handleChange}
              readOnly={true}
            />
          </div>
          <div className="form-group ">
            <label>תאריך לידה</label>
            <input
              className="form-input"
              name="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={handleChange}
            />
          </div>
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
            <div className="my-projects-list">
              {projects.map((p) => {
                const pId = p.id || p._id;
                return (
                  <div
                    key={pId}
                    className="management-item personal-project-card"
                  >
                    <div
                      className="item-info"
                      onClick={() => setSelectedProject(p)}
                      style={{ cursor: 'pointer', flex: 1 }}
                    >
                      <span className="item-title">{p.title} 🔍</span>
                    </div>
                    <div className="item-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // מונע את פתיחת הפופאפ כשלוחצים על המחיקה
                          handleDeleteProject(pId);
                        }}
                        className="btn-delete-action"
                        title="מחק פרויקט"
                        disabled={saving}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>טרם פרסמת פרויקטים.</p>
          )}
        </div>
        <div className="management-section">
          <h3 className="section-title">📦 פרויקטים שרכשתי</h3>
          {purchasedProjects.length > 0 ? (
            purchasedProjects.map((p) => (
              <div
                key={p._id || p.id}
                className="management-item purchased-card"
              >
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
          <p>עדיין לא התייעצת עם ה- AI לגבי הפרויקטים שלך.</p>
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
          onUpdate={(updatedProject) => {
            // עדכון הפרויקט ברשימה המקומית מיד לאחר העריכה
            setProjects((prev) =>
              prev.map((p) =>
                (p._id || p.id) === (updatedProject._id || updatedProject.id)
                  ? { ...p, ...updatedProject }
                  : p
              )
            );
            setSelectedProject(null); // סגירת הפופאפ
          }}
        />
      )}
    </div>
  );
};

export default PersonalDashboard;
