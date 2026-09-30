import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  KeyRound, 
  CheckCircle2, 
  X, 
  ShoppingBag, 
  AlertCircle, 
  Sparkles,
  MessageSquare,
  ShieldCheck,
  RotateCw,
  Flame,
  Eye,
  EyeOff
} from 'lucide-react';
import { API_URL } from '../config';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { 
  isFirebaseConfigured, 
  setupRecaptcha, 
  sendFirebaseOtp, 
  confirmFirebaseOtp 
} from '../firebase';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated as admin
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  // Channel: 'phone' or 'email'
  const [authChannel, setAuthChannel] = useState('phone'); 
  // Method: 'password' (default for login) or 'otp'
  const [authMethod, setAuthMethod] = useState('password'); 

  // Form Inputs
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification Step (for optional OTP login fallback)
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Firebase Phone Auth State
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isUsingFirebase, setIsUsingFirebase] = useState(false);
  const firebaseReady = isFirebaseConfigured();

  // Status & Feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [infoMessage, setInfoMessage] = useState(location.state?.message || '');
  const [isLoading, setIsLoading] = useState(false);

  // OTP Password Reset Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [resetChannel, setResetChannel] = useState('phone'); // 'phone' or 'email'
  const [resetPhone, setResetPhone] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetGeneratedOtp, setResetGeneratedOtp] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Helper to persist auth state and redirect
  const handleAuthSuccess = (data, identifier) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);

    const displayName = data.user?.fullName || (data.role === 'admin' ? 'Harsh Srivastava' : 'Customer');
    localStorage.setItem('fullName', displayName);

    if (data.user?.phone || (authChannel === 'phone' && identifier)) {
      const activePhone = data.user?.phone || identifier;
      localStorage.setItem('userPhone', activePhone);
      if (data.role === 'admin') {
        localStorage.setItem('adminPhone', activePhone);
      }
    }

    if (data.user?.email || (authChannel === 'email' && identifier)) {
      const activeEmail = data.user?.email || identifier;
      localStorage.setItem('userEmail', activeEmail);
      if (data.role === 'admin') {
        localStorage.setItem('adminEmail', activeEmail);
      }
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('freshcart-user-updated', {
      detail: { 
        fullName: displayName, 
        email: data.user?.email || (authChannel === 'email' ? identifier : ''), 
        phone: data.user?.phone || (authChannel === 'phone' ? identifier : '') 
      }
    }));

    if (data.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  // 1. Send Login OTP
  // Phone -> Firebase Google SMS (10,000 Free) or Server Gateway fallback
  // Email -> Nodemailer HTML Email OTP
  const handleSendLoginOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    if (authChannel === 'phone') {
      const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        setError('Please enter a valid 10-digit Indian mobile number starting with 6-9');
        setIsLoading(false);
        return;
      }

      // 1A. If Firebase project is configured, use Firebase Phone Auth (10,000 Free SMS / mo)
      if (firebaseReady) {
        try {
          const verifier = setupRecaptcha('recaptcha-container');
          if (!verifier) {
            throw new Error('reCAPTCHA initialization failed. Please reload.');
          }

          const confirmRes = await sendFirebaseOtp(cleanPhone, verifier);
          setConfirmationResult(confirmRes);
          setIsUsingFirebase(true);
          setIsOtpStep(true);
          setResendCountdown(30);
          setSuccessMsg(`Google Firebase SMS OTP sent to +91 ${cleanPhone}`);
          setIsLoading(false);
          return;
        } catch (fbErr) {
          console.warn('[Firebase Auth] Error or quota exceeded, switching to server dispatch:', fbErr.message);
          // Fall through to server-side SMS dispatch
        }
      }

      // 1B. Server-side SMS Dispatch (Fast2SMS / Dev fallback)
      try {
        const response = await fetch(`${API_URL}/api/auth/otp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone })
        });

        const data = await response.json();
        if (response.ok) {
          setIsUsingFirebase(false);
          setIsOtpStep(true);
          setDevOtp(data.devOtp || '');
          setResendCountdown(30);
          setSuccessMsg(data.message || `OTP sent to mobile +91 ${cleanPhone} via SMS`);
        } else {
          setError(data.error || 'Failed to send OTP via SMS. Please check your phone number.');
        }
      } catch (err) {
        setError('Could not connect to authentication service. Please check your network.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // 1C. Email Address Login: Send OTP to Email
      const cleanEmail = email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/otp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail })
        });

        const data = await response.json();
        if (response.ok) {
          setIsUsingFirebase(false);
          setIsOtpStep(true);
          setDevOtp(data.devOtp || '');
          setResendCountdown(30);
          setSuccessMsg(data.message || `OTP sent to ${cleanEmail}`);
        } else {
          setError(data.error || 'Failed to send OTP to email.');
        }
      } catch (err) {
        setError('Could not connect to authentication service.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 2. Verify Login OTP
  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    if (!otpCode || otpCode.trim().length < 4) {
      setError('Please enter the 6-digit verification code sent to you.');
      setIsLoading(false);
      return;
    }

    const cleanCode = otpCode.trim();

    // 2A. Firebase Verification Flow
    if (isUsingFirebase && confirmationResult) {
      try {
        const fbResult = await confirmFirebaseOtp(confirmationResult, cleanCode);
        const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);

        const response = await fetch(`${API_URL}/api/auth/firebase-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            idToken: fbResult.idToken
          })
        });

        const data = await response.json();
        if (response.ok) {
          handleAuthSuccess(data, cleanPhone);
          return;
        } else {
          setError(data.error || 'Authentication with Firebase failed.');
        }
      } catch (fbVerifyErr) {
        setError(fbVerifyErr.message || 'Invalid or expired Firebase verification code.');
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // 2B. Server Gateway Verification Flow
    const payload = { otp: cleanCode };
    const targetIdentifier = authChannel === 'phone' 
      ? phone.trim().replace(/\D/g, '').slice(-10) 
      : email.trim().toLowerCase();

    if (authChannel === 'phone') {
      payload.phone = targetIdentifier;
    } else {
      payload.email = targetIdentifier;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        handleAuthSuccess(data, targetIdentifier);
      } else {
        setError(data.error || 'Invalid or expired OTP code. Please try again.');
      }
    } catch (err) {
      setError('Could not verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Password Login (Traditional / SuperAdmin)
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setIsLoading(true);

    const payload = { password };
    const targetIdentifier = authChannel === 'phone' 
      ? phone.trim().replace(/\D/g, '').slice(-10) 
      : email.trim().toLowerCase();

    if (authChannel === 'phone') {
      payload.phone = targetIdentifier;
    } else {
      payload.email = targetIdentifier;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        handleAuthSuccess(data, targetIdentifier);
      } else {
        setError(data.error || 'Login failed. Please verify your credentials.');
      }
    } catch (err) {
      setError('Could not connect to backend server. Please verify backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password Handlers (Dual-Channel: Phone SMS or Email OTP)
  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setIsResetLoading(true);

    const payload = {};
    if (resetChannel === 'phone') {
      const cleanPhone = resetPhone.trim().replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        setResetError('Please enter a valid 10-digit Indian mobile number');
        setIsResetLoading(false);
        return;
      }
      payload.phone = cleanPhone;
    } else {
      const cleanEmail = resetEmail.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
        setResetError('Please enter a valid email address');
        setIsResetLoading(false);
        return;
      }
      payload.email = cleanEmail;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setResetGeneratedOtp(data.devOtp || data.otp || '');
        setResetSuccess(data.message || `Verification code sent via ${resetChannel === 'phone' ? 'SMS' : 'Email'}`);
        setResetStep(2);
      } else {
        setResetError(data.error || 'Failed to send reset OTP. Check your details.');
      }
    } catch (err) {
      setResetError('Error communicating with server. Please try again.');
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setIsResetLoading(true);

    const payload = {
      otp: resetOtpCode.trim(),
      newPassword: resetNewPassword
    };

    if (resetChannel === 'phone') {
      payload.phone = resetPhone.trim().replace(/\D/g, '').slice(-10);
    } else {
      payload.email = resetEmail.trim().toLowerCase();
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password-with-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setResetSuccess('Password reset successfully! Logging you in...');
        setShowOtpModal(false);
        handleAuthSuccess(data, resetChannel === 'phone' ? payload.phone : payload.email);
      } else {
        setResetError(data.error || 'Invalid OTP or password requirement not met.');
      }
    } catch (err) {
      setResetError('Error communicating with server.');
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-4">
      
      {/* Invisible container for Firebase reCAPTCHA */}
      <div id="recaptcha-container"></div>

      {/* Brand Header */}
      <div className="mb-6 text-center">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-[#00B074] flex items-center justify-center shadow-lg shadow-[#00B074]/25 text-white transition-transform group-hover:scale-105">
            <ShoppingBag size={26} strokeWidth={2.4} />
          </div>
          <span className="text-3xl font-black text-slate-900 tracking-tight">FreshCart</span>
        </Link>
        <p className="text-xs font-semibold text-slate-500 mt-2 tracking-wide">
          Fresh Groceries & Essentials • Superfast 10-15 Min Delivery
        </p>
      </div>

      {/* Main Auth Container */}
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative">
        
        {/* Step Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              {isOtpStep ? 'Verify OTP' : 'Welcome Back'}
              {!isOtpStep && <Sparkles size={20} className="text-[#00B074]" />}
            </h2>

            {/* Firebase Active Badge */}
            {authChannel === 'phone' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 border border-amber-200 text-amber-700">
                <Flame size={12} className="text-amber-500" />
                Firebase 10k Free
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-1">
            {isOtpStep 
              ? (authChannel === 'phone' 
                  ? `Enter the 6-digit code sent via SMS to +91 ${phone}` 
                  : `Enter the 6-digit code sent to ${email}`)
              : 'Choose your preferred login method to continue'}
          </p>
        </div>

        {/* Global Feedback Notifications */}
        {infoMessage && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200/70 rounded-2xl text-xs text-amber-800 font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-amber-600" />
            <span>{infoMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-600 font-bold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-700 font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-[#00B074]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: INITIAL LOGIN VIEW (CHANNEL SELECTION & INPUT) */}
        {!isOtpStep && (
          <>
            {/* Login Channel Tabs: Phone vs Email */}
            <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl mb-5 border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setAuthChannel('phone');
                  setError('');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  authChannel === 'phone'
                    ? 'bg-white text-slate-900 shadow-sm shadow-slate-300/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Phone size={15} className={authChannel === 'phone' ? 'text-[#00B074]' : ''} />
                <span>Mobile Phone</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthChannel('email');
                  setError('');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  authChannel === 'email'
                    ? 'bg-white text-slate-900 shadow-sm shadow-slate-300/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Mail size={15} className={authChannel === 'email' ? 'text-[#00B074]' : ''} />
                <span>Email Address</span>
              </button>
            </div>

            {/* Google Authentication Quick Access */}
            <div className="mb-4">
              <GoogleAuthButton onError={(err) => setError(err)} label="Continue with Google" />
            </div>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {authChannel === 'phone' ? 'or login with phone SMS' : 'or login with email OTP'}
              </span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            {/* Input Form based on Channel & Method */}
            <form onSubmit={authMethod === 'otp' ? handleSendLoginOtp : handlePasswordLogin} className="space-y-4">
              
              {/* Phone Channel Input */}
              {authChannel === 'phone' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Mobile Phone Number
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Google Firebase 10k Free
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center gap-1 text-slate-400 font-bold text-xs pointer-events-none">
                      <Phone size={15} />
                      <span className="text-slate-500 ml-0.5">+91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074] transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">
                    {authMethod === 'otp' ? '💬 A 6-digit verification code will be sent via SMS' : ''}
                  </p>
                </div>
              )}

              {/* Email Channel Input */}
              {authChannel === 'email' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074] transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">
                    {authMethod === 'otp' ? '✉️ A 6-digit verification code will be sent to your email' : ''}
                  </p>
                </div>
              )}

              {/* Password Input (Only when authMethod === 'password') */}
              {authMethod === 'password' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetChannel(authChannel);
                        if (authChannel === 'phone') {
                          setResetPhone(phone);
                        } else {
                          setResetEmail(email);
                        }
                        setResetStep(1);
                        setResetError('');
                        setResetSuccess('');
                        setShowOtpModal(true);
                      }}
                      className="text-[11px] font-bold text-[#00B074] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your account password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#00B074] text-white rounded-2xl font-black text-sm hover:bg-[#009663] transition shadow-lg shadow-[#00B074]/25 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : authMethod === 'otp' ? (
                  <>
                    {authChannel === 'phone' ? (
                      <>
                        <MessageSquare size={16} />
                        <span>Send OTP via SMS</span>
                      </>
                    ) : (
                      <>
                        <Mail size={16} />
                        <span>Send OTP via Email</span>
                      </>
                    )}
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Toggle between OTP and Password Mode */}
            <div className="mt-4 text-center">
              {authMethod === 'otp' ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('password');
                    setError('');
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-[#00B074] transition"
                >
                  Prefer password? <span className="underline">Sign in with password</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('otp');
                    setError('');
                  }}
                  className="text-xs font-bold text-[#00B074] hover:underline transition"
                >
                  ⚡ Sign in with OTP (Passwordless)
                </button>
              )}
            </div>
          </>
        )}

        {/* STEP 2: OTP VERIFICATION VIEW */}
        {isOtpStep && (
          <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
            
            {/* Developer Mode OTP Preview Banner (When gateway falls back to local simulation) */}
            {devOtp && (
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                  <ShieldCheck size={14} className="text-[#00B074]" />
                  <span>Verification Code (Demo & Local Mode)</span>
                </div>
                <div className="text-2xl font-mono font-black text-[#00B074] tracking-widest my-1">
                  {devOtp}
                </div>
                <button
                  type="button"
                  onClick={() => setOtpCode(devOtp)}
                  className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-3 py-1 rounded-lg transition"
                >
                  Click to Auto-fill Code
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                required
                maxLength="6"
                placeholder="• • • • • •"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-mono tracking-widest text-center font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074]"
              />
            </div>

            {/* OTP Actions: Verify Button */}
            <button
              type="submit"
              disabled={isLoading || otpCode.length < 4}
              className="w-full py-3.5 bg-[#00B074] text-white rounded-2xl font-black text-sm hover:bg-[#009663] transition shadow-lg shadow-[#00B074]/25 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Log In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Resend and Edit options */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsOtpStep(false);
                  setOtpCode('');
                  setDevOtp('');
                  setConfirmationResult(null);
                  setError('');
                  setSuccessMsg('');
                }}
                className="font-bold text-slate-500 hover:text-slate-800 transition"
              >
                ← Change {authChannel === 'phone' ? 'Number' : 'Email'}
              </button>

              <button
                type="button"
                disabled={resendCountdown > 0 || isLoading}
                onClick={handleSendLoginOtp}
                className="font-bold text-[#00B074] hover:underline disabled:text-slate-400 disabled:no-underline flex items-center gap-1"
              >
                <RotateCw size={13} className={resendCountdown > 0 ? '' : 'text-[#00B074]'} />
                {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Footer: Create Account Link */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-[#00B074] hover:underline">
              Create Account
            </Link>
          </p>
        </div>

      </div>

      {/* Forgot Password Reset Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00B074] flex items-center justify-center">
                <KeyRound size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Reset Password</h3>
                <p className="text-[11px] text-slate-500">Verify your registered details</p>
              </div>
            </div>

            {resetError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {/* STEP 1: Enter Phone or Email with Channel Switcher */}
            {resetStep === 1 && (
              <form onSubmit={handleSendResetOtp} className="space-y-4 mt-4">
                {/* Channel Switcher */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => {
                      setResetChannel('phone');
                      setResetError('');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      resetChannel === 'phone'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Phone size={13} className={resetChannel === 'phone' ? 'text-[#00B074]' : ''} />
                    <span>Mobile SMS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetChannel('email');
                      setResetError('');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      resetChannel === 'email'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Mail size={13} className={resetChannel === 'email' ? 'text-[#00B074]' : ''} />
                    <span>Email OTP</span>
                  </button>
                </div>

                {resetChannel === 'phone' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Mobile Number
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 flex items-center gap-1 text-slate-400 font-bold text-xs pointer-events-none">
                        <Phone size={14} />
                        <span className="text-slate-500 ml-0.5">+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="9876543210"
                        value={resetPhone}
                        onChange={(e) => setResetPhone(e.target.value)}
                        className="w-full pl-16 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074]"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074]"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isResetLoading}
                  className="w-full py-3 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl font-black text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isResetLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <span>{resetChannel === 'phone' ? 'Send OTP via SMS' : 'Send OTP via Email'}</span>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Enter Code & New Password */}
            {resetStep === 2 && (
              <form onSubmit={handleVerifyResetOtp} className="space-y-4 mt-4">
                {resetGeneratedOtp && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                    <p className="text-[11px] font-bold text-emerald-800">Verification OTP Code:</p>
                    <p className="text-2xl font-mono font-black text-[#00B074] tracking-widest mt-0.5">{resetGeneratedOtp}</p>
                    <button
                      type="button"
                      onClick={() => setResetOtpCode(resetGeneratedOtp)}
                      className="text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-0.5 rounded-md mt-1 transition"
                    >
                      Click to Auto-fill
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Enter 6-Digit OTP *</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    placeholder="e.g. 123456"
                    value={resetOtpCode}
                    onChange={(e) => setResetOtpCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Set New Password *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 4 characters"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                      tabIndex={-1}
                    >
                      {showResetPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isResetLoading}
                    className="flex-2 py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-xl font-black text-xs transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isResetLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Save & Sign In</span>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Login;