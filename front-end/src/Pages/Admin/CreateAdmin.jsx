import React, { useState } from 'react';
import axios from 'axios';
import { Shield, UserPlus, Mail, Lock, UserCheck } from 'lucide-react'; // הוספת אייקונים למראה מקצועי
import '../PublicPages.css';

const CreateAdmin = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'admin', // ערך ברירת מחדל
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // שימוש בראוט הרישום הקיים שלך
      await axios.post('http://localhost:5000/api/auth/register', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert(
        `משתמש חדש בתפקיד ${formData.role === 'admin' ? 'אדמין' : 'מנהל עסקי'} נוצר בהצלחה`
      );

      // איפוס הטופס
      setFormData({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'admin',
      });
    } catch (err) {
      alert(err.response?.data?.message || 'שגיאה ביצירת המשתמש');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page-container" dir="rtl">
      <div className="admin-form-card">
        <div className="admin-card-header">
          <Shield size={40} className="header-icon-main" />
          <h2>ניהול צוות ניהולי</h2>
          <p>
            יצירת חשבונות חדשים עבור אדמינים או מנהלי מערכת (System Managers)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="admin-vertical-form">
          {/* בחירת תפקיד - השינוי המרכזי */}
          <div className="form-group">
            <label className="form-label">סוג הרשאה</label>
            <select
              className="form-input select-role"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
            >
              <option value="admin">אדמין (ניהול טכני מלא)</option>
              <option value="systemmanager">
                מנהל מערכת (סטטיסטיקות ועסקי)
              </option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">שם משתמש</label>
            <div className="input-with-icon">
              <UserCheck size={18} />
              <input
                className="form-input"
                placeholder="לדוגמה: admin_israel"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">כתובת אימייל</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                className="form-input"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">סיסמה</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                className="form-input"
                type="password"
                placeholder="לפחות 8 תווים"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row-dual">
            <div className="form-group">
              <label className="form-label">שם פרטי</label>
              <input
                className="form-input"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">שם משפחה</label>
              <input
                className="form-input"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="admin-submit-btn">
            {loading ? 'מבצע רישום...' : 'צור משתמש ניהולי חדש'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAdmin;
