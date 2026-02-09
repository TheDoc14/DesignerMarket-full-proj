import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import Popup from '../../Components/Popup';
import {
  Trash2,
  Edit3,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
} from 'lucide-react'; // הוספת אייקונים לבהירות
import '../../App.css';

const ManageProjects = () => {
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [editData, setEditData] = useState({
    title: '',
    description: '',
    category: '',
  });

  const [filters, setFilters] = useState({
    q: '',
    published: '',
    page: 1,
  });

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = { limit: 50, page: filters.page };
      if (filters.q) queryParams.q = filters.q;
      if (filters.published !== '') queryParams.published = filters.published;

      const params = new URLSearchParams(queryParams).toString();
      const res = await axios.get(
        `http://localhost:5000/api/admin/projects?${params}`,
        getAuthHeader()
      );
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error('טעינת פרויקטים נכשלה', err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (currentUser?.role === 'admin') fetchProjects();
  }, [currentUser, fetchProjects]);

  // פונקציית מחיקה חדשה
  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (
      !window.confirm(
        'האם אתה בטוח שברצונך למחוק פרויקט זה לצמיתות? פעולה זו תמחק גם את כל הקבצים והביקורות הקשורים.'
      )
    )
      return;

    try {
      await axios.delete(
        `http://localhost:5000/api/projects/${projectId}`,
        getAuthHeader()
      );
      alert('הפרויקט נמחק בהצלחה');
      fetchProjects();
    } catch (err) {
      alert('מחיקת הפרויקט נכשלה');
    }
  };

  const togglePublish = async (e, projectId, currentStatus) => {
    e.stopPropagation();
    try {
      await axios.put(
        `http://localhost:5000/api/admin/projects/${projectId}/publish`,
        { isPublished: !currentStatus },
        getAuthHeader()
      );
      fetchProjects();
    } catch (err) {
      alert('עדכון סטטוס נכשל');
    }
  };

  const handleEditClick = (e, project) => {
    e.stopPropagation();
    setEditData({
      title: project.title || '',
      description: project.description || '',
      category: project.category || '',
    });
    setActiveProject(project);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const id = activeProject._id || activeProject.id;
      await axios.put(
        `http://localhost:5000/api/projects/${id}`,
        editData,
        getAuthHeader()
      );
      alert('הפרויקט עודכן בהצלחה');
      setIsEditing(false);
      setActiveProject(null);
      fetchProjects();
    } catch (err) {
      alert('עדכון הפרויקט נכשל.');
    }
  };

  if (!currentUser || currentUser.role !== 'admin')
    return <div className="container">אין הרשאות ניהול למשתמש זה.</div>;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>🛠️ פאנל ניהול פרויקטים</h1>
        <p>צפייה, אישור, עריכה או הסרה של תכנים מהפלטפורמה</p>
      </header>

      {/* סרגל כלים משופר */}
      <div className="admin-toolbar">
        <div>
          <input
            placeholder="חפש לפי כותרת או תיאור..."
            value={filters.q}
            onChange={(e) =>
              setFilters({ ...filters, q: e.target.value, page: 1 })
            }
            className="admin-input"
          />
        </div>
        <div>
          <select
            value={filters.published}
            onChange={(e) =>
              setFilters({ ...filters, published: e.target.value, page: 1 })
            }
          >
            <option value="">כל הסטטוסים</option>
            <option value="true">מפורסמים בלבד</option>
            <option value="false">ממתינים לאישור</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div>טוען נתונים...</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>פרטי הפרויקט</th>
                <th>יוצר</th>
                <th>סטטוס</th>
                <th>ניהול</th>
              </tr>
            </thead>
            <tbody>
              {projects.length > 0 ? (
                projects.map((p) => {
                  const id = p._id || p.id;
                  return (
                    <tr
                      key={id}
                      onClick={() => setActiveProject(p)}
                      className="clickable-row"
                    >
                      <td>
                        <div>{p.title}</div>
                        <div>{p.category}</div>
                      </td>
                      <td>{p.createdBy?.username || 'משתמש מערכת'}</td>
                      <td>
                        <span
                          className={`status-tag ${p.isPublished ? 'approved' : 'pending'}`}
                        >
                          {p.isPublished ? (
                            <CheckCircle size={14} />
                          ) : (
                            <Clock size={14} />
                          )}
                          {p.isPublished ? 'מפורסם' : 'ממתין'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions-cell">
                          <button
                            onClick={(e) => handleEditClick(e, p)}
                            className="btn-icon"
                            title="ערוך"
                          >
                            <Edit3 size={18} color="#0984e3" />
                          </button>
                          <button
                            onClick={(e) => togglePublish(e, id, p.isPublished)}
                            className="btn-icon"
                            title={p.isPublished ? 'הסר פרסום' : 'אשר פרסום'}
                          >
                            {p.isPublished ? (
                              <XCircle size={18} color="#d63031" />
                            ) : (
                              <CheckCircle size={18} color="#00b894" />
                            )}
                          </button>
                          <button
                            onClick={(e) => handleDeleteProject(e, id)}
                            className="btn-icon"
                            title="מחק"
                          >
                            <Trash2 size={18} color="#e17055" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4">לא נמצאו פרויקטים התואמים לחיפוש.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* מודאל עריכה (נשאר דומה עם שיפור עיצובי קל) */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div
            className="modal-content admin-edit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="profile-main-title">✏️ עריכת פרטי פרויקט</h2>
            <div className="admin-vertical-form">
              <div className="form-group">
                <label className="form-label">כותרת הפרויקט</label>
                <input
                  className="form-input"
                  value={editData.title}
                  onChange={(e) =>
                    setEditData({ ...editData, title: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">תיאור</label>
                <textarea
                  className="form-textarea"
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                />
              </div>
              <div className="modal-footer-btns">
                <button
                  onClick={() => setIsEditing(false)}
                  className="cancel-btn"
                >
                  ביטול
                </button>
                <button onClick={handleSaveEdit} className="profile-save-btn">
                  שמור שינויים
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeProject && !isEditing && (
        <Popup
          project={activeProject}
          onClose={() => setActiveProject(null)}
          onUpdate={() => fetchProjects()}
        />
      )}
    </div>
  );
};

export default ManageProjects;
