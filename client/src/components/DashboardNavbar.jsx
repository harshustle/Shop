import { useNavigate } from 'react-router-dom';

const DashboardNavbar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <span className="text-xl font-bold text-blue-600">OrderEase</span>
                        <div className="flex space-x-4">
                            <button onClick={() => navigate('/')} className="text-gray-600 hover:text-blue-600">
                                Place Order
                            </button>
                            <button onClick={() => navigate('/orders')} className="text-gray-600 hover:text-blue-600">
                                My Orders
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default DashboardNavbar;
