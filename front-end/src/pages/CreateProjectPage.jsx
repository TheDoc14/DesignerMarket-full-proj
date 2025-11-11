import React, { useState } from "react";
import axios from "axios";
import StyledForm from "../components/styled/StyledForm";
import StyledInput from "../components/styled/StyledInput";
import StyledButton from "../components/styled/StyledButton";
import StyledError from "../components/styled/StyledError";
import StyledSuccess from "../components/styled/StyledSuccess";

function CreateProject() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("other");
  const [files, setFiles] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(null);

  const apiBase = process.env.REACT_APP_API_BASE;

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length > 10) {
      alert("מקסימום 10 קבצים");
      return;
    }

    // יצירת Preview תמונות + שמירת כל הקבצים
    const withPreview = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setFiles(withPreview);
    setMainImageIndex(null); // reset בחירה ראשית
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!files.length) {
      alert("חובה לבחור קבצים לפרויקט");
      return;
    }

    if (mainImageIndex === null) {
      alert("חובה לבחור תמונה ראשית");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("category", category);
    formData.append("mainImageIndex", mainImageIndex);

    files.forEach((obj) => {
      formData.append("files", obj.file);
    });

    try {
      const token = localStorage.getItem("token");

      await axios.post(`${apiBase}/api/projects`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      alert("הפרויקט נוצר בהצלחה!");
    } catch (error) {
      console.error(error);
      alert("שגיאה ביצירה");
    }
  };


  return (
    <div style={{ width: "60%", margin: "auto", marginTop: "30px" }}>
      <h2>יצירת פרויקט חדש</h2>

      <StyledForm onSubmit={handleSubmit}>
        <label className = "text-primary">כותרת פרויקט:</label>
        <StyledInput.Input className = "text-primary"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="שם הפרויקט"
        />

        <label className = "text-primary">תיאור:</label>
        <StyledInput.Input className = "text-primary"
          type="text"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className = "text-primary">מחיר:</label>
        <StyledInput.Input className = "text-primary"
          type="number"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <label className = "text-primary">קטגוריה:</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="product">Product</option>
          <option value="graphic">Graphic</option>
          <option value="architecture">Architecture</option>
          <option value="fashion">Fashion</option>
          <option value="other">Other</option>
        </select>

        <label className = "text-primary">בחר קבצים לפרויקט (עד 10):</label>
        <input type="file" multiple onChange={handleFileChange} />

        {files.length > 0 && (
          <>
            <h4>בחר תמונה ראשית</h4>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {files.map((obj, index) => (
                <div key={index} style={{ textAlign: "center" }}>
                  <img
                    src={obj.preview}
                    alt="preview"
                    style={{
                      width: "120px",
                      height: "120px",
                      border: mainImageIndex === index ? "3px solid blue" : "1px solid #ccc",
                      objectFit: "cover",
                      borderRadius: "5px",
                      cursor: "pointer"
                    }}
                    onClick={() => setMainImageIndex(index)}
                  />
                  <input
                    type="radio"
                    name="mainImage"
                    checked={mainImageIndex === index}
                    onChange={() => setMainImageIndex(index)}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <button type="submit" className="primary" style={{ marginTop: "20px" }}>
          שמירת פרויקט
        </button>
      </StyledForm>
    </div>
  );
}

export default CreateProject;
