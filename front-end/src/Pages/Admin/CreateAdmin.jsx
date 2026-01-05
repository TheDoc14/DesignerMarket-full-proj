import React, { useState } from 'react';
import axios from 'axios';

const CreateAdmin = () => {
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', firstName: '', lastName: '', role: 'admin'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/auth/register', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('מנהל מערכת חדש נוצר בהצלחה');
            setFormData({ username: '', email: '', password: '', firstName: '', lastName: '', role: 'admin' });
        } catch (err) {
            alert(err.response?.data?.message || 'שגיאה ביצירת אדמין');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ direction: 'rtl', padding: '20px', maxWidth: '500px' }}>
            <h2>יצירת מנהל מערכת (Admin)</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <input 
                    style={inputStyle} 
                    placeholder="שם משתמש" 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                    required 
                />
                <input 
                    style={inputStyle} 
                    type="email" 
                    placeholder="אימייל" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    required 
                />
                <input 
                    style={inputStyle} 
                    type="password" 
                    placeholder="סיסמה" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    required 
                />
                <input 
                    style={inputStyle} 
                    placeholder="שם פרטי" 
                    value={formData.firstName} 
                    onChange={e => setFormData({...formData, firstName: e.target.value})} 
                />
                <input 
                    style={inputStyle} 
                    placeholder="שם משפחה" 
                    value={formData.lastName} 
                    onChange={e => setFormData({...formData, lastName: e.target.value})} 
                />
                <button 
                    type="submit" 
                    disabled={loading}
                    style={{ background: '#007bff', color: 'white', border: 'none', padding: '12px', borderRadius: '5px', cursor: 'pointer' }}
                >
                    {loading ? 'יוצר...' : 'צור מנהל מערכת'}
                </button>
            </form>
        </div>
    );
};

const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #ccc' };

export default CreateAdmin;