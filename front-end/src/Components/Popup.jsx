import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import { PayPalButtons } from '@paypal/react-paypal-js';
import './componentStyle.css';

const Popup = ({ project, onClose, onUpdate }) => {
  const { user: currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const [editData, setEditData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    category: project?.category || '',
    price: project?.price || 0,
  });

  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  // בדיקה האם היוצר קיים
  const isCreatorMissing =
    !project?.createdBy ||
    (typeof project.createdBy === 'object' && !project.createdBy?._id);

  const isOwner =
    currentUser &&
    (currentUser.id === project?.createdBy?._id ||
      currentUser.id === project?.createdBy);
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isOwner || isAdmin;

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 4000);
  };

  const fetchReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      const projectId = project._id || project.id;
      const res = await axios.get(
        `http://localhost:5000/api/reviews?projectId=${projectId}`
      );
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (project) fetchReviews();
  }, [project, fetchReviews]);

  // פונקציית שמירת עריכה
  const handleSaveProject = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('title', editData.title);
      data.append('description', editData.description);
      data.append('category', editData.category);
      data.append('price', editData.price);
      if (selectedImage) data.append('image', selectedImage);

      const projectId = project._id || project.id;

      // גם כאן - וודאי ש-response מוגדר
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
      showFeedback('success', 'הפרויקט עודכן בהצלחה!');
    } catch (err) {
      const errMsg =
        err.response?.data?.message || 'אירעה שגיאה בעדכון הפרויקט.';
      showFeedback('error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- לוגיקת PAYPAL מתוקנת ---
  const createOrder = async () => {
    if (isCreatorMissing) {
      showFeedback(
        'error',
        'לא ניתן לרכוש פרויקט זה כיוון שחשבון המוכר אינו פעיל.'
      );
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/orders/paypal/create',
        { projectId: project._id || project.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.order.paypalOrderId;
    } catch (err) {
      console.error('PayPal Create Error:', err);
      showFeedback(
        'error',
        err.response?.data?.message || 'שגיאה ביצירת הזמנה'
      );
      throw err;
    }
  };

  const onApprove = async (data) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/orders/paypal/capture',
        { paypalOrderId: data.orderID },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showFeedback('success', 'התשלום בוצע בהצלחה! הפרויקט זמין עבורך.');
      if (onUpdate) onUpdate();
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error('PayPal Capture Error:', err);
      showFeedback('error', 'התשלום נכשל בעדכון המערכת.');
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/reviews`,
        {
          projectId: project._id || project.id,
          rating: newRating,
          text: newComment,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      fetchReviews();
      showFeedback('success', 'התגובה נוספה!');
      if (onUpdate) onUpdate();
    } catch (err) {
      showFeedback(
        'error',
        err.response?.data?.message || 'שגיאה בהוספת תגובה'
      );
    }
  };

  if (!project) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
        <br />

        {feedback.msg && (
          <div className={`popup-feedback ${feedback.type}`}>
            {feedback.msg}
          </div>
        )}
        <br />

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
              <div className="title-area">
                <h2>{project.title}</h2>
                <span className="creator-tag">
                  מאת:{' '}
                  {project.creatorName ||
                    (isCreatorMissing ? 'חשבון לא פעיל' : 'מעצב במערכת')}
                </span>
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
                  </div>
                ) : (
                  <div className="view-mode">
                    <div className="price-row">
                      <span className="label">מחיר פרויקט:</span>
                      <span className="value">₪{project.price}</span>
                    </div>

                    {isCreatorMissing ? (
                      <div
                        className="unavailable-notice"
                        style={{
                          color: 'red',
                          fontWeight: 'bold',
                          margin: '15px 0',
                        }}
                      >
                        ⚠️ פרויקט זה אינו זמין לרכישה כרגע (חשבון המוכר אינו
                        פעיל).
                      </div>
                    ) : (
                      <>
                        <p className="desc-text">{project.description}</p>
                        {currentUser && !isOwner && (
                          <div
                            className="purchase-section"
                            style={{ marginTop: '20px' }}
                          >
                            <PayPalButtons
                              createOrder={createOrder}
                              onApprove={onApprove}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <hr className="divider" />
            {/* כאן יבואו התגובות */}
            {/* --- מדור תגובות --- */}
            <div className="reviews-section">
              <h3>תגובות ודירוגים ({reviews.length})</h3>

              {/* רשימת תגובות */}
              <div className="reviews-list">
                {reviewsLoading ? (
                  <p>טוען תגובות...</p>
                ) : reviews.length > 0 ? (
                  reviews.map((rev, index) => {
                    if (!rev) return null;

                    // שימוש ב-userId במקום user, וב-username במקום name כפי שמופיע ב-Backend
                    const reviewerName = rev.userId?.username || 'משתמש מערכת';

                    return (
                      <div
                        key={rev._id || `review-${index}`}
                        className="review-item"
                      >
                        <div className="review-header">
                          <div className="review-user-info">
                            {/* בדיקה כפולה: userId או user (לפי מה שהסוריאלייזר מחזיר) */}
                            {(rev.userId?.profileImage ||
                              rev.user?.profileImage) && (
                              <img
                                src={
                                  rev.userId?.profileImage ||
                                  rev.user?.profileImage
                                }
                                alt="פרופיל"
                                className="review-avatar"
                              />
                            )}
                            <strong>
                              {rev.userId?.username ||
                                rev.user?.username ||
                                'משתמש'}
                            </strong>
                          </div>
                          <span className="review-rating">
                            {'⭐'.repeat(
                              Math.max(0, Math.min(5, Number(rev.rating) || 0))
                            )}
                          </span>
                        </div>
                        <p className="review-text">{rev.text}</p>
                        <small className="review-date">
                          {rev.createdAt
                            ? new Date(rev.createdAt).toLocaleDateString(
                                'he-IL'
                              )
                            : ''}
                        </small>
                      </div>
                    );
                  })
                ) : (
                  <p className="no-reviews">אין עדיין תגובות לפרויקט זה.</p>
                )}
              </div>
              {/* טופס הוספת תגובה - רק למשתמשים מחוברים שאינם הבעלים */}
              {currentUser && !isOwner && (
                <form className="add-review-form" onSubmit={handleAddReview}>
                  <h4>הוסף תגובה</h4>
                  <div className="rating-select">
                    <span>דירוג:</span>
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
                    placeholder="כתוב מה דעתך על הפרויקט..."
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
        </div>

        <div className="popup-footer">
          {canEdit && (
            <div className="footer-actions">
              {isEditing ? (
                <>
                  <button className="save-btn" onClick={handleSaveProject}>
                    שמור שינויים
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
                  ✏️ עריכת פרויקט
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
