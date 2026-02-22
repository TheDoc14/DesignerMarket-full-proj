import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import '../App.css';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setError('קישור לא תקין או חסר טוקן אימות.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      return setError('הסיסמאות אינן תואמות');
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await api.post('/api/auth/reset-password', {
        token,
        newPassword: formData.newPassword,
      });

      setMessage('הסיסמה שונתה בהצלחה! מועבר לעמוד ההתחברות...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(
        err.friendlyMessage ||
          err.response?.data?.message ||
          'חלה שגיאה בעיבוד הבקשה. ייתכן והלינק פג תוקף.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <h1>איפוס סיסמה</h1>

      {!token ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>סיסמה חדשה</label>
            <input
              type="password"
              placeholder="לפחות 6 תווים"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>אימות סיסמה</label>
            <input
              type="password"
              placeholder="הזינו את הסיסמה שוב"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />
          </div>

          <button type="submit" disabled={loading || !token}>
            {loading ? 'מעדכן סיסמה...' : 'אפס סיסמה'}
          </button>
        </form>
      )}

      {message && <div className="alert alert-success">{message}</div>}
      {error && token && <div className="alert alert-error">{error}</div>}
    </div>
  );
};

export default ResetPassword;
