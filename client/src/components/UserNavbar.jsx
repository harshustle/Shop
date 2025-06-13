import { useNavigate } from 'react-router-dom';

const UserNavbar = () => {
    const navigate = useNavigate();
    const isAuthenticated = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <h1
                            onClick={() => navigate('/')}
                            className="text-xl font-bold text-blue-600 cursor-pointer"
                        >
                            Shop Orders
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="text-gray-600 hover:text-blue-600"
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="text-gray-600 hover:text-blue-600"
                                >
                                    Register
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                >
                                    Login
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default UserNavbar;
