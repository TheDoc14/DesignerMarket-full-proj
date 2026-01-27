import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import defaultUserPic from '../DefaultPics/userDefault.jpg';

const Dashboard = () => {
    const { user, updateUser, logout } = useAuth();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [projects, setProjects] = useState([]);
    const [purchasedProjects, setPurchasedProjects] = useState([]);
    const [profileImagePreview, setProfileImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        paypalEmail: '',
        firstName: '',
        lastName: '',
        birthDate: '',
        city: '',
        country: '',
        phone: '',
        bio: '',
        social: { website: '', instagram: '', behance: '', dribbble: '', linkedin: '', github: '' },
        profileImage: null
    });

    // פונקציה מרכזית לטעינת כל נתוני הדשבורד
  // Dashboard.jsx

// Dashboard.jsx

useEffect(() => {
    const fetchPurchasedProjects = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const profileRes = await axios.get('http://localhost:5000/api/profile/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const { user: fetchedUser, projects: userProjects } = profileRes.data;
            
            // עדכון נתוני הטופס
            if (fetchedUser) {
                setFormData(prev => ({
                    ...prev,
                    username: fetchedUser.username || '',
                    email: fetchedUser.email || '',
                    paypalEmail: fetchedUser.paypalEmail || '',
                    firstName: fetchedUser.firstName || '',
                    lastName: fetchedUser.lastName || '',
                    phone: fetchedUser.phone || '',
                    city: fetchedUser.city || '',
                    country: fetchedUser.country || '',
                    bio: fetchedUser.bio || '',
                    birthDate: fetchedUser.birthDate ? fetchedUser.birthDate.split('T')[0] : '',
                    social: fetchedUser.social || prev.social
                }));
                
                if (fetchedUser.profileImage) {
                    setProfileImagePreview(fetchedUser.profileImage); // הסרת השרשור הידני כי הסריאלייזר בבק בונה URL מלא
                } else {
                    setProfileImagePreview(defaultUserPic);
                }
            }
            setProjects(userProjects || []); // הצגת הפרויקטים שהעלית
            // שליפת כל הפרויקטים - השרת מזהה את המשתמש לפי ה-Token
            const res = await axios.get('http://localhost:5000/api/projects', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const allProjects = res.data.projects || []; 

            // סינון: רק פרויקטים שהמשתמש הנוכחי רכש בהצלחה.
            // השרת מחזיר את המערך 'files' רק אם ה-buyerId תואם והתשלום בוצע
            const purchased = allProjects.filter(p => 
                p && 
                p.files !== undefined && 
                Array.isArray(p.files) && 
                p.files.length > 0
            );

            setPurchasedProjects(purchased);
        } catch (err) {
            console.error("Error loading purchased projects:", err);
        } finally {
            setLoading(false);
        }
    };

    fetchPurchasedProjects();
}, []);

   

    // פונקציות עזר לשינוי שדות
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSocialChange = (e) => {
        setFormData({
            ...formData,
            social: { ...formData.social, [e.target.name]: e.target.value }
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, profileImage: file });
            setProfileImagePreview(URL.createObjectURL(file));
        }
    };

    // --- חדש: פונקציה למחיקת פרויקט ספציפי מהרשימה ---
    const handleDeleteProject = async (projectId) => {
        const isConfirmed = window.confirm("האם אתה בטוח שברצונך למחוק את הפרויקט הזה?");
        if (!isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/projects/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // עדכון הסטייט המקומי להסרת הפרויקט מהתצוגה
            setProjects(projects.filter(p => p.id !== projectId));
            alert("הפרויקט נמחק בהצלחה.");
        } catch (err) {
            alert(err.response?.data?.message || "שגיאה במחיקת הפרויקט.");
        }
    };
    // פונקציית עזר להורדה מאולצת (Force Download)
const downloadFile = async (url, filename) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename; // שם הקובץ שיישמר במחשב
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("Download failed:", error);
        alert("שגיאה בהורדת הקובץ. נסה שנית.");
    }
};

    // מחיקת חשבון משתמש לצמיתות
    const handleDeleteAccount = async () => {
        const targetId = user?.id; 
        if (!targetId) return;

        if (user?.role === 'admin') {
            alert("לא ניתן למחוק חשבון מנהל דרך הממשק.");
            return;
        }

        const isConfirmed = window.confirm("האם את בטוחה? כל הפרויקטים והמידע שלך יימחקו לצמיתות!");
        if (isConfirmed) {
            try {
                setSaving(true);
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/profile/${targetId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                alert("החשבון נמחק בהצלחה.");
                logout();
            } catch (err) {
                alert(err.response?.data?.message || "שגיאה בתהליך המחיקה");
            } finally {
                setSaving(false);
            }
        }
    };

    // שמירת שינויים בפרופיל
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const data = new FormData();

            Object.keys(formData).forEach(key => {
                if (key !== 'social' && key !== 'profileImage' && formData[key] !== null) {
                    data.append(key, formData[key]);
                }
            });

            data.append('social', JSON.stringify(formData.social));
            if (formData.profileImage instanceof File) {
                data.append('profileImage', formData.profileImage);
            }

            const res = await axios.put('http://localhost:5000/api/profile/me', data, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            updateUser(res.data.user); 
            setMessage({ type: 'success', text: 'הפרופיל עודכן בהצלחה!' });

        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'שגיאה בעדכון הפרופיל.' });
        } finally {
            setSaving(false);
        }
    };

    const getPlaceholderImage = () => {
        const initial = user?.username ? user.username.charAt(0).toUpperCase() : '?';
        return (
            <div style={placeholderStyle}>
                <span style={{ fontSize: '40px', color: '#666' }}>{initial}</span>
            </div>
        );
    };

    if (loading) return <div style={{textAlign: 'center', padding: '50px', fontSize: '18px'}}>טוען את הפרופיל שלך...</div>;
    if (!user) return <div style={{textAlign: 'center', padding: '50px', fontSize: '18px'}}>אינך מחובר/ת. אנא התחבר/י.</div>;

    return (
        <div style={{ direction: 'rtl', padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#333' }}>
            <h1 style={{ marginBottom: '30px', color: '#2c3e50', textAlign: 'center' }}>
                הפרופיל האישי של {user.username}
            </h1>

            {/* תמונת פרופיל */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div onClick={() => fileInputRef.current.click()} style={profileImageContainerStyle}>
                    {profileImagePreview ? (
                        <img src={profileImagePreview} alt="Profile" style={profileImageStyle} />
                    ) : getPlaceholderImage()}
                </div>
                <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="image/*" />
                <p style={{marginTop: '10px', fontSize: '14px', color: '#555'}}>לחץ/י על התמונה לעדכון</p>
            </div>

            {/* טופס עריכה */}
            <form onSubmit={handleSubmit} style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                {message.text && (
                    <div style={{ ...alertStyle, backgroundColor: message.type === 'error' ? '#f8d7da' : '#d4edda', color: message.type === 'error' ? '#721c24' : '#155724' }}>
                        {message.text}
                    </div>
                )}

                <div style={gridStyle}>
                    <div style={fieldStyle}><label style={labelStyle}>שם פרטי</label><input style={inputStyle} name="firstName" value={formData.firstName} onChange={handleChange} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>שם משפחה</label><input style={inputStyle} name="lastName" value={formData.lastName} onChange={handleChange} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>תאריך לידה</label><input style={inputStyle} type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>טלפון</label><input style={inputStyle} name="phone" value={formData.phone} onChange={handleChange} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>עיר</label><input style={inputStyle} name="city" value={formData.city} onChange={handleChange} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>מדינה</label><input style={inputStyle} name="country" value={formData.country} onChange={handleChange} /></div>
                </div>

                <div style={{ ...fieldStyle, marginTop: '25px' }}>
                    <label style={labelStyle}>ביוגרפיה (עד 500 תווים)</label>
                    <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} name="bio" value={formData.bio} onChange={handleChange} maxLength="500" />
                </div>

                <h3 style={{ marginTop: '35px', marginBottom: '20px', color: '#2c3e50' }}>קישורים חברתיים</h3>
                <div style={gridStyle}>
                    {Object.keys(formData.social).map((key) => (
                        <div key={key} style={fieldStyle}>
                            <label style={{ ...labelStyle, textTransform: 'capitalize' }}>{key}</label>
                            <input style={inputStyle} name={key} placeholder={`https://${key}.com/...`} value={formData.social[key]} onChange={handleSocialChange} />
                        </div>
                    ))}
                </div>
                <div style={fieldStyle}>
    <label style={labelStyle}>אימייל PayPal לקבלת תשלומים (חובה למוכרים)</label>
    <input 
        style={{...inputStyle, backgroundColor: '#eef6ff'}} 
        name="paypalEmail" 
        type="email"
        value={formData.paypalEmail} 
        onChange={handleChange} 
        placeholder="your-paypal@example.com"
    />
</div>

                <div style={{ marginTop: '40px' }}>
                    <button type="submit" disabled={saving} style={btnStyle}>
                        {saving ? 'שומר שינויים...' : 'שמור שינויים'}
                    </button>
                </div>
            </form>

            {/* --- אזור ניהול פרויקטים --- */}
            <div style={{ marginTop: '50px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
                
                {/* צד ימין: פרויקטים שהעליתי */}
                <div style={sectionStyle}>
                    <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '15px' }}>
                        🚀 פרויקטים שהעליתי ({projects.length})
                    </h3>
                    {projects.length > 0 ? (
                        projects.map(p => (
                            <div key={p.id} style={itemStyle}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 'bold' }}>{p.title}</span>
                                    <span style={{ fontSize: '12px', color: '#666' }}>{p.isPublished ? '✅ פורסם' : '⏳ ממתין לאישור'}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => window.location.href = `/edit-project/${p.id}`} style={editBtnSmallStyle}>✏️ ערוך</button>
                                    <button onClick={() => handleDeleteProject(p.id)} style={deleteBtnSmallStyle}>🗑️</button>
                                </div>
                            </div>
                        ))
                    ) : <p style={{ color: '#666' }}>עוד לא העלית פרויקטים.</p>}
                </div>

                {/* צד שמאל: פרויקטים שרכשתי */}
<div style={sectionStyle}>
    <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #27ae60', paddingBottom: '10px', marginBottom: '15px' }}>
        📦 פרויקטים שרכשתי ({purchasedProjects.length})
    </h3>
    
    {purchasedProjects.length > 0 ? (
        purchasedProjects.map(p => (
            <div key={p.id} style={{ ...itemStyle, flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold' }}>{p.title}</span>
                    <span style={{ fontSize: '11px', color: '#666' }}>
                        נרכש ב-{new Date(p.createdAt).toLocaleDateString('he-IL')}
                    </span>
                </div>
                
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* קבצי פרויקט להורדה מאובטחת */}
                    {p.files?.map((file, idx) => (
                        <div key={idx} style={fileRowStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>📁</span>
                                <span style={{ fontSize: '13px' }}>{file.filename}</span>
                            </div>
                            <button 
                                onClick={() => downloadFile(file.url, file.filename)}
                                style={{ ...downloadBtnStyle, border: 'none', cursor: 'pointer' }}
                            >
                                📥 הורד למחשב
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        ))
    ) : (
        <p style={{ color: '#666' }}>לא נמצאו פרויקטים שרכשת.</p>
    )}
</div>
            </div>

            {/* מחיקת חשבון */}
            <div style={dangerZoneStyle}>
                <h3 style={{ color: '#721c24', marginBottom: '10px' }}>מחיקת חשבון</h3>
                <p style={{ fontSize: '14px', marginBottom: '15px' }}>מחיקת החשבון תסיר לצמיתות את כל המידע שלך, הפרויקטים וההגדרות מהמערכת.</p>
                <button type="button" onClick={handleDeleteAccount} disabled={saving} style={deleteAccountBtnStyle}>
                    {saving ? 'מבצע מחיקה...' : '🗑️ מחק את החשבון שלי לצמיתות'}
                </button>
            </div>
        </div>
    );
};

// --- Styles (ללא שינוי, רק הוספת המיישרים החסרים) ---
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' };
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '14px', fontWeight: 'bold', color: '#555' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '16px' };
const btnStyle = { padding: '12px 30px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const alertStyle = { padding: '15px', borderRadius: '8px', marginBottom: '20px' };
const profileImageContainerStyle = { width: '150px', height: '150px', borderRadius: '50%', backgroundColor: '#e9ecef', margin: '0 auto', cursor: 'pointer', overflow: 'hidden', border: '3px solid #007bff', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const profileImageStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const placeholderStyle = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const dangerZoneStyle = { marginTop: '50px', padding: '25px', border: '1px solid #f5c6cb', borderRadius: '10px', backgroundColor: '#fff5f5' };
const deleteAccountBtnStyle = { padding: '12px 24px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const sectionStyle = { padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '12px', minHeight: '200px' };
const itemStyle = { padding: '15px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e9ecef' };
const editBtnSmallStyle = { padding: '5px 12px', backgroundColor: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' };
const deleteBtnSmallStyle = { padding: '5px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const downloadBtnStyle = { padding: '5px 10px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '12px' };
const fileRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '8px',
    backgroundColor: '#f1f3f5',
    borderRadius: '6px',
    border: '1px solid #dee2e6'
};
export default Dashboard;