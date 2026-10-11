import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config';

const Register = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('pass123');

  // OTP Verification Step
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Status & Feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleAuthSuccess = (data, userPhone) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role || 'customer');

    const displayName = data.user?.fullName || fullName || 'Customer';
    localStorage.setItem('fullName', displayName);
    localStorage.setItem('userPhone', data.user?.phone || userPhone);

    sessionStorage.removeItem('fresh_basti_map_opened');

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(
      new CustomEvent('freshcart-user-updated', {
        detail: {
          fullName: displayName,
          phone: data.user?.phone || userPhone
        }
      })
    );

    navigate('/');
  };

  const handleSendSignupOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      setError('Enter your full name');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Enter valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/signup/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, fullName: cleanName })
      });

      const data = await response.json();
      if (response.ok) {
        setIsOtpStep(true);
        setDevOtp(data.devOtp || '');
        setResendCountdown(30);
        setSuccessMsg(`OTP sent to +91 ${cleanPhone}`);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpAndRegister = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setError('Enter 6-digit OTP');
      return;
    }

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanName,
          phone: cleanPhone,
          password: password || 'pass123',
          otp: cleanCode
        })
      });

      const data = await response.json();
      if (response.ok) {
        handleAuthSuccess(data, cleanPhone);
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Verification error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text-primary)] flex flex-col font-sans transition-colors duration-200">
      
      {/* Sleek Minimal Header: strictly brand and theme switch */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06]">
        <Link to="/" className="text-lg font-black lowercase tracking-tighter text-[var(--app-text-primary)]">
          fresh
        </Link>

        {/* 3-Theme Switcher */}
        <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.08] p-0.5 rounded-full">
          <button
            type="button"
            onClick={() => setTheme('white')}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
              theme === 'white' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
            }`}
          >
            White
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
              theme === 'dark' ? 'bg-slate-900 shadow-xs text-white' : 'text-slate-400'
            }`}
          >
            Dark
          </button>
          <button
            type="button"
            onClick={() => setTheme('yellow')}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
              theme === 'yellow' ? 'bg-amber-400 shadow-xs text-slate-900' : 'text-slate-500'
            }`}
          >
            Yellow
          </button>
        </div>
      </header>

      {/* Simple, flat, non-card full mobile layout */}
      <div className="flex-1 max-w-sm w-full mx-auto px-5 py-8 flex flex-col justify-center">
        
        {/* Simple title */}
        <div className="mb-5">
          <h1 className="text-lg font-black tracking-tight text-[var(--app-text-primary)]">
            {isOtpStep ? 'Verify OTP' : 'Sign up to continue'}
          </h1>
          <p className="text-[11px] text-[var(--app-text-muted)] mt-0.5">
            {isOtpStep ? `Enter code sent to +91 ${phone.slice(-10)}` : 'Fast doorstep delivery in Basti'}
          </p>
        </div>

        {/* Status alerts */}
        {error && (
          <div className="mb-3 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
            <AlertCircle size={13} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Test OTP Helper */}
        {devOtp && isOtpStep && (
          <div className="mb-3 p-2 rounded-xl bg-[#635BFF]/10 text-[11px] flex items-center justify-between">
            <span className="font-semibold text-[#635BFF] dark:text-[#A59FFF]">
              OTP: <strong>{devOtp}</strong>
            </span>
            <button
              type="button"
              onClick={() => setOtpCode(devOtp)}
              className="px-2 py-0.5 rounded-full bg-[#635BFF] text-white text-[10px] font-bold"
            >
              Fill
            </button>
          </div>
        )}

        {!isOtpStep ? (
          /* STEP 1: Details */
          <form onSubmit={handleSendSignupOtp} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-[var(--app-text-muted)] uppercase mb-1">
                Full Name
              </label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Harsh Srivastav"
                  className="w-full pl-8 pr-3 py-2 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs font-semibold text-[var(--app-text-primary)] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--app-text-muted)] uppercase mb-1">
                Mobile Number
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-slate-400 select-none">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full pl-11 pr-3 py-2 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs font-semibold text-[var(--app-text-primary)] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 mt-2 rounded-full bg-[#635BFF] hover:bg-[#5248EE] active:scale-98 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: OTP */
          <form onSubmit={handleVerifyOtpAndRegister} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-[var(--app-text-muted)] uppercase mb-1">
                Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full py-2 text-center text-base font-black tracking-[0.3em] bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[var(--app-text-primary)] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 mt-1 rounded-full bg-[#635BFF] hover:bg-[#5248EE] active:scale-98 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <span>Verify & Continue</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <button
                type="button"
                onClick={() => setIsOtpStep(false)}
                className="font-medium text-slate-400 hover:text-slate-600"
              >
                Change details
              </button>
              {resendCountdown > 0 ? (
                <span className="text-slate-400 font-medium">Resend in {resendCountdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendSignupOtp}
                  className="font-bold text-[#635BFF] hover:underline"
                >
                  Resend code
                </button>
              )}
            </div>
          </form>
        )}

        <div className="pt-4 text-center text-[11px] text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#635BFF] hover:underline">
            Log in
          </Link>
        </div>

      </div>

    </div>
  );
};

export default Register;