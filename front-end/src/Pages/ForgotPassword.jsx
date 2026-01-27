import React, { useState } from 'react';
import axios from 'axios';
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
      const res = await axios.post(
        'http://localhost:5000/api/auth/forgot-password',
        { email }
      );
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה בשליחת הבקשה.');
    } finally {
      setLoading(false);
    }
  };

  // אובייקט עיצוב פנימי
  const styles = {
    wrapper: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh',
      direction: 'rtl',
      fontFamily: 'sans-serif',
    },
    card: {
      background: 'white',
      padding: '30px',
      borderRadius: '15px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      width: '100%',
      maxWidth: '400px',
      textAlign: 'center',
    },
    input: {
      width: '100%',
      padding: '12px',
      marginBottom: '15px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '16px',
      boxSizing: 'border-box',
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
    },
    link: {
      display: 'block',
      marginTop: '15px',
      color: '#007bff',
      textDecoration: 'none',
      fontSize: '14px',
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={{ marginBottom: '10px' }}>שכחת סיסמה?</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          הכנס אימייל ונשלח לך לינק לאיפוס.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="כתובת אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'שולח...' : 'שלח בקשה'}
          </button>
        </form>
        {message && (
          <p style={{ color: 'green', marginTop: '15px' }}>{message}</p>
        )}
        {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
        <Link to="/login" style={styles.link}>
          חזרה להתחברות
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
