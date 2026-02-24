import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { PayPalButtons } from '@paypal/react-paypal-js';
import './componentStyle.css';
import { usePermission } from '../Hooks/usePermission.jsx';

const Popup = ({ project, onClose, onUpdate, isLoggedIn }) => {
  const { hasPermission, user: currentUser } = usePermission();
  const projectId = project?._id || project?.id;
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const location = useLocation();
  const hasFetchedRef = useRef(false);

  // --- States ---
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [reviewsLoading, setReviewsLoading] = useState(false);
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
  });

  const safeReviews = Array.isArray(reviews) ? reviews.filter(Boolean) : [];

  // --- Logic Helpers ---
  const currentUserId = String(currentUser?._id || currentUser?.id || '');
  const createdById = String(
    project?.createdBy?._id || project?.createdBy || ''
  );

  const isOwner = !!currentUserId && !!createdById && currentUserId === createdById;

  const canUseAi = isOwner && hasPermission('ai.consult');

  // אצלך כתוב projects.edit אבל בבאק שלך זה projects.update
  const canEdit = isOwner || hasPermission('projects.update');

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: null }), 6000);
  };
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

  const loadMessages = async (id) => {
    const msgRes = await api.get(`/api/ai-chats/${id}/messages`, {
      params: { limit: 50, order: 'asc' },
    });
    setAiMessages(msgRes.data.data || []);
  };

  // שליפת מכסה אמיתית מה-meta
  const fetchAiQuota = useCallback(async () => {
    try {
      const res = await api.get('/api/ai-chats');

      const quota =
        res.data.meta?.quota || res.data.quota || res.data.data?.quota;

      if (quota) {
        setAiQuota({
          used: Number(quota.used) || 0,
          limit: Number(quota.limit) || 20,
          remaining: Number(quota.remaining) || 0,
        });
      }
    } catch (err) {
      console.error('Failed to sync quota', err);
    }
  }, []);

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

      const response = await api.post(
        `/api/ai-chats/${currentChatId}/messages`,
        {
          content: messageContent,
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
  useEffect(() => {
    if (projectId) fetchReviews();
  }, [projectId, fetchReviews]);
  // טעינה ראשונית וטיפול בלינקים מהדשבורד
  useEffect(() => {
    const initPopup = async () => {
      if (
        isOwner &&
        hasPermission('ai.consult') &&
        project &&
        !hasFetchedRef.current
      ) {
        hasFetchedRef.current = true;

        // בדיקה אם עבר chatId ב-URL או ב-Props
        const queryParams = new URLSearchParams(location.search);
        const chatIdFromUrl = queryParams.get('chat') || project.initialChatId;

        if (chatIdFromUrl) setChatId(chatIdFromUrl);

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
    hasPermission,
    fetchAiQuota,
    fetchAiChat,
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  if (!project) return null;

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
              <div className="popup-creator-info">
                <span>
                  יוצר: {project.creatorName || project.createdBy?.username}
                </span>
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
              <div className="popup-main-layout">
                <div className="image-side">
                  <img
                    src={project.mainImageUrl}
                    alt={project.title}
                    className="main-popup-img"
                  />
                </div>
                <div className="info-side">
                  <p className="price-row">₪{project.price}</p>
                  <p className="desc-text">{project.description}</p>
                </div>
              </div>
            </div>

            <div className="popup-sections-divider" />

            {/* --- חלק 2: אזור רכישה (PayPal) --- */}
            {!isOwner && project.price > 0 && (
              <div className="paypal-purchase-section">
                <h4>💳 רכישת רישיון לפרויקט</h4>
                <div className="paypal-button-container">
                  <PayPalButtons
                    style={{ layout: 'horizontal', height: 45 }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        purchase_units: [
                          {
                            amount: {
                              value: project.price.toString(),
                              currency_code: 'ILS',
                            },
                            description: project.title,
                          },
                        ],
                      });
                    }}
                    onApprove={async (data, actions) => {
                      const details = await actions.order.capture();
                      showFeedback(
                        'success',
                        `תודה ${details.payer.name.given_name}! הרכישה הושלמה.`
                      );
                    }}
                  />
                </div>
              </div>
            )}

            <div className="popup-sections-divider" />

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
              <div className="reviews-list">
                {!reviewsLoading && safeReviews.length === 0 ? (
                  <p className="no-reviews">אין עדיין תגובות לפרויקט זה.</p>
                ) : (
                  safeReviews.map((rev, idx) => {
                    const reviewer = rev?.userId || rev?.user; // תומך בשני מבנים
                    const reviewerName = reviewer?.username || 'משתמש';
                    const revId = rev?._id || rev?.id || `rev-${idx}`;
                    const rating = Number(rev?.rating || 0);

                    return (
                      <div key={revId} className="review-card">
                        <div className="review-header">
                          <strong>{reviewerName}</strong>
                          <span className="review-rating">⭐ {rating}</span>
                        </div>

                        <p className="review-text">{rev?.text || ''}</p>

                        {rev?.createdAt && (
                          <small>
                            {new Date(rev.createdAt).toLocaleDateString(
                              'he-IL'
                            )}
                          </small>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {/* כפתור עריכה לבעלים */}
            <div className="popup-footer">
              {canEdit && (
                <button
                  className="edit-trigger-btn"
                  onClick={() => setIsEditing(true)}
                >
                  ✏️ עריכה
                </button>
              )}
            </div>
          </div>

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
                  <small>נותרו {aiQuota.remaining} שאילתות</small>
                </div>
                <div className="ai-input-wrapper">
                  <textarea
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="שאל משהו..."
                  />
                  <button
                    onClick={handleSendAiMessage}
                    className="ai-send-btn"
                    disabled={loading}
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
