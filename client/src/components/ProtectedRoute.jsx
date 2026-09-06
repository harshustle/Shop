import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { API_URL } from '../config';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) return false;
    if (requireAdmin && role !== 'admin') return false;
    return true;
  });

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  useEffect(() => {
    if (!token) {
      setIsAuthorized(false);
      return;
    }

    if (requireAdmin && role !== 'admin') {
      setIsAuthorized(false);
      return;
    }

    // Verify token validity against backend if present
    let isMounted = true;
    const verifySession = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          if (isMounted) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('fullName');
            localStorage.removeItem('userPhone');
            setIsAuthorized(false);
          }
        } else {
          const data = await res.json();
          if (requireAdmin && data.role !== 'admin') {
            if (isMounted) setIsAuthorized(false);
          }
        }
      } catch (err) {
        // Backend offline or network blip - allow offline cached auth if token format is present
      }
    };

    verifySession();
    return () => { isMounted = false; };
  }, [token, role, requireAdmin]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location, message: 'Authentication required. Please sign in.' }} replace />;
  }

  if (requireAdmin && role !== 'admin') {
    return <Navigate to="/login" state={{ from: location, message: 'Super Admin access required. Please sign in with admin privileges.' }} replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" state={{ from: location, message: 'Session expired or unauthorized. Please sign in again.' }} replace />;
  }

  return children;
};

export default ProtectedRoute;
