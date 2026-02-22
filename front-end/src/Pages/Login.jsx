import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import './PublicPages.css';
import { useAuth } from '../Context/AuthContext';
import api from '../api/axios';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // שינוי 1: שליפת פונקציית ה-login מה-AuthContext
  const { login } = useAuth();

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
      const gToken = await executeRecaptcha('login');

      const res = await api.post('/api/auth/login', {
        email: formData.email,
        password: formData.password,
        captchaToken: gToken,
      });

      // לפי רוב המבנים אצלכם
      const data = res.data?.data || res.data;

      await login(data.user, data.token);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message;

      const errorTranslations = {
        'Invalid credentials.': 'האימייל או הסיסמה אינם נכונים.',
        'Email verification required.':
          'אנא אמת את כתובת המייל שלך לפני ההתחברות.',
        'Your account is awaiting admin approval.':
          'חשבונך ממתין לאישור מנהל מערכת.',
        'User not found.': 'משתמש זה אינו קיים במערכת.',
        'Internal Server Error': 'יש לנו תקלה בשרת, אנחנו כבר מטפלים בזה.',
      };

      if (msg === 'Your account is awaiting admin approval.') {
        setError('חשבונך ממתין לאישור מנהל מערכת.');
      } else {
        setError(
          err.friendlyMessage ||
            errorTranslations[msg] ||
            msg ||
            'אירעה שגיאה בכניסה.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-page-container" dir="rtl">
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
            <Link to="/forgot-password">שכחתי סיסמה</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
