import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { API_URL } from '../config';

const GoogleAuthButton = ({ onError, label = "Continue with Google" }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const googleBtnRef = useRef(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Handle Google authentication response token
  const handleGoogleCredential = async (credential) => {
    setIsLoading(true);
    if (onError) onError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credential })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Google authentication failed');
      }

      // Persist session
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      const displayName = data.user?.fullName || 'Customer';
      localStorage.setItem('fullName', displayName);
      if (data.user?.email) {
        localStorage.setItem('userEmail', data.user.email);
        if (data.role === 'admin') localStorage.setItem('adminEmail', data.user.email);
      }
      if (data.user?.phone) {
        localStorage.setItem('userPhone', data.user.phone);
      }
      if (data.user?.avatar) {
        localStorage.setItem('userAvatar', data.user.avatar);
      }

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('freshcart-user-updated', {
        detail: { 
          fullName: displayName, 
          email: data.user?.email, 
          phone: data.user?.phone,
          avatar: data.user?.avatar 
        }
      }));

      // Seamless redirect
      if (data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Google Auth Error:', err);
      if (onError) {
        onError(err.message || 'Could not complete Google Sign-In. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load Google Identity Services script if client ID is configured
  useEffect(() => {
    if (!googleClientId) return;

    const scriptId = 'google-gsi-client-script';
    let script = document.getElementById(scriptId);

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (res) => {
            if (res?.credential) {
              handleGoogleCredential(res.credential);
            }
          }
        });
        setIsGsiLoaded(true);

        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'pill'
          });
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    } else if (window.google?.accounts?.id) {
      initGsi();
    }
  }, [googleClientId]);

  // Click handler
  const handleClick = () => {
    if (isLoading) return;

    // If Google Client ID is configured and GSI prompt is available
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
      return;
    }

    // If no client ID configured yet, authenticate using demo mode with helpful toast
    handleGoogleCredential('demo-google-token');
  };

  return (
    <div className="w-full">
      {/* Hidden container for official GSI rendered button if active */}
      {googleClientId && <div ref={googleBtnRef} className="hidden" />}

      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all duration-150 flex items-center justify-center gap-3 shadow-xs hover:border-slate-300 hover:shadow-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin text-slate-500" />
            <span>Connecting to Google...</span>
          </>
        ) : (
          <>
            {/* Official Google multicolored 'G' icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{label}</span>
          </>
        )}
      </button>

      {!googleClientId && (
        <p className="text-[10px] text-center text-slate-400 mt-1.5">
          (Ready: Add <span className="font-mono text-slate-500">VITE_GOOGLE_CLIENT_ID</span> to <span className="font-mono text-slate-500">client/.env</span> for live OAuth)
        </p>
      )}
    </div>
  );
};

export default GoogleAuthButton;
