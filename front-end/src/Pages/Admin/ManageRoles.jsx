import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { usePermission } from '../../Hooks/usePermission.jsx';
import { PERMS } from '../../Constants/permissions.jsx';
import {
  Shield,
  Save,
  Plus,
  ChevronLeft,
  Lock,
  CheckCircle,
  AlertCircle,
  Trash2,
  X,
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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const allAvailablePermissions = Object.values(PERMS);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        'http://localhost:5000/api/admin/roles',
        getAuthHeader()
      );
      setRoles(res.data.roles || []);
    } catch (err) {
      console.error('Failed to fetch roles', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!permissionLoading && hasPermission('roles.manage')) {
      fetchRoles();
    }
  }, [permissionLoading, hasPermission, fetchRoles]);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleData.key || !newRoleData.label) return;
    try {
      await axios.post(
        'http://localhost:5000/api/admin/roles',
        newRoleData,
        getAuthHeader()
      );
      setMessage({ type: 'success', text: 'התפקיד נוצר בהצלחה' });
      setNewRoleData({ key: '', label: '' });
      setShowAddForm(false);
      fetchRoles();
    } catch (err) {
      setMessage({ type: 'error', text: 'יצירת התפקיד נכשלה' });
    }
  };

  const handleDeleteRole = async (roleKey) => {
    if (!roleKey) return; // מניעת שגיאת undefined
    if (!window.confirm('האם אתה בטוח שברצונך למחוק תפקיד זה?')) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/admin/roles/${roleKey}`,
        getAuthHeader()
      );
      setMessage({ type: 'success', text: 'התפקיד נמחק בהצלחה' });
      if (selectedRole?.key === roleKey) setSelectedRole(null);
      fetchRoles();
    } catch (err) {
      setMessage({ type: 'error', text: 'מחיקת התפקיד נכשלה' });
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

  const handleSavePermissions = async () => {
    if (!selectedRole?.key) return;
    try {
      await axios.put(
        `http://localhost:5000/api/admin/roles/${selectedRole.key}`,
        {
          permissions: selectedRole.permissions,
          label: selectedRole.label,
        },
        getAuthHeader()
      );
      setMessage({
        type: 'success',
        text: `ההרשאות לתפקיד ${selectedRole.label} עודכנו`,
      });
      fetchRoles();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'השמירה נכשלה' });
    }
  };

  if (permissionLoading) return <div className="loader">טוען...</div>;

  return (
    <div className="admin-container roles-page" dir="rtl">
      <header className="admin-header">
        <div className="header-content">
          <Shield size={32} className="header-icon" />
          <h1>ניהול תפקידים והרשאות</h1>
        </div>
        <button
          className="add-btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={18} /> הוסף תפקיד
        </button>
      </header>

      <div className="roles-main-layout">
        {/* תפריט צדדי לבחירת תפקיד */}
        <aside className="roles-sidebar">
          <div className="sidebar-list">
            {roles.map((role) => (
              <div
                key={role._id}
                className={`role-item-box ${selectedRole?.key === role.key ? 'active' : ''}`}
                onClick={() => setSelectedRole(role)}
              >
                <div className="role-main-info">
                  {/* תיקון הכפילות: מציגים רק את ה-label */}
                  <span className="role-display-label">{role.label}</span>
                </div>
                <div className="role-item-actions">
                  {!role.isSystem ? (
                    <button
                      className="delete-tiny-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role.key);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <Lock size={14} className="icon-lock-locked" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* עורך הרשאות מרכזי */}
        <main className="roles-editor-area">
          {selectedRole ? (
            <div className="permissions-card">
              <div className="card-header-flex">
                <h2>עריכת הרשאות: {selectedRole.label}</h2>
                <button
                  className="save-changes-btn"
                  onClick={handleSavePermissions}
                >
                  <Save size={18} /> שמור שינויים
                </button>
              </div>

              <div className="perms-grid-system">
                {allAvailablePermissions.map((perm) => (
                  <label key={perm} className="perm-toggle-row">
                    <span className="perm-text-label">{perm}</span>
                    <div className="custom-switch">
                      <input
                        type="checkbox"
                        checked={selectedRole.permissions.includes(perm)}
                        onChange={() => handleTogglePermission(perm)}
                      />
                      <span className="switch-slider"></span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-selection-placeholder">
              <Shield size={60} />
              <p>בחר תפקיד מהרשימה כדי להתחיל בניהול הרשאות</p>
            </div>
          )}
        </main>
      </div>

      {/* מודאל להוספת תפקיד */}
      {showAddForm && (
        <div className="modal-overlay-bg">
          <div className="modal-card-box">
            <div className="modal-top-bar">
              <h3>תפקיד חדש</h3>
              <button onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateRole} className="modal-form-body">
              <input
                placeholder="מפתח (למשל: manager)"
                value={newRoleData.key}
                onChange={(e) =>
                  setNewRoleData({ ...newRoleData, key: e.target.value })
                }
                required
              />
              <input
                placeholder="שם תצוגה (למשל: מנהל)"
                value={newRoleData.label}
                onChange={(e) =>
                  setNewRoleData({ ...newRoleData, label: e.target.value })
                }
                required
              />
              <button type="submit" className="submit-form-btn">
                צור תפקיד
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRoles;
