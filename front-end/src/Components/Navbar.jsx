import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { usePermission } from '../Hooks/usePermission.jsx';
import { PERMS } from '../Constants/permissions.jsx';
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
  const { logout } = useAuth();
  // שליפת hasPermission והמשתמש. ה-Hook הזה מסתמך על מידע מקומי ולא קורא לשרת
  const { hasPermission, user } = usePermission();
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
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

        <div className="sidebar-footer">
          {user ? (
            <button onClick={handleLogout} className="logout-btn-sidebar">
              <LogOut size={18} /> התנתק
            </button>
          ) : (
            <div className="guest-actions">
              <Link to="/login" onClick={closeMenu} className="auth-btn login">
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

        <div className="sidebar-links">
          <Link to="/projects" onClick={closeMenu} className="sidebar-item">
            📦 קטלוג פרויקטים
          </Link>
          <Link to="/about" onClick={closeMenu} className="sidebar-item">
            👥 אודות
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
              {hasPermission('projects.create') && (
                <Link
                  to="/add-project"
                  onClick={closeMenu}
                  className="sidebar-item highlight-link"
                >
                  + הוסף מוצר
                </Link>
              )}
            </>
          )}
          {/* --- תפריט ניהול עסקי (Business Manager) --- */}
          {(hasPermission(PERMS.BUSINESS_PANEL_ACCESS) ||
            hasPermission('stats.read') ||
            user?.role === 'business_manager') && (
            <div className="admin-section-sidebar">
              <p className="section-title">📊 ניהול עסקי</p>
              <Link
                to="/admin/system-stats"
                onClick={closeMenu}
                className="admin-item"
              >
                <BarChart3 size={18} /> דשבורד סטטיסטיקות
              </Link>
            </div>
          )}
          {/* --- תפריט אדמין (Admin) --- */}
          {hasPermission('admin.panel.access') && (
            <div className="admin-section-sidebar">
              <p className="section-title">🛡️ ניהול אדמין</p>
              <div className="admin-links-list">
                {hasPermission('users.approve') && (
                  <Link
                    to="/admin/user-approval"
                    onClick={closeMenu}
                    className="admin-item"
                  >
                    <CheckSquare size={16} /> אישור משתמשים
                  </Link>
                )}
                <br></br>
                {hasPermission('users.read') && (
                  <Link
                    to="/admin/manage-users"
                    onClick={closeMenu}
                    className="admin-item"
                  >
                    <Users size={16} /> ניהול משתמשים
                  </Link>
                )}
                <br></br>

                {hasPermission('projects.publish') && (
                  <Link
                    to="/admin/manage-projects"
                    onClick={closeMenu}
                    className="admin-item"
                  >
                    <FileText size={16} /> ניהול פרויקטים
                  </Link>
                )}
                <br></br>

                {hasPermission('reviews.manage') && (
                  <Link
                    to="/admin/manage-reviews"
                    onClick={closeMenu}
                    className="admin-item"
                  >
                    <MessageSquare size={16} /> ניהול תגובות
                  </Link>
                )}
                <br></br>

                <Link
                  to="/admin/manage-categories"
                  onClick={closeMenu}
                  className="admin-item"
                >
                  <Tags size={18} /> ניהול קטגוריות
                </Link>
                <br></br>

                {hasPermission('roles.manage') && (
                  <Link
                    to="/admin/manage-roles"
                    onClick={closeMenu}
                    className="admin-item"
                  >
                    <Shield size={16} /> ניהול תפקידים
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
        </div>
      </div>
      {isOpen && <div className="overlay" onClick={closeMenu}></div>}
    </nav>
  );
};

export default Navbar;
