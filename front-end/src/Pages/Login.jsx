import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // הוספנו את Link

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
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

      if (!response.ok) {
        throw new Error(data.message || 'שגיאה בהתחברות');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/'); 
      window.location.reload();

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

        <div style={{ marginBottom: '5px' }}> {/* הקטנו מעט את המרווח בשביל הקישור */}
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

        {/* קישור "שכחת סיסמה" */}
        <div style={{ textAlign: 'left', marginBottom: '15px' }}>
          <Link 
            to="/forgot-password" 
            style={{ fontSize: '0.85rem', color: '#007bff', textDecoration: 'none' }}
          >
            שכחת סיסמה?
          </Link>
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