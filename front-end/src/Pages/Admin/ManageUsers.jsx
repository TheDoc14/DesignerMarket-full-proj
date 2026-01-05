import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import '../../App.css';

const ManageUsers = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // סטייט לניהול כלל הפילטרים והפגינציה
    const [filters, setFilters] = useState({
        q: '',
        role: '',
        approved: '',
        page: 1,
        limit: 10
    });

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            // בניית ה-URL עם כל הפרמטרים הנתמכים בבאקנד
            const params = new URLSearchParams({
                q: filters.q,
                role: filters.role,
                approved: filters.approved,
                page: filters.page,
                limit: filters.limit
            }).toString();

            const res = await axios.get(`http://localhost:5000/api/admin/users?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setUsers(res.data.users || []);
        } catch (err) {
            console.error("טעינת משתמשים נכשלה", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (currentUser?.role === 'admin') fetchUsers();
    }, [currentUser, fetchUsers]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value, page: 1 })); // חזרה לעמוד 1 בשינוי סינון
    };

    if (!currentUser || currentUser.role !== 'admin') return <div className="container">אין הרשאות.</div>;

    return (
        <div className="admin-container">
            <h1>ניהול משתמשים</h1>
            
            {/* סרגל סינון וחיפוש */}
            <div className="admin-toolbar" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input 
                    name="q"
                    placeholder="חיפוש שם/אימייל..." 
                    value={filters.q}
                    onChange={handleFilterChange}
                    style={{ flex: 1, minWidth: '200px' }}
                />
                <select name="role" value={filters.role} onChange={handleFilterChange}>
                    <option value="">כל התפקידים</option>
                    <option value="student">סטודנט</option>
                    <option value="designer">מעצב</option>
                    <option value="customer">לקוח</option>
                    <option value="admin">אדמין</option>
                </select>
                <select name="approved" value={filters.approved} onChange={handleFilterChange}>
                    <option value="">כל הסטטוסים</option>
                    <option value="true">מאושרים</option>
                    <option value="false">ממתינים</option>
                </select>
            </div>

            {loading ? <p>טוען...</p> : (
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>שם משתמש</th>
                                <th>אימייל</th>
                                <th>תפקיד</th>
                                <th>סטטוס</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id || u.id}>
                                    <td>{u.username}</td>
                                    <td>{u.email}</td>
                                    <td>{u.role}</td>
                                    <td>{u.isApproved ? '✅ מאושר' : '⏳ ממתין'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;