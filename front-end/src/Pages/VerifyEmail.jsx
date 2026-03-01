//src/Pages/VerifyEmail.jsx
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ranRef = useRef(false);

  const [status, setStatus] = useState('loading');
  const [msg, setMsg] = useState('מבצע אימות...');

  useEffect(() => {
    if (ranRef.current) return; // ✅ מונע ריצה כפולה ב-StrictMode
    ranRef.current = true;

    const verify = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMsg('קישור לא תקין (חסר טוקן).');
        return;
      }

      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      try {
        await Promise.all([
          api.get('/api/auth/verify-email', { params: { token } }),
          delay(1000), // לא חייב 3 שניות, אבל תשאיר אם אתה רוצה UX
        ]);

        setStatus('success');
        setMsg('המייל אומת בהצלחה! מעביר להתחברות...');
        setTimeout(() => navigate('/login'), 1500);
      } catch (err) {
        setStatus('error');
        setMsg(
          err.friendlyMessage ||
            err.response?.data?.message ||
            'האימות נכשל. ייתכן שהקישור פג תוקף.'
        );
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <div className="page-container">
      {status === 'loading' && <h2>⏳ {msg}</h2>}
      {status === 'success' && <h2>✅ {msg}</h2>}
      {status === 'error' && <h2>❌ {msg}</h2>}
    </div>
  );
};

export default VerifyEmail;
