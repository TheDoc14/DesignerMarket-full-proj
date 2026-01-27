import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import Popup from '../../Components/Popup';
import '../../App.css';

const ManageProjects = () => {
    const { user: currentUser } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // שליטה על פופאפ צפייה ועריכה
    const [activeProject, setActiveProject] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ title: '', description: '', category: '' });

    const [filters, setFilters] = useState({
        q: '',
        published: '',
        page: 1
    });

    const getAuthHeader = () => ({
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    // שליפה מתוקנת - שולחת רק פרמטרים שאינם ריקים
    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const queryParams = { limit: 50, page: filters.page };
            if (filters.q) queryParams.q = filters.q;
            if (filters.published !== '') queryParams.published = filters.published;

            const params = new URLSearchParams(queryParams).toString();
            
            const res = await axios.get(`http://localhost:5000/api/admin/projects?${params}`, getAuthHeader());
            
            // לפי ה-Controller שלך, הנתונים חוזרים בתוך res.data.projects
            setProjects(res.data.projects || []);
        } catch (err) {
            console.error("טעינת פרויקטים נכשלה", err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (currentUser?.role === 'admin') fetchProjects();
    }, [currentUser, fetchProjects]);

    // שינוי סטטוס פרסום (אדמין)
    const togglePublish = async (e, projectId, currentStatus) => {
        e.stopPropagation();
        try {
            await axios.put(`http://localhost:5000/api/admin/projects/${projectId}/publish`, 
                { isPublished: !currentStatus },
                getAuthHeader()
            );
            fetchProjects(); 
        } catch (err) {
            alert("עדכון סטטוס נכשל");
        }
    };

    // פתיחת מצב עריכה
    const handleEditClick = (e, project) => {
        e.stopPropagation();
        setEditData({
            title: project.title || '',
            description: project.description || '',
            category: project.category || ''
        });
        setActiveProject(project);
        setIsEditing(true);
    };

    // שמירת עריכה (משתמש בראוט הכללי של פרויקטים)
    const handleSaveEdit = async () => {
        try {
            const id = activeProject._id || activeProject.id;
            await axios.put(`http://localhost:5000/api/projects/${id}`, editData, getAuthHeader());
            alert("הפרויקט עודכן בהצלחה");
            setIsEditing(false);
            setActiveProject(null);
            fetchProjects();
        } catch (err) {
            console.error("שגיאה בעדכון", err.response?.data);
            alert("עדכון הפרויקט נכשל. וודא שהבאקנד מאפשר לאדמין לערוך בראוט זה.");
        }
    };

    if (!currentUser || currentUser.role !== 'admin') return <div className="container">אין הרשאות.</div>;

    return (
        <div className="admin-container" style={{ direction: 'rtl', padding: '20px' }}>
            <h1>ניהול פרויקטים</h1>
            
            {/* סרגל כלים */}
            <div className="admin-toolbar" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input 
                    placeholder="חפש פרויקט..." 
                    value={filters.q}
                    onChange={(e) => setFilters({...filters, q: e.target.value, page: 1})}
                    className="admin-input"
                    style={{ flex: 1, padding: '8px' }}
                />
                <select 
                    value={filters.published} 
                    onChange={(e) => setFilters({...filters, published: e.target.value, page: 1})}
                    style={{ padding: '8px' }}
                >
                    <option value="">כל הסטטוסים</option>
                    <option value="true">מפורסמים ✅</option>
                    <option value="false">ממתינים ⏳</option>
                </select>
            </div>

            {loading ? <p>טוען פרויקטים...</p> : (
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>כותרת</th>
                                <th>יוצר</th>
                                <th>סטטוס</th>
                                <th>פעולות</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(p => {
                                const id = p._id || p.id;
                                return (
                                    <tr key={id} onClick={() => setActiveProject(p)} style={{ cursor: 'pointer' }}>
                                        <td style={{ fontWeight: 'bold' }}>{p.title}</td>
                                        <td>{p.createdBy?.username || 'מעצב'}</td>
                                        <td>
                                            <span className={p.isPublished ? 'status-active' : 'status-pending'}>
                                                {p.isPublished ? 'מפורסם' : 'ממתין'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    className="secondary" 
                                                    onClick={(e) => handleEditClick(e, p)}
                                                    style={{ padding: '4px 8px' }}
                                                >
                                                    ✏️ ערוך
                                                </button>
                                                <button 
                                                    className={p.isPublished ? "danger" : "approve-btn"}
                                                    onClick={(e) => togglePublish(e, id, p.isPublished)}
                                                    style={{ padding: '4px 8px' }}
                                                >
                                                    {p.isPublished ? 'הסר' : 'אשר'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* מודאל עריכה (אדמין) */}
            {isEditing && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="edit-modal" style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <h2>עריכת פרויקט</h2>
                        <input 
                            placeholder="כותרת"
                            value={editData.title} 
                            onChange={e => setEditData({...editData, title: e.target.value})}
                            style={{ padding: '8px' }}
                        />
                        <textarea 
                            placeholder="תיאור"
                            value={editData.description} 
                            onChange={e => setEditData({...editData, description: e.target.value})}
                            style={{ padding: '8px', minHeight: '100px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setIsEditing(false)} className="secondary">תצוגת פרויקט</button>
                            <button onClick={handleSaveEdit} className="approve-btn">שמור שינויים</button>
                        </div>
                    </div>
                </div>
            )}

            {/* פופאפ צפייה רגיל (נפתח רק כשלא בעריכה) */}
{activeProject && (
    <Popup 
        project={activeProject} 
        onClose={() => setActiveProject(null)} 
        onUpdate={() => fetchProjects()} // מעכשיו רענון יעבוד מיד אחרי שמירה/מחיקה
    />
)}
        </div>
    );
};

export default ManageProjects;