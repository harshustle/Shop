import { Navigate } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
    const role = localStorage.getItem('role');
    
    if (role !== 'admin') {
        return <Navigate to="/dashboard" />;
    }

    return children;
};

export default ProtectedAdminRoute;
