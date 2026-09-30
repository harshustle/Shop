export const API_URL = (typeof window !== 'undefined')
  ? (window.location.port === '5173' ? 'http://localhost:3000' : '')
  : (import.meta.env.VITE_API_URL || 'https://shop-backend-t6k1.onrender.com');

