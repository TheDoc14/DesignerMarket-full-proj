import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // נתונים קיימים מהשרת
    const [existingFiles, setExistingFiles] = useState([]);
    const [currentMainImageId, setCurrentMainImageId] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        price: '',
        tags: '',
        paypalEmail: ''
    });

    const [newFiles, setNewFiles] = useState([]);
    const [previews, setPreviews] = useState([]);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:5000/api/projects/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const p = res.data.project;
                setFormData({
                    title: p.title || '',
                    description: p.description || '',
                    category: p.category || '',
                    price: p.price || '',
                    tags: p.tags ? p.tags.join(', ') : '',
                    paypalEmail: p.paypalEmail || ''
                });

                // שמירת הקבצים הקיימים לצורך בחירת תמונה ראשית
                setExistingFiles(p.media || []); // media מכיל תמונות/וידאו לפי הסריאלייזר
                setCurrentMainImageId(p.mainImageId); // מזהה התמונה הנוכחית מהשרת
            } catch (err) {
                alert("שגיאה בטעינת נתוני הפרויקט");
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id, navigate]);

    const handleNewFilesChange = (e) => {
        const selected = Array.from(e.target.files);
        setNewFiles(selected);
        const newPreviews = selected.map(file => 
            file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        );
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();

            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('category', formData.category);
            data.append('price', formData.price);
            data.append('mainImageId', currentMainImageId); // שליחת ה-ID של התמונה שנבחרה כראשית

            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
            tagsArray.forEach(tag => data.append('tags[]', tag));

            if (newFiles.length > 0) {
                newFiles.forEach(file => data.append('files', file));
            }

            await axios.put(`http://localhost:5000/api/projects/${id}`, data, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert("הפרויקט עודכן בהצלחה!");
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.message || "שגיאה בעדכון");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>טוען נתונים...</div>;

    return (
        <div style={{ direction: 'rtl', padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>עריכת פרויקט: {formData.title}</h2>
            
            <form onSubmit={handleSubmit} style={formStyle}>
                <div style={fieldStyle}>
                    <label style={labelStyle}>כותרת</label>
                    <input style={inputStyle} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                </div>

                {/* --- ניהול תמונת תצוגה (Main Image) --- */}
                <div style={sectionBoxStyle}>
                    <label style={labelStyle}>בחר תמונת תצוגה מתוך הקבצים הקיימים:</label>
                    <div style={imageGridStyle}>
                        {existingFiles.map((file) => (
                            <div 
                                key={file.id} 
                                onClick={() => setCurrentMainImageId(file.id)}
                                style={imageCardStyle(currentMainImageId === file.id)}
                            >
                                <img src={file.url} alt="existing" style={thumbStyle} />
                                <div style={radioStyle(currentMainImageId === file.id)}></div>
                                {currentMainImageId === file.id && <span style={badgeStyle}>ראשי</span>}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>הוספת קבצים חדשים (אם תעלה תמונה חדשה, תוכל להפוך אותה לראשית לאחר השמירה):</label>
                    <input type="file" multiple onChange={handleNewFilesChange} style={{marginTop: '10px'}} />
                </div>

                {/* שאר השדות (תיאור, מחיר וכו') */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>תיאור</label>
                    <textarea style={{...inputStyle, height: '100px'}} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                    <button type="submit" disabled={saving} style={saveBtnStyle}>
                        {saving ? 'שומר שינויים...' : 'עדכן פרויקט'}
                    </button>
                    <button type="button" onClick={() => navigate('/dashboard')} style={cancelBtnStyle}>ביטול</button>
                </div>
            </form>
        </div>
    );
};

// Styles
const formStyle = { display: 'flex', flexDirection: 'column', gap: '20px' };
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontWeight: 'bold', fontSize: '14px', color: '#444' };
const inputStyle = { padding: '12px', borderRadius: '6px', border: '1px solid #ddd' };
const sectionBoxStyle = { padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' };
const imageGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px', marginTop: '10px' };
const imageCardStyle = (active) => ({ 
    position: 'relative', border: active ? '3px solid #28a745' : '1px solid #ddd', 
    borderRadius: '8px', cursor: 'pointer', padding: '5px', backgroundColor: '#fff' 
});
const thumbStyle = { width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px' };
const radioStyle = (active) => ({ position: 'absolute', top: '5px', right: '5px', width: '15px', height: '15px', borderRadius: '50%', backgroundColor: active ? '#28a745' : '#ccc', border: '2px solid white' });
const badgeStyle = { position: 'absolute', bottom: '5px', left: '5px', backgroundColor: '#28a745', color: '#fff', fontSize: '10px', padding: '2px 5px', borderRadius: '4px' };
const saveBtnStyle = { flex: 2, padding: '15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cancelBtnStyle = { flex: 1, padding: '15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' };

export default EditProject;