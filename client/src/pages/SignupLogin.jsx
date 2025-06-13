import React, { useState } from 'react';
import axios from 'axios';
import Navigation from '../Components/Navigation';

const SignupLogin = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    const toggleForm = () => {
        setIsLogin(!isLogin);
        setEmail('');
        setPassword('');
        setUsername('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLogin) {
            // Handle login
            try {
                const response = await axios.post('http://localhost:8080/login', { email, password });
                console.log('Login successful:', response.data);
                // Handle successful login (e.g., redirect to another page)
            } catch (error) {
                console.error('Error logging in:', error);
            }
        } else {
            // Handle signup
            try {
                const response = await axios.post('http://localhost:8080/signup', { username, email, password });
                console.log('Signup successful:', response.data);
                // Handle successful signup (e.g., redirect to another page)
            } catch (error) {
                console.error('Error signing up:', error);
            }
        }
    };

    return (
        <>  <Navigation/>
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <h1 className="text-4xl font-bold mb-8">{isLogin ? 'Login' : 'Signup'}</h1>
                <form className="bg-white p-6 rounded shadow-md w-full max-w-sm" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            {isLogin ? 'Login' : 'Signup'}
                        </button>
                        <button
                            type="button"
                            className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
                            onClick={toggleForm}
                        >
                            {isLogin ? 'Need an account? Signup' : 'Have an account? Login'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default SignupLogin;