import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Popup from '../Components/Popup';
import './PublicPages.css';
import projectDefault from '../DefaultPics/projectDefault.png';

const ProjectLibrary = () => {
  const [projects, setProjects] = useState([]);
  const [displayList, setDisplayList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [usernames, setUsernames] = useState({}); // אובייקט שיחזיק { userId: username }

  const fetchUsernames = useCallback(
    async (userIds) => {
      const uniqueIds = [...new Set(userIds)];
      const newNames = { ...usernames };
      let changed = false;

      for (const id of uniqueIds) {
        if (!newNames[id] && id) {
          try {
            const res = await axios.get(
              `http://localhost:5000/api/users/${id}`
            );
            newNames[id] = res.data.username;
            changed = true;
          } catch (err) {
            newNames[id] = 'מעצב במערכת';
            changed = true;
          }
        }
      }
      if (changed) setUsernames(newNames);
    },
    [usernames]
  );

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = 'http://localhost:5000/api/projects?published=true';

      const response = await axios.get(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = response.data.projects || [];
      const onlyPublished = data.filter((p) => p.isPublished === true);

      setProjects(onlyPublished);
      setDisplayList(onlyPublished);

      // --- כאן השליפה של השמות - בתוך הבלוק שבו data קיים ---
      const ids = onlyPublished
        .map((p) => p.createdBy)
        .filter((id) => typeof id === 'string');

      if (ids.length > 0) {
        fetchUsernames(ids);
      }
      // ----------------------------------------------------
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchUsernames]); // הוספנו את התלות ב-fetchUsernames
  // בתוך הקומפוננטה ProjectLibrary

  // 2. קריאה ראשונית בטעינת הדף
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // 3. עכשיו refreshData יכולה למצוא את הפונקציה
  const refreshData = async () => {
    await fetchProjects();
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = projectDefault;
  };

  const handleProjectUpdate = (updatedProject) => {
    // אם הפונקציה נקראת עם פרויקט מעודכן (למשל מעריכה)
    if (updatedProject && updatedProject._id) {
      const updateInList = (list) =>
        list.map((p) => (p._id === updatedProject._id ? updatedProject : p));
      setProjects((prev) => updateInList(prev));
      setDisplayList((prev) => updateInList(prev));
      setActiveProject(updatedProject);
    } else {
      // אם הפונקציה נקראת ללא פרמטרים (למשל אחרי הוספת תגובה), נרפרש את הכל
      refreshData();
    }
  };

  useEffect(() => {
    let result = [...projects];
    if (searchTerm.trim()) {
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.createdBy?.username
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }
    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'rating')
      result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    if (sortBy === 'newest')
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setDisplayList(result);
  }, [searchTerm, sortBy, projects]);

  const getImageUrl = (project) => {
    if (project.mainImageUrl) return project.mainImageUrl;
    if (project.media?.[0]?.url) return project.media[0].url;
    return projectDefault;
  };

  if (loading) return <div className="loader">טוען את ספריית הפרויקטים...</div>;

  return (
    <div className="catalog-container">
      <header className="catalog-header">
        <h1 className="catalog-title">ספריית פרויקטים</h1>
        <div className="catalog-toolbar">
          <div className="search-wrapper">
            <input
              type="text"
              className="catalog-search-input"
              placeholder="חפש פרויקט או מעצב..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="catalog-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">מהחדש לישן</option>
            <option value="rating">דירוג מעצבים</option>
            <option value="price-asc">מחיר (נמוך לגבוה)</option>
          </select>
        </div>
      </header>

      {displayList.length > 0 ? (
        <main className="projects-grid">
          {displayList.map((project) => (
            <article
              key={project._id}
              className="project-card"
              onClick={() => setActiveProject(project)}
            >
              <div className="card-img-box">
                <img
                  src={getImageUrl(project)}
                  className="card-img"
                  alt={project.title}
                  onError={handleImageError}
                />
                <div className="price-badge">₪{project.price}</div>
              </div>
              <div className="card-info">
                <h3>{project.title}</h3>
                <div className="card-creator">
                  <span>👤</span>
                  <span>{project.createdBy?.username || 'מעצב במערכת'}</span>
                </div>
                <div className="card-footer">
                  <div className="card-rating">
                    <span>★</span>
                    <span>{Number(project.averageRating || 0).toFixed(1)}</span>
                  </div>
                  <span className="view-btn">צפה בפרטים ←</span>
                </div>
              </div>
            </article>
          ))}
        </main>
      ) : (
        <div className="no-results-container">
          <p className="no-results-text">
            לא נמצאו פרויקטים התואמים לחיפוש שלך.
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="reset-search-btn"
          >
            נקה חיפוש
          </button>
        </div>
      )}

      {activeProject && (
        <Popup
          project={activeProject}
          onClose={() => setActiveProject(null)}
          onUpdate={handleProjectUpdate} // משתמש ב-handleProjectUpdate שקורא ל-refreshData
        />
      )}
    </div>
  );
};

export default ProjectLibrary;
