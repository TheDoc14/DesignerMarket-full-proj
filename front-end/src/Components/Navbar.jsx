import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext'; // ייבוא ה-Hook שיצרנו

const Navbar = () => {
  const { user, logout } = useAuth();
  console.log(user);

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#eee' }}>
      
      <div className="menu-items">
        {user ? (
          // תצוגה למשתמש מחובר
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span>שלום, <strong>{user.username}</strong> </span>
            <Link to="/dashboard">אזור אישי</Link>
           
            <Link to="/">בית</Link>
            <Link to="/products">קטלוג</Link> {/* קישור חדש */}
            <Link to="/add-product">הוסף מוצר</Link> {/* קישור חדש */}
             <button onClick={logout} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
              התנתק
            </button>

          </div>
        ) : (
          // תצוגה לאורח
          <div style={{ display: 'flex', gap: '10px' }}>

            <Link to="/">בית</Link>
            <Link to="/products">קטלוג</Link> {/* קישור חדש */}
            <Link to="/login">התחברות</Link>
            <Link to="/Register">הרשמה</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;