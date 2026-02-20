import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import { PayPalButtons } from '@paypal/react-paypal-js';
import projectDefault from '../DefaultPics/projectDefault.png';
import './componentStyle.css';
import { usePermission } from '../Hooks/usePermission.jsx';
import { Tag, X } from 'lucide-react';

const Popup = ({ project, onClose, onUpdate, isLoggedIn }) => {
  const { hasPermission, user: currentUser } = usePermission();
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: null });
  const navigate = useNavigate();

  const [tags, setTags] = useState(project?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const [editData, setEditData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    category: project?.category || '',
    price: project?.price || 0,
  });

  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [selectedImage, setSelectedImage] = useState(null);
  const projectId = project._id || project.id;
  const storageKey = `pending_paypal_${projectId}`;

  const creatorName =
    project?.createdBy?.username || project?.creatorName || 'מעצב במערכת';
  const isCreatorMissing =
    !project?.createdBy ||
    (typeof project.createdBy === 'object' && !project.createdBy?._id);

  const isOwner =
    currentUser &&
    (String(currentUser.id) === String(project?.createdBy?._id) ||
      String(currentUser.id) === String(project?.createdBy));

  const canEdit = isOwner || hasPermission('projects.edit');

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    const timer = type === 'success' ? 10000 : 6000;
    setTimeout(() => setFeedback({ type: '', msg: null }), timer);
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = projectDefault;
  };

  // --- לוגיקת תגובות ---
  const fetchReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/reviews?projectId=${projectId}`
      );
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error('Reviews load failed', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [projectId]);

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = tagInput.trim().replace(',', '');
      if (value && !tags.includes(value)) {
        setTags([...tags, value]);
        setTagInput('');
      }
    }
  };
  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };

  // --- תיקון ה-useEffect: הסרת בדיקת ההזמנות שגרמה ל-404 ---
  useEffect(() => {
    if (project) {
      fetchReviews();
    }
  }, [project, fetchReviews]);

  // עדכון ה-State כשהפרויקט משתנה
  useEffect(() => {
    if (project) {
      setEditData({
        title: project.title,
        description: project.description,
        category: project.category,
        price: project.price,
      });
      setTags(project.tags || []);
    }
  }, [project]);

  // --- לוגיקת PayPal ---
  const createOrder = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `http://localhost:5000/api/orders/paypal/create`,
        { projectId: projectId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newId = response.data.order.paypalOrderId;
      localStorage.setItem(storageKey, newId);
      return newId;
    } catch (err) {
      if (err.response && err.response.status === 409) {
        const details = err.response.data.details;
        const existingPaypalId = details?.paypalOrderId;
        if (existingPaypalId) {
          showFeedback('success', 'משחזר הזמנה קיימת...');
          localStorage.setItem(storageKey, existingPaypalId);
          return existingPaypalId;
        }
      }
      const serverMessage =
        err.response?.data?.message || 'שגיאה בתקשורת עם השרת';
      showFeedback('error', serverMessage);
      throw err;
    }
  };

  const onApprove = async (data) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/orders/paypal/capture`,
        { paypalOrderId: data.orderID },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.removeItem(storageKey);
      showFeedback(
        'success',
        <span>
          הרכישה הושלמה! הקבצים במתינים ב-
          <a href="/PersonalDashboard">אזור האישי</a>
        </span>
      );
      if (onUpdate) onUpdate();
      setTimeout(onClose, 8000);
    } catch (err) {
      showFeedback('error', 'שגיאה בהשלמת הרכישה.');
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/reviews`,
        { projectId, rating: newRating, text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      fetchReviews();
      if (onUpdate) onUpdate();
      showFeedback('success', 'התגובה נוספה!');
    } catch (err) {
      showFeedback('error', 'שגיאה בהוספת תגובה.');
    }
  };

  const handleSaveProject = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('title', editData.title);
      data.append('description', editData.description);
      data.append('price', editData.price);
      data.append('tags', tags.join(',')); // הוספת התגיות המעודכנות
      if (selectedImage) data.append('image', selectedImage);
      const response = await axios.put(
        `http://localhost:5000/api/projects/${projectId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      if (onUpdate) onUpdate(response.data.project);
      setIsEditing(false);
      showFeedback('success', 'הפרויקט עודכן!');
    } catch (err) {
      showFeedback('error', err.friendlyMessage || 'עדכון הפרויקט נכשל.');
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  return (
    <div className="project-modal-overlay" onClick={onClose}>
      <div
        className="project-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
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
            {isEditing ? (
              <input
                className="edit-input title-edit"
                value={editData.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
              />
            ) : (
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
            )}
          </div>

          <div className="popup-body">
            <div className="popup-main-layout">
              <div className="image-side">
                <img
                  src={
                    selectedImage
                      ? URL.createObjectURL(selectedImage)
                      : project.mainImageUrl
                  }
                  alt={project.title}
                  className="main-popup-img"
                  onError={handleImageError}
                />
              </div>
              <div className="info-side">
                {isEditing ? (
                  <div className="edit-mode">
                    <label>מחיר (₪)</label>
                    <input
                      type="number"
                      value={editData.price}
                      onChange={(e) =>
                        setEditData({ ...editData, price: e.target.value })
                      }
                    />
                    <label>תיאור</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          description: e.target.value,
                        })
                      }
                    />
                    <label>תגיות</label>
                    <div className="tags-edit-container">
                      <div className="tags-wrapper">
                        {tags.map((tag, idx) => (
                          <span key={idx} className="tag-pill">
                            {tag} <X size={12} onClick={() => removeTag(idx)} />
                          </span>
                        ))}
                        <input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          placeholder="הוסף..."
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="view-mode">
                    <p className="price-row">
                      <span className="label">מחיר:</span>{' '}
                      <span className="value">₪{project.price}</span>
                    </p>
                    <p className="desc-text">{project.description}</p>

                    {tags.length > 0 && (
                      <div className="popup-tags-display">
                        <Tag size={14} />
                        {tags.map((tag, i) => (
                          <span key={i} className="tag-item">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="purchase-area">
                      {isCreatorMissing ? (
                        <div className="unavailable-notice">
                          ⚠️ המוכר אינו פעיל
                        </div>
                      ) : !isLoggedIn ? (
                        <div className="auth-prompt-section">
                          <p>כדי לרכוש עליך להיות מחובר</p>
                          <Link
                            to="/login"
                            onClick={onClose}
                            className="auth-btn login-btn"
                          >
                            התחברות
                          </Link>
                        </div>
                      ) : (
                        currentUser &&
                        !isOwner && (
                          <div className="purchase-section">
                            <PayPalButtons
                              createOrder={createOrder}
                              onApprove={onApprove}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="divider" />

            {/* רשימת תגובות */}
            <div className="reviews-list">
              {reviewsLoading ? (
                <p>טוען תגובות...</p>
              ) : reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div key={rev._id || rev.id} className="review-item">
                    <div className="review-header">
                      <strong>{rev.userId?.username || 'משתמש מערכת'}</strong>
                      <span>{'⭐'.repeat(rev.rating)}</span>
                    </div>
                    <p>{rev.text}</p>
                  </div>
                ))
              ) : (
                <p>אין תגובות לפרויקט זה.</p>
              )}
            </div>

            {/* הוספת תגובה - רק למחוברים שאינם הבעלים */}
            {isLoggedIn && currentUser && !isOwner && !isEditing && (
              <form className="add-review-form" onSubmit={handleAddReview}>
                <h4>הוסף חוות דעת</h4>
                <div className="rating-select">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      className={newRating >= num ? 'star active' : 'star'}
                      onClick={() => setNewRating(num)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="כתוב מה דעתך..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                />
                <button type="submit" className="submit-review-btn">
                  שלח תגובה
                </button>
              </form>
            )}
          </div>
        </div>

        {/* פוטר - כפתורי עריכה */}
        <div className="popup-footer">
          {canEdit && (
            <div className="footer-actions">
              {isEditing ? (
                <>
                  <button
                    className="save-btn"
                    onClick={handleSaveProject}
                    disabled={loading}
                  >
                    שמור
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setIsEditing(false)}
                  >
                    ביטול
                  </button>
                </>
              ) : (
                <button
                  className="edit-trigger-btn"
                  onClick={() => setIsEditing(true)}
                >
                  ✏️ עריכה
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Popup;
