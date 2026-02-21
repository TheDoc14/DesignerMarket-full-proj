import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { PayPalButtons } from '@paypal/react-paypal-js';
import projectDefault from '../DefaultPics/projectDefault.png';
import './componentStyle.css';
import { usePermission } from '../Hooks/usePermission.jsx';
import { Tag, X, Shield } from 'lucide-react';

const Popup = ({ project, onClose, onUpdate, isLoggedIn }) => {
  const { hasPermission, user: currentUser } = usePermission();
  const projectId = project?._id || project?.id;
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const location = useLocation();
  const hasFetchedRef = useRef(false);

  // --- States ---
  const [reviews, setReviews] = useState([]);
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

  // --- API Functions ---

  // שליפת היסטוריית צ'אט
  const fetchAiChat = useCallback(
    async (forcedChatId = null) => {
      const token = localStorage.getItem('token');
      const targetChatId = forcedChatId || chatId;

      try {
        if (!targetChatId) {
          // חיפוש צ'אט קיים לפרויקט
          const chatRes = await axios.get(
            `http://localhost:5000/api/ai-chats?projectId=${projectId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const chats = chatRes.data.data || [];
          if (chats.length > 0) {
            setChatId(chats[0]._id);
            return fetchAiChat(chats[0]._id);
          }
          return;
        }

        const msgRes = await axios.get(
          `http://localhost:5000/api/ai-chats/${targetChatId}/messages?limit=50&order=asc`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAiMessages(msgRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch AI chat', err);
      }
    },
    [projectId, chatId]
  );

  // שליפת מכסה אמיתית מה-meta
  const fetchAiQuota = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/ai-chats', {
        headers: { Authorization: `Bearer ${token}` },
      });

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

    const token = localStorage.getItem('token');
    const messageContent = userQuery.trim();
    setLoading(true);
    setUserQuery('');

    try {
      let currentChatId = chatId;
      if (!currentChatId) {
        const chatRes = await axios.post(
          'http://localhost:5000/api/ai-chats',
          { projectId, title: `ייעוץ עבור ${project.title}` },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        currentChatId = chatRes.data.data.chatId;
        setChatId(currentChatId);
      }

      setAiMessages((prev) => [
        ...prev,
        { role: 'user', content: messageContent, _id: Date.now() },
      ]);

      const response = await axios.post(
        `http://localhost:5000/api/ai-chats/${currentChatId}/messages`,
        { content: messageContent },
        { headers: { Authorization: `Bearer ${token}` } }
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
        err.response?.data?.message || 'שגיאה בשליחת הודעה'
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Effects ---

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
    project.initialChatId,
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
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
          {feedback.msg && (
            <div className={`popup-feedback ${feedback.type}`}>
              {feedback.msg}
            </div>
          )}

          <div className="popup-scroll-container">
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
                  <div className="view-mode">
                    <p className="price-row">₪{project.price}</p>
                    <p className="desc-text">{project.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

        {hasPermission('ai.consult') && isOwner && (
          <aside className="ai-sidebar">
            <div className="ai-sidebar-header">
              <h3>🤖 משוב AI</h3>
              <p>התייעצות לגבי "{project.title}"</p>
            </div>

            <div className="ai-content-area">
              <div className="ai-chat-messages">
                {aiMessages.map((msg) => (
                  <div key={msg._id} className={`chat-bubble ${msg.role}`}>
                    {msg.content}
                  </div>
                ))}
                {loading && <div className="ai-loading">המנטור חושב...</div>}
                <div ref={chatEndRef} />
              </div>
            </div>

            <div className="ai-sidebar-footer">
              <div className="ai-quota-display">
                <div className="quota-text">
                  <span>מכסה יומית:</span>
                  <span className="quota-numbers">
                    {aiQuota.used} / {aiQuota.limit}
                  </span>
                </div>
                <div className="quota-bar-container">
                  <div
                    className="quota-bar-fill"
                    style={{
                      width: `${(aiQuota.used / aiQuota.limit) * 100}%`,
                      backgroundColor:
                        aiQuota.remaining === 0 ? '#ef4444' : '#8e44ad',
                    }}
                  ></div>
                </div>
                <p className="quota-remaining">
                  נותרו לך עוד {aiQuota.remaining} שאילתות
                </p>
              </div>

              <div className="ai-input-wrapper">
                <textarea
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder={
                    aiQuota.remaining > 0 ? 'שאל את המנטור...' : 'המכסה הסתיימה'
                  }
                  disabled={aiQuota.remaining === 0 || loading}
                />
                <button
                  className="send-ai-btn"
                  onClick={handleSendAiMessage}
                  disabled={
                    loading || !userQuery.trim() || aiQuota.remaining === 0
                  }
                >
                  {loading ? '...' : 'שלח'}
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default Popup;
