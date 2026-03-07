//src/Pages/Admin/ManageProjects.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { usePermission } from '../../Hooks/usePermission.jsx';
import Popup from '../../Components/Popup';
import { Trash2, Edit3, CheckCircle, Clock } from 'lucide-react';
import '../../App.css';

const ManageProjects = () => {
  const {
    hasPermission,
    user: currentUser,
    loading: permissionLoading,
  } = usePermission();

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

  // 2. פונקציית שליפה יציבה - תלויה רק בערכי הפילטרים וב-ID של המשתמש
  const fetchProjects = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);

      const params = { limit: 50, page: filters.page };
      if (filters.q) params.q = filters.q;
      if (filters.published !== '') params.published = filters.published;

      const res = await api.get('/api/admin/projects', { params });
      setProjects(res.data?.projects || res.data?.data || []);
    } catch (err) {
      console.error('טעינת פרויקטים נכשלה', err);
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.q, filters.published, currentUser?.id]);

  // 3. Effect שרץ רק כשנתוני המשתמש או הפילטרים משתנים באמת
  useEffect(() => {
    if (currentUser?.id && hasPermission('admin.panel.access')) {
      fetchProjects();
    }
  }, [
    currentUser?.id,
    permissionLoading,
    filters.page,
    filters.q,
    filters.published,
    fetchProjects,
    hasPermission,
  ]);

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (!hasPermission('projects.delete'))
      return alert('אין לך הרשאה למחוק פרויקטים');
    if (!window.confirm('האם אתה בטוח שברצונך למחוק פרויקט זה לצמיתות?'))
      return;

    try {
      await api.delete(`/api/projects/${projectId}`);
      alert('הפרויקט נמחק בהצלחה');
      fetchProjects();
    } catch (err) {
      alert(err.friendlyMessage || 'מחיקת הפרויקט נכשלה');
    }
  };

  const togglePublish = async (project) => {
    const projectId = project._id || project.id;
    if (!projectId) return;

    try {
      await api.put(`/api/admin/projects/${projectId}/publish`, {
        isPublished: !project.isPublished,
      });

      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId || p.id === projectId
            ? { ...p, isPublished: !p.isPublished }
            : p
        )
      );
    } catch (err) {
      alert(
        err.friendlyMessage || err.response?.data?.message || 'העדכון נכשל'
      );
    }
  };

  const handleEditClick = (e, project) => {
    e.stopPropagation();
    // אנחנו רק מגדירים את הפרויקט הפעיל. ה-Popup כבר יזהה שאת אדמין ויציע כפתור עריכה
    setActiveProject(project);
    setIsEditing(false); // סוגרים את המודאל הישן אם הוא פתוח
  };

  const handleSaveEdit = async () => {
    if (!hasPermission('projects.update'))
      return alert('אין לך הרשאה לערוך פרויקטים');

    try {
      const id = activeProject._id || activeProject.id;
      await api.put(`/api/projects/${id}`, editData);
      alert('הפרויקט עודכן בהצלחה');
      setIsEditing(false);
      setActiveProject(null);
      fetchProjects();
    } catch (err) {
      alert(err.friendlyMessage || 'עדכון הפרויקט נכשל.');
    }
  };

  if (permissionLoading) return <div className="loader">בודק הרשאות...</div>;

  if (!hasPermission('admin.panel.access')) {
    return <div className="container">אין לך הרשאה לגשת לפאנל הניהול.</div>;
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1> 🛠️ניהול פרויקטים</h1>
        <p>צפייה, אישור, עריכה או הסרה של תכנים מהפלטפורמה</p>
      </header>

      <div className="admin-toolbar">
        <input
          placeholder="חפש לפי כותרת או תיאור..."
          value={filters.q}
          onChange={(e) =>
            setFilters({ ...filters, q: e.target.value, page: 1 })
          }
          className="admin-input"
        />
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

      {loading ? (
        <div>טוען נתונים...</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>שם הפרויקט</th>
                <th>קטגוריה</th>
                <th>יוצר</th>
                <th>סטטוס</th>
                <th>ניהול</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(
                (
                  p // המשתנה כאן הוא 'p'
                ) => (
                  <tr
                    key={p._id || p.id}
                    onClick={() => setActiveProject(p)}
                    className="clickable-row"
                  >
                    <td>{p.title}</td>
                    <td>{p.category}</td>
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
                        {hasPermission('projects.update') && (
                          <button
                            onClick={(e) => handleEditClick(e, p)}
                            className="btn-icon"
                          >
                            <Edit3 size={18} color="#0984e3" />
                          </button>
                        )}

                        {hasPermission('projects.publish') && (
                          <button
                            /* תיקון: שימוש ב-p.isPublished במקום project.isPublished */
                            className={`btn-publish ${p.isPublished ? 'unpublish' : 'publish'}`}
                            onClick={(e) => {
                              // מניעת פתיחת הפופאפ של השורה
                              e.stopPropagation();
                              // תיקון: קריאה לשם הפונקציה הנכון togglePublish ושימוש ב-p
                              togglePublish(p);
                            }}
                          >
                            {p.isPublished ? 'הסר פרסום' : 'אשר פרסום'}
                          </button>
                        )}

                        {hasPermission('projects.delete') && (
                          <button
                            onClick={(e) =>
                              handleDeleteProject(e, p._id || p.id)
                            }
                            className="btn-icon"
                          >
                            <Trash2 size={18} color="#e17055" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeProject && (
        <Popup
          project={activeProject}
          onClose={() => setActiveProject(null)}
          onUpdate={() => {
            fetchProjects(); // מרענן את הטבלה אחרי עריכה בתוך הפופאפ
            setActiveProject(null); // סוגר את הפופאפ לאחר עדכון (אופציונלי)
          }}
        />
      )}
    </div>
  );
};

export default ManageProjects;
