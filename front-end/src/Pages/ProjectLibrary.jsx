import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Popup from '../Components/Popup';
import './PublicPages.css';
import { useAuth } from '../Context/AuthContext';

const ProjectLibrary = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [displayList, setDisplayList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // בתוך ProjectLibrary.js - עדכון ה-useEffect
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // הוספת הפרמטר ?published=true מבטיחה שהשרת יחזיר רק פרויקטים מאושרים

        const endpoint =
          user?.role === 'admin'
            ? 'http://localhost:5000/api/projects' // אדמין רואה הכל
            : 'http://localhost:5000/api/projects?published=true';
        const response = await axios.get(endpoint, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = response.data.projects || [];
        setProjects(data);
        setDisplayList(data);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // בתוך קומפוננטת ProjectLibrary
  const handleProjectUpdate = (updatedProject) => {
    // הגנה: אם updatedProject לא קיים או חסר לו ID, אין מה לעדכן
    if (!updatedProject || !updatedProject._id) {
      console.warn(
        'Update received without a valid project object',
        updatedProject
      );
      return;
    }

    setProjects((prevProjects) => {
      // הגנה: וודא ש-prevProjects הוא אכן מערך
      if (!Array.isArray(prevProjects)) return [];

      return prevProjects.map((p) => {
        // הגנה: אם אחד הפרויקטים ברשימה הפך ל-null/undefined בטעות, דלג עליו
        if (!p || !p._id) return p;

        // השוואה בטוחה
        return p._id === updatedProject._id ? updatedProject : p;
      });
    });

    // וגם את הרשימה המוצגת (המסוננת)
    setDisplayList((prevDisplay) =>
      prevDisplay.map((p) =>
        p._id === updatedProject._id ? updatedProject : p
      )
    );

    // חשוב: אם הפופאפ פתוח על הפרויקט הזה, נעדכן גם את ה-activeProject
    setActiveProject(updatedProject);
  };

  // ודאי שהעברת את הפונקציה ל-Popup ב-Return:
  {
    activeProject && (
      <Popup
        project={activeProject}
        onClose={() => setActiveProject(null)}
        onUpdate={handleProjectUpdate}
      />
    );
  }
  // מנגנון חיפוש ומיון
  useEffect(() => {
    let result = [...projects];

    if (searchTerm.trim()) {
      result = result.filter((p) =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase())
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
    // 1. הכתובת המלאה שהשרת בנה (הכי בטוח)
    if (project.mainImageUrl) return project.mainImageUrl;

    // 2. גיבוי: אם יש מערך מדיה, הכתובת המלאה נמצאת בתוך שדה url
    if (project.media && project.media.length > 0 && project.media[0].url) {
      return project.media[0].url;
    }

    // 3. ברירת מחדל אם אין תמונה
    return '../DefaultPics/projectDefault.png';
  };
  if (loading) return <div className="loader">טוען פרויקטים...</div>;

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

      <main className="projects-grid">
        {displayList.map((project) => (
          /* תיקון: המפתח הייחודי חייב להיות רק על האלמנט העליון ביותר בלופ */
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
              />
              {user?.role === 'admin' && (
                <div
                  className={`status-badge ${project.isPublished ? 'published' : 'pending'}`}
                >
                  {project.isPublished ? '✓ פורסם' : '⏳ ממתין'}
                </div>
              )}
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

      {activeProject && (
        <Popup
          project={activeProject}
          onClose={() => setActiveProject(null)}
          onUpdate={handleProjectUpdate}
        />
      )}
    </div>
  );
};

export default ProjectLibrary;
