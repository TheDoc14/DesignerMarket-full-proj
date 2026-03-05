//src/Pages/Register.jsx
import { useState } from 'react';
import api from '../api/axios';
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

    // reCAPTCHA provider לא מוכן עדיין
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
      const captchaToken = await executeRecaptcha('register');

      const dataToSend = new FormData();
      dataToSend.append('username', formData.username);
      dataToSend.append('email', formData.email);
      dataToSend.append('password', formData.password);
      dataToSend.append('role', formData.role);
      dataToSend.append('captchaToken', captchaToken);

      if (formData.approvalDocument) {
        dataToSend.append('approvalDocument', formData.approvalDocument);
      }
      await api.post('/api/auth/register', dataToSend);

      setSuccess(true);
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      console.log('REGISTER ERROR STATUS:', err.response?.status);

      const errorTranslations = {
        'User already exists with this email.':
          'כבר קיים משתמש עם כתובת אימייל זו.',
        'Username already taken.': 'שם המשתמש כבר תפוס, נסה שם אחר.',
        'Approval document is required for student/designer.':
          'חובה לצרף מסמך אישור עבור סטודנט או מעצב.',
        'Approval document is not allowed for customers.':
          'לקוח אינו רשאי להעלות מסמך אישור.',
        'Unsupported file type.': 'סוג הקובץ אינו נתמך (העלה PDF, JPG או PNG).',
        'File too large.': 'הקובץ גדול מדי, הגבלת המערכת היא עד 5MB.',
        'Password is too short': 'הסיסמה קצרה מדי, עליה להכיל לפחות 6 תווים.',
        'Too many requests. Please try again later.':
          'הגעת למגבלת הבקשות. אנא נסה שוב מאוחר יותר.',
        'Invalid role.': 'תפקיד משתמש לא תקין.',
        'Invalid role selected.': 'התפקיד שנבחר אינו מורשה במערכת.',
      };

      setError(
        err.friendlyMessage ||
          errorTranslations[serverMsg] ||
          serverMsg ||
          'שגיאה בתהליך ההרשמה.'
      );
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

          {(formData.role === 'student' || formData.role === 'designer') && (
            <div className="file-upload-area">
              <label>
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
              />
            </div>
          )}

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

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'נרשם...' : 'הרשמה למערכת'}
          </button>
        </form>

        <div className="auth-footer">
          <span>כבר יש לך חשבון? </span>
          <button className="link-btn" onClick={() => navigate('/login')}>
            התחבר
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
