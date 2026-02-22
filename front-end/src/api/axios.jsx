import axios from 'axios';
import { getFriendlyError } from '../Constants/errorMessages';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMsg = error.response?.data?.message;
    error.friendlyMessage = getFriendlyError(serverMsg);
    return Promise.reject(error);
  }
);

export default api;
