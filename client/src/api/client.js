import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL||'http://localhost:5000/api',
  withCredentials: true, // ← THE critical line. Without it, the browser
                         // won't send/receive our auth cookie cross-origin.
});

export default api;