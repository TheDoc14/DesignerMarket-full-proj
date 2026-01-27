import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const PublicProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 1. שליפת פרטי הפרופיל הציבורי
        // נשתמש בנתיב הפרופיל הקיים בשרת שלך
        const res = await axios.get(
          `http://localhost:5000/api/profile/${userId}`
        );

        // ה-Serializer שלך (pickUserProfilePublic) מחזיר את האובייקט הזה
        setProfile(res.data.user);
        setUserProjects(res.data.projects || []);
      } catch (err) {
        console.error('שגיאה בטעינת הפרופיל', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId]);

  if (loading) return <div>טוען פרופיל...</div>;
  if (!profile) return <div>משתמש לא נמצא.</div>;

  return (
    <div
      className="public-profile-container"
      style={{ direction: 'rtl', padding: '20px' }}
    >
      {/* כותרת הפרופיל */}
      <div style={headerStyle}>
        <img
          src={profile.profileImage || '/default-avatar.png'}
          alt={profile.username}
          style={avatarStyle}
        />
        <h1>{profile.username}</h1>
        <p>{profile.bio || 'אין ביוגרפיה זמינה'}</p>
        <div style={socialLinksStyle}>
          {profile.social &&
            Object.entries(profile.social).map(
              ([platform, url]) =>
                url && (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ margin: '0 5px' }}
                  >
                    {platform}
                  </a>
                )
            )}
        </div>
      </div>

      <hr />

      {/* רשימת הפרויקטים של המשתמש */}
      <h2>הפרויקטים של {profile.username}</h2>
      <div style={projectsGridStyle}>
        {userProjects.map((project) => (
          <div key={project.id} className="project-card" style={cardStyle}>
            <img
              src={project.mainImageUrl}
              alt={project.title}
              style={{ width: '100%', borderRadius: '8px' }}
            />
            <h3>{project.title}</h3>
            <p>{project.price} ₪</p>
            <Link to={`/project/${project.id}`} className="view-btn">
              צפה בפרויקט
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

// סטייל בסיסי (ניתן להעביר ל-CSS)
const headerStyle = { textAlign: 'center', marginBottom: '40px' };
const avatarStyle = {
  width: '150px',
  height: '150px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '3px solid #007bff',
};
const socialLinksStyle = { marginTop: '15px' };
const projectsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: '20px',
};
const cardStyle = {
  border: '1px solid #ddd',
  padding: '15px',
  borderRadius: '12px',
  textAlign: 'center',
};

export default PublicProfile;
