import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function WelcomeMessage({ username }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/profile');
    }, 3000); // מעבר לאחר 3 שניות

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      backgroundColor: '#4CAF50',
      padding: '20px',
      borderRadius: '10px',
      color: 'white',
      textAlign: 'center',
      fontSize: '1.5rem',
      marginTop: '50px'
    }}>
      שלום, {username}! ברוך הבא 👋
    </div>
  );
}

export default WelcomeMessage;
