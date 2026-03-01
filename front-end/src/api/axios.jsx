// /src/api/axios.jsx
import axios from 'axios';
import { getFriendlyError } from '../Constants/errorMessages';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

// Request: מוסיף Authorization אם יש token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: תרגום שגיאות + טיפול בטוקן פג תוקף
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const serverMsg = error.response?.data?.message;

    // תרגום ידידותי
    error.friendlyMessage = getFriendlyError(serverMsg);

    // ✅ טיפול בטוקן לא תקין/פג תוקף
    if (status === 401) {
      // מנקים סשן
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // מונעים לולאה אם כבר בלוגין
      const isOnLogin = window.location.pathname
        .toLowerCase()
        .includes('login');
      if (!isOnLogin) {
        // אפשר להעביר reason כדי להציג הודעה בלוגין (אם תרצה)
        window.location.href = '/login?reason=session_expired';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
