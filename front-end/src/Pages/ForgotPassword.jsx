import { useState } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await api.post('/api/auth/forgot-password', { email });
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
    <div>
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
        {message && <p>{message}</p>}
        {error && <p>{error}</p>}
        <Link to="/login">חזרה להתחברות</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
