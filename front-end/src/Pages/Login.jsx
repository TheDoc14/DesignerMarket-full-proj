import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // מוודא שיש לך react-router-dom

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // עדכון השדות בטופס
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // שליחת הטופס
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. שליחת הבקשה לשרת
      // וודאי שהכתובת תואמת את ה-Route שהגדרת ב-server.js
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      // 2. בדיקה אם השרת החזיר שגיאה
      if (!response.ok) {
        // השרת שלך מחזיר הודעות שגיאה ספציפיות (כמו "Your account is pending...")
        // אנחנו מציגים אותן ישירות למשתמש
        throw new Error(data.message || 'שגיאה בהתחברות');
      }

      // 3. הצלחה! שמירת הטוקן
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user)); // שמירת פרטי המשתמש (לא חובה, אבל נוח)

      // 4. הפניה לעמוד הראשי (או לפי תפקיד)
      console.log('התחברת בהצלחה:', data.user);
      navigate('/dashboard'); // שני את זה לנתיב הרצוי במערכת שלך

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ maxWidth: '400px', margin: '50px auto', direction: 'rtl' }}>
      <h2>כניסה למערכת</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>אימייל:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>סיסמה:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '15px', backgroundColor: '#ffe6e6', padding: '10px' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', cursor: 'pointer' }}>
          {loading ? 'מתחבר...' : 'היכנס'}
        </button>
      </form>
    </div>
  );
};

export default Login;