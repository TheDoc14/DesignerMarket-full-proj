//src/Pages/ForgotPassword.jsx
import { useState, useCallback } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'; // שינוי פה
import api from '../api/axios';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // שימוש ב-Hook של v3
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!executeRecaptcha) {
      setError('מנגנון ההגנה טרם נטען, נסה שנית עוד רגע');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      // יצירת טוקן של v3 עבור הפעולה הספציפית הזו
      const token = await executeRecaptcha('forgot_password');

      const res = await api.post('/api/auth/forgot-password', {
        email,
        captchaToken: token, // הטוקן שנוצר אוטומטית ברקע
      });

      setMessage(res.data?.message || 'נשלח מייל לאיפוס סיסמה.');
    } catch (err) {
      setError(
        err.friendlyMessage ||
          err.response?.data?.message ||
          'שגיאה בשליחת הבקשה.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>שכחת סיסמה?</h2>
      <p>הכנס אימייל ונשלח לך לינק לאיפוס.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="כתובת אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {/* אין כאן יותר ReCAPTCHA ויזואלי! גוגל מציגה באדג' קטן בצד המסך */}
        <button type="submit" disabled={loading}>
          {loading ? 'שולח...' : 'שלח בקשה'}
        </button>
      </form>
      {message && <p className="success-msg">{message}</p>}
      {error && <p className="error-msg">{error}</p>}
      <Link to="/login">חזרה להתחברות</Link>
    </div>
  );
};

export default ForgotPassword;
