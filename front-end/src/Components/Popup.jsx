import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Popup = ({ project, onClose }) => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newText, setNewText] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [hover, setHover] = useState(0);

  // חילוץ בטוח של מזהה הפרויקט למניעת שגיאות בשרת
  const projectId = project?._id || project?.id;

  // פונקציה לשליפת ביקורות מהשרת
  const fetchReviews = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingReviews(true);
      const response = await axios.get(`http://localhost:5000/api/reviews?projectId=${projectId}`);
      // התיעוד מציין שהנתונים בתוך אובייקט reviews
      const data = response.data.reviews || response.data || [];
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("שגיאה בטעינת ביקורות:", err);
    } finally {
      setLoadingReviews(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // שליחת ביקורת חדשה
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return alert("עליך להתחבר כדי להוסיף ביקורת");

    try {
      await axios.post('http://localhost:5000/api/reviews', {
        projectId,
        rating: newRating,
        text: newText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewText('');
      setNewRating(5);
      fetchReviews(); // רענון הרשימה
    } catch (err) {
      alert(err.response?.data?.message || "שגיאה בשליחת הביקורת");
    }
  };

  if (!project) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* כפתור סגירה */}
        <button style={styles.closeBtn} onClick={onClose}>✕</button>

        {/* כותרת ותמונה ראשית */}
        <h2 style={styles.title}>{project.title}</h2>
        
        {/* כרטיס יוצר הפרויקט (מעצב) */}
        <div style={styles.creatorSection}>
          <div style={styles.avatar}>👤</div>
          <div style={{ flex: 1 }}>
            <p style={styles.creatorLabel}>מעלה הפרויקט:</p>
            <p style={styles.creatorName}>
              {project.createdBy?.username || project.createdBy?.name || "מעצב במערכת"}
            </p>
          </div>
          <button 
            style={styles.contactBtn} 
            onClick={() => window.location.href = `mailto:${project.createdBy?.email}`}
          >
            צור קשר
          </button>
        </div>

        {/* תיאור הפרויקט */}
        <div style={styles.descriptionBox}>
          <h4 style={styles.subTitle}>אודות הפרויקט</h4>
          <p style={styles.descText}>{project.description}</p>
        </div>

        {/* כפתור רכישה בולט */}
        <button 
          style={styles.buyBtn} 
          onClick={() => navigate(`/checkout/${projectId}`)}
        >
          💳 רכישת הפרויקט המלא (₪{project.price})
        </button>

        <hr style={styles.divider} />

        {/* סקציית ביקורות */}
        <div style={styles.reviewSection}>
          <h3 style={styles.subTitle}>ביקורות ודירוגים (★ {Number(project.averageRating || 0).toFixed(2)})</h3>
          
          {/* טופס הוספת ביקורת */}
          <form onSubmit={handleSubmitReview} style={styles.form}>
            <div style={styles.starRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <span 
                  key={s}
                  style={{...styles.star, color: (hover || newRating) >= s ? '#f1c40f' : '#ddd'}}
                  onClick={() => setNewRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                >★</span>
              ))}
            </div>
            <textarea 
              placeholder="מה דעתך על הפרויקט?" 
              value={newText} 
              onChange={e => setNewText(e.target.value)} 
              style={styles.textarea} 
              required
            />
            <button type="submit" style={styles.submitBtn}>פרסם תגובה</button>
          </form>

          {/* רשימת ביקורות קיימות */}
          <div style={styles.reviewsList}>
            {loadingReviews ? <p>טוען ביקורות...</p> : 
              reviews.length > 0 ? reviews.map((rev) => (
                <div key={rev._id} style={styles.revCard}>
                  <div style={styles.revHeader}>
                    <span style={styles.revStars}>{'★'.repeat(rev.rating)}</span>
                    <span style={styles.revUser}>
                      {rev.userId?.username || rev.userId?.name || rev.username || "משתמש"}
                    </span>
                  </div>
                  <p style={styles.revText}>{rev.text}</p>
                </div>
              )) : <p style={styles.noReviews}>אין עדיין ביקורות לפרויקט זה.</p>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', direction: 'rtl', backdropFilter: 'blur(4px)' },
  modal: { backgroundColor: '#fff', width: '95%', maxWidth: '550px', borderRadius: '24px', padding: '30px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  closeBtn: { position: 'absolute', top: '20px', left: '20px', border: 'none', background: '#f0f0f0', borderRadius: '50%', width: '35px', height: '35px', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' },
  title: { fontSize: '26px', color: '#1a1a1a', marginBottom: '20px', fontWeight: '800', textAlign: 'center' },
  creatorSection: { display: 'flex', gap: '15px', alignItems: 'center', background: '#f8f9fa', padding: '15px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #eee' },
  avatar: { width: '45px', height: '45px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  creatorLabel: { margin: 0, fontSize: '12px', color: '#718096' },
  creatorName: { margin: 0, fontWeight: '700', color: '#2d3748' },
  contactBtn: { background: '#edf2f7', color: '#4a5568', border: 'none', padding: '8px 15px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  descriptionBox: { marginBottom: '25px' },
  subTitle: { fontSize: '18px', color: '#2d3748', marginBottom: '10px', fontWeight: '700' },
  descText: { color: '#4a5568', lineHeight: '1.6', fontSize: '15px', margin: 0 },
  buyBtn: { width: '100%', padding: '16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '18px', cursor: 'pointer', marginBottom: '10px', transition: '0.3s', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)' },
  divider: { border: 'none', height: '1px', backgroundColor: '#e2e8f0', margin: '25px 0' },
  starRow: { fontSize: '30px', display: 'flex', gap: '5px', marginBottom: '10px' },
  star: { cursor: 'pointer', transition: '0.2s' },
  textarea: { width: '100%', height: '80px', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '12px', marginBottom: '12px', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '14px' },
  submitBtn: { width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' },
  revCard: { padding: '15px 0', borderBottom: '1px solid #f1f5f9' },
  revHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  revStars: { color: '#f1c40f', letterSpacing: '2px' },
  revUser: { fontWeight: '700', fontSize: '14px', color: '#1a202c' },
  revText: { margin: 0, fontSize: '14px', color: '#4a5568' },
  noReviews: { textAlign: 'center', color: '#a0aec0', fontSize: '14px', marginTop: '10px' }
};

export default Popup;