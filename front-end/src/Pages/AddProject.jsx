import React, { useState } from 'react';
import axios from 'axios';

const AddProject = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'architecture', // התאמה לקטגוריה שבתמונה
        paypalEmail: '',
        tags: ''
    });
    const [files, setFiles] = useState([]);
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        // המרת FileList למערך והגבלה ל-10 קבצים לפי המודל
        const selectedFiles = Array.from(e.target.files).slice(0, 10);
        setFiles(selectedFiles);

        // יצירת תצוגה מקדימה לבחירת Thumbnail
        const newPreviews = selectedFiles.map(file => 
            file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        );
        setPreviews(newPreviews);
        setMainImageIndex(0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Authentication token missing. Please log in again.");

            const data = new FormData();

            // הוספת שדות הטקסט - וודאי ששמות השדות תואמים ל-Validators בבקאנד
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('price', formData.price);
            data.append('category', formData.category);
            data.append('paypalEmail', formData.paypalEmail); // שדה חובה בשרת
            data.append('mainImageIndex', mainImageIndex); // שדה חובה בשרת
            data.append('isPublished', 'false'); // פרויקט חדש תמיד לא מפורסם

            if (formData.tags) data.append('tags', formData.tags);

            // הוספת כל הקבצים שנבחרו
            if (files.length === 0) throw new Error("חובה להעלות לפחות קובץ אחד");
            
            files.forEach((file) => {
                data.append('files', file); // השם 'files' חייב להתאים ל-multer ב-Route
            });

            await axios.post('http://localhost:5000/api/projects', data, {
                headers: { 
                    'Authorization': `Bearer ${token}`, // פותר שגיאת 401
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('הפרויקט הועלה בהצלחה וממתין לאישור!');
        } catch (err) {
            console.error("Upload Error:", err.response?.data || err.message);
            alert(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <form onSubmit={handleSubmit} style={formStyle}>
                <input name="title" placeholder="שם הפרויקט" onChange={handleChange} style={inputStyle} required />
                <textarea name="description" placeholder="תיאור הפרויקט" onChange={handleChange} style={{...inputStyle, height: '100px'}} required />
                
                <div style={paypalBoxStyle}>
                    <label>אימייל למשיכת כספים (PayPal):</label>
                    <input 
                        name="paypalEmail" 
                        type="email" 
                        placeholder="your-paypal@example.com" 
                        onChange={handleChange} 
                        style={inputStyle} 
                        required 
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <input name="price" type="number" placeholder="מחיר" onChange={handleChange} style={inputStyle} required />
                    <select name="category" onChange={handleChange} style={inputStyle} value={formData.category}>
                        <option value="architecture">ארכיטקטורה</option>
                        <option value="graphic">גרפיקה</option>
                        <option value="product">מוצר</option>
                    </select>
                </div>

                <div style={uploadBoxStyle}>
                    <label>בחר עד 10 קבצים (תמונות, PDF, ZIP):</label>
                    <input 
                        type="file" 
                        multiple // מאפשר בחירת מספר קבצים
                        onChange={handleFileChange} 
                        style={{ marginTop: '10px' }} 
                    />
                </div>

                {previews.length > 0 && (
                    <div style={previewContainerStyle}>
                        <p style={{fontSize: '14px', marginBottom: '10px'}}>לחץ על התמונה שתשמש כתצוגה מקדימה (Thumbnail):</p>
                        <div style={gridStyle}>
                            {previews.map((src, index) => (
                                <div key={index} onClick={() => setMainImageIndex(index)} style={previewCardStyle(mainImageIndex === index)}>
                                    {src ? <img src={src} alt="preview" style={imgStyle} /> : <div style={{lineHeight: '80px'}}>📄</div>}
                                    <div style={radioStyle(mainImageIndex === index)}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button type="submit" disabled={loading} style={submitBtnStyle}>
                    {loading ? 'שולח...' : 'פרסם פרויקט לאישור'}
                </button>
            </form>
        </div>
    );
};

// Styles (Simplified)
const containerStyle = { direction: 'rtl', padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', width: '100%' };
const paypalBoxStyle = { padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px', border: '1px solid #b3d7ff' };
const uploadBoxStyle = { padding: '20px', border: '2px dashed #007bff', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8f9fa' };
const previewContainerStyle = { padding: '15px', border: '1px solid #eee', borderRadius: '8px' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' };
const previewCardStyle = (active) => ({ border: active ? '3px solid #28a745' : '1px solid #ddd', borderRadius: '8px', padding: '5px', cursor: 'pointer', position: 'relative' });
const imgStyle = { width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px' };
const radioStyle = (active) => ({ position: 'absolute', top: '5px', right: '5px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: active ? '#28a745' : '#ccc' });
const submitBtnStyle = { padding: '15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

export default AddProject;