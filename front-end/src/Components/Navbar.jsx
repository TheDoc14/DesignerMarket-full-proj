import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import logo from '../DefaultPics/Logo.svg';
import './componentStyle.css'; // ייבוא ה-CSS החדש

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="logo-container">
        <Link to="/">
          <img src={logo} alt="Designer Market Logo" />
        </Link>
      </div>

      <div className="menu-items">
        {user ? (
          <>
            <div style={{ color: '#f8f9fa' }}>
              <span className="user-greeting">
                שלום, <strong>{user.username}</strong>
              </span>
            </div>
            <Link to="/dashboard" className="nav-link">
              אזור אישי
            </Link>
            <Link to="/projects" className="nav-link">
              קטלוג
            </Link>
            <Link to="/about" className="nav-link">
              אודות
            </Link>

            {(user.role === 'designer' || user.role === 'student') && (
              <div className="special-group">
                <Link to="/add-project" className="nav-link">
                  הוסף מוצר
                </Link>
              </div>
            )}

            {user.role === 'admin' && (
              <div className="special-group">
                <Link to="/admin/user-approval" className="nav-link admin-link">
                  אישור משתמשים
                </Link>
                <Link to="/admin/create-admin" className="nav-link admin-link">
                  הוספת מנהל מערכת
                </Link>
                <Link to="/admin/manage-users" className="nav-link admin-link">
                  ניהול משתמשים
                </Link>
                <Link
                  to="/admin/manage-projects"
                  className="nav-link admin-link"
                >
                  ניהול פרויקטים
                </Link>
                <Link
                  to="/admin/manage-reviews"
                  className="nav-link admin-link"
                >
                  ניהול תגובות
                </Link>
                <Link to="/admin/dashboard" className="nav-link admin-link">
                  לוח בקרה
                </Link>
              </div>
            )}

            <button onClick={logout} className="logout-btn">
              התנתק
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link to="/About" className="nav-link">
              אודות
            </Link>
            <Link to="/projects" className="nav-link">
              קטלוג
            </Link>
            <Link to="/login" className="nav-link">
              התחברות
            </Link>
            <Link to="/Register" className="nav-link">
              הרשמה
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
