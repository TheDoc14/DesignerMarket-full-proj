import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import { PayPalButtons } from '@paypal/react-paypal-js';
import projectDefault from '../DefaultPics/projectDefault.png';
import './componentStyle.css';

const Popup = ({ project, onClose, onUpdate }) => {
  const { user: currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: null });

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

  // שליפת שם המעצב בצורה בטוחה
  const creatorName =
    project?.createdBy?.username || project?.creatorName || 'מעצב במערכת';
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
    const timer = type === 'success' ? 10000 : 6000;
    setTimeout(() => setFeedback({ type: '', msg: null }), timer);
  };

  // טיפול בתמונה שבורה
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = projectDefault;
  };

  // --- לוגיקת PayPal ---
  const createOrder = async () => {
    if (isCreatorMissing) {
      showFeedback('error', 'לא ניתן לרכוש פרויקט זה (חשבון המוכר אינו פעיל).');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `http://localhost:5000/api/orders/paypal/create`,
        { projectId: projectId },
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (s) => s < 500,
        }
      );

      if (response.status === 409) {
        const ordersRes = await axios.get('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const found = (ordersRes.data.orders || []).find(
          (o) =>
            String(o.projectId?._id || o.projectId) === String(projectId) &&
            ['CREATED', 'APPROVED'].includes(o.status)
        );
        return found?.paypalOrderId || localStorage.getItem(storageKey);
      }
      const newId = response.data.order.paypalOrderId;
      localStorage.setItem(storageKey, newId);
      return newId;
    } catch (err) {
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

      // הודעת הצלחה עם הפניה לאזור האישי
      showFeedback(
        'success',
        <span>
          הרכישה הושלמה! הקבצים ממתינים לך ב-
          <a href="/PersonalDashboard">אזור האישי שלך</a>
        </span>
      );

      if (onUpdate) onUpdate();
      setTimeout(onClose, 8000);
    } catch (err) {
      showFeedback('error', 'שגיאה בהשלמת הרכישה.');
    }
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

  useEffect(() => {
    if (project) fetchReviews();
  }, [project, fetchReviews]);

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
      if (onUpdate) onUpdate(); // עדכון הקטלוג למעלה
      showFeedback('success', 'התגובה נוספה והדירוג הממוצע עודכן!');
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
      showFeedback('success', 'הפרויקט עודכן בהצלחה!');
    } catch (err) {
      // במקום הודעה קבועה, נשתמש ב-friendlyMessage שנוצר ב-App.js
      showFeedback('error', err.friendlyMessage || 'עדכון הפרויקט נכשל.');
    } finally {
      setLoading(false);
    }
  };
  if (!project) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
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
              <div className="title-area">
                <h2>{project.title}</h2>
                <span className="creator-tag">
                  מאת: <strong>{creatorName}</strong>
                  {isCreatorMissing && <span> (חשבון לא פעיל)</span>}
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
                  onError={handleImageError} // טיפול בתמונה שבורה
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
                      <span className="label">מחיר פרויקט:</span>{' '}
                      <span className="value">₪{project.price}</span>
                    </div>
                    {isCreatorMissing ? (
                      <div className="unavailable-notice">
                        ⚠️ רכישה חסומה - המוכר אינו פעיל במערכת.
                      </div>
                    ) : (
                      <>
                        <p className="desc-text">{project.description}</p>
                        {currentUser && !isOwner && (
                          <div className="purchase-section">
                            <PayPalButtons
                              createOrder={createOrder}
                              onApprove={onApprove}
                              onError={() =>
                                showFeedback('error', 'שגיאת PayPal.')
                              }
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

            <div className="reviews-section">
              <h3>תגובות ודירוגים ({reviews.length})</h3>
              <div className="reviews-list">
                {reviewsLoading ? (
                  <p>טוען תגובות...</p>
                ) : (
                  reviews.map((rev, idx) => (
                    <div key={rev._id || idx} className="review-item">
                      <div className="review-header">
                        {/* תמיכה בנתיבי שם משתמש שונים מה-API */}
                        <strong>
                          {rev.userId?.username ||
                            rev.user?.username ||
                            'משתמש מערכת'}
                        </strong>
                        <span>{'⭐'.repeat(rev.rating)}</span>
                      </div>
                      <p>{rev.text}</p>
                    </div>
                  ))
                )}
              </div>

              {currentUser && !isOwner && (
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
