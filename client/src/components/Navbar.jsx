import { useNavigate } from 'react-router-dom';

const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 
              onClick={() => navigate('/')} 
              className="text-xl font-bold text-blue-600 cursor-pointer"
            >
              Order System
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-blue-600"
            >
              Dashboard
            </button>
            <button 
              onClick={() => navigate('/admin')}
              className="text-gray-600 hover:text-blue-600"
            >
              Orders
            </button>
            <button 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
