import { useState } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import api from '../api/axios';
import { Link } from 'react-router-dom';

/*
 *The ForgotPassword component is a critical security feature within the authentication module.
 *it provides a secure way for users to regain access to their accounts if they have lost their credentials.
 *The component integrates an invisible Google reCAPTCHA v3 layer to protect the "Reset Password" endpoint from automated bot attacks
 *and brute-force attempts.
 */
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  //This function is called immediately upon form submission. It assigns a "score" to the user's interaction in the background.
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
      const token = await executeRecaptcha('forgot_password');

      const res = await api.post('/api/auth/forgot-password', {
        email,
        captchaToken: token,
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
