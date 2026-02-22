import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { usePermission } from '../../Hooks/usePermission.jsx';
import { PERMS } from '../../Constants/permissions.jsx';
import { getFriendlyError } from '../../Constants/errorMessages';
import {
  Shield,
  Save,
  Plus,
  Lock,
  Trash2,
  X,
  Search,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import './AdminDesign.css';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const ManageRoles = () => {
  const { hasPermission, loading: permissionLoading } = usePermission();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoleData, setNewRoleData] = useState({ key: '', label: '' });

  // הפרדת משתני טעינה למניעת הבהובים
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const allAvailablePermissions = Object.values(PERMS);

  const groupedPermissions = useMemo(() => {
    const groups = {
      'ניהול משתמשים': allAvailablePermissions.filter(
        (p) => p.includes('users') || p.includes('roles')
      ),
      'פרויקטים ותוכן': allAvailablePermissions.filter(
        (p) =>
          p.includes('projects') ||
          p.includes('categories') ||
          p.includes('reviews')
      ),
      'ניהול עסקי וכספים': allAvailablePermissions.filter(
        (p) =>
          p.includes('business') || p.includes('stats') || p.includes('orders')
      ),
      'מערכת ו-AI': allAvailablePermissions.filter(
        (p) => p.includes('admin.panel') || p.includes('ai')
      ),
    };
    return groups;
  }, [allAvailablePermissions]);

  // פונקציית טעינה יציבה
  const fetchRoles = useCallback(async () => {
    try {
      const res = await axios.get(
        'http://localhost:5000/api/admin/roles',
        getAuthHeader()
      );
      setRoles(res.data.roles || []);
    } catch (err) {
      console.error('Failed to fetch roles', err);
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  // עדכון ה-useEffect ב-ManageRoles.jsx
  useEffect(() => {
    const token = localStorage.getItem('token');

    // אם אין טוקן, אל תנסה אפילו לבצע את הקריאה כדי למנוע לולאת שגיאות
    if (!token) {
      setMessage({ type: 'error', text: 'החיבור פג תוקף, אנא התחברי מחדש' });
      return;
    }

    if (!permissionLoading && hasPermission('roles.manage')) {
      fetchRoles();
    }
  }, [permissionLoading, hasPermission]); // הסרנו את fetchRoles מהתלויות כדי למנוע לולאה

  const handleCreateRole = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const cleanKey = newRoleData.key.trim().toLowerCase();
    const cleanLabel = newRoleData.label.trim();

    if (!/^[a-z0-9-]+$/.test(cleanKey)) {
      setMessage({
        type: 'error',
        text: 'המזהה חייב להכיל אותיות באנגלית (a-z) ומספרים בלבד',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage({ type: '', text: '' });

      const res = await axios.post(
        'http://localhost:5000/api/admin/roles',
        { key: cleanKey, label: cleanLabel },
        getAuthHeader()
      );

      if (res.status === 200 || res.status === 201) {
        setMessage({ type: 'success', text: 'התפקיד נוצר בהצלחה!' });
        setNewRoleData({ key: '', label: '' });
        setShowAddForm(false);
        await fetchRoles();
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || 'שגיאה ביצירת תפקיד';
      setMessage({ type: 'error', text: getFriendlyError(serverMsg) });
    } finally {
      setIsSubmitting(false); // כאן אנחנו עוצרים את ה"הבהוב"
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole?.key) return;
    try {
      setIsSubmitting(true); // כדאי להוסיף חיווי טעינה גם כאן
      const res = await axios.put(
        `http://localhost:5000/api/admin/roles/${selectedRole.key}`,
        { permissions: selectedRole.permissions, label: selectedRole.label },
        getAuthHeader()
      );

      setMessage({ type: 'success', text: `ההרשאות עודכנו בהצלחה` });

      // עדכון רשימת התפקידים הכללית
      await fetchRoles();

      // עדכון התפקיד הספציפי שנבחר עם המידע החדש מהתגובה של השרת
      if (res.data.role) {
        setSelectedRole(res.data.role);
      }

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'השמירה נכשלה' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePermission = (perm) => {
    setSelectedRole((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  if (permissionLoading || isPageLoading)
    return <div className="loader">טוען...</div>;

  return (
    <div className="admin-container roles-dashboard" dir="rtl">
      <header className="roles-header">
        <div className="header-main">
          <Shield className="header-icon-animated" size={32} />
          <div>
            <h1>ניהול הרשאות מערכת</h1>
            <p>הגדרת סמכויות גישה לכל סוג משתמש</p>
          </div>
        </div>
        <button className="add-role-btn" onClick={() => setShowAddForm(true)}>
          <Plus size={20} /> תפקיד חדש
        </button>
      </header>

      {message.text && (
        <div className={`alert-toast ${message.type}`}>{message.text}</div>
      )}

      <div className="roles-grid-container">
        <nav className="roles-nav-card">
          <div className="nav-title">רשימת תפקידים</div>
          <div className="roles-list">
            {roles.map((role) => (
              <button
                key={role._id}
                className={`role-nav-item ${selectedRole?.key === role.key ? 'selected' : ''}`}
                onClick={() => setSelectedRole(role)}
              >
                <div className="role-meta">
                  <span className="role-name">{role.label}</span>
                </div>
                {role.isSystem ? (
                  <Lock size={14} className="lock-icon" />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ))}
          </div>
        </nav>

        <section className="permissions-editor">
          {selectedRole ? (
            <div className="editor-card">
              <div className="editor-header">
                <div className="editor-info">
                  <h2>עריכת הרשאות: {selectedRole.label}</h2>
                  <span className="badge-key">{selectedRole.key}</span>
                </div>
                <div className="editor-actions">
                  <button className="btn-save" onClick={handleSavePermissions}>
                    <Save size={18} /> שמור שינויים
                  </button>
                </div>
              </div>

              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="חיפוש הרשאה ספציפית..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="permissions-groups-container">
                {Object.entries(groupedPermissions).map(
                  ([groupName, perms]) => {
                    const filteredPerms = perms.filter((p) =>
                      p.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    if (filteredPerms.length === 0) return null;
                    return (
                      <div key={groupName} className="perm-group-card">
                        <div className="group-title">{groupName}</div>
                        <div className="group-grid">
                          {filteredPerms.map((perm) => (
                            <div
                              key={perm}
                              className={`perm-checkbox-item ${selectedRole.permissions.includes(perm) ? 'checked' : ''}`}
                              onClick={() => handleTogglePermission(perm)}
                            >
                              <div className="checkbox-status">
                                {selectedRole.permissions.includes(perm) ? (
                                  <CheckCircle size={16} />
                                ) : (
                                  <AlertCircle size={16} />
                                )}
                              </div>
                              <span className="perm-name">{perm}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Shield size={80} strokeWidth={1} />
              <h3>ניהול סמכויות</h3>
              <p>בחר תפקיד מצד ימין כדי לצפות ולערוך את ההרשאות שלו</p>
            </div>
          )}
        </section>
      </div>

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="close-x" onClick={() => setShowAddForm(false)}>
                <X size={15} />
              </button>
              <h3>יצירת תפקיד חדש</h3>
            </div>

            <form onSubmit={handleCreateRole} className="modal-body">
              <div className="input-group">
                <label>מזהה תפקיד (Key) - אנגלית בלבד</label>
                <input
                  value={newRoleData.key}
                  onChange={(e) => {
                    // ולידציה מיידית: מונע הקלדת עברית או תווים אסורים
                    const val = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '');
                    setNewRoleData({ ...newRoleData, key: val });
                  }}
                  placeholder="לדוגמה: content-manager"
                  required
                />
              </div>

              <div className="input-group">
                <label>שם התפקיד (Label)</label>
                <input
                  value={newRoleData.label}
                  onChange={(e) =>
                    setNewRoleData({ ...newRoleData, label: e.target.value })
                  }
                  placeholder="לדוגמה: עורך תוכן"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-create-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'מעבד...' : 'שמור תפקיד חדש'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRoles;
