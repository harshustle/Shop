import axios from 'axios';

const API_URL = '/api/users/';

// Register user
const register = async (phone, password) => {
    const response = await axios.post(API_URL + 'register', {
        phone,
        password
    });
    return response.data;
};

// Login user
const login = async (phone, password) => {
    const response = await axios.post(API_URL + 'login', {
        phone,
        password
    });
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

// Logout user
const logout = () => {
    localStorage.removeItem('user');
};

// Get logged in user
const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

export {
    register,
    login,
    logout,
    getCurrentUser
};