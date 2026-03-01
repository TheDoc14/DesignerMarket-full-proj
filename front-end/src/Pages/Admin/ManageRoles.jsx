//src/Pages/Admin/ManageRoles.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import { usePermission } from '../../Hooks/usePermission.jsx';
import { PERMS, PERMISSION_LABELS } from '../../Constants/permissions.jsx';
import { getFriendlyError } from '../../Constants/errorMessages';
import {
  Shield,
  Save,
  Plus,
  Lock,
  X,
  Search,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import './AdminDesign.css';

const ManageRoles = () => {
  const { hasPermission, loading: permissionLoading } = usePermission();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoleData, setNewRoleData] = useState({ key: '', label: '' });
  const [dynamicPermissions, setDynamicPermissions] = useState([]);

  // הפרדת משתני טעינה למניעת הבהובים
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const allAvailablePermissions = Object.values(PERMS);

  const groupedPermissions = useMemo(() => {
    const groups = {
      'ניהול משתמשים': dynamicPermissions.filter(
        (p) => p.includes('users') || p.includes('roles')
      ),
      'פרויקט ותוכן': dynamicPermissions.filter(
        (p) =>
          p.includes('projects') ||
          p.includes('categories') ||
          p.includes('reviews')
      ),
      'ניהול עסקי וכספים': dynamicPermissions.filter(
        (p) =>
          p.includes('business') || p.includes('stats') || p.includes('orders')
      ),
      'מערכת ו-AI': dynamicPermissions.filter(
        (p) => p.includes('admin.panel') || p.includes('ai')
      ),
      'אחר (הרשאות חדשות)': dynamicPermissions.filter(
        (p) =>
          !p.includes('users') &&
          !p.includes('roles') &&
          !p.includes('projects') &&
          !p.includes('categories') &&
          !p.includes('reviews') &&
          !p.includes('business') &&
          !p.includes('stats') &&
          !p.includes('orders') &&
          !p.includes('admin.panel') &&
          !p.includes('ai')
      ),
    };
    return groups;
  }, [dynamicPermissions]);

  // פונקציית טעינה יציבה
  // בתוך ManageRoles.jsx - החליפי את החלקים הרלוונטיים:

  // 1. נגדיר state להרשאות הדינמיות

  // 2. עדכון פונקציית fetchRoles
  const fetchRoles = useCallback(async () => {
    try {
      setIsPageLoading(true);
      const res = await api.get('/api/admin/roles');
      const rolesList = res.data?.roles || res.data?.data || [];
      setRoles(rolesList);

      // לוגיקה דינמית: איסוף כל ההרשאות הייחודיות מכל התפקידים שקיימים ב-DB
      const extractedPerms = new Set();
      rolesList.forEach((role) => {
        if (Array.isArray(role.permissions)) {
          role.permissions.forEach((p) => extractedPerms.add(p));
        }
      });

      // הוספת הרשאות ה-Constants כגיבוי למקרה שהן עוד לא משויכות לאף תפקיד
      Object.values(PERMS).forEach((p) => extractedPerms.add(p));

      setDynamicPermissions(Array.from(extractedPerms).sort());
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
  }, [permissionLoading, hasPermission, fetchRoles]); // הסרנו את fetchRoles מהתלויות כדי למנוע לולאה

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

      const res = await api.post('/api/admin/roles', {
        key: cleanKey,
        label: cleanLabel,
      });

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
    if (!selectedRole?.key || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setMessage({ type: '', text: '' });

      const res = await api.put(`/api/admin/roles/${selectedRole.key}`, {
        permissions: selectedRole.permissions,
        label: selectedRole.label,
      });

      // עדכון הרשימה הכללית כדי שהשינוי ישתקף ב-Sidebar
      setRoles((prev) =>
        prev.map((r) => (r.key === selectedRole.key ? res.data.role : r))
      );

      setMessage({ type: 'success', text: 'השינויים נשמרו בהצלחה!' });

      // העלמת ההודעה אחרי 3 שניות
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setMessage({ type: 'error', text: 'השמירה נכשלה. נסי שוב.' });
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

  const handleDeleteRole = async (roleKey) => {
    if (
      !window.confirm(
        'האם אתה בטוח שברצונך למחוק את התפקיד? פעולה זו אינה הפיכה.'
      )
    )
      return;

    try {
      setIsSubmitting(true);
      await api.delete(`/api/admin/roles/${roleKey}`);

      setMessage({ type: 'success', text: 'התפקיד נמחק בהצלחה' });
      setSelectedRole(null); // ניקוי הבחירה
      await fetchRoles(); // רענון הרשימה
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'שגיאה במחיקת התפקיד';
      setMessage({ type: 'error', text: getFriendlyError(errorMsg) });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  {!selectedRole.isSystem && (
                    <button
                      className="btn-delete-role"
                      onClick={() => handleDeleteRole(selectedRole.key)}
                      disabled={isSubmitting}
                    >
                      <X size={18} /> מחיקת תפקיד
                    </button>
                  )}
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
                              <span className="perm-name">
                                {PERMISSION_LABELS[perm] || perm}
                              </span>{' '}
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
