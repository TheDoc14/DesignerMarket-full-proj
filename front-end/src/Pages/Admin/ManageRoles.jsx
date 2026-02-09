import React, { useState, useEffect } from 'react';
import axios from 'axios';
// תיקון הייבוא לפי מבנה התיקיות בתמונה שלך
import { PERMISSION_LABELS } from '../../Constants/permissions';
import './AdminDesign.css';
import {
  Trash2,
  Edit3,
  Save,
  XCircle,
  Star,
  MessageSquare,
  User,
  Package,
  Filter,
  ArrowUpDown,
} from 'lucide-react';

const ManageRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // מצב עריכה
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    key: '',
    label: '',
    permissions: [],
  });

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(res.data.roles || []);
    } catch (err) {
      setMessage({ type: 'error', text: 'שגיאה בטעינת תפקידים' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleTogglePermission = (perm) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const openEdit = (role) => {
    setFormData({
      key: role.key,
      label: role.label,
      permissions: role.permissions,
    });
    setIsEditing(true);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // אם אנחנו בעריכה משתמשים ב-PUT, אם בחדש משתמשים ב-POST
      const url = isEditing
        ? `http://localhost:5000/api/admin/roles/${formData.key}`
        : 'http://localhost:5000/api/admin/roles';

      const method = isEditing ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage({
        type: 'success',
        text: isEditing ? 'התפקיד עודכן!' : 'התפקיד נוצר!',
      });
      setIsAdding(false);
      setIsEditing(false);
      setFormData({ key: '', label: '', permissions: [] });
      fetchRoles();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'פעולה נכשלה',
      });
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm('האם למחוק תפקיד זה?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/roles/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRoles();
    } catch (err) {
      alert(err.response?.data?.message || 'לא ניתן למחוק');
    }
  };

  if (loading) return <div className="loader">טוען הגדרות מערכת...</div>;

  return (
    <div className="admin-container" dir="rtl">
      <h1 className="profile-header">ניהול תפקידים והרשאות</h1>

      {message.text && (
        <div className={`profile-alert ${message.type}`}>{message.text}</div>
      )}

      <button
        className="profile-save-btn"
        onClick={() => {
          setIsAdding(!isAdding);
          setIsEditing(false);
          setFormData({ key: '', label: '', permissions: [] });
        }}
      >
        {isAdding ? 'ביטול' : '+ צור תפקיד חדש'}
      </button>

      {isAdding && (
        <form onSubmit={handleSubmit} className="profile-card-form">
          <h3>
            {isEditing ? `עריכת תפקיד: ${formData.key}` : 'הגדרת תפקיד חדש'}
          </h3>
          <div className="form-grid-3">
            <div className="form-group">
              <label>מזהה (Key)</label>
              <input
                className="form-input"
                value={formData.key}
                disabled={isEditing} // מניעת שינוי Key בתפקיד קיים
                onChange={(e) =>
                  setFormData({ ...formData, key: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>שם תצוגה (Label)</label>
              <input
                className="form-input"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
              />
            </div>
          </div>

          <h4 className="section-subtitle">הרשאות משויכות:</h4>
          <div className="permissions-grid">
            {Object.entries(PERMISSION_LABELS).map(([value, label]) => (
              <label key={value} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.permissions.includes(value)}
                  onChange={() => handleTogglePermission(value)}
                />
                {label}
              </label>
            ))}
          </div>

          <button type="submit" className="profile-save-btn">
            {isEditing ? 'עדכן שינויים' : 'שמור תפקיד חדש'}
          </button>
        </form>
      )}

      <div className="management-section">
        <h3>רשימת תפקידים</h3>
        <div className="purchased-list">
          {roles.map((role) => (
            <div key={role.key} className="management-item">
              <div>
                <strong>{role.label || role.key}</strong>
                <span>({role.key})</span>
                <p>{role.permissions.length} הרשאות</p>
              </div>
              <div>
                <button
                  onClick={() => openEdit(role)}
                  className="btn-icon"
                  title="ערוך"
                >
                  <Edit3 size={18} color="#0984e3" />
                </button>
                {!role.isSystem && (
                  <button
                    onClick={() => handleDelete(role.key)}
                    className="btn-icon"
                  >
                    <Trash2 size={18} color="#e17055" />
                  </button>
                )}
                {role.isSystem && (
                  <span className="role-badge admin">מערכת</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageRoles;
