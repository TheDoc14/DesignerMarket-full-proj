import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext'; // וודא שהנתיב נכון
import defaultUserPic from '../DefaultPics/userDefault.jpg'; // תמונת ברירת מחדל

const Dashboard = () => {
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef(null); // Ref ל-input של קובץ התמונה

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [projects, setProjects] = useState([]);
    const [profileImagePreview, setProfileImagePreview] = useState(null); // תצוגה מקדימה של התמונה

    const [formData, setFormData] = useState({
        username: '', // משם המשתמש המקורי, לא ניתן לערוך כאן
        email: '',    // מאימייל המשתמש המקורי, לא ניתן לערוך כאן
        firstName: '',
        lastName: '',
        birthDate: '',
        city: '',
        country: '',
        phone: '',
        bio: '',
        social: { website: '', instagram: '', behance: '', dribbble: '', linkedin: '', github: '' },
        profileImage: null // ייצוג File object להעלאה
    });

    // טעינת נתוני המשתמש והפרויקטים בעת טעינת הרכיב
    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get('http://localhost:5000/api/profile/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const { user: fetchedUser, projects: userProjects } = response.data;

               if (fetchedUser) {
                    setFormData({
                        username: fetchedUser.username || '',
                        email: fetchedUser.email || '',
                        firstName: fetchedUser.firstName || '',
                        lastName: fetchedUser.lastName || '',
                        phone: fetchedUser.phone || '',
                        city: fetchedUser.city || '',
                        country: fetchedUser.country || '',
                        bio: fetchedUser.bio || '',
                        birthDate: fetchedUser.birthDate ? fetchedUser.birthDate.split('T')[0] : '',
                        social: fetchedUser.social || { website: '', instagram: '', behance: '', dribbble: '', linkedin: '', github: '' },
                        profileImage: null 
                    });

                    // תיקון הלוגיקה של התמונה:
                    if (fetchedUser.profileImage) {
                        // אם יש תמונה בשרת - נציג אותה מהנתיב ב-uploads
                        setProfileImagePreview(`http://localhost:5000/uploads/profileImages/${fetchedUser.profileImage}`);
                    } else {
                        // אם אין תמונה בשרת - נציג את תמונת ברירת המחדל שייבאת
                        setProfileImagePreview(defaultUserPic);
                    }
                }
                setProjects(userProjects || []);
            } catch (err) {
                setMessage({ type: 'error', text: err.response?.data?.message || 'שגיאה בטעינת הנתונים.' });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // פונקציות לשינוי שדות הטופס
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSocialChange = (e) => {
        setFormData({
            ...formData,
            social: { ...formData.social, [e.target.name]: e.target.value }
        });
    };

    // פונקציה לטיפול בהעלאת קובץ תמונה
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, profileImage: file });
            setProfileImagePreview(URL.createObjectURL(file)); // תצוגה מקדימה מיידית
        }
    };

    // שליחת הטופס ל-Backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' }); // איפוס הודעות

        try {
            const token = localStorage.getItem('token');
            const data = new FormData(); // FormData עבור העלאת קבצים

            // הוספת שדות טקסט
            Object.keys(formData).forEach(key => {
                if (key !== 'social' && key !== 'profileImage' && formData[key] !== null) {
                    data.append(key, formData[key]);
                }
            });

            // הוספת אובייקט סושיאל כ-JSON string
            data.append('social', JSON.stringify(formData.social));

            // הוספת קובץ התמונה אם קיים
            if (formData.profileImage instanceof File) {
                data.append('profileImage', formData.profileImage);
            }

            const res = await axios.put('http://localhost:5000/api/profile/me', data, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data' // חשוב עבור העלאת קבצים
                }
            });

            updateUser(res.data.user); // עדכון פרטי המשתמש ב-AuthContext
            setMessage({ type: 'success', text: 'הפרופיל עודכן בהצלחה!' });
            // עדכון תצוגת התמונה אחרי העלאה מוצלחת (השרת מחזיר את הנתיב החדש)
            if (res.data.user.profileImage) {
                 setProfileImagePreview(`http://localhost:5000/uploads/profileImages/${res.data.user.profileImage}`);
            }

        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'שגיאה בעדכון הפרופיל.' });
        } finally {
            setSaving(false);
        }
    };

    // יצירת תמונת Placeholder
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
        <div style={{ direction: 'rtl', padding: '30px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#333' }}>
            <h1 style={{ marginBottom: '30px', color: '#2c3e50', textAlign: 'center' }}>
                הפרופיל האישי של {user.username}
            </h1>

            {/* אזור תמונת פרופיל */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div 
                    onClick={() => fileInputRef.current.click()}
                    style={profileImageContainerStyle}
                >
                    {profileImagePreview ? (
                        <img src={profileImagePreview} alt="Profile" style={profileImageStyle} />
                    ) : getPlaceholderImage()}
                </div>
                <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="image/*" />
                <p style={{marginTop: '10px', fontSize: '14px', color: '#555'}}>לחץ/י על התמונה לעדכון</p>
            </div>

            <form onSubmit={handleSubmit} style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                {message.text && (
                    <div style={{ ...alertStyle, backgroundColor: message.type === 'error' ? '#f8d7da' : '#d4edda', color: message.type === 'error' ? '#721c24' : '#155724' }}>
                        {message.text}
                    </div>
                )}

                <div style={gridStyle}>
                    {/* פרטים אישיים */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>שם פרטי</label>
                        <input style={inputStyle} name="firstName" value={formData.firstName} onChange={handleChange} />
                    </div>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>שם משפחה</label>
                        <input style={inputStyle} name="lastName" value={formData.lastName} onChange={handleChange} />
                    </div>
                    
                    <div style={fieldStyle}>
                        <label style={labelStyle}>תאריך לידה</label>
                        <input style={inputStyle} type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
                    </div>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>טלפון</label>
                        <input style={inputStyle} name="phone" value={formData.phone} onChange={handleChange} />
                    </div>
                    
                    <div style={fieldStyle}>
                        <label style={labelStyle}>עיר</label>
                        <input style={inputStyle} name="city" value={formData.city} onChange={handleChange} />
                    </div>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>מדינה</label>
                        <input style={inputStyle} name="country" value={formData.country} onChange={handleChange} />
                    </div>
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
                            <input 
                                style={inputStyle} 
                                name={key} 
                                placeholder={`https://${key}.com/...`}
                                value={formData.social[key]} 
                                onChange={handleSocialChange} 
                            />
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button type="submit" disabled={saving} style={btnStyle}>
                        {saving ? 'שומר שינויים...' : 'שמור שינויים'}
                    </button>
                </div>
            </form>

            <div style={{ marginTop: '50px', padding: '25px', backgroundColor: '#f0f4f8', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>הפרויקטים שלי ({projects.length})</h3>
                {projects.length > 0 ? (
                    projects.map(p => <div key={p._id} style={{ padding: '12px', borderBottom: '1px solid #e0e7ee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{p.title}</span>
                        <span style={{ fontSize: '14px', color: '#666' }}>סטטוס: {p.isPublished ? 'פורסם' : 'ממתין לאישור'}</span>
                    </div>)
                ) : <p style={{ color: '#666' }}>עדיין אין לך פרויקטים. <a href="/add-project" style={{ color: '#007bff', textDecoration: 'none' }}>הוסף פרויקט חדש!</a></p>}
            </div>
        </div>
    );
};

// סטיילס
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' };
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '14px', fontWeight: 'bold', color: '#555' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '16px', transition: 'border-color 0.2s ease-in-out' };
const btnStyle = { padding: '12px 30px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '17px', fontWeight: 'bold', transition: 'background-color 0.2s ease-in-out' };
const alertStyle = { padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid transparent' };
const profileImageContainerStyle = {
    width: '150px', height: '150px', borderRadius: '50%', backgroundColor: '#e9ecef', margin: '0 auto', cursor: 'pointer',
    overflow: 'hidden', border: '3px solid #007bff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
};
const profileImageStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const placeholderStyle = { 
    width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#e9ecef',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontWeight: 'bold'
};

export default Dashboard;