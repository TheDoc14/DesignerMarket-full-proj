import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Popup from '../Components/Popup';

const ProjectLibrary = () => {
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
      const response = await axios.get('http://localhost:5000/api/projects?published=true', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      const data = response.data.projects || [];
      setProjects(data);
      setDisplayList(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
  fetchProjects();
}, []);
  // מנגנון חיפוש ומיון
  useEffect(() => {
    let result = [...projects];
    
    if (searchTerm.trim()) {
      result = result.filter(p => p.title?.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'rating') result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
    return 'front-end\src\DefaultPics\projectDefault.png';
};
  if (loading) return <div style={styles.loader}>טוען פרויקטים...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>ספריית פרויקטים</h1>
        <div style={styles.toolbar}>
          <input 
            type="text" 
            placeholder="חפש פרויקט..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.select}>
            <option value="newest">חדש ביותר</option>
            <option value="rating">דירוג גבוה</option>
            <option value="price-asc">מחיר מהנמוך לגבוה</option>
          </select>
        </div>
      </div>

      <div style={styles.grid}>
        {displayList.map((project) => (
          <div key={project._id} style={styles.card} onClick={() => setActiveProject(project)}>
            <div style={styles.imgBox}>
              <img src={getImageUrl(project)} style={styles.img} alt={project.title} />
              <div style={styles.priceTag}>₪{project.price}</div>
            </div>
            <div style={styles.info}>
              <h3 style={styles.pTitle}>{project.title}</h3>
              {/* שליפה חכמה של שם המעלה */}
              <p style={styles.creator}>
                👤 {project.createdBy?.username || project.createdBy?.name || "מעצב במערכת"}
              </p>
              <div style={styles.rating}>
                <span style={{color: '#f1c40f'}}>★</span>
                <span>{Number(project.averageRating || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {activeProject && <Popup project={activeProject} onClose={() => setActiveProject(null)} />}
    </div>
  );
};

const styles = {
  container: { direction: 'rtl', padding: '40px 20px', backgroundColor: '#f4f7f6', minHeight: '100vh' },
  header: { maxWidth: '1200px', margin: '0 auto 30px', textAlign: 'center' },
  title: { fontSize: '28px', color: '#2c3e50', marginBottom: '20px' },
  toolbar: { display: 'flex', justifyContent: 'center', gap: '15px' },
  searchInput: { padding: '12px 20px', borderRadius: '25px', border: '1px solid #ddd', width: '300px', outline: 'none' },
  select: { padding: '12px 20px', borderRadius: '25px', border: '1px solid #ddd', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px', maxWidth: '1200px', margin: '0 auto' },
  card: { backgroundColor: '#fff', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', transition: '0.3s' },
  imgBox: { height: '200px', position: 'relative' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  priceTag: { position: 'absolute', top: '10px', left: '10px', background: '#27ae60', color: '#fff', padding: '5px 12px', borderRadius: '10px', fontWeight: 'bold' },
  info: { padding: '15px' },
  pTitle: { margin: '0 0 10px 0', fontSize: '18px' },
  creator: { fontSize: '13px', color: '#7f8c8d', marginBottom: '10px' },
  rating: { display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' },
  loader: { textAlign: 'center', marginTop: '100px', fontSize: '20px' }
};

export default ProjectLibrary;