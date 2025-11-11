import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const apiBase = process.env.REACT_APP_API_BASE;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get(`${apiBase}/api/projects`);
        setProjects(res.data);
      } catch (err) {
        console.error("שגיאה בשליפת פרויקטים:", err);
      }
    };

    fetchProjects();
  }, [apiBase]);

  const handleProjectClick = (id) => {
    navigate(`/projects/${id}`); // מעבר לעמוד צפייה בפרויקט מסוים
  };

  return (
    <div style={{ width: "80%", margin: "auto", marginTop: "30px" }}>
      <h2>כל הפרויקטים</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {projects.map((project) => {
          const mainImage = project.files.find(
            (f) => f._id === project.mainImageId
          ); // מוצא את התמונה הראשית מהמערך

          return (
            <div
              key={project._id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "10px",
                cursor: "pointer",
              }}
              onClick={() => handleProjectClick(project._id)}
            >
              {mainImage && (
                <img
                  src={`${apiBase}/${mainImage.path}`}
                  alt={project.title}
                  style={{ width: "100%", height: "180px", objectFit: "cover" }}
                />
              )}

              <h3>{project.title}</h3>
              <p>מחיר: {project.price} ₪</p>
              <p>קטגוריה: {project.category}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProjectsList;
