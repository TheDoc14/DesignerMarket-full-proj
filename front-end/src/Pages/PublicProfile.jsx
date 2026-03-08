import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { usePermission } from '../Hooks/usePermission.jsx';
import defaultUserPic from '../DefaultPics/userDefault.jpg';

import Popup from '../Components/Popup';
import {
  MapPin,
  Calendar,
  Package,
  ChevronLeft,
  ExternalLink,
  Star,
} from 'lucide-react';
import './PublicPages.css';

/*
 *The PublicProfile component is a public-facing landing page designed to showcase a specific creator's professional identity and portfolio.
 *It serves as a digital business card for designers and students on the Designer Market platform, allowing visitors to view a creator's biography,
 *social links, location, and all published projects in a unified, professional layout.
 */

const PublicProfile = () => {
  const { userId } = useParams();
  const { loading: permissionLoading, user: currentUser } = usePermission();

  const [profile, setProfile] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const isLoggedIn = !!currentUser;
  //An asynchronous function that retrieves data from the /api/profile/${userId} endpoint.
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/profile/${userId}`);
      setProfile(res.data?.user || res.data?.data?.user);
      setUserProjects(res.data?.projects || res.data?.data?.projects || []);
    } catch (err) {
      setError('לא ניתן היה לטעון את הפרופיל.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!permissionLoading) fetchUserData();
  }, [userId, permissionLoading, fetchUserData]);
  //Triggers the detailed project view.
  const openProjectModal = (project) => {
    setSelectedProject(project);
    document.body.style.overflow = 'hidden';
  };
  //Reverts the scroll behavior and clears the selectedProject state.
  const closeModal = () => {
    setSelectedProject(null);
    document.body.style.overflow = 'auto';
  };

  if (permissionLoading || loading)
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="profile-page-wrapper" dir="rtl">
      <div className="profile-top-banner"></div>

      <div className="profile-main-content">
        {error && <div className="error-publicProfile">{error}</div>}
        <header className="profile-header-card">
          <div className="header-flex-container">
            <div className="profile-avatar-area">
              <img
                src={profile?.profileImage || defaultUserPic}
                alt={profile?.username}
                className="profile-img-main"
              />
              <span className={`role-badge-floating ${profile?.role}`}>
                {profile?.role}
              </span>
            </div>

            <div className="profile-details-area">
              <h1 className="profile-title-name">{profile?.username}</h1>
              <div className="profile-sub-stats">
                <span>
                  <MapPin size={14} /> {profile?.city || 'ישראל'}
                </span>
                <span>
                  <Package size={14} /> {userProjects.length} פרויקטים
                </span>
                <span>
                  <Calendar size={14} /> הצטרף ב-
                  {new Date(profile?.createdAt).getFullYear()}
                </span>
              </div>
              <p className="profile-bio-summary">
                {profile?.bio || 'המעצב טרם הוסיף תיאור אישי.'}
              </p>
              <div className="public-social-links">
                {profile?.social &&
                  Object.entries(profile.social).map(([platform, url]) =>
                    url ? (
                      <a
                        key={`${platform}-${url}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="social-btn-premium"
                        title={platform}
                      >
                        <ExternalLink size={14} />
                        <span>{platform}</span>
                      </a>
                    ) : null
                  )}
              </div>
            </div>
          </div>
        </header>

        <section className="portfolio-grid-section">
          <h2 className="portfolio-grid-title">תיק עבודות</h2>
          <div className="projects-display-grid">
            {userProjects.map((project, idx) => (
              <div
                key={project._id || project.id || idx}
                className="minimal-project-card"
              >
                <div
                  className="card-visual-part"
                  onClick={() => openProjectModal(project)}
                >
                  <img src={project.mainImageUrl} alt={project.title} />
                  <div className="card-price-tag-fixed">₪{project.price}</div>
                </div>

                <div className="card-info-part">
                  <h3>{project.title}</h3>
                  <div className="card-meta-row">
                    <div className="rating-pill">
                      <Star size={12} fill="#ffc107" color="#ffc107" />
                      <span>{project.averageRating || '0.0'}</span>
                    </div>
                    <button
                      onClick={() => openProjectModal(project)}
                      className="details-text-link"
                    >
                      צפה בפרטים <ChevronLeft size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {selectedProject && (
        <Popup
          project={selectedProject}
          onClose={closeModal}
          isLoggedIn={isLoggedIn}
          onUpdate={(updatedProject) => {
            setUserProjects((prev) =>
              prev.map((p) =>
                (p._id || p.id) === (updatedProject._id || updatedProject.id)
                  ? updatedProject
                  : p
              )
            );
          }}
        />
      )}
    </div>
  );
};

export default PublicProfile;
