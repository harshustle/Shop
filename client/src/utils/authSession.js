import { API_URL } from '../config';

let refreshRequest = null;

export const saveTokenPair = (data = {}) => {
  const accessToken = data.accessToken || data.token;
  if (accessToken) localStorage.setItem('token', accessToken);
  if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
  return accessToken;
};

export const clearTokenPair = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

export const refreshAccessToken = async () => {
  if (refreshRequest) return refreshRequest;
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  refreshRequest = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (!response.ok) {
        clearTokenPair();
        return null;
      }
      const data = await response.json();
      const accessToken = saveTokenPair(data);
      if (data.role) localStorage.setItem('role', data.role);
      return accessToken;
    } catch {
      return null;
    } finally {
      refreshRequest = null;
    }
  })();

  return refreshRequest;
};

export const authenticatedFetch = async (url, options = {}) => {
  const request = (token) => fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  let response = await request(localStorage.getItem('token'));
  if (response.status !== 401) return response;

  const renewedToken = await refreshAccessToken();
  if (!renewedToken) return response;
  response = await request(renewedToken);
  return response;
};
