// /src/Components/Popup.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { PayPalButtons } from '@paypal/react-paypal-js';
import './componentStyle.css';
import { usePermission } from '../Hooks/usePermission.jsx';

const Popup = ({ project, onClose, onUpdate, isLoggedIn }) => {
  const [existingFiles, setExistingFiles] = useState(project?.files || []);
  const [newFiles, setNewFiles] = useState([]); // קבצים נוספים להעלאה
  const { hasPermission, user: currentUser } = usePermission();
  const [orderStatus, setOrderStatus] = useState(null); // 'PENDING', 'PAID', וכו'
  const navigate = useNavigate();

  const [alreadyPurchased, setAlreadyPurchased] = useState(false);

  const [, setCurrentMainImageId] = useState(project?.mainImageId || '');
  const isAdmin = hasPermission('admin');

  const projectId = project?._id || project?.id;
  const chatEndRef = useRef(null);
  const location = useLocation();
  const hasFetchedRef = useRef(false);

  const createdById = String(
    project?.createdBy?._id || project?.createdBy || ''
  );
  const currentUserId = String(currentUser?._id || currentUser?.id || '');
  const isOwner =
    (!!currentUserId && !!createdById && currentUserId) === createdById;

  // --- Logic Helpers ---

  const canUseAi = isOwner && hasPermission('ai.consult');

  // אצלך כתוב projects.edit אבל בבאק שלך זה projects.update
  const canEdit = isOwner || hasPermission('projects.update');

  // --- States ---
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  // --- States חדשים לעריכת תמונה ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(project?.mainImageUrl || ''); // תצוגה מקדימה
  const fileInputRef = useRef(null); // רפרנס לשדה בחירת הקובץ
  const [editReviewData, setEditReviewData] = useState({ rating: 5, text: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: null });

  // AI States
  const [aiQuota, setAiQuota] = useState({ used: 0, limit: 20, remaining: 20 });
  const [aiMessages, setAiMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [userQuery, setUserQuery] = useState('');

  const [editData, setEditData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    category: project?.category || '',
    price: project?.price || 0,
    tags: project?.tags ? project.tags.join(', ') : '', // הופך מערך למחרוזת עם פסיקים
  });
  // --- 1. הגדרת כל ה-Hooks בראש הקומפוננטה (לפני כל if) ---

  // ✅ פונקציה לבדיקת אם המשתמש כבר קנה את הפרויקט
  // בודקת ב-existingOrder מתוך ה-project
  const checkIfProjectPurchased = useCallback(() => {
    if (!project) {
      setAlreadyPurchased(false);
      return;
    }
    try {
      // בדוק אם בפרויקט יש existingOrder שהוא PAYOUT_SENT (רכישה בהצלחה)
      if (
        project.existingOrder &&
        project.existingOrder.status === 'PAYOUT_SENT'
      ) {
        setAlreadyPurchased(true);
      } else {
        setAlreadyPurchased(false);
      }
    } catch (err) {
      console.error('שגיאה בבדיקת רכישה:', err);
      setAlreadyPurchased(false);
    }
  }, [project]);

  // פונקציה לשליפת קבצים מלאה מה-DB
  const fetchProjectFilesFromDB = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/projects/${projectId}`);
      const fullData = res.data?.project || res.data?.data || res.data;
      if (fullData) {
        // ✅ מאחדים media + files לרשימה אחת לניהול
        const allFiles = [...(fullData.media || []), ...(fullData.files || [])];
        setExistingFiles(allFiles);
        const status = fullData.existingOrder?.status || null;
        setOrderStatus(status);

        if (!status) setAlreadyPurchased(false);
        // אם אין קבצים אבל השרת מציין שיש הזמנה קיימת (למשל PENDING)
        if (fullData.existingOrder?.status) {
          setOrderStatus(fullData.existingOrder.status);
        }

        if (fullData.mainImageUrl) setImagePreview(fullData.mainImageUrl);
        setCurrentMainImageId(fullData.mainImageId || '');
      }
    } catch (err) {
      console.error('שגיאה בשליפת קבצים:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // שליפת היסטוריית צ'אט
  const fetchAiChat = useCallback(
    async (forcedChatId = null) => {
      const targetChatId = forcedChatId || chatId;

      try {
        if (!targetChatId) {
          if (!projectId) return;

          const chatRes = await api.get('/api/ai-chats', {
            params: { projectId },
          });

          const chats = chatRes.data.data || [];
          if (chats.length > 0) {
            const firstChatId = chats[0]._id;
            setChatId(firstChatId);
            await loadMessages(firstChatId);
          }
          return;
        }

        const msgRes = await api.get(`/api/ai-chats/${targetChatId}/messages`, {
          params: { limit: 50, order: 'asc' },
        });

        setAiMessages(msgRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch AI chat', err);
      }
    },
    [projectId, chatId]
  );
  const fetchAiQuota = useCallback(async () => {
    try {
      const res = await api.get('/api/ai-chats');

      const quota =
        res.data.meta?.quota || res.data.quota || res.data.data?.quota;

      if (quota) {
        setAiQuota({
          used: parseInt(quota.used) || 0,
          limit: parseInt(quota.limit) || 20,
          remaining: parseInt(quota.remaining) || 0,
        });
      }
    } catch (err) {
      console.error('Failed to sync quota', err);
    }
  }, []);
  const handleOpenFile = async (file) => {
    const filename = file.filename || file.name || 'download.txt';
    const fileUrl = file.url || file.fileUrl;

    if (!fileUrl) return showFeedback('error', 'כתובת קובץ חסרה');

    try {
      showFeedback('info', `מוריד את ${filename}...`);

      // אנחנו משתמשים ב-api אבל מוסיפים הגדרה שתמנע מה-Interceptor לנתק אותנו
      const response = await api.get(fileUrl, {
        responseType: 'blob',
        // דגל מיוחד למניעת ניתוק (וודאי שהשם תואם למה שמוגדר אצלכם ב-axios.js)
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
      showFeedback('success', 'הקובץ ירד בהצלחה');
    } catch (err) {
      // כאן אנחנו עוצרים את הניתוק!
      console.error('Download failed, preventing logout:', err);

      // אם השרת החזיר 401/403 (מה שקורה עם הקובץ של המעצב)
      if (err.response?.status === 401 || err.response?.status === 403) {
        showFeedback(
          'error',
          'אין לך הרשאה להוריד את קובץ המקור הזה (ייתכן שלא רכשת את הפרויקט).'
        );
      } else {
        showFeedback('error', 'שגיאה בהורדת הקובץ');
      }

      // חשוב מאוד: לא לעשות throw err כדי שה-Interceptor לא יתפוס את זה
    }
  };
  // פונקציה למחיקה מקומית (לפני השמירה)

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await api.get('/api/reviews', { params: { projectId } });
      const list = res.data?.reviews || res.data?.data || res.data || [];
      setReviews(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchReviews();
  }, [projectId, fetchReviews]);

  // ✅ Effect חדש: בדיקת רכישה כשהפופאפ נפתח או כשמשתנה ה-projectId
  useEffect(() => {
    if (isLoggedIn && !isOwner) {
      checkIfProjectPurchased();
    }
  }, [projectId, currentUserId, isLoggedIn, isOwner, checkIfProjectPurchased]);

  // טעינה ראשונית וטיפול בלינקים מהדשבורד
  // בתוך useEffect של initPopup
  useEffect(() => {
    const initPopup = async () => {
      // הבדיקה hasPermission('ai.consult') חייבת להיות כאן
      if (
        isOwner &&
        hasPermission('ai.consult') &&
        project &&
        !hasFetchedRef.current
      ) {
        hasFetchedRef.current = true;
        const queryParams = new URLSearchParams(location.search);
        const chatIdFromUrl = queryParams.get('chat') || project.initialChatId;

        if (chatIdFromUrl) setChatId(chatIdFromUrl);

        // רק כאן מתבצעות הקריאות שזורקות 403
        await fetchAiQuota();
        await fetchAiChat(chatIdFromUrl);
      }
    };
    initPopup();
  }, [
    projectId,
    location.search,
    project?.initialChatId,
    isOwner,
    hasPermission, // וודאי שזה ב-Dependency array
    fetchAiQuota,
    fetchAiChat,
  ]);
  useEffect(() => {
    if (isEditing) {
      const scrollContainer = document.querySelector('.popup-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [isEditing]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  // וודאי שרשימת הקבצים מתעדכנת כשהפרויקט משתנה

  useEffect(() => {
    setExistingFiles([]); // איפוס עד שה-fetch יחזור
  }, [projectId]);
  // גלילה לראש הפופאפ כשנכנסים למצב עריכה
  // הוסיפי את ה-Effect הזה בתוך Popup.jsx
  // ✅ Effect 1: איפוס כשהפרויקט משתנה + שליפה מחדש
  useEffect(() => {
    setExistingFiles([]);
    setImagePreview(project?.mainImageUrl || '');
    fetchProjectFilesFromDB();
  }, [projectId, project?.mainImageUrl, fetchProjectFilesFromDB]);

  // ✅ Effect 2: גלילה לראש בעריכה
  useEffect(() => {
    if (isEditing) {
      const scrollContainer = document.querySelector('.popup-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [isEditing]);

  // ✅ Effect 3: גלילה לסוף הצ'אט
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  // ✅ Effect 4: בדיקת רכישה - חייב להיות לפני ה-return
  useEffect(() => {
    if (isLoggedIn && !isOwner && project) {
      checkIfProjectPurchased();
    }
  }, [project, isLoggedIn, isOwner, checkIfProjectPurchased]);

  // --- 2. רק עכשיו מותר לשים את תנאי העצירה ---
  if (!project) return null;

  // --- 3. פונקציות עזר (Handlers) ---

  const handleSaveProjectEdit = async () => {
    try {
      const tagsArray = editData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== '');
      setLoading(true);
      const formData = new FormData();

      formData.append('title', editData.title);
      formData.append('description', editData.description);
      formData.append('price', editData.price);
      formData.append('tags', JSON.stringify(tagsArray));

      // ✅ שולחים רק קבצים שאינם תמונות כ-existingFiles
      const nonImageFiles = existingFiles.filter(
        (f) => f.fileType !== 'image' && f.fileType !== 'video'
      );
      formData.append('existingFiles', JSON.stringify(nonImageFiles));

      // קבצים חדשים
      newFiles.forEach((file) => formData.append('files', file));

      // ✅ אם נבחרה תמונה חדשה - נשלח אותה
      if (selectedFile) formData.append('files', selectedFile);

      const res = await api.put(`/api/projects/${projectId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updated = res.data.project || res.data.data;

      // ✅ אם הועלתה תמונה חדשה - נמצא אותה ב-media ונעדכן mainImageId
      // ✅ אם הועלתה תמונה חדשה - נמצא אותה ב-media ונעדכן mainImageId
      if (selectedFile && updated.media) {
        const newImage = updated.media[updated.media.length - 1];
        if (newImage) {
          const mainFormData = new FormData();
          mainFormData.append('mainImageId', newImage.id);
          const updatedMain = await api.put(
            `/api/projects/${projectId}`,
            mainFormData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          );

          const finalProject =
            updatedMain.data.project || updatedMain.data.data;
          if (finalProject?.mainImageUrl)
            setImagePreview(finalProject.mainImageUrl);
          if (onUpdate) onUpdate(finalProject);
        }
      } else {
        if (onUpdate) onUpdate(updated);
      }

      // ✅ רענון הקבצים מהשרת
      await fetchProjectFilesFromDB();
      setNewFiles([]);
      setSelectedFile(null);
      setIsEditing(false);
      showFeedback('success', 'הפרויקט עודכן בהצלחה!');
    } catch (err) {
      showFeedback(
        'error',
        'שגיאה בשמירה. וודא ששמות הקבצים באנגלית ללא תווים מיוחדים.'
      );
    } finally {
      setLoading(false);
    }
  };

  const safeReviews = Array.isArray(reviews) ? reviews.filter(Boolean) : [];

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: null }), 6000);
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return showFeedback('error', 'עליך להתחבר כדי להגיב');

    const projectIdSafe = project?._id || project?.id;
    const ratingNum = Number(newReview.rating);
    const textVal = (newReview.comment || '').trim();

    if (!projectIdSafe) return showFeedback('error', 'חסר מזהה פרויקט');
    if (!ratingNum || ratingNum < 1 || ratingNum > 5)
      return showFeedback('error', 'בחר דירוג בין 1 ל-5');
    if (!textVal) return showFeedback('error', 'נא לכתוב תגובה');

    try {
      const res = await api.post('/api/reviews', {
        projectId: projectIdSafe,
        rating: ratingNum,
        text: textVal,
      });

      const created = res.data?.review || res.data?.data || res.data;
      if (created)
        setReviews((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);

      setNewReview({ rating: 5, comment: '' });
      showFeedback('success', 'התגובה נוספה בהצלחה!');
    } catch (err) {
      showFeedback('error', err.friendlyMessage || 'שגיאה בהוספת תגובה');
    }
  };
  // --- API Functions ---

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // יצירת URL זמני לתצוגה מקדימה
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleUpdateReview = async (reviewId) => {
    if (!editReviewData.text.trim())
      return showFeedback('error', 'לא ניתן לשמור תגובה ריקה');

    try {
      setLoading(true);
      // שליחת הבקשה לשרת
      const res = await api.put(`/api/reviews/${reviewId}`, {
        rating: editReviewData.rating,
        text: editReviewData.text,
      });

      // השרת מחזיר את האובייקט המעודכן (חשוב לבדוק אם הוא תחת data או review)
      const updatedReview = res.data.review || res.data.data;

      setReviews((prev) =>
        prev.map((r) => {
          // השוואת ID בצורה בטוחה (גם מחרוזת וגם אובייקט)
          if (String(r._id || r.id) === String(reviewId)) {
            // אנחנו מחזירים את האובייקט החדש מהשרת ושומרים על השדות הקיימים
            return { ...r, ...updatedReview };
          }
          return r;
        })
      );

      setEditingReviewId(null); // סגירת מצב העריכה
      showFeedback('success', 'התגובה עודכנה בהצלחה');
    } catch (err) {
      console.error('Update failed:', err);
      showFeedback('error', 'שגיאה בעדכון התגובה');
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את התגובה?')) return;

    try {
      setLoading(true);
      await api.delete(`/api/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => (r._id || r.id) !== reviewId));
      showFeedback('success', 'התגובה נמחקה בהצלחה');
    } catch (err) {
      showFeedback('error', err.friendlyMessage || 'שגיאה במחיקת התגובה');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (id) => {
    const msgRes = await api.get(`/api/ai-chats/${id}/messages`, {
      params: { limit: 50, order: 'asc' },
    });
    setAiMessages(msgRes.data.data || []);
  };

  // שליפת מכסה אמיתית מה-meta

  const handleSendAiMessage = async () => {
    if (!userQuery.trim() || aiQuota.remaining === 0 || loading) return;

    const messageContent = userQuery.trim();
    setLoading(true);
    setUserQuery('');

    try {
      let currentChatId = chatId;
      if (!currentChatId) {
        const chatRes = await api.post('/api/ai-chats', {
          projectId,
          title: `ייעוץ עבור ${project.title}`,
        });
        currentChatId = chatRes.data.data.chatId;
        setChatId(currentChatId);
      }

      setAiMessages((prev) => [
        ...prev,
        { role: 'user', content: messageContent, _id: Date.now() },
      ]);
      // עדכני את החלק הזה בתוך handleSendAiMessage (סביב שורה 332):
      const response = await api.post(
        `/api/ai-chats/${currentChatId}/messages`,
        {
          // הוספת השדה שהשרת מתעקש עליו לפי שגיאת ה-400
          content: messageContent,
          imageUrl: null,

          // שמירה על שאר המבנה עבור הלוגיקה של ה-AI בשרת
          messages: [
            ...aiMessages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: messageContent },
          ],
          language: 'he',
          safetyIdentifier: currentUserId,
        }
      );

      if (response.data.data) {
        setAiMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: response.data.data.answer,
            _id: response.data.data.assistantMessageId,
          },
        ]);
        if (response.data.data.usage) setAiQuota(response.data.data.usage);
      }
    } catch (err) {
      showFeedback(
        'error',
        err.friendlyMessage ||
          err.response?.data?.message ||
          'שגיאה בשליחת הודעה'
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Effects ---

  // הפעלת השליפה ברגע שהפופאפ נפתח

  return (
    <div className="project-modal-overlay" onClick={onClose}>
      <div
        className="popup-main-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="project-modal-content">
          {/* כפתור סגירה ופידבק */}
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
          {feedback.msg && (
            <div className={`popup-feedback ${feedback.type}`}>
              {feedback.msg}
            </div>
          )}

          <div className="popup-scroll-container">
            {/* --- חלק 1: פרטי הפרויקט --- */}
            <div className="popup-header">
              {isEditing ? (
                <h2 className="project-title">עריכת פרויקט</h2>
              ) : (
                <h2 className="project-title">{project.title}</h2>
              )}

              <div className="popup-creator-info">
                <button
                  onClick={() =>
                    navigate(
                      `/profile/${project.createdBy?._id || project.createdBy}`
                    )
                  }
                  className="view-public-profile-btn"
                >
                  לפרופיל היוצר ←
                </button>
              </div>
            </div>

            <div className="popup-body">
              {isEditing ? (
                /* --- מצב עריכת פרויקט --- */
                <>
                  <div className="edit-project-container">
                    <div className="edit-layout-columns">
                      {/* צד שמאל: תמונה */}
                      <div className="edit-image-side">
                        <div className="edit-image-wrapper">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="edit-image-preview"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            className="change-image-btn-overlay"
                            onClick={() => fileInputRef.current.click()}
                          >
                            📷 החלף תמונה
                          </button>
                          <div className="form-group">
                            <label>תגיות (מופרדות בפסיק):</label>
                            <input
                              type="text"
                              placeholder="לדוגמה: React, Fullstack, Design"
                              value={editData.tags}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  tags: e.target.value,
                                })
                              }
                            />
                            <small style={{ color: '#666' }}>
                              הפרד בין מילים באמצעות פסיק (,)
                            </small>
                          </div>
                        </div>
                      </div>

                      {/* צד ימין: טופס */}
                      <div className="edit-fields-side">
                        <div className="form-group">
                          <label>שם הפרויקט:</label>
                          <input
                            type="text"
                            value={editData.title}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>תיאור:</label>
                          <textarea
                            value={editData.description}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                description: e.target.value,
                              })
                            }
                            rows={5}
                          />
                        </div>
                        <div className="form-group">
                          <label>מחיר (₪):</label>
                          <input
                            type="number"
                            value={editData.price}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                price: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        {/* אזור ניהול קבצים - גלוי רק ליוצר הפרויקט */}
                        {/* אזור ניהול קבצים - גלוי רק ליוצר הפרויקט במצב עריכה */}
                        {((isOwner && isEditing) || isAdmin) && (
                          <div className="project-files-manager">
                            <h4>📁 ניהול קבצי מקור</h4>
                            <div className="files-list-admin">
                              {/* הצגת קבצים שכבר קיימים בשרת */}
                              {existingFiles.map((file, idx) => (
                                <div
                                  key={file._id || idx}
                                  className="file-item-row"
                                >
                                  <span className="file-name">
                                    {file.filename}
                                  </span>
                                  <div className="file-actions">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenFile(file)}
                                      className="btn-view-small"
                                      title="פתח או הורד קובץ"
                                    >
                                      👁️
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {/* הצגת קבצים חדשים שבחרת הרגע (לפני שמירה) */}
                              {newFiles.map((file, idx) => (
                                <div
                                  key={`new-${idx}`}
                                  className="file-item-row pending-upload"
                                >
                                  <span>🆕 {file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setNewFiles(
                                        newFiles.filter((_, i) => i !== idx)
                                      )
                                    }
                                  >
                                    ✖️
                                  </button>
                                </div>
                              ))}
                            </div>

                            <label className="btn-add-files">
                              ➕ הוסף קבצים (באנגלית בלבד)
                              <input
                                type="file"
                                multiple
                                style={{ display: 'none' }}
                                onChange={(e) =>
                                  setNewFiles([
                                    ...newFiles,
                                    ...Array.from(e.target.files),
                                  ])
                                }
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="edit-form-actions">
                      <button
                        className="btn-save-project"
                        onClick={handleSaveProjectEdit}
                        disabled={loading}
                      >
                        {loading ? 'שומר...' : 'שמור שינויים'}
                      </button>
                      <button
                        className="btn-cancel-project"
                        onClick={() => setIsEditing(false)}
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="popup-main-layout">
                  <div className="image-side">
                    <img
                      src={project.mainImageUrl}
                      alt={project.title}
                      className="main-popup-img"
                    />
                  </div>
                  <div className="info-side">
                    {/* הצגת קטגוריה */}
                    {project.category && (
                      <div className="project-category-badge">
                        📁 קטגוריה:{' '}
                        <span>{project.category.name || project.category}</span>
                      </div>
                    )}

                    <p className="price-row">₪{project.price}</p>
                    <p className="project-description">{project.description}</p>

                    {/* הצגת תוויות (Tags) */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="project-tags-container">
                        {project.tags.map((tag, index) => (
                          <span key={index} className="tag-pill">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="popup-sections-divider" />
            <div className="purchase-and-reviews-container">
              {/* --- חלק 2: אזור רכישה (PayPal) --- */}
              {/* ✅ מציגים כפתורי PayPal רק אם:
                   1. המשתמש לא בעלים של הפרויקט (!isOwner)
                   2. המשתמש עדיין לא קנה את הפרויקט (!alreadyPurchased)
                   3. המחיר גדול מ-0 (project.price > 0)
              */}
              {!isOwner && !alreadyPurchased && project.price > 0 && (
                <div className="paypal-purchase-section">
                  {/* מקרה: כפתורי תשלום */}
                  <div className="paypal-button-container">
                    <h4>
                      {/* בדיקה אם יש הזמנה קיימת שאינה מבוטלת/גמורה */}
                      {orderStatus &&
                      !['CANCELED', 'COMPLETED', 'PAID'].includes(orderStatus)
                        ? '⏳ המשך הזמנה קיימת'
                        : '💳 רכישת הפרויקט'}
                    </h4>
                    <PayPalButtons
                      style={{
                        layout: 'vertical',
                        shape: 'rect',
                        height: 45,
                      }}
                      createOrder={async () => {
                        try {
                          const res = await api.post(
                            '/api/orders/paypal/create',
                            { projectId }
                          );
                          return res.data.order.paypalOrderId;
                        } catch (err) {
                          if (err.response?.status === 409) {
                            // אם השרת מחזיר 409, נעדכן את הסטטוס להמשך הזמנה
                            setOrderStatus('PENDING');
                            showFeedback(
                              'info',
                              'קיימת הזמנה פתוחה לפרויקט זה. ניתן להמשיך בתשלום.'
                            );

                            // אם השרת מחזיר את ה-ID הקיים בתוך ה-Error:
                            if (err.response.data?.details?.paypalOrderId) {
                              return err.response.data.details.paypalOrderId;
                            }
                            throw new Error('PENDING_ORDER');
                          }
                          throw err;
                        }
                      }}
                      onApprove={async (data) => {
                        try {
                          setLoading(true);
                          const res = await api.post(
                            '/api/orders/paypal/capture',
                            { paypalOrderId: data.orderID }
                          );

                          if (
                            res.data.order.status === 'PAYOUT_SENT' ||
                            res.data.order.status === 'PAID'
                          ) {
                            showFeedback('success', '✅ רכישה הושלמה בהצלחה!');

                            // רענן את הדף כדי שייטען את existingOrder החדש מהשרת
                            setTimeout(() => {
                              window.location.reload();
                            }, 1500);
                          }
                        } catch (err) {
                          showFeedback(
                            'error',
                            err.friendlyMessage || 'שגיאה בהשלמת התשלום'
                          );
                        } finally {
                          setLoading(false);
                        }
                      }}
                      onError={() => {
                        showFeedback('error', 'שגיאה בתשלום PayPal');
                      }}
                    />
                  </div>
                </div>
              )}

              {/* הודעת הצלחה - מציגה רק אם כבר קנה */}
              {alreadyPurchased && (
                <div className="success-message-box purchased-alert">
                  <p>
                    ✅ <strong>רכשת את הפרויקט בעבר!</strong>
                  </p>
                  <p>
                    תוכל לצפות בקבצי המקור שלו באיזור האישי שלך. תודה על התמיכה!
                  </p>
                </div>
              )}
            </div>
            <div className="popup-sections-divider" />
            <div className="popup-footer">
              {canEdit && (
                <button
                  className="edit-trigger-btn"
                  onClick={() => setIsEditing(true)}
                >
                  ✏️ עריכת פרויקט
                </button>
              )}
            </div>
            {/* --- חלק 3: אזור תגובות --- */}
            <div className="reviews-section">
              <h3>💬 תגובות משתמשים ({safeReviews.length})</h3>

              {reviewsLoading && (
                <p className="loading-spinner">טוען תגובות...</p>
              )}

              {/* טופס הוספת תגובה */}
              {isLoggedIn ? (
                <form onSubmit={handleAddReview} className="add-review-form">
                  <div className="rating-row">
                    <label>דירוג:</label>
                    <select
                      value={newReview.rating}
                      onChange={(e) =>
                        setNewReview((prev) => ({
                          ...prev,
                          rating: Number(e.target.value),
                        }))
                      }
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    placeholder="כתוב תגובה..."
                    value={newReview.comment}
                    onChange={(e) =>
                      setNewReview((prev) => ({
                        ...prev,
                        comment: e.target.value,
                      }))
                    }
                    required
                  />

                  <button type="submit" className="submit-review-btn">
                    פרסם תגובה
                  </button>
                </form>
              ) : (
                <p className="no-reviews">כדי לכתוב תגובה – צריך להתחבר.</p>
              )}

              {/* רשימת תגובות */}
              {/* רשימת תגובות */}
              {/* רשימת תגובות */}
              <div className="reviews-list">
                {!reviewsLoading && safeReviews.length === 0 ? (
                  <p className="no-reviews">אין עדיין תגובות לפרויקט זה.</p>
                ) : (
                  safeReviews.map((rev, idx) => {
                    const reviewer = rev?.userId || rev?.user;
                    const reviewerId = String(
                      reviewer?._id || reviewer?.id || reviewer || ''
                    );
                    const revId = rev?._id || rev?.id;

                    // בדיקה האם את היוצרת (המרנו את שניהם למחרוזת כדי למנוע בעיות טיפוסים)
                    const isReviewOwner = reviewerId === currentUserId;

                    // שורת דיבאג - פתחי את ה-Console (F12) כדי לראות אם ה-IDs תואמים

                    const canManageReview = isReviewOwner || isAdmin;

                    return (
                      <div key={revId} className="review-card">
                        {editingReviewId === revId ? (
                          /* --- מצב עריכה --- */
                          <div className="review-edit-form">
                            <div className="edit-header">
                              <select
                                value={editReviewData.rating}
                                onChange={(e) =>
                                  setEditReviewData({
                                    ...editReviewData,
                                    rating: Number(e.target.value),
                                  })
                                }
                              >
                                {[5, 4, 3, 2, 1].map((n) => (
                                  <option key={n} value={n}>
                                    {n} ⭐
                                  </option>
                                ))}
                              </select>
                            </div>
                            <textarea
                              value={editReviewData.text}
                              onChange={(e) =>
                                setEditReviewData({
                                  ...editReviewData,
                                  text: e.target.value,
                                })
                              }
                              className="edit-textarea"
                            />
                            <div className="edit-actions">
                              <button
                                className="btn-save-review"
                                onClick={() => handleUpdateReview(revId)}
                                disabled={loading}
                              >
                                שמור
                              </button>
                              <button
                                className="btn-cancel-review"
                                onClick={() => setEditingReviewId(null)}
                              >
                                ביטול
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* --- מצב תצוגה נעים לעין --- */
                          <div className="review-display">
                            <div className="review-top-row">
                              <div className="user-meta">
                                <span className="reviewer-name">
                                  {reviewer?.username || 'משתמש'}{' '}
                                </span>
                                <span className="review-stars">
                                  {'⭐'.repeat(rev.rating || 0)}
                                </span>
                              </div>

                              {canManageReview && (
                                <div className="review-controls">
                                  {isReviewOwner && (
                                    <button
                                      className="control-btn edit"
                                      onClick={() => {
                                        setEditingReviewId(revId); // הפעלת מצב עריכה ל-ID הספציפי
                                        setEditReviewData({
                                          rating: rev.rating,
                                          text: rev.text,
                                        }); // טעינת טקסט ודירוג קיימים
                                      }}
                                    >
                                      ✏️ ערוך
                                    </button>
                                  )}
                                  <button
                                    className="control-btn delete"
                                    onClick={() => handleDeleteReview(revId)}
                                  >
                                    🗑️ מחק
                                  </button>
                                </div>
                              )}
                            </div>

                            <p className="review-content">{rev.text}</p>
                            <span className="review-timestamp">
                              {rev.createdAt
                                ? new Date(rev.createdAt).toLocaleDateString(
                                    'he-IL'
                                  )
                                : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {/* כפתור עריכה לבעלים */}
          </div>
        </div>
        <div className="sidebar-container">
          {/* סיידבר AI - מופיע רק לבעלים */}
          {canUseAi && (
            <aside className="ai-sidebar">
              <div className="ai-sidebar-header">
                <h3>🤖 סוכן AI</h3>
                <p>ייעוץ עבור "{project.title}"</p>
              </div>

              <div className="ai-content-area">
                <div className="ai-chat-messages">
                  {aiMessages.map((msg) => (
                    <div key={msg._id} className={`chat-bubble ${msg.role}`}>
                      {msg.content}
                    </div>
                  ))}
                  {loading && (
                    <div className="ai-loading">הסוכן מעבד נתונים...</div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              <div className="ai-sidebar-footer">
                <div className="ai-quota-info">
                  {/* שימוש ב-aiQuota.remaining מה-state */}
                  <small>
                    {aiQuota.remaining > 0
                      ? `נותרו לך ${aiQuota.remaining} שאילתות`
                      : 'ניצלת את כל המכסה להיום'}
                  </small>
                </div>
                <div className="ai-input-wrapper">
                  <textarea
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="שאל משהו..."
                    disabled={aiQuota.remaining === 0 || loading} // חסימת קלט אם אין מכסה
                  />
                  <button
                    onClick={handleSendAiMessage}
                    className="ai-send-btn"
                    disabled={
                      loading || !userQuery.trim() || aiQuota.remaining === 0
                    }
                  >
                    שלח
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default Popup;
