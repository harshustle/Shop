import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Loader2, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  ShieldCheck, 
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

const Register = () => {
  const navigate = useNavigate();

  // Channel: 'phone' or 'email'
  const [authChannel, setAuthChannel] = useState('phone');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification Step
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Firebase Phone Auth
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isUsingFirebase, setIsUsingFirebase] = useState(false);
  const firebaseReady = isFirebaseConfigured();

  // Status & Feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Auth Success Persistence & Navigation
  const handleAuthSuccess = (data, identifier) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role || 'customer');

    const displayName = data.user?.fullName || fullName || 'Customer';
    localStorage.setItem('fullName', displayName);

    if (data.user?.phone || (authChannel === 'phone' && identifier)) {
      const activePhone = data.user?.phone || identifier;
      localStorage.setItem('userPhone', activePhone);
    }

    if (data.user?.email || (authChannel === 'email' && identifier)) {
      const activeEmail = data.user?.email || identifier;
      localStorage.setItem('userEmail', activeEmail);
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(
      new CustomEvent('freshcart-user-updated', {
        detail: {
          fullName: displayName,
          email: data.user?.email || (authChannel === 'email' ? identifier : ''),
          phone: data.user?.phone || (authChannel === 'phone' ? identifier : '')
        }
      })
    );

    navigate('/');
  };

  // STEP 1: Send Signup OTP (Phone SMS or Email OTP)
  const handleSendSignupOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!password || password.length < 4) {
      setError('Please choose a password with at least 4 characters.');
      return;
    }

    setIsLoading(true);

    if (authChannel === 'phone') {
      const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        setError('Please enter a valid 10-digit Indian mobile number starting with 6-9');
        setIsLoading(false);
        return;
      }

      // Check with Firebase if configured (10,000 Free SMS / mo)
      if (firebaseReady) {
        try {
          const verifier = setupRecaptcha('signup-recaptcha-container');
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
          console.warn('[Firebase Auth] Falling back to server SMS dispatch:', fbErr.message);
        }
      }

      // Backend SMS Gateway Fallback (Fast2SMS / Dev simulation)
      try {
        const response = await fetch(`${API_URL}/api/auth/signup/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone, fullName: cleanName })
        });

        const data = await response.json();
        if (response.ok) {
          setIsUsingFirebase(false);
          setIsOtpStep(true);
          setDevOtp(data.devOtp || '');
          setResendCountdown(30);
          setSuccessMsg(data.message || `Verification code sent to +91 ${cleanPhone} via SMS`);
        } else {
          setError(data.error || 'Failed to send SMS OTP. Please check your phone number.');
        }
      } catch (err) {
        setError('Could not connect to authentication service. Please check your network.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Email Channel
      const cleanEmail = email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/signup/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, fullName: cleanName })
        });

        const data = await response.json();
        if (response.ok) {
          setIsUsingFirebase(false);
          setIsOtpStep(true);
          setDevOtp(data.devOtp || '');
          setResendCountdown(30);
          setSuccessMsg(data.message || `Verification code sent to ${cleanEmail}`);
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

  // STEP 2: Verify OTP & Create Account
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setError('Please enter the verification code sent to you.');
      setIsLoading(false);
      return;
    }

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
    const cleanEmail = email.trim().toLowerCase();

    // 2A. Firebase Verification
    if (isUsingFirebase && confirmationResult) {
      try {
        const fbResult = await confirmFirebaseOtp(confirmationResult, cleanCode);

        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: cleanName,
            phone: cleanPhone,
            password: password,
            firebaseIdToken: fbResult.idToken
          })
        });

        const data = await response.json();
        if (response.ok) {
          handleAuthSuccess(data, cleanPhone);
          return;
        } else {
          setError(data.error || 'Failed to complete registration.');
        }
      } catch (fbErr) {
        setError(fbErr.message || 'Invalid or expired Firebase verification code.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 2B. Server Gateway Verification
    const payload = {
      fullName: cleanName,
      password: password,
      otp: cleanCode
    };

    if (authChannel === 'phone') {
      payload.phone = cleanPhone;
    } else {
      payload.email = cleanEmail;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        handleAuthSuccess(data, authChannel === 'phone' ? cleanPhone : cleanEmail);
      } else {
        setError(data.error || 'Invalid or expired verification code. Please check and retry.');
      }
    } catch (err) {
      setError('Could not complete registration. Please check your network.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col items-center justify-center p-4">
      {/* Invisible container for Firebase reCAPTCHA */}
      <div id="signup-recaptcha-container"></div>

      {/* Brand Logo Header */}
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

      {/* Main Registration Card */}
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            {isOtpStep ? 'Verify OTP' : 'Create Account'}
          </h2>
          <span className="px-2.5 py-1 bg-emerald-50 text-[#00B074] text-[10px] font-black rounded-full uppercase border border-emerald-100">
            {isOtpStep ? 'Step 2 of 2' : 'Quick Signup'}
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-5">
          {isOtpStep
            ? authChannel === 'phone'
              ? `Enter the 6-digit SMS verification code sent to +91 ${phone.trim().replace(/\D/g, '').slice(-10)}`
              : `Enter the 6-digit email verification code sent to ${email}`
            : 'Sign up to enjoy 10-15 min express delivery right to your door.'}
        </p>

        {/* Feedback Messages */}
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

        {/* STEP 1: FILL DETAILS & CHOOSE CHANNEL */}
        {!isOtpStep && (
          <>
            {/* Channel Tabs: Mobile Phone vs Email Address */}
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

            {/* Google Signup Button */}
            <div className="mb-4">
              <GoogleAuthButton onError={(err) => setError(err)} label="Sign up with Google" />
            </div>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {authChannel === 'phone' ? 'or sign up with mobile phone' : 'or sign up with email'}
              </span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            <form onSubmit={handleSendSignupOtp} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074] transition"
                  />
                </div>
              </div>

              {/* Mobile Phone Input */}
              {authChannel === 'phone' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Mobile Phone Number</label>
                    <span className="text-[10px] font-semibold text-slate-400">Google Firebase SMS</span>
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
                    💬 An SMS verification OTP will be sent to this mobile number.
                  </p>
                </div>
              )}

              {/* Email Address Input */}
              {authChannel === 'email' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
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
                    ✉️ A verification code will be sent to this email address.
                  </p>
                </div>
              )}

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Set Account Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a strong password (min 4 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074] transition"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#00B074] text-white rounded-2xl font-black text-sm hover:bg-[#009663] transition shadow-lg shadow-[#00B074]/25 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Continue & Send OTP</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* STEP 2: VERIFY OTP CODE */}
        {isOtpStep && (
          <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4">
            {/* Developer Mode OTP Preview Banner */}
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
                  className="text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-lg transition"
                >
                  Click to Auto-fill Code
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength="6"
                autoFocus
                placeholder="• • • • • •"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xl font-mono tracking-[0.5em] font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074] transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length < 4}
              className="w-full py-3.5 bg-[#00B074] text-white rounded-2xl font-black text-sm hover:bg-[#009663] transition shadow-lg shadow-[#00B074]/25 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying & Creating Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Verify OTP & Complete Signup</span>
                </>
              )}
            </button>

            {/* Resend & Edit Navigation */}
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
                ← Edit {authChannel === 'phone' ? 'Phone' : 'Email'}
              </button>

              <button
                type="button"
                disabled={resendCountdown > 0 || isLoading}
                onClick={handleSendSignupOtp}
                className="font-bold text-[#00B074] hover:underline disabled:text-slate-400 disabled:no-underline flex items-center gap-1"
              >
                <RotateCw size={13} className={resendCountdown > 0 ? '' : 'text-[#00B074]'} />
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Footer: Sign in link */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#00B074] hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;