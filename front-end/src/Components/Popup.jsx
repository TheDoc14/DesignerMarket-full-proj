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

  // --- Logic Helpers ---
  const isOwner =
    currentUser &&
    (String(currentUser.id) === String(project?.createdBy?._id) ||
      String(currentUser.id) === String(project?.createdBy));

  const canEdit = isOwner || hasPermission('projects.edit');

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: null }), 6000);
  };
  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      // בדרך כלל ב-Backend כזה, השליפה היא לפי query parameter
      // במקום ה-URL הישן שגרם ל-404
      const res = await api.get(`/api/reviews`, { params: { projectId } });
      setReviews(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [projectId]);

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return showFeedback('error', 'עליך להתחבר כדי להגיב');

    try {
      const res = await api.post('/api/reviews', {
        projectId,
        rating: newReview.rating,
        text: newReview.comment,
      });

      setReviews((prev) => [res.data.data, ...prev]);
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
              <h3>💬 תגובות משתמשים ({reviews.length})</h3>

              {/* טופס הוספה (רק אם מחובר) */}
              {isLoggedIn && (
                <form onSubmit={handleAddReview} className="add-review-form">
                  <div className="reviews-list">
                    {reviews.map((rev) => (
                      <div key={rev._id} className="review-card">
                        <div className="review-header">
                          <strong>{rev.userId?.username || 'משתמש'}</strong>
                          <span>⭐ {rev.rating}</span>
                        </div>
                        <p>{rev.text}</p>
                      </div>
                    ))}
                  </div>
                  <textarea
                    placeholder="כתוב תגובה..."
                    value={newReview.comment}
                    onChange={(e) =>
                      setNewReview({ ...newReview, comment: e.target.value })
                    }
                    required
                  />
                  <button type="submit" className="submit-review-btn">
                    פרסם תגובה
                  </button>
                </form>
              )}

              {/* רשימת התגובות הקיימות */}
              <div className="reviews-list">
                {reviews.length === 0 ? (
                  <p className="no-reviews">אין עדיין תגובות לפרויקט זה.</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev._id} className="review-card">
                      <div className="review-header">
                        <strong>{rev.userId?.username || 'משתמש'}</strong>
                        <span className="review-rating">⭐ {rev.rating}</span>
                      </div>
                      <p className="review-text">{rev.text}</p>
                      <small>
                        {new Date(rev.createdAt).toLocaleDateString('he-IL')}
                      </small>
                    </div>
                  ))
                )}
              </div>
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
        {
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
        }
      </div>
    </div>
  );
};

export default Popup;
