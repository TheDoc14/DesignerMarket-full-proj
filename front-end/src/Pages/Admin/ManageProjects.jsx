import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { usePermission } from '../../Hooks/usePermission.jsx';
import Popup from '../../Components/Popup';
import { Trash2, Edit3, CheckCircle, Clock } from 'lucide-react';
import '../../App.css';

/*
 *The ManageProjects page is a robust administrative console used to oversee every project uploaded to the platform.
 *It provides a tabular overview of the marketplace's content, allowing administrators to filter, review, approve, edit, or remove projects.
 *This page serves as the primary "moderation" hub to ensure all public content meets the platform's standards.
 */
const ManageProjects = () => {
  const {
    hasPermission,
    user: currentUser,
    loading: permissionLoading,
  } = usePermission();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(null);
  const [setIsEditing] = useState(false);

  const [filters, setFilters] = useState({
    q: '',
    published: '',
    page: 1,
  });
  // An asynchronous function that queries the /api/admin/projects endpoint.
  // It supports server-side pagination and filtering based on the filters state (search string q and published status).
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
  //Validates the projects.delete permission and prompts a native confirmation before removing a project permanently from the database.
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

  //This function handles the "Approval" logic. It sends a PUT request to the specialized admin endpoint to flip the isPublished boolean.
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
    setActiveProject(project);
    setIsEditing(false);
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
              {projects.map((p) => (
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
                          className={`btn-publish ${p.isPublished ? 'unpublish' : 'publish'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePublish(p);
                          }}
                        >
                          {p.isPublished ? 'הסר פרסום' : 'אשר פרסום'}
                        </button>
                      )}

                      {hasPermission('projects.delete') && (
                        <button
                          onClick={(e) => handleDeleteProject(e, p._id || p.id)}
                          className="btn-icon"
                        >
                          <Trash2 size={18} color="#e17055" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeProject && (
        <Popup
          project={activeProject}
          onClose={() => setActiveProject(null)}
          onUpdate={() => {
            fetchProjects();
            setActiveProject(null);
          }}
        />
      )}
    </div>
  );
};

export default ManageProjects;
