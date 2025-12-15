import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';

const Dashboard = () => {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // נתונים מהשרת
  const [projects, setProjects] = useState([]);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // State לטופס
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    country: '',
    bio: '',
    birthDate: '',
    profileImage: null,
    social: {
      website: '',
      instagram: '',
      linkedin: '',
      github: '',
      behance: '',
      dribbble: ''
    }
  });

  // טעינת נתונים
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/profile/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'שגיאה בטעינת פרופיל');

        const { user, projects } = data;
        setProjects(projects || []);

        let formattedDate = '';
        if (user.birthDate) {
          formattedDate = new Date(user.birthDate).toISOString().split('T')[0];
        }

        setFormData({
          username: user.username || '',
          email: user.email || '',
          role: user.role || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
          city: user.city || '',
          country: user.country || '',
          bio: user.bio || '',
          birthDate: formattedDate,
          profileImage: null,
          social: {
            website: user.social?.website || '',
            instagram: user.social?.instagram || '',
            linkedin: user.social?.linkedin || '',
            github: user.social?.github || '',
            behance: user.social?.behance || '',
            dribbble: user.social?.dribbble || ''
          }
        });

        if (user.profileImage) {
          setProfileImagePreview(user.profileImage);
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleSocialChange = (e) => {
    setFormData({
      ...formData,
      social: { ...formData.social, [e.target.name]: e.target.value }
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profileImage: file });
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const dataToSend = new FormData();

      dataToSend.append('username', formData.username);
      dataToSend.append('firstName', formData.firstName);
      dataToSend.append('lastName', formData.lastName);
      dataToSend.append('bio', formData.bio);
      dataToSend.append('city', formData.city);
      dataToSend.append('country', formData.country);
      dataToSend.append('phone', formData.phone);
      if (formData.birthDate) dataToSend.append('birthDate', formData.birthDate);

      if (formData.profileImage) {
        dataToSend.append('profileImage', formData.profileImage);
      }

      Object.keys(formData.social).forEach(key => {
        dataToSend.append(`social[${key}]`, formData.social[key]);
      });

      const response = await fetch('http://localhost:5000/api/profile/me', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: dataToSend
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'שגיאה בעדכון');

      updateUser(result.user);
      setMessage({ type: 'success', text: 'הפרופיל עודכן בהצלחה!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>טוען נתונים...</div>;

  return (
    <div style={{padding: '40px 20px'}}>
      
      <div style={{  backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {/* --- Header --- */}
        <div style={{ padding: '30px 40px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', color: '#1f2937' }}>הגדרות פרופיל</h1>
            <p style={{ margin: '8px 0 0', color: '#6b7280' }}>ניהול פרטים אישיים והגדרות חשבון</p>
          </div>
          <span style={{ padding: '8px 20px', borderRadius: '30px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '600', fontSize: '14px' }}>
            {formData.role.toUpperCase()}
          </span>
        </div>

        {/* --- Messages --- */}
        {message.text && (
          <div style={{ padding: '15px 40px', backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7', color: message.type === 'error' ? '#991b1b' : '#166534', fontWeight: '500' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '0' }}>
          
          {/* --- Sidebar (Left Side) --- */}
          <div style={{ padding: '40px', backgroundColor: '#fafafa', borderLeft: '1px solid #eee' }}>
            {/* Profile Image */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
              <div style={{ width: '160px', height: '160px', borderRadius: '50%', overflow: 'hidden', marginBottom: '15px', border: '5px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <img 
                  src={profileImagePreview || 'https://via.placeholder.com/160?text=User'} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <label htmlFor="upload-photo" style={{ cursor: 'pointer', color: '#2563eb', fontWeight: '600', fontSize: '15px' }}>
                שינוי תמונה ✏️
              </label>
              <input id="upload-photo" type="file" onChange={handleImageChange} style={{ display: 'none' }} accept="image/*" />
            </div>

            {/* Account Info Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={styles.label}>שם משתמש</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} style={styles.input} />
              </div>
              <div>
                <label style={styles.label}>אימייל (לקריאה בלבד)</label>
                <input type="email" value={formData.email} disabled style={{ ...styles.input, backgroundColor: '#e5e7eb', color: '#6b7280', cursor: 'not-allowed' }} />
              </div>
              <div>
                <label style={styles.label}>קצת עליי (Bio)</label>
                <textarea name="bio" value={formData.bio} onChange={handleChange} rows="6" style={{ ...styles.input, resize: 'vertical', lineHeight: '1.5' }} />
              </div>
            </div>
          </div>

          {/* --- Main Content (Right Side) --- */}
          <div style={{ padding: '40px' }}>
            
            {/* Personal Details Section */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={styles.sectionTitle}>פרטים אישיים</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={styles.label}>שם פרטי</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>שם משפחה</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>טלפון</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>תאריך לידה</label>
                  <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>עיר מגורים</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>מדינה</label>
                  <input type="text" name="country" value={formData.country} onChange={handleChange} style={styles.input} />
                </div>
              </div>
            </div>

            {/* Social Media Section */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={styles.sectionTitle}>רשתות חברתיות</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={styles.label}>🌐 אתר אישי</label>
                  <input type="url" name="website" placeholder="https://" value={formData.social.website} onChange={handleSocialChange} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>🔗 LinkedIn</label>
                  <input type="url" name="linkedin" placeholder="https://linkedin.com/in/..." value={formData.social.linkedin} onChange={handleSocialChange} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>🐙 GitHub</label>
                  <input type="url" name="github" placeholder="https://github.com/..." value={formData.social.github} onChange={handleSocialChange} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>📷 Instagram</label>
                  <input type="url" name="instagram" placeholder="https://instagram.com/..." value={formData.social.instagram} onChange={handleSocialChange} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>🎨 Behance</label>
                  <input type="url" name="behance" placeholder="https://behance.net/..." value={formData.social.behance} onChange={handleSocialChange} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>🏀 Dribbble</label>
                  <input type="url" name="dribbble" placeholder="https://dribbble.com/..." value={formData.social.dribbble} onChange={handleSocialChange} style={styles.input} />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={saving} style={styles.button}>
              {saving ? '⏳ שומר שינויים...' : 'שמור שינויים'}
            </button>
          </div>
        </form>
      </div>

      {/* --- Projects Section (Outside the white card) --- */}
      <div style={{ maxWidth: '1000px', margin: '40px auto' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '20px' }}>הפרויקטים שלי ({projects.length})</h2>
        {projects.length === 0 ? (
          <p style={{ color: '#6b7280' }}>עדיין לא העלית פרויקטים.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {projects.map(proj => (
              <div key={proj._id} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '18px', color: '#111827' }}>{proj.title}</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                  {proj.description ? proj.description.substring(0, 80) + '...' : 'אין תיאור'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

// --- Styles Object ---
const styles = {
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '12px',
    marginBottom: '24px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#4b5563'
  },
  input: {
    width: '100%',
    padding: '14px', // שדות גבוהים יותר
    fontSize: '15px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    backgroundColor: '#fff'
  },
  button: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#2563eb',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)',
    transition: 'background-color 0.2s'
  }
};

export default Dashboard;