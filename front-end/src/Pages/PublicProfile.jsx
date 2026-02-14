import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { usePermission } from '../Hooks/usePermission.jsx'; // החלת ההרשאות החדשה
import { MapPin, Calendar, ExternalLink, Package } from 'lucide-react';
import './PublicPages.css';

const PublicProfile = () => {
  const { userId } = useParams();
  // 1. הגנת הרשאות: בודקים אם למשתמש המחובר יש הרשאת קריאת פרופילים
  const { hasPermission, loading: permissionLoading } = usePermission();

  const [profile, setProfile] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // שליחת פרמטר page לשרת
      const res = await axios.get(
        `http://localhost:5000/api/profile/${userId}?page=${currentPage}&limit=6`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      setProfile(res.data.user);
      setUserProjects(res.data.projects || []);
      // שמירת נתוני הפגינציה מהשרת
      setMeta(res.data.meta || { page: 1, totalPages: 1 });
    } catch (err) {
      setError('שגיאה בטעינת הפרופיל');
    } finally {
      setLoading(false);
    }
  }, [userId, currentPage]);

  useEffect(() => {
    if (!permissionLoading) {
      fetchUserData();
    }
  }, [userId, permissionLoading, fetchUserData]);

  if (permissionLoading || loading)
    return <div className="loader">טוען פרופיל...</div>;
  if (error || !profile)
    return <div className="error-message">{error || 'משתמש לא נמצא.'}</div>;

  return (
    <div className="public-profile-container" dir="rtl">
      {/* 2. כותרת פרופיל (Hero Section) עשירה במידע */}
      <header className="profile-hero card-shadow">
        <div className="hero-content">
          <div className="avatar-wrapper">
            <img
              src={profile.profileImage || '/default-avatar.png'}
              alt={profile.username}
              className="public-profile-avatar"
            />
            {/* תג סטטוס בהתאם לתפקיד */}
            <span className={`role-tag ${profile.role}`}>{profile.role}</span>
          </div>

          <div className="profile-text-info">
            <h1>{profile.username}</h1>
            <p className="full-name">
              {profile.firstName} {profile.lastName}
            </p>

            <div className="profile-meta-grid">
              {(profile.city || profile.country) && (
                <span className="meta-item">
                  <MapPin size={16} /> {profile.city}
                  {profile.country ? `, ${profile.country}` : ''}
                </span>
              )}
              {profile.createdAt && (
                <span className="meta-item">
                  <Calendar size={16} /> הצטרף ב:{' '}
                  {new Date(profile.createdAt).toLocaleDateString('he-IL')}
                </span>
              )}
              <span className="meta-item">
                <Package size={16} /> {userProjects.length} פרויקטים שפורסמו
              </span>
            </div>

            <p className="public-bio">
              {profile.bio || 'המעצב טרם הוסיף ביוגרפיה.'}
            </p>

            <div className="public-social-links">
              {profile.social &&
                Object.entries(profile.social).map(
                  ([platform, url]) =>
                    url && (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="social-btn"
                      >
                        <ExternalLink size={14} /> {platform}
                      </a>
                    )
                )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. גריד הפרויקטים של המשתמש */}
      {/* 3. גריד הפרויקטים של המשתמש */}
      <section className="profile-portfolio">
        <h2 className="section-title">תיק עבודות</h2>
        {userProjects.length > 0 ? (
          <>
            {' '}
            {/* 👈 הוספת Fragment כדי לעטוף שני אלמנטים */}
            <div className="projects-grid">
              {userProjects.map((project) => (
                <article
                  key={project.id || project._id}
                  className="project-card"
                >
                  <div className="card-img-box">
                    <img
                      src={project.mainImageUrl || '/project-default.png'}
                      alt={project.title}
                    />
                    <div className="price-tag">₪{project.price}</div>
                  </div>
                  <div className="card-body">
                    <h3>{project.title}</h3>
                    <div className="card-actions">
                      <Link
                        to={`/project/${project.id || project._id}`}
                        className="view-details-btn"
                      >
                        צפה בפרטים
                      </Link>
                      {hasPermission('projects.update') && (
                        <Link
                          to={`/edit-project/${project.id || project._id}`}
                          className="quick-edit-link"
                        >
                          ערוך פרויקט
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {/* רכיב הניווט כחלק מאותו ענף בתנאי */}
            {meta.totalPages > 1 && (
              <div className="pagination-container">
                <button
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((prev) => prev - 1);
                    window.scrollTo(0, 400);
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
                    window.scrollTo(0, 400);
                  }}
                  className="pagination-btn"
                >
                  הבא ←
                </button>
              </div>
            )}
          </> // 👈 סגירת ה-Fragment
        ) : (
          <div className="empty-portfolio">
            אין פרויקטים ציבוריים להצגה בשלב זה.
          </div>
        )}
      </section>
    </div>
  );
};

export default PublicProfile;
