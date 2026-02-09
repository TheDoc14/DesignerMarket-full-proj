import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import logo from '../DefaultPics/logo.png';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileText,
  Shield,
  MessageSquare,
  BarChart3,
  Tags,
  LogOut,
} from 'lucide-react';
import './componentStyle.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // פונקציית עזר לבדיקת הרשאות דינמית
  const allowed = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };
  const closeMenu = () => setIsOpen(false);
  const handleLogout = () => {
    setIsOpen(false); // סגירת ה-Sidebar כדי שלא יישאר פתוח "על ריק"
    logout(); // ביצוע הניתוק ב-AuthContext
  };
  return (
    <nav className="navbar" dir="rtl">
      <div className="navbar-fixed-part">
        <button className="hamburger" onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>
        <div className="logo-container">
          <Link to="/">
            <img src={logo} alt="Designer Market" />
          </Link>
        </div>
        {user && (
          <div className="user-greeting">
            <span>
              שלום, <strong>{user.username}</strong>
            </span>
          </div>
        )}
      </div>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={closeMenu}>
          &times;
        </button>

        <div className="sidebar-links">
          {/* קישורים ציבוריים */}
          <Link to="/projects" onClick={closeMenu} className="sidebar-item">
            📦 קטלוג פרויקטים
          </Link>
          <Link to="/about" onClick={closeMenu} className="sidebar-item">
            ℹ️ אודות
          </Link>

          {user && (
            <>
              <div className="menu-divider"></div>
              <Link
                to="/PersonalDashboard"
                onClick={closeMenu}
                className="sidebar-item"
              >
                👤 אזור אישי
              </Link>
              {allowed('projects.create') && (
                <Link
                  to="/add-project"
                  onClick={closeMenu}
                  className="sidebar-item highlight-link"
                >
                  + הוסף מוצר חדש
                </Link>
              )}
            </>
          )}

          {/* --- חדש: תפריט ניהול עסקי (System Manager) --- */}
          {/* מציג רק למשתמש עם הרשאת מערכת */}
          {allowed('system.panel.access') && (
            <div className="admin-section-sidebar">
              <p className="section-title">📊 ניהול עסקי</p>
              <Link
                to="/admin/system-stats"
                onClick={closeMenu}
                className="admin-item"
              >
                <BarChart3 size={18} /> דשבורד סטטיסטיקות
              </Link>
              <Link
                to="/admin/manage-categories"
                onClick={closeMenu}
                className="admin-item"
              >
                <Tags size={18} /> ניהול קטגוריות
              </Link>
            </div>
          )}

          {/* --- תפריט אדמין (Admin) --- */}
          {/* מציג רק אם המשתמש הוא אדמין ואינו מנהל מערכת עסקי (הפרדה מוחלטת) */}
          {allowed('admin.panel.access') && !allowed('system.panel.access') && (
            <div className="admin-section-sidebar">
              <p className="section-title">🛡️ ניהול אדמין</p>
              <div className="admin-links-list">
                {allowed('users.approve') && (
                  <Link
                    to="/admin/user-approval"
                    onClick={closeMenu}
                    className="admin-item"
                  >
                    <CheckSquare size={16} /> אישור משתמשים
                  </Link>
                )}
                <br></br>
                {allowed('users.read') && (
                  <Link
                    to="/admin/manage-users"
                    onClick={closeMenu}
                    className="admin-item"
                  >
                    <Users size={16} /> ניהול משתמשים
                  </Link>
                )}
                <br></br>
                {allowed('projects.publish') && (
                  <Link
                    to="/admin/manage-projects"
                    onClick={closeMenu}
                    className="admin-item"
                  >
                    <FileText size={16} /> ניהול פרויקטים
                  </Link>
                )}
                <br></br>
                {allowed('reviews.manage') && (
                  <Link
                    to="/admin/manage-reviews"
                    onClick={closeMenu}
                    className="admin-item"
                  >
                    <MessageSquare size={16} /> ניהול תגובות
                  </Link>
                )}
                <br></br>
                {allowed('roles.manage') && (
                  <Link
                    to="/admin/manage-roles"
                    onClick={closeMenu}
                    className="admin-item"
                  >
                    <Shield size={16} /> ניהול הרשאות
                  </Link>
                )}
                <br></br>
                <Link
                  to="/admin/dashboard"
                  onClick={closeMenu}
                  className="admin-item bold-link"
                >
                  <LayoutDashboard size={16} /> לוח בקרה כללי
                </Link>
              </div>
            </div>
          )}

          <div className="sidebar-footer">
            {user ? (
              <button onClick={handleLogout} className="logout-btn-sidebar">
                <LogOut size={18} /> התנתק מהמערכת
              </button>
            ) : (
              <div className="guest-actions">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="auth-btn login"
                >
                  התחברות
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="auth-btn register"
                >
                  הרשמה
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      {isOpen && <div className="overlay" onClick={closeMenu}></div>}
    </nav>
  );
};

export default Navbar;
