import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { API_URL } from '../config';
import { authenticatedFetch, clearTokenPair } from '../utils/authSession';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(Boolean(requireAdmin && localStorage.getItem('token')));
  const [isAuthorized, setIsAuthorized] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) return false;
    if (requireAdmin) return false;
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
      setIsValidating(false);
      return;
    }

    // Verify token validity against backend if present
    let isMounted = true;
    const verifySession = async () => {
      setIsValidating(true);
      try {
        const verificationUrl = requireAdmin ? `${API_URL}/api/admin/metrics` : `${API_URL}/api/auth/me`;
        const res = await authenticatedFetch(verificationUrl);
        if (!res.ok) {
          if (isMounted) {
            clearTokenPair();
            localStorage.removeItem('role');
            localStorage.removeItem('fullName');
            localStorage.removeItem('userPhone');
            setIsAuthorized(false);
          }
        } else {
          const data = await res.json();
          if (isMounted) setIsAuthorized(requireAdmin ? data.adminRole === 'Super Admin' : true);
        }
      } catch (err) {
        // Admin authorization fails closed when the backend cannot verify ownership.
        if (isMounted && requireAdmin) setIsAuthorized(false);
      } finally {
        if (isMounted) setIsValidating(false);
      }
    };

    verifySession();
    return () => { isMounted = false; };
  }, [token, role, requireAdmin]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location, message: 'Authentication required. Please sign in.' }} replace />;
  }

  if (requireAdmin && role !== 'admin') {
    return <Navigate to="/login" state={{ from: location, message: 'Authentication required. Please sign in.' }} replace />;
  }

  if (isValidating) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
          <p className="mt-3 text-sm font-bold">Verifying secure admin session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" state={{ from: location, message: 'Your session could not be verified. Please sign in again.' }} replace />;
  }

  return children;
};

export default ProtectedRoute;
