import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserApproval = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
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
            await axios.put(`http://localhost:5000/api/admin/users/${userId}/approval`, 
                { isApproved: true }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUsers(prev => prev.filter(u => u.id !== userId));
            alert('המשתמש אושר בהצלחה');
        } catch (err) {
            alert('שגיאה בתהליך האישור');
        }
    };


const handleViewDocument = async (documentUrl, username) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(documentUrl, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob', // קריטי לקבלת קובץ גולמי
        });

        // יצירת אובייקט URL מהמידע שהתקבל
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        
        // יצירת אלמנט קישור זמני לביצוע ההורדה/פתיחה
        const link = document.createElement('a');
        link.href = url;
        
        // שם הקובץ שיוצג בהורדה
        link.setAttribute('download', `Approval_${username}.pdf`);
        
        document.body.appendChild(link);
        link.click();
        
        // ניקוי המשאבים
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Error viewing document:", err);
        alert("לא ניתן לגשת למסמך. וודא שהטוקן תקין ושאתה מחובר כאדמין.");
    }
};

    if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>טוען משתמשים ממתינים...</div>;

    return (
        <div style={{ direction: 'rtl', padding: '20px', fontFamily: 'Arial' }}>
            <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>אישור משתמשים חדשים</h2>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        <th style={tableHeaderStyle}>שם משתמש</th>
                        <th style={tableHeaderStyle}>אימייל</th>
                        <th style={tableHeaderStyle}>תפקיד</th>
                        <th style={tableHeaderStyle}>מסמך אישור</th>
                        <th style={tableHeaderStyle}>פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={tableCellStyle}>{u.username}</td>
                            <td style={tableCellStyle}>{u.email}</td>
                            <td style={tableCellStyle}>
                                <span style={roleBadgeStyle(u.role)}>{u.role}</span>
                            </td>
                           <td style={tableCellStyle}>
    {u.approvalDocument ? (
        <button 
            onClick={() => handleViewDocument(u.approvalDocument, u.username)} 
            style={{ 
                background: 'none', 
                border: 'none', 
                color: '#007bff', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                textDecoration: 'underline'
            }}
        >
            📄 הורד/צפה במסמך
        </button>
    ) : (
        <span style={{ color: '#999' }}>אין מסמך</span>
    )}
</td>
                            <td style={tableCellStyle}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleApprove(u.id)} style={approveBtnStyle}>
                                        אשר
                                    </button>
                    
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {users.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p>אין כרגע משתמשים הממתינים לאישור.</p>
                </div>
            )}
        </div>
    );
};

// Styles
const tableHeaderStyle = { padding: '15px', textAlign: 'right', fontWeight: 'bold' };
const tableCellStyle = { padding: '15px' };

const roleBadgeStyle = (role) => ({
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    backgroundColor: role === 'designer' ? '#e3f2fd' : '#f3e5f5',
    color: role === 'designer' ? '#0d47a1' : '#4a148c',
    fontWeight: 'bold'
});

const approveBtnStyle = { 
    background: '#28a745', color: 'white', border: 'none', 
    padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
};

const rejectBtnStyle = { 
    background: '#dc3545', color: 'white', border: 'none', 
    padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
};

const docLinkStyle = { 
    color: '#007bff', textDecoration: 'none', fontWeight: 'bold', borderBottom: '1px solid #007bff' 
};

export default UserApproval;