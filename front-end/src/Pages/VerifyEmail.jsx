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

      try {
        // קריאה לשרת לפי הראוט ששלחת לי: router.get('/verify-email', verifyEmail);
        await axios.get(`http://localhost:5000/api/auth/verify-email?token=${token}`);
        
        setStatus('success');
        setMsg('המייל אומת בהצלחה! מעביר להתחברות...');
        
        setTimeout(() => navigate('/login'), 3000); // מעבר אוטומטי
      } catch (err) {
        setStatus('error');
        setMsg(err.response?.data?.message || 'האימות נכשל. ייתכן שהקישור פג תוקף.');
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <div className="page-container" style={{textAlign: 'center', marginTop: '100px'}}>
        {status === 'loading' && <h2>⏳ {msg}</h2>}
        {status === 'success' && <h2 style={{color: 'green'}}>✅ {msg}</h2>}
        {status === 'error' && (
            <div>
                <h2 style={{color: 'red'}}>❌ {msg}</h2>
                <button onClick={() => navigate('/login')}>חזור לדף התחברות</button>
            </div>
        )}
    </div>
  );
};

export default VerifyEmail;