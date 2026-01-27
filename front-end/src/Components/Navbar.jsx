import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  console.log("Current User:", user);

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#eee' }}>
      
      <div className="menu-items">
        {user ? (
          // תצוגה למשתמש מחובר
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span>שלום, <strong>{user.username}</strong> </span>
            
            {/* קישורים רגילים למשתמש מחובר */}
            <Link to="/dashboard">אזור אישי</Link>
            <Link to="/projects">קטלוג</Link>

        {(user.role === 'designer' || user.role==='student') && (
            <div style={{ display: 'flex', gap: '15px', padding: '0 10px', borderRight: '2px solid #ccc', marginLeft: '10px' }}>

            <Link to="/add-project">הוסף מוצר</Link>
            </div>
        )}

            {/* תפריט אדמין - יוצג רק אם התפקיד הוא admin */}
            {user.role === 'admin' && (
              <div style={{ display: 'flex', gap: '15px', padding: '0 10px', borderRight: '2px solid #ccc', marginLeft: '10px' }}>
                <Link to="/admin/user-approval" style={{ color: '#d32f2f', fontWeight: 'bold' }}>אישור משתמשים</Link>
                <Link to="/admin/create-admin" style={{ color: '#d32f2f', fontWeight: 'bold' }}>הוספת מנהל מערכת</Link>
                <Link to="/admin/manage-users" style={{ color: '#d32f2f', fontWeight: 'bold' }}>ניהול משתמשים</Link>
                <Link to="/admin/manage-projects" style={{ color: '#d32f2f', fontWeight: 'bold' }}>ניהול פרויקטים</Link>
                <Link to="/admin/manage-reviews" style={{ color: '#d32f2f', fontWeight: 'bold' }}>ניהול תגובות</Link>
                <Link to="/admin/dashboard" style={{ color: '#d32f2f', fontWeight: 'bold' }}>לוח בקרה</Link>
              </div>
            )}

            <button 
              onClick={logout} 
              style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginRight: '10px' }}
            >
              התנתק
            </button>
          </div>
        ) : (
          // תצוגה לאורח
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/projects">קטלוג</Link>
            <Link to="/login">התחברות</Link>
            <Link to="/Register">הרשמה</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;