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
    <div className="public-profile-container">
      {/* כותרת הפרופיל */}
      <div>
        <img
          src={profile.profileImage || '/default-avatar.png'}
          alt={profile.username}
        />
        <h1>{profile.username}</h1>
        <p>{profile.bio || 'אין ביוגרפיה זמינה'}</p>
        <div>
          {profile.social &&
            Object.entries(profile.social).map(
              ([platform, url]) =>
                url && (
                  <a key={platform} href={url} target="_blank" rel="noreferrer">
                    {platform}
                  </a>
                )
            )}
        </div>
      </div>

      <hr />

      {/* רשימת הפרויקטים של המשתמש */}
      <h2>הפרויקטים של {profile.username}</h2>
      <div>
        {userProjects.map((project) => (
          <div key={project.id} className="project-card">
            <img src={project.mainImageUrl} alt={project.title} />
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

export default PublicProfile;
