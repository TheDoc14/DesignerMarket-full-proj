import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserApproval = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            // שליפת משתמשים ממתינים (approved=false)
            const res = await axios.get('http://localhost:5000/api/admin/users?approved=false', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data.users || []);
        } catch (err) {
            console.error("Error fetching users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleApprove = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            // שליחת בקשת PUT לפי הראוט ב-Backend
            await axios.put(`http://localhost:5000/api/admin/users/${userId}/approval`, 
                { isApproved: true }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // הסרה מהרשימה המקומית אחרי אישור
            setUsers(prev => prev.filter(u => u._id !== userId));
            alert('המשתמש אושר בהצלחה');
        } catch (err) {
            alert('שגיאה בתהליך האישור');
        }
    };

    if (loading) return <div style={{padding: '20px', textAlign: 'center'}}>טוען משתמשים...</div>;

    return (
        <div style={{ direction: 'rtl', padding: '20px' }}>
            <h2>אישור משתמשים חדשים</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ background: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
                        <th style={{padding: '10px', textAlign: 'right'}}>שם משתמש</th>
                        <th style={{padding: '10px', textAlign: 'right'}}>אימייל</th>
                        <th style={{padding: '10px', textAlign: 'right'}}>תפקיד</th>
                        <th style={{padding: '10px', textAlign: 'right'}}>פעולה</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u._id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{padding: '10px'}}>{u.username}</td>
                            <td style={{padding: '10px'}}>{u.email}</td>
                            <td style={{padding: '10px'}}>{u.role}</td>
                            <td style={{padding: '10px'}}>
                                <button 
                                    onClick={() => handleApprove(u._id)} 
                                    style={{ background: '#28a745', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    אשר
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {users.length === 0 && <p style={{marginTop: '20px'}}>אין משתמשים הממתינים לאישור.</p>}
        </div>
    );
};

export default UserApproval;