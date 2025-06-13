import api from '../api/axios'; // Custom axios instance

// ✅ Register user
const register = async (phone, password) => {
  const response = await api.post('register', { phone, password });
  return response.data;
};

// ✅ Login user
const login = async (phone, password) => {
  const response = await api.post('login', { phone, password });
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

// ✅ Logout user
const logout = () => {
  localStorage.removeItem('user');
};

// ✅ Get current user
const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

export {
  register,
  login,
  logout,
  getCurrentUser
};
