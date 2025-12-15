import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', // השרת מצפה ל-username
    email: '',
    password: '',
    role: 'customer',
    approvalDocument: null // הקובץ היחיד שהשרת יודע לקבל בהרשמה
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // ודאי שהפורט תואם לשרת (5000)
  const API_BASE_URL = 'http://localhost:5000'; 

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // ולידציה: אם התפקיד הוא סטודנט או מעצב - חייב להעלות קובץ
    if ((formData.role === 'student' || formData.role === 'designer') && !formData.approvalDocument) {
        setError('עבור תפקיד זה חובה להעלות קובץ אישור/תעודה.');
        setLoading(false);
        return;
    }

    try {
      const dataToSend = new FormData();
      
      // שדות הטקסט שהשרת מצפה להם (לפי הקונטרולר שלך)
      dataToSend.append('username', formData.username); 
      dataToSend.append('email', formData.email);
      dataToSend.append('password', formData.password);
      dataToSend.append('role', formData.role);
      
      // שליחת הקובץ - אך ורק אם הוא קיים (לסטודנט/מעצב)
      // השם חייב להיות 'approvalDocument' כי זה מה שמוגדר ב-Router בשרת
      if (formData.approvalDocument) {
        dataToSend.append('approvalDocument', formData.approvalDocument);
      }
      
      const url = `${API_BASE_URL}/api/auth/register`;
      
      // שליחה לשרת
      await axios.post(url, dataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);

    } catch (err) {
      console.error('Registration Error:', err);
      const serverMsg = err.response?.data?.message;
      // הצגת השגיאה מהשרת או שגיאה כללית
      setError(serverMsg || 'שגיאה בהרשמה. ודא שהשרת רץ ונסה שנית.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
        <div className="page-container" style={{textAlign: 'center', marginTop: '50px'}}>
            <h2 style={{color: 'green'}}>ההרשמה בוצעה בהצלחה!</h2>
            <div style={{backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', display: 'inline-block', marginTop: '20px'}}>
                <p>שלחנו מייל אימות לכתובת <strong>{formData.email}</strong>.</p>
                <p>יש להיכנס למייל וללחוץ על הקישור כדי להפעיל את החשבון.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="page-container">
      <h2>הרשמה למערכת</h2>
      {error && <div style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '10px', marginBottom: '15px', borderRadius: '5px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div>
            <label>שם משתמש</label>
            <input 
                name="username" 
                type="text" 
                value={formData.username}
                onChange={handleChange} 
                required 
                placeholder="User Name" 
            />
        </div>
        
        <div>
            <label>אימייל</label>
            <input 
                name="email" 
                type="email" 
                value={formData.email}
                onChange={handleChange} 
                required 
            />
        </div>
        
        <div>
            <label>סיסמה</label>
            <input 
                name="password" 
                type="password" 
                value={formData.password}
                onChange={handleChange} 
                required 
            />
        </div>
        
        <div>
            <label>תפקיד</label>
            <select name="role" value={formData.role} onChange={handleChange} required>
                <option value="customer">לקוח (רגיל)</option>
                <option value="student">סטודנט</option>
                <option value="designer">מעצב</option>
            </select>
        </div>
        
        {/* שדה הקובץ מופיע אך ורק אם נבחר סטודנט או מעצב */}
        {(formData.role === 'student' || formData.role === 'designer') && (
            <div style={{marginTop: '15px', padding: '10px', backgroundColor: '#e2e3e5', borderRadius: '5px'}}>
                <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>
                    {formData.role === 'student' ? 'צרף אישור לימודים (חובה):' : 'צרף תעודה (חובה):'}
                </label>
                <input 
                    name="approvalDocument" 
                    type="file" 
                    onChange={handleChange} 
                    accept=".pdf,.jpg,.jpeg,.png"
                    required 
                />
            </div>
        )}
        
        <button type="submit" disabled={loading} style={{marginTop: '20px'}}>
          {loading ? 'מבצע רישום...' : 'הירשם'}
        </button>
      </form>
    </div>
  );
};

export default Register;