import React, { useState } from 'react';
import axios from 'axios';
import '../PublicPages.css';

const CreateAdmin = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'admin',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/register', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('מנהל מערכת חדש נוצר בהצלחה');
      setFormData({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'admin',
      });
    } catch (err) {
      alert(err.response?.data?.message || 'שגיאה ביצירת אדמין');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-form-card">
        <div className="admin-card-header">
          <h2>🛡️ יצירת מנהל מערכת</h2>
          <p>הוספת משתמש חדש עם הרשאות ניהול מלאות</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-vertical-form">
          <div className="form-group">
            <label className="form-label">שם משתמש</label>
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

          <div className="form-group">
            <label className="form-label">כתובת אימייל</label>
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

          <div className="form-group">
            <label className="form-label">סיסמה</label>
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
            {loading ? 'מבצע רישום...' : 'צור מנהל מערכת חדש'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAdmin;
