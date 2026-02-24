import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { usePermission } from '../Hooks/usePermission.jsx';
import { PayPalButtons } from '@paypal/react-paypal-js';
import ReactDOM from 'react-dom';
import {
  MapPin,
  Calendar,
  Package,
  X,
  Star,
  ChevronLeft,
  ExternalLink,
} from 'lucide-react';
import './PublicPages.css';

const PublicProfile = () => {
  const { userId } = useParams();
  const { loading: permissionLoading } = usePermission();

  const [profile, setProfile] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

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

  const openProjectModal = (project) => {
    setSelectedProject(project);
    document.body.style.overflow = 'hidden';
  };

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
      {/* באנר עליון */}
      <div className="profile-top-banner"></div>

      <div className="profile-main-content">
        {error && (
          <div style={{ background: '#ffe5e5', padding: 12, borderRadius: 8 }}>
            {error}
          </div>
        )}
        <header className="profile-header-card">
          <div className="header-flex-container">
            <div className="profile-avatar-area">
              <img
                src={profile?.profileImage || '/default-avatar.png'}
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
                        key={`${platform}-${url}`} // ✅ key יציב וייחודי
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
                      <span>0.0</span>
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

      {/* שימוש ב-Portal להצגת המודאל מחוץ להיררכיה הרגילה */}
      {selectedProject &&
        ReactDOM.createPortal(
          <div className="project-modal-overlay" onClick={closeModal}>
            <div
              className="project-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={24} />
              </button>

              <div className="modal-body-grid">
                <div className="modal-image-side">
                  <img
                    src={selectedProject.mainImageUrl || '/project-default.png'}
                    alt={selectedProject.title}
                  />
                </div>

                <div className="modal-info-side">
                  <header className="modal-header-info">
                    {/* שליפת הקטגוריה באופן דינמי מהפרויקט הנבחר */}
                    <span className="modal-category-tag">
                      {selectedProject.category?.name ||
                        selectedProject.category ||
                        'כללי'}
                    </span>
                    <h2>{selectedProject.title}</h2>
                    <div className="modal-price-display">
                      ₪{selectedProject.price}
                    </div>
                  </header>

                  <div className="modal-description-area">
                    <p>
                      {selectedProject.description ||
                        'אין תיאור זמין לפרויקט זה.'}
                    </p>
                  </div>

                  <div className="modal-footer-actions">
                    <div className="payment-container">
                      <p className="payment-label">רכישה מאובטחת:</p>
                      <PayPalButtons
                        style={{
                          layout: 'vertical',
                          shape: 'rect',
                          height: 45,
                        }}
                        createOrder={(data, actions) => {
                          return actions.order.create({
                            purchase_units: [
                              {
                                amount: {
                                  value: selectedProject.price.toString(),
                                },
                                description: selectedProject.title,
                              },
                            ],
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div> // סגירת ה-div של ה-profile-page-wrapper
  ); // סגירת ה-return
}; // סגירת הקומפוננטה

export default PublicProfile;
