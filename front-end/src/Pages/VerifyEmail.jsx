import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

/*
 *The VerifyEmail component is a dedicated landing page that handles the asynchronous verification of a user's email address.
 *It acts as the final step in the registration workflow, where a user clicks a link sent to their inbox to activate their account.
 *The component automatically extracts the verification token from the URL and communicates with the backend to finalize the authentication process.
 */
const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ranRef = useRef(false);

  const [status, setStatus] = useState('loading');
  const [msg, setMsg] = useState('מבצע אימות...');

  useEffect(() => {
    //Because React's useEffect can run twice in development mode, the component uses const ranRef = useRef(false).
    if (ranRef.current) return;
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
          delay(1000),
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
