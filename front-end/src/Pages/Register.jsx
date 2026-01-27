import React, { useState } from 'react';
import axios from 'axios';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'customer',
    approvalDocument: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const API_BASE_URL = 'http://localhost:5000';

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!executeRecaptcha) {
      setError('שירות האבטחה אינו מוכן. נסה שנית בעוד רגע.');
      return;
    }

    if (
      (formData.role === 'student' || formData.role === 'designer') &&
      !formData.approvalDocument
    ) {
      setError('עבור תפקיד זה חובה להעלות קובץ אישור/תעודה.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. הפקת טוקן reCAPTCHA
      const captchaToken = await executeRecaptcha('register');

      // 2. הכנת הנתונים למשלוח
      const dataToSend = new FormData();
      dataToSend.append('username', formData.username);
      dataToSend.append('email', formData.email);
      dataToSend.append('password', formData.password);
      dataToSend.append('role', formData.role);
      dataToSend.append('captchaToken', captchaToken); // הטוקן נשלח כאן

      if (formData.approvalDocument) {
        dataToSend.append('approvalDocument', formData.approvalDocument);
      }

      // 3. שליחה לשרת
      await axios.post(`${API_BASE_URL}/api/auth/register`, dataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      setError(serverMsg || 'שגיאה בתהליך ההרשמה.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="user-page-container">
        <div className="auth-card success-card">
          <div className="success-icon">✓</div>
          <h2>ההרשמה בוצעה בהצלחה!</h2>

          <div className="success-content">
            <p>
              שלחנו מייל אימות לכתובת:
              <br />
              <strong className="email-highlight">{formData.email}</strong>
            </p>
            <p>אנא אמת את חשבונך כדי שתוכל להתחיל להשתמש ב-Designer Market.</p>
          </div>

          <button onClick={() => navigate('/login')} className="primary-btn">
            עבור להתחברות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-page-container">
      <div className="auth-card">
        <h2>יצירת חשבון חדש</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>שם משתמש</label>
            <input
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="ישראל ישראלי"
            />
          </div>

          <div className="form-group">
            <label>אימייל</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@mail.com"
            />
          </div>

          <div className="form-group">
            <label>בחרו סוג משתמש</label>
            <select
              name="role"
              className="role-select"
              onChange={handleChange}
              value={formData.role}
            >
              <option value="customer">לקוח (רכישת פרויקטים)</option>
              <option value="student">סטודנט לעיצוב</option>
              <option value="designer">מעצב תעשייתי</option>
            </select>
          </div>

          <div className="form-group">
            <label>סיסמה</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              onChange={handleChange}
              required
            />
          </div>

          {(formData.role === 'student' || formData.role === 'designer') && (
            <div className="file-upload-area">
              <label style={{ fontWeight: 'bold' }}>
                {formData.role === 'student'
                  ? '📁 צרף אישור לימודים:'
                  : '📁 צרף תעודת מעצב:'}
              </label>
              <input
                name="approvalDocument"
                type="file"
                onChange={handleChange}
                accept=".pdf,.jpg,.jpeg,.png"
                required
                style={{ marginTop: '10px' }}
              />
            </div>
          )}

          <button type="submit" className="primary-btn">
            הרשמה למערכת
          </button>
        </form>
        <div className="auth-footer">
          <span>כבר יש לך חשבון? </span>
          <button className="link-btn" onClick={() => navigate('/login')}>
            הירשם
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
