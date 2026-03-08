import axios from 'axios';
import { getFriendlyError } from '../Constants/errorMessages';

/*This module configures a centralized Axios Instance used for all HTTP communication between the React frontend and the backend server.
 *It leverages Interceptors to automate authentication and global error handling.
 */
const api = axios.create({
  //The entry point for the API. It prioritizes the environment variable
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

api.interceptors.request.use((config) => {
  //If a token exists, it attaches an Authorization header using the Bearer scheme: Bearer <token>
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const serverMsg = error.response?.data?.message;
    error.friendlyMessage = getFriendlyError(serverMsg);

    if (status === 401 && !error.config?.skipAuthRedirect) { // ← הוסיפי את זה
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const isOnLogin = window.location.pathname.toLowerCase().includes('login');
      if (!isOnLogin) {
        window.location.href = '/login?reason=session_expired';
      }
    }

    return Promise.reject(error);
  }
);


export default api;
