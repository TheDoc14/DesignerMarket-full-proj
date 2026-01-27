import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [msg, setMsg] = useState('מבצע אימות...');

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMsg('קישור לא תקין (חסר טוקן).');
        return;
      }
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      try {
        // אנחנו מריצים את הקריאה לשרת ואת ההמתנה במקביל.
        // ה-await יסתיים רק כששניהם יושלמו (לפחות 3 שניות בסך הכל).
        await Promise.all([
          axios.get(
            `http://localhost:5000/api/auth/verify-email?token=${token}`
          ),
          delay(3000), // המתנה של 3 שניות
        ]);

        setStatus('success');
        setMsg('המייל אומת בהצלחה! מעביר להתחברות...');

        // מעבר לדף התחברות לאחר הצגת הודעת ההצלחה
        setTimeout(() => navigate('/login'), 2000);
      } catch (err) {
        setStatus('error');
        setMsg(
          err.response?.data?.message || 'האימות נכשל. ייתכן שהקישור פג תוקף.'
        );
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <div
      className="page-container"
      style={{ textAlign: 'center', marginTop: '100px' }}
    >
      {status === 'loading' && <h2>⏳ {msg}</h2>}
      {status === 'success' && <h2 style={{ color: 'green' }}>✅ {msg}</h2>}
    </div>
  );
};

export default VerifyEmail;
