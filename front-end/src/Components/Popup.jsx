import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import { PayPalButtons } from "@paypal/react-paypal-js";
import './Popup.css';

const Popup = ({ project, onClose, onUpdate }) => {
    const { user: currentUser } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [editData, setEditData] = useState({
        title: project.title || '',
        description: project.description || '',
        category: project.category || '',
        price: project.price || 0
    });

    const [newComment, setNewComment] = useState("");
    const [newRating, setNewRating] = useState(5);
    const [selectedImage, setSelectedImage] = useState(null);
    const fileInputRef = useRef(null);

    const isOwner = currentUser && (currentUser.id === project.createdBy?._id || currentUser.id === project.createdBy);
    const canEdit = isOwner || currentUser?.role === 'admin';

    // פונקציית עזר להמרת נתיב תמונה לכתובת מלאה
    const formatImageUrl = (url) => {
        if (!url) return 'https://via.placeholder.com/600x400?text=No+Image';
        if (url.startsWith('http')) return url;
        const cleanPath = url.replace(/\\/g, '/').replace(/^\.\//, '');
        return `http://localhost:5000/${cleanPath}`;
    };

    // שליפת תגובות - מוודא Populate דרך ה-API של ה-Reviews
    const fetchReviews = useCallback(async () => {
        try {
            setReviewsLoading(true);
            const projectId = project._id || project.id;
            const res = await axios.get(`http://localhost:5000/api/reviews?projectId=${projectId}`);
            setReviews(res.data.reviews || []);
        } catch (err) {
            console.error("Failed to load reviews", err);
        } finally {
            setReviewsLoading(false);
        }
    }, [project]);

    useEffect(() => {
        if (project) fetchReviews();
    }, [project, fetchReviews]);

    const handleSaveProject = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', editData.title);
            formData.append('description', editData.description);
            formData.append('category', editData.category);
            formData.append('price', editData.price);
            if (selectedImage) formData.append('files', selectedImage);

            await axios.put(`http://localhost:5000/api/projects/${project._id || project.id}`, formData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            alert("הפרויקט עודכן!");
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } catch (err) {
            alert("שגיאה בעדכון הפרויקט");
        } finally { setLoading(false); }
    };

    // --- לוגיקת PAYPAL ---
    
    // 1. יצירת הזמנה בשרת שלנו
    const createOrder = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/orders/paypal/create', 
                { projectId: project._id || project.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data.order.paypalOrderId; // מחזיר את ה-ID ל-PayPal
        } catch (err) {
            console.error("PayPal Create Error:", err);
            alert(err.response?.data?.message || "שגיאה ביצירת הזמנה");
            throw err;
        }
    };

    // 2. אישור התשלום בשרת שלנו
    const onApprove = async (data) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/orders/paypal/capture', 
                { paypalOrderId: data.orderID },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            alert("התשלום בוצע בהצלחה! הפרויקט זמין עבורך.");
            if (onUpdate) onUpdate();
            onClose(); // סגירת הפופאפ לאחר רכישה
        } catch (err) {
            console.error("PayPal Capture Error:", err);
            alert("התשלום עבר ב-PayPal אך נכשל בעדכון המערכת. פנה לתמיכה.");
        }
    };

    
    const handleAddReview = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/reviews`, 
                { 
                    projectId: project._id || project.id, 
                    rating: newRating, 
                    text: newComment // השדה בבאקנד הוא text
                }, 
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setNewComment("");
            fetchReviews();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert(err.response?.data?.message || "שגיאה בהוספת תגובה");
        }
    };

    if (!project) return null;

    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>

                <div className="popup-scroll-container">
                    <div className="popup-header">
                        {isEditing ? (
                            <input className="edit-input title-edit" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
                        ) : (
                            <>
                            <h2>{project.title}</h2>
                            {/* קישור לפרופיל המוכר */}
            <div className="seller-link-container" style={{ marginTop: '5px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>הועלה על ידי: </span>
                <button 
                    onClick={() => window.location.href = `/profile/${project.createdBy}`}
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#007bff', 
                        cursor: 'pointer', 
                        textDecoration: 'underline',
                        padding: 0,
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    {/* אם ה-Backend מחזיר את שם המשתמש בתוך createdBy, השתמשי בו. אם לא, ה-ID יוצג */}
                    {project.creatorName || "צפה בפרופיל המוכר"}
                </button>
            </div>
        </>
    
                            
                        )}
                        
                    </div>

                    <div className="popup-body">
                        <div className="image-container">
<img 
    // השרת כבר מחזיר URL מלא ב-mainImageUrl לפי הסריאלייזר שלך
    src={selectedImage ? URL.createObjectURL(selectedImage) : project.mainImageUrl} 
    alt={project.title} 
    className="popup-image" 
    onError={(e) => { 
        // מנגנון הגנה אם ה-URL מהשרת שבור
        e.target.src = 'front-end\src\DefaultPics\projectDefault.png'; 
    }} 
/>                            {isEditing && (
                                <div className="image-upload-overlay">
                                    <button onClick={() => fileInputRef.current.click()} className="upload-icon-btn">📷 החלף תמונה</button>
                                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => setSelectedImage(e.target.files[0])} accept="image/*" />
                                </div>
                            )}
                        </div>

                        <div className="project-details">
                            {isEditing ? (
                                <div className="edit-fields">
                                    <label>מחיר (₪):</label>
                                    <input type="number" className="edit-input" value={editData.price} onChange={e => setEditData({...editData, price: e.target.value})} />
                                    <label>תיאור:</label>
                                    <textarea className="edit-textarea" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
                                </div>
                            ) : (
                                <div className="view-details">
                                    <p className="price-tag">מחיר: {project.price || 0} ₪</p>
                                    <p className="description">{project.description}</p>
                                    {currentUser && !isOwner && (
                                        <div className="paypal-container" style={{ marginTop: '20px' }}>
                                            <h4 style={{ marginBottom: '10px' }}>רכישת הפרויקט:</h4>
                                            <PayPalButtons 
                                                style={{ layout: "horizontal", color: "blue", shape: "pill", label: "pay" }}
                                                createOrder={createOrder}
                                                onApprove={onApprove}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <hr />

                        <div className="reviews-section">
                            <h3>תגובות הקהילה ({reviews.length})</h3>
                            <div className="reviews-list">
                                {reviewsLoading ? <p>טוען תגובות...</p> : (
                                    reviews.length > 0 ? reviews.map((rev) => (
                                        <div key={rev._id || rev.id} className="review-card">
                                            <div className="review-header">
                                                <strong className="reviewer-name">
                                                    {rev.userId?.username || rev.user?.username || 'משתמש מערכת'}
                                                </strong>
                                                <span className="review-stars">{'★'.repeat(rev.rating)}{'☆'.repeat(5-rev.rating)}</span>
                                            </div>
                                            <p className="review-text">{rev.text}</p>
                                        </div>
                                    )) : <p>אין תגובות עדיין.</p>
                                )}
                            </div>

                            {currentUser && !isOwner && (
                                <form className="add-review-form" onSubmit={handleAddReview}>
                                    <div className="form-row">
                                        <label>דרג פרויקט:</label>
                                        <select value={newRating} onChange={(e) => setNewRating(e.target.value)}>
                                            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} כוכבים</option>)}
                                        </select>
                                    </div>
                                    <textarea placeholder="כתוב תגובה..." value={newComment} onChange={(e) => setNewComment(e.target.value)} required />
                                    <button type="submit" className="approve-btn">שלח תגובה</button>
                                </form>
                            )}
                            
                        </div>
                    </div>
                </div>
                

                <div className="popup-footer">
                    {canEdit && (
                        <div className="action-buttons">
                            {isEditing ? (
                                <><button className="approve-btn" onClick={handleSaveProject}>שמור שינויים</button>
                                <button className="secondary-btn" onClick={() => setIsEditing(false)}>ביטול</button></>
                            ) : (
                                <button className="edit-btn" onClick={() => setIsEditing(true)}>✏️ ערוך פרויקט</button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Popup;