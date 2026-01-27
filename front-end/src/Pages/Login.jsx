import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // הוספנו את Link
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import './PublicPages.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!executeRecaptcha) {
      setError('שירות האבטחה אינו זמין כרגע, נסה שוב');
      setLoading(false);
      return;
    }
    try {
      const token = await executeRecaptcha('login');
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          captchaToken: token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        switch (response.status) {
          case 400:
            throw new Error(' אנא בדוק את הנתונים שהזנת.');
          case 401:
            throw new Error('האימייל או הסיסמה אינם נכונים.');
          case 403:
            throw new Error(
              'חשבונך ממתין לאישור מנהל מערכת. תקבל הודעה ברגע שהחשבון יאושר.'
            );
          case 404:
            throw new Error('משתמש זה אינו קיים במערכת.');
          case 429:
            throw new Error(
              'יותר מדי ניסיונות התחברות. אנא נסה שוב בעוד מספר דקות.'
            );
          case 500:
            throw new Error('ישנה תקלה בשרת שלנו. אנחנו כבר מטפלים בזה!');
          default:
            throw new Error(data.message || 'אירעה שגיאה לא צפויה, נסה שוב.');
        }
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/');
      window.location.reload();
    } catch (err) {
      if (err.message === 'Pending_approval') {
        setError('חשבונך ממתין לאישור מנהל מערכת.');
      } else {
        setError(err.message || 'שגיאה בתקשורת עם השרת');
      }
      const serverMsg = err.response?.data?.message;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-page-container">
      <div className="auth-card">
        <h2>כניסה למערכת</h2>
        {error && (
          <div
            className={`message-box ${error.includes('ממתין') ? 'pending-message' : 'error-message'}`}
          >
            {error.includes('ממתין') ? '⏳ ' : '⚠️ '}
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>אימייל</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />
          </div>
          <div className="form-group">
            <label>סיסמה</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="********"
            />
          </div>
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'מתחבר...' : 'התחברות'}
          </button>

          <div className="auth-footer">
            <span>עוד לא נרשמת? </span>
            <Link to="/Register">ליצירת חשבון חדש</Link>
            <br />
            <Link
              to="/forgot-password"
              style={{
                fontSize: '0.8rem',
                marginTop: '10px',
                display: 'inline-block',
                opacity: 0.8,
              }}
            >
              שכחתי סיסמה
            </Link>
          </div>
        </form>{' '}
        {/* סגירה נכונה של הטופס כאן */}
      </div>
    </div>
  );
};

export default Login;
