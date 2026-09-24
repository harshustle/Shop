import React, { useState } from 'react';
import { LogOut, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';

const LogoutConfirmModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isOpen) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');

      // Call server to blacklist tokens in Redis
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ refreshToken })
      });
    } catch (err) {
      console.warn('Logout notification error:', err);
    } finally {
      // Clear client session
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('role');
      localStorage.removeItem('fullName');
      localStorage.removeItem('userPhone');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminPhone');
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('freshcart-user-updated'));
      setIsLoggingOut(false);
      onClose();
      navigate('/login');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-center">
        
        <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <LogOut size={26} className="stroke-[2.2]" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900">Sign out of FreshCart?</h3>
          <p className="text-xs text-slate-500 font-medium">
            You will need to sign in again with your mobile number or email to access your wallet and orders.
          </p>
        </div>

        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={handleLogout}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition shadow-sm disabled:opacity-50"
          >
            {isLoggingOut ? 'Signing out...' : 'Yes, Sign Out'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default LogoutConfirmModal;
