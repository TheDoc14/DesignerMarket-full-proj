import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // שליפת הטוקן מה-Query String (?token=...) כפי שמוגדר ב-email.utils.js
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // בדיקה ראשונית אם הטוקן קיים בכתובת
  useEffect(() => {
    if (!token) {
      setError('קישור לא תקין או חסר טוקן אימות.');
    }
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
      // התאמה ל-auth.controller.js: השרת מצפה ל-token ול-newPassword בתוך req.body
      const res = await axios.post(
        `http://localhost:5000/api/auth/reset-password`,
        {
          token: token,
          newPassword: formData.newPassword,
        }
      );

      setMessage('הסיסמה שונתה בהצלחה! מועבר לעמוד ההתחברות...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      // השרת מחזיר שגיאה אם הטוקן לא תקין או פג תוקף (לפי hashToken)
      setError(
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
