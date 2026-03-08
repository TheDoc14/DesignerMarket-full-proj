// /src/Components/Popup.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { PayPalButtons } from '@paypal/react-paypal-js';
import './componentStyle.css';
import { usePermission } from '../Hooks/usePermission.jsx';
import { useAiQuota } from '../Hooks/useAiQuota.jsx';
/*
 * The Popup component is a multi-functional modal window designed to display detailed information about
 * a specific project. It serves as the primary interface for project interaction,
 * including viewing details, purchasing via PayPal, managing user reviews, and consulting with an AI agent.
 */

const Popup = ({ project, onClose, onUpdate, isLoggedIn, onAiUpdate }) => {
  const [existingFiles, setExistingFiles] = useState(project?.files || []);
  const [newFiles, setNewFiles] = useState([]);
  const { hasPermission, user: currentUser } = usePermission();
  const [orderStatus, setOrderStatus] = useState(null);
  const [categories, setCategories] = useState([]);
  //Tracks the remaining AI interactions available to the user via the useAiQuota hook.
  const { aiQuota, fetchAiQuota, decrementQuota } = useAiQuota();

  const navigate = useNavigate();
  //Tracks if the current user has a successful order for this project.
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);

  const [, setCurrentMainImageId] = useState(project?.mainImageId || '');
  //Users with administrative privileges. Can manage all content and reviews.
  const isAdmin = hasPermission('admin');

  const projectId = project?._id || project?.id;
  const chatEndRef = useRef(null);
  const location = useLocation();
  const hasFetchedRef = useRef(false);

  const createdById = String(
    project?.createdBy?._id || project?.createdBy || ''
  );
  const currentUserId = String(currentUser?._id || currentUser?.id || '');
  //The user who created the project. Can edit details and use AI.
  const isOwner = currentUserId && createdById && currentUserId === createdById;
  //Granted if the user is the owner and has the specific ai.consult permission.
  const canUseAi = isOwner && hasPermission('ai.consult');
  const canEdit = isOwner || hasPermission('admin');
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(project?.mainImageUrl || '');
  const fileInputRef = useRef(null);
  const [editReviewData, setEditReviewData] = useState({ rating: 5, text: '' });
  //Toggles between the display view and the project edit form.
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback] = useState({ type: '', msg: null });
  //Stores the conversation history for the AI chat session.
  const [aiMessages, setAiMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [userQuery, setUserQuery] = useState('');

  const [editData, setEditData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    category: project?.category?._id || project?.category || '',
    price: project?.price || 0,
    tags: project?.tags ? project.tags.join(', ') : '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/api/categories');

        let catList = [];
        if (Array.isArray(res.data)) {
          catList = res.data;
        } else if (Array.isArray(res.data?.categories)) {
          catList = res.data.categories;
        } else if (Array.isArray(res.data?.data)) {
          catList = res.data.data;
        }

        setCategories(catList);
      } catch (err) {
        console.error('❌ Failed to fetch categories:', err);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  //Validates the user's purchase status to unlock content or hide payment buttons.
  const checkIfProjectPurchased = useCallback(() => {
    if (!project) {
      setAlreadyPurchased(false);
      return;
    }

    try {
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

  //Synchronizes the local state with the latest project data (media, files, and order status) from the server.
  const fetchProjectFilesFromDB = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/projects/${projectId}`);
      const fullData = res.data?.project || res.data?.data || res.data;
      if (fullData) {
        const allFiles = [...(fullData.media || []), ...(fullData.files || [])];
        setExistingFiles(allFiles);
        const status = fullData.existingOrder?.status || null;
        setOrderStatus(status);

        if (!status) setAlreadyPurchased(false);
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

  //Retrieves all reviews associated with the project ID.
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

  useEffect(() => {
    if (isLoggedIn && !isOwner) {
      checkIfProjectPurchased();
    }
  }, [projectId, currentUserId, isLoggedIn, isOwner, checkIfProjectPurchased]);

  useEffect(() => {
    const fetchFullData = async () => {
      if (!projectId || !isLoggedIn || isOwner) return;

      try {
        setLoading(true);

        const projectRes = await api.get(`/api/projects/${projectId}`);
        const fullProject =
          projectRes.data?.project || projectRes.data?.data || projectRes.data;

        if (fullProject) {
          setExistingFiles([
            ...(fullProject.media || []),
            ...(fullProject.files || []),
          ]);
          if (fullProject.mainImageUrl)
            setImagePreview(fullProject.mainImageUrl);
        }

        const ordersRes = await api.get(
          `/api/orders/my?projectId=${projectId}`
        );
        const orders = ordersRes.data?.data || [];

        if (orders.length > 0) {
          const paidOrder = orders.find((o) =>
            ['PAID', 'PAYOUT_SENT'].includes(o.status)
          );

          if (paidOrder) {
            setAlreadyPurchased(true);
            setOrderStatus(paidOrder.status);
          } else {
            const pendingOrder = orders[0];
            setOrderStatus(pendingOrder.status);
            setAlreadyPurchased(false);
          }
        } else {
          setOrderStatus(null);
          setAlreadyPurchased(false);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setOrderStatus(null);
        setAlreadyPurchased(false);
      } finally {
        setLoading(false);
      }
    };

    fetchFullData();
  }, [projectId, isLoggedIn, isOwner]);
  useEffect(() => {
    const initPopup = async () => {
      if (
        isLoggedIn &&
        hasPermission('ai.consult') &&
        project &&
        !hasFetchedRef.current
      ) {
        hasFetchedRef.current = true;

        const queryParams = new URLSearchParams(location.search);
        const targetChatId = project.initialChatId || queryParams.get('chat');

        if (targetChatId) {
          setChatId(targetChatId);
          await loadMessages(targetChatId);
        } else {
          try {
            const res = await api.get('/api/ai-chats', {
              params: { projectId },
            });
            if (res.data.data?.length > 0) {
              const lastChatId = res.data.data[0]._id;
              setChatId(lastChatId);
              await loadMessages(lastChatId);
            }
          } catch (e) {
            console.error('Error finding existing chat', e);
          }
        }

        await fetchAiQuota();
      }
    };
    initPopup();
  }, [
    projectId,
    isLoggedIn,
    project,
    fetchAiQuota,
    hasPermission,
    location.search,
  ]);
  useEffect(() => {
    if (isLoggedIn && !isOwner && project) {
      checkIfProjectPurchased();
    }
  }, [project, isLoggedIn, isOwner, checkIfProjectPurchased]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  if (!project) return null;
  //Submits a FormData object to the API to update project details and files. It handles both existing and new file uploads.
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
      formData.append('category', editData.category);
      formData.append('tags', JSON.stringify(tagsArray));

      const nonImageFiles = existingFiles.filter(
        (f) => f.fileType !== 'image' && f.fileType !== 'video'
      );
      formData.append('existingFiles', JSON.stringify(nonImageFiles));

      newFiles.forEach((file) => formData.append('files', file));

      if (selectedFile) formData.append('files', selectedFile);

      const res = await api.put(`/api/projects/${projectId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updated = res.data.project || res.data.data;

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

      await fetchProjectFilesFromDB();
      setNewFiles([]);
      setSelectedFile(null);
      setIsEditing(false);
      window.alert('הפרויקט עודכן בהצלחה!');
    } catch (err) {
      window.alert(
        'שגיאה בשמירה. וודא ששמות הקבצים באנגלית ללא תווים מיוחדים.'
      );
    } finally {
      setLoading(false);
    }
  };

  const safeReviews = Array.isArray(reviews) ? reviews.filter(Boolean) : [];
  //Validates and posts a new rating and comment.
  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return window.window.alert('עליך להתחבר כדי להגיב');

    const projectIdSafe = project?._id || project?.id;
    const ratingNum = Number(newReview.rating);
    const textVal = (newReview.comment || '').trim();

    if (!projectIdSafe) return window.window.alert('חסר מזהה פרויקט');
    if (!ratingNum || ratingNum < 1 || ratingNum > 5)
      return window.window.alert('בחר דירוג בין 1 ל-5');
    if (!textVal) return window.window.alert('נא לכתוב תגובה');

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
      window.window.alert('התגובה נוספה בהצלחה!');
    } catch (err) {
      window.window.alert(err.friendlyMessage || 'שגיאה בהוספת תגובה');
    }
  };
  //Manages the local preview of a newly selected main image.
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  //Allows authorized users to modify existing feedback.
  const handleUpdateReview = async (reviewId) => {
    if (!editReviewData.text.trim())
      return window.window.alert('לא ניתן לשמור תגובה ריקה');

    try {
      setLoading(true);
      const res = await api.put(`/api/reviews/${reviewId}`, {
        rating: editReviewData.rating,
        text: editReviewData.text,
      });

      const updatedReview = res.data.review || res.data.data;

      setReviews((prev) =>
        prev.map((r) => {
          if (String(r._id || r.id) === String(reviewId)) {
            return { ...r, ...updatedReview };
          }
          return r;
        })
      );

      setEditingReviewId(null);
      window.window.alert('התגובה עודכנה בהצלחה');
    } catch (err) {
      console.error('Update failed:', err);
      window.window.alert('שגיאה בעדכון התגובה');
    } finally {
      setLoading(false);
    }
  };

  //Allows authorized users to remove existing feedback.
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את התגובה?')) return;

    try {
      setLoading(true);
      await api.delete(`/api/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => (r._id || r.id) !== reviewId));
      window.window.alert('התגובה נמחקה בהצלחה');
    } catch (err) {
      window.window.alert(err.friendlyMessage || 'שגיאה במחיקת התגובה');
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

  //Sends the user's query to the AI backend, updates the UI optimistically, and decrements the user's AI quota upon a successful response.
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
        currentChatId = chatRes.data.data.chatId || chatRes.data.data._id;
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
          language: 'he',
        }
      );

      if (response.data?.data) {
        setAiMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: response.data.data.answer,
            _id: response.data.data.assistantMessageId,
          },
        ]);

        decrementQuota();
        if (onAiUpdate) onAiUpdate();
      }
    } catch (err) {
      console.error('AI Message Error:', err);
      window.alert(
        err.response?.data?.message ||
          'שגיאה בשליחת הודעה - וודא שיש לך חיבור יציב ומכסה פנויה'
      );
    } finally {
      setLoading(false);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };
  //Triggers a secure blob-based download of project source files, ensuring only authorized purchasers can access the data.
  const handleOpenFile = async (file) => {
    const filename = file.filename || file.name || 'download.txt';
    const fileUrl = file.url || file.fileUrl;

    if (!fileUrl) return window.alert('כתובת קובץ חסרה');

    try {
      window.alert(`מוריד את ${filename}...`);

      const response = await api.get(fileUrl, {
        responseType: 'blob',
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
      window.alert('הקובץ ירד בהצלחה');
    } catch (err) {
      console.error('Download failed, preventing logout:', err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        window.alert(
          'אין לך הרשאה להוריד את קובץ המקור הזה (ייתכן שלא רכשת את הפרויקט).'
        );
      } else {
        window.alert('שגיאה בהורדת הקובץ');
      }
    }
  };

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
                <>
                  <div className="edit-project-container">
                    <div className="edit-layout-columns">
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
                            <small className="small">
                              הפרד בין מילים באמצעות פסיק (,)
                            </small>
                          </div>
                        </div>
                      </div>

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
                          <label>קטגוריה:</label>
                          <select
                            value={editData.category}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                category: e.target.value,
                              })
                            }
                          >
                            <option value="">בחר קטגוריה</option>
                            {categories && categories.length > 0 ? (
                              categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                  {cat.name}
                                </option>
                              ))
                            ) : (
                              <option disabled>טוען קטגוריות...</option>
                            )}
                          </select>
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
                        {((isOwner && isEditing) || isAdmin) && (
                          <div className="project-files-manager">
                            <h4>📁 ניהול קבצי מקור</h4>
                            <div className="files-list-admin">
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
                                onChange={(e) =>
                                  setNewFiles([
                                    ...newFiles,
                                    ...Array.from(e.target.files),
                                  ])
                                }
                              />
                            </label>
                            <p className="files-note">
                              שים לב! רק סוגי הקבצים הבאים מתקבלים:
                            </p>
                            <p className="files-note">
                              jpeg, jpg, png, gif, mp4, avi, mov, pdf, doc,
                              docx, ppt, pptx, txt, zip
                            </p>
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
                    {project.category && (
                      <div className="project-category-badge">
                        📁 קטגוריה:{' '}
                        <span>{project.category.name || project.category}</span>
                      </div>
                    )}

                    <p className="price-row">₪{project.price}</p>
                    <p className="project-description">{project.description}</p>

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
              {!isOwner && project.price > 0 && (
                <div className="paypal-button-container">
                  {alreadyPurchased ||
                  ['PAID', 'PAYOUT_SENT'].includes(orderStatus) ? (
                    <div className="purchased-message">
                      ✅ כבר רכשת את הפרויקט הזה! התכנים פתוחים עבורך.
                    </div>
                  ) : (
                    <div className="paypal-purchase-section">
                      {orderStatus &&
                        !['CANCELED', 'PAID', 'PAYOUT_SENT'].includes(
                          orderStatus
                        ) && (
                          <div className="pending-order-window.alert">
                            <small>⚠️ מערכת זיהתה הזמנה קיימת</small>
                          </div>
                        )}

                      <PayPalButtons
                        className="paypal-buttons"
                        createOrder={async () => {
                          {
                            /* Initiates a PayPal transaction on the backend and returns the Order ID. */
                          }

                          try {
                            const myOrders = await api.get(
                              `/api/orders/my?projectId=${projectId}`
                            );
                            const existing = (myOrders.data?.data || []).find(
                              (o) => ['CREATED', 'APPROVED'].includes(o.status)
                            );

                            if (existing) {
                              await api.post(
                                `/api/orders/${existing.id}/cancel`
                              );
                            }

                            const res = await api.post(
                              '/api/orders/paypal/create',
                              { projectId }
                            );
                            return res.data.order.paypalOrderId;
                          } catch (err) {
                            console.error(
                              'PayPal Flow Failed:',
                              err.response?.data || err.message
                            );

                            if (err.response?.status === 409) {
                              const paypalId =
                                err.response.data?.details?.paypalOrderId ||
                                err.response.data?.paypalOrderId;
                              if (paypalId) return String(paypalId);
                            }

                            window.alert(
                              'לא ניתן להתחיל בתשלום. נסה לרענן את הדף.'
                            );
                            throw err;
                          }
                        }}
                        onApprove={async (data) => {
                          {
                            /* Captures the payment and reloads the state upon success.. */
                          }
                          try {
                            setLoading(true);
                            const res = await api.post(
                              '/api/orders/paypal/capture',
                              { paypalOrderId: data.orderID }
                            );
                            if (
                              ['PAID', 'PAYOUT_SENT'].includes(
                                res.data.order.status
                              )
                            ) {
                              window.alert('✅ הרכישה הושלמה בהצלחה!');
                              setTimeout(() => window.location.reload(), 1500);
                            }
                          } catch (e) {
                            window.alert('שגיאה באישור התשלום');
                          } finally {
                            setLoading(false);
                          }
                        }}
                      />
                    </div>
                  )}
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

            <div className="reviews-section">
              <h3>💬 תגובות משתמשים ({safeReviews.length})</h3>

              {reviewsLoading && (
                <p className="loading-spinner">טוען תגובות...</p>
              )}

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

                    const isReviewOwner = reviewerId === currentUserId;

                    const canManageReview = isReviewOwner || isAdmin;

                    return (
                      <div key={revId} className="review-card">
                        {editingReviewId === revId ? (
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
                                        setEditingReviewId(revId);
                                        setEditReviewData({
                                          rating: rev.rating,
                                          text: rev.text,
                                        });
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
          </div>
        </div>
        <div className="sidebar-container">
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
                <div className="ai-input-wrapper">
                  <textarea
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="שאל משהו..."
                    disabled={aiQuota.remaining === 0 || loading}
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
