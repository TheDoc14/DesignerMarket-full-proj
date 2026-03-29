//src/Pages/PersonalDashboard.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import JSZip from 'jszip';
import { usePermission } from '../Hooks/usePermission.jsx';
import defaultUserPic from '../DefaultPics/userDefault.jpg';
import { useAuth } from '../Context/AuthContext';
import Popup from '../Components/Popup';
import { useAiQuota } from '../Hooks/useAiQuota.jsx';
import { useSharedProject } from '../Hooks/useSharedProject.jsx';
import './PublicPages.css';

/*
 * The personal dashboard acts as the user's central workspace.
 * In the AI consultation flow, it connects quota tracking, chat history,
 * selected project context, and the popup-based AI interface into one screen.
 */
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

  // Admins have wildcard permissions so hasPermission('ai.consult') returns true
  // for them, but the backend only serves AI quota to designer/student roles.
  // isOwnProfile must also be true — admins viewing other profiles must not call it.
  const isOwnProfile =
    !userId || String(userId) === String(currentUser?.id || user?.id);
  const canAccessAiFeature =
    isOwnProfile &&
    hasPermission('ai.consult') &&
    currentUser?.role !== 'admin';

  // --- States ---
  // Connect the dashboard to the reusable AI quota hook
  // so the user can view and update AI usage state from one central page.
  const { aiQuota, setAiQuota, decrementQuota } = useAiQuota({ enabled: canAccessAiFeature });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message] = useState({ type: '', text: '' });
  const [projects, setProjects] = useState([]);
  const [purchasedProjects, setPurchasedProjects] = useState([]);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const { selectedProject, setSelectedProject, updateProject } =
    useSharedProject();
  const [aiHistory, setAiHistory] = useState([]);
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

  // --- API Functions ---
  /*
   * Display the user's previous AI consultation sessions only when the user
   * has the dedicated AI permission. Each history item can reopen the related
   * project and restore the selected chat context inside the popup.
   */
  const fetchMyAiHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/api/ai-chats');
      setAiHistory(res.data.data || []);

      const meta = res.data.meta;
      if (meta) {
        const totalUsed = Number(meta.total) || 0;
        const dailyLimit = Number(meta.limit) || 20;
        const calculatedRemaining =
          meta.quota?.remaining ?? Math.max(0, dailyLimit - totalUsed);

        setAiQuota({
          used: totalUsed,
          limit: dailyLimit,
          remaining: calculatedRemaining,
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
  }, [setAiQuota]);
  //This function performs a heavy-duty synchronization across multiple domains:
  //fetches the latest user data from /api/profile/me,Retrieves successful orders (PAID or PAYOUT_SENT) to unlock downloadable content
  //and splits all platform projects into two distinct arrays: projects (authored by the user) and purchasedProjects (bought from others)
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const myId = String(user.id || user._id);
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
        if (u.profileImage) setProfileImagePreview(u.profileImage);
      }
      const projectsRes = await api.get('/api/projects');
      const allProjects =
        projectsRes.data?.projects ||
        projectsRes.data?.data ||
        projectsRes.data ||
        [];
      let myOrders = [];
      try {
        const ordersRes = await api.get('/api/orders/my');
        if (Array.isArray(ordersRes.data)) {
          myOrders = ordersRes.data;
        } else if (ordersRes.data?.data && Array.isArray(ordersRes.data.data)) {
          myOrders = ordersRes.data.data;
        } else if (
          ordersRes.data?.orders &&
          Array.isArray(ordersRes.data.orders)
        ) {
          myOrders = ordersRes.data.orders;
        }

        myOrders = myOrders.filter((order) => {
          const status = String(order.status || '').toUpperCase();
          return ['PAID', 'PAYOUT_SENT'].includes(status);
        });
      } catch (err) {
        console.warn('⚠️ Could not fetch orders:', err.message);
        myOrders = [];
      }

      const purchasedProjectIds = new Set(
        myOrders
          .map((order) => {
            const projectObj = order.project;
            const id = projectObj?.id || projectObj?._id || projectObj;
            return String(id || '').trim();
          })
          .filter(Boolean)
      );
      const myOwn = allProjects.filter((p) => {
        const creatorId = p.createdBy?._id || p.createdBy?.id || p.createdBy;
        return String(creatorId) === myId;
      });

      const purchased = allProjects.filter((p) => {
        const pId = String(p._id || p.id || '').trim();
        return purchasedProjectIds.has(pId);
      });

      const createdResults = await Promise.allSettled(
        myOwn.map((p) => {
          const pId = p._id || p.id;
          return api.get(`/api/projects/${pId}`);
        })
      );

      const purchasedResults = await Promise.allSettled(
        purchased.map((p) => {
          const pId = p._id || p.id;
          return api.get(`/api/projects/${pId}`);
        })
      );

      const createdProjects = createdResults
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value.data?.project || r.value.data?.data || r.value.data)
        .filter(Boolean);

      const purchasedProjects = purchasedResults
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value.data?.project || r.value.data?.data || r.value.data)
        .filter(Boolean);

      setProjects(createdProjects);
      setPurchasedProjects(purchasedProjects);
    } catch (err) {
      console.error('❌ Dashboard data fetch failed', err);
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
    if (user?.id && !permissionLoading) {
      if (canAccessAiFeature) {
        fetchMyAiHistory();
      } else {
        setAiHistory([]);
      }
    }
  }, [canAccessAiFeature, user?.id, permissionLoading, fetchMyAiHistory]);

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
  //Utilizes the jszip library to aggregate project images and source files.
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
      alert('הפרופיל עודכן בהצלחה!');
      window.scrollTo(0, 0);
    } catch (err) {
      alert('עדכון הפרופיל נכשל, אנא וודא שמילאת את כל השדות הנדרשים כראוי.');
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
      await api.delete(`/api/projects/${projectId}`);
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
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              value={formData.profileImage ? undefined : ''}
            />
            <div className={`role-badge-floating ${user?.role}`}>
              {user?.role}
            </div>
          </div>
        </div>

        <p className="note">שים לב - השדות המסומנים * הם שדות חובה</p>
        <div className="form-grid-3">
          <div className="form-group">
            <label>שם משתמש</label>
            <span className="required-star">*</span>

            <input
              className="form-input"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>שם פרטי</label>
            <span className="required-star">*</span>

            <input
              className="form-input"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>שם משפחה</label>
            <span className="required-star">*</span>

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
            <span className="required-star">*</span>

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
                    >
                      <span className="item-title">{p.title} 🔍</span>
                    </div>
                    <div className="item-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
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
      {}
      {hasPermission('ai.consult') && (
        <section className="profile-ai-history">
          <h3 className="section-title">📜 היסטוריית ייעוץ AI</h3>
          {historyLoading ? (
            <p>טוען שיחות...</p>
          ) : aiHistory.length > 0 ? (
            <div className="ai-chats-grid">
              {aiHistory.map((chat) => {
                const pId = chat.projectId?._id || chat.projectId;
                const linkedProject = [...projects, ...purchasedProjects].find(
                  (p) => String(p._id || p.id) === String(pId)
                );
                const displayTitle =
                  linkedProject?.title || chat.title || 'פרויקט כללי';
                return (
                  <div key={chat._id} className="ai-chat-card">
                    <div className="chat-card-header">
                      <h4>{chat.title}</h4>
                      <span className="chat-date">
                        {new Date(chat.createdAt).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                    <p>
                      פרויקט: <strong>{displayTitle}</strong>
                    </p>
                    <button
                      className="view-chat-btn"
                      onClick={() => {
                        setSelectedProject({
                          ...(linkedProject || {
                            _id: pId,
                            title: displayTitle,
                          }),
                          initialChatId: chat._id,
                        });
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
      )}
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

      {/* Open the project popup as the execution point of the AI consultation flow. */}
      {/* The dashboard passes the current quota and a callback for post-AI quota updates. */}
      {selectedProject && (
        <Popup
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          isLoggedIn={true}
          externalAiQuota={aiQuota}
          onAiUpdate={() => decrementQuota()}
          onUpdate={updateProject}
        />
      )}
    </div>
  );
};

export default PersonalDashboard;
