import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import Popup from '../../Components/Popup'; // וידוא נתיב תקין לקומפוננטה שלך
import '../../App.css';

const ManageProjects = () => {
    const { user: currentUser } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // שימוש באותו מבנה כמו ב-ProjectLibrary
    const [activeProject, setActiveProject] = useState(null);
    
    const [filters, setFilters] = useState({
        q: '',
        published: '',
        page: 1
    });

    const getAuthHeader = () => ({
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                ...filters,
                limit: 50 // הבאת כמות גדולה יותר לניהול
            }).toString();
            
            const res = await axios.get(`http://localhost:5000/api/admin/projects?${params}`, getAuthHeader());
            setProjects(res.data.projects || []);
        } catch (err) {
            console.error("טעינת פרויקטים נכשלה", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (currentUser?.role === 'admin') fetchProjects();
    }, [currentUser, fetchProjects]);

    const togglePublish = async (e, projectId, currentStatus) => {
        e.stopPropagation(); // מונע מהפופאפ להיפתח כשלוחצים על הכפתור
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

    if (!currentUser || currentUser.role !== 'admin') return <div className="container">אין הרשאות.</div>;

    return (
        <div className="admin-container" style={{ direction: 'rtl', padding: '20px' }}>
            <h1>ניהול פרויקטים</h1>
            
            <div className="admin-toolbar" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input 
                    placeholder="חפש פרויקט..." 
                    value={filters.q}
                    onChange={(e) => setFilters({...filters, q: e.target.value, page: 1})}
                    className="admin-input"
                />
                <select 
                    value={filters.published} 
                    onChange={(e) => setFilters({...filters, published: e.target.value, page: 1})}
                    className="admin-select"
                >
                    <option value="">כל הסטטוסים</option>
                    <option value="true">באוויר ✅</option>
                    <option value="false">ממתינים ⏳</option>
                </select>
            </div>

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
                        {/* כפתור "פרטים" ייעודי למקרה שלא לוחצים על השורה */}
                        <button 
                            className="secondary" 
                            onClick={(e) => {
                                e.stopPropagation(); // חשוב! מונע כפל פתיחה
                                setActiveProject(p);
                            }}
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                        >
                            👁️ פרטים
                        </button>

                        <button 
                            className={p.isPublished ? "danger" : "approve-btn"}
                            onClick={(e) => togglePublish(e, id, p.isPublished)}
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
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

            {/* התיקון המרכזי: העברת ה-project כ-Prop בדיוק כמו ב-ProjectLibrary */}
            {activeProject && (
                <Popup 
                    project={activeProject} 
                    onClose={() => setActiveProject(null)} 
                />
            )}
        </div>
    );
};

export default ManageProjects;