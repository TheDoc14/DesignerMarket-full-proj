import React, { useState } from 'react';
import axios from 'axios';
// ייבוא התמונה הדיפולטית כדי שנוכל להשתמש בה (אופציונלי לתצוגה)
import defaultProjectPic from '../DefaultPics/projectDefault.png'; 

const AddProject = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'product',
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('token');
    const data = new FormData();

    // הוספת שדות הטקסט
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category', formData.category);

    // בדיקה: האם המשתמש העלה קבצים?
    if (files && files.length > 0) {
      // אם העלה - מוסיפים אותם כרגיל
      for (let i = 0; i < files.length; i++) {
        data.append('files', files[i]);
      }
      data.append('mainImageIndex', 0); // התמונה הראשונה שהעלה תהיה הראשית
    } else {
      /**
       * כאן הפתרון:
       * מכיוון שלא ניתן לשלוח קובץ מקומי מהתיקייה ב-FormData, 
       * אנחנו שולחים שדה מיוחד שמודיע לשרת להשתמש בתמונה הדיפולטית.
       */
      data.append('useDefaultImage', 'true');
    }

    try {
      const response = await axios.post('http://localhost:5000/api/projects', data, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('הפרויקט הועלה בהצלחה!');
      console.log(response.data);
    } catch (err) {
      console.error("Detailed Error:", err.response?.data);
      alert('שגיאה: ' + (err.response?.data?.message || 'שגיאת שרת'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg" style={{ direction: 'rtl' }}>
      <h2 className="text-2xl font-bold mb-6">העלאת פרויקט חדש</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="title" placeholder="שם הפרויקט" onChange={handleChange} className="w-full p-2 border rounded" required />
        <textarea name="description" placeholder="תיאור הפרויקט" onChange={handleChange} className="w-full p-2 border rounded" rows="4" required />
        
        <div className="flex gap-4">
          <input name="price" type="number" placeholder="מחיר" onChange={handleChange} className="w-1/2 p-2 border rounded" required />
          <select name="category" onChange={handleChange} className="w-1/2 p-2 border rounded">
            <option value="product">Product</option>
            <option value="graphic">Graphic</option>
            <option value="architecture">Architecture</option>
            <option value="fashion">Fashion</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">העלאת קבצים (עד 10):</label>
          <input type="file" multiple onChange={handleFileChange} className="w-full" />
          {files.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              * לא נבחרו קבצים. תפורסם תמונת ברירת מחדל.
            </p>
          )}
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          {loading ? 'מעלה...' : 'פרסם פרויקט'}
        </button>
      </form>
    </div>
  );
};

export default AddProject;