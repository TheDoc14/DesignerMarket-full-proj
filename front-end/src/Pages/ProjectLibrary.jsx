import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/axios';
import Popup from '../Components/Popup';
import './PublicPages.css';
import projectDefault from '../DefaultPics/projectDefault.png';
import { usePermission } from '../Hooks/usePermission.jsx';

/*
 *The ProjectLibrary component serves as the central marketplace hub of the application.
 *It provides a public-facing gallery where users can browse, search, and filter through published industrial design projects.
 *The page is designed for high performance, utilizing server-side pagination and an interactive grid layout to showcase designer work.
 */
const ProjectLibrary = () => {
  const { user } = usePermission();
  const [projects, setProjects] = useState([]);
  const [displayList, setDisplayList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  //An asynchronous function that queries the /api/projects endpoint
  const loadLibraryData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.get('/api/projects', {
        params: {
          published: true,

          page: currentPage,

          limit: 8,

          search: searchTerm || '',
        },
      });

      const allProjects = res.data.projects || res.data.data || [];

      setMeta(res.data.meta || { page: 1, totalPages: 1 });

      setProjects(allProjects);

      setDisplayList(allProjects);
    } catch (err) {
      console.error('טעינת הנתונים נכשלה:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    loadLibraryData();
  }, []);

  useEffect(() => {
    let result = [...projects];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();

      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(term) ||
          p.creatorName?.toLowerCase().includes(term)
      );
    }

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);

    if (sortBy === 'rating')
      result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));

    if (sortBy === 'newest')
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setDisplayList(result);
  }, [searchTerm, sortBy, projects]);
  //A safety function that replaces broken image links with a local default asset to maintain a clean UI.
  const handleImageError = (e) => {
    e.target.onerror = null;

    e.target.src = projectDefault;
  };

  const getImageUrl = (project) => {
    if (!project) return projectDefault;

    if (project.mainImageUrl) return project.mainImageUrl;

    if (project.media?.[0]?.url) return project.media[0].url;

    return projectDefault;
  };
  //A callback passed to the Popup.
  //If a project is modified (e.g., an Admin edits it from the public view), the entire library reloads to ensure the displayed data is fresh.
  const handleProjectUpdate = (updatedProject) => {
    loadLibraryData();

    setActiveProject(null);
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
          {displayList.map((project, index) => (
            <article
              key={project._id || index}
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
                <div className="card-creator-info">
                  <button
                    onClick={() =>
                      navigate(
                        `/profile/${project.createdBy?._id || project.createdBy}`
                      )
                    }
                    className="view-public-profile-btn"
                  >
                    לפרופיל היוצר ←
                  </button>
                </div>
                <div className="card-footer">
                  <div className="card-rating">
                    <span>
                      ★ {Number(project.averageRating || 0).toFixed(1)}
                    </span>
                  </div>

                  <span className="view-btn">צפה בפרטים ←</span>
                </div>
              </div>

              {/* Pagination*/}

              {meta.totalPages > 1 && (
                <div className="pagination-container">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((prev) => prev - 1);

                      window.scrollTo(0, 0);
                    }}
                    className="pagination-btn"
                  >
                    → הקודם
                  </button>

                  <span className="page-indicator">
                    דף {meta.page} מתוך {meta.totalPages}
                  </span>

                  <button
                    disabled={currentPage === meta.totalPages}
                    onClick={() => {
                      setCurrentPage((prev) => prev + 1);

                      window.scrollTo(0, 0);
                    }}
                    className="pagination-btn"
                  >
                    הבא ←
                  </button>
                </div>
              )}
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
          onUpdate={handleProjectUpdate}
          isLoggedIn={!!user}
        />
      )}
    </div>
  );
};

export default ProjectLibrary;
