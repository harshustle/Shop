import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  MapPin, 
  Loader2, 
  AlertCircle, 
  Navigation,
  Send,
  Smartphone,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';
import GoogleAuthButton from '../components/GoogleAuthButton';
import LocationPickerModal from '../components/LocationPickerModal';

const Register = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { setLocation } = useCart();

  // Multi-step screens: 'welcome' | 'form' | 'otp' | 'location'
  const [step, setStep] = useState('welcome');

  // Unified Form state (both phone and email together)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 6-digit OTP code state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [activeOtpIndex, setActiveOtpIndex] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Status & Feedback
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Digit input refs for keyboard typing
  const digitRefs = useRef([]);

  // Countdown timer for resend code
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Handlers for OTP entry
  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    if (cleanVal && index < 5) {
      setActiveOtpIndex(index + 1);
      if (digitRefs.current[index + 1]) {
        digitRefs.current[index + 1].focus();
      }
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        setActiveOtpIndex(index - 1);
        if (digitRefs.current[index - 1]) digitRefs.current[index - 1].focus();
      }
    }
  };

  const handleDigitPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pastedData.length; i++) {
        newDigits[i] = pastedData[i];
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pastedData.length, 5);
      setActiveOtpIndex(nextFocus);
      if (digitRefs.current[nextFocus]) digitRefs.current[nextFocus].focus();
    }
  };

  // STEP 1: Submit Unified Form & Send OTP directly to Email
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number starting with 6-9.');
      return;
    }

    const rawEmail = email.trim().toLowerCase();
    const cleanEmail = rawEmail.includes('@') ? rawEmail : `${rawEmail}@gmail.com`;
    if (!rawEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 4) {
      setError('Please choose a password with at least 4 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/signup/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanName,
          phone: cleanPhone,
          email: cleanEmail
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResendCountdown(30);
        setStep('otp');
        setActiveOtpIndex(0);
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => {
          if (digitRefs.current[0]) digitRefs.current[0].focus();
        }, 150);
      } else {
        setError(data.error || 'Failed to send OTP to email. Please verify your details.');
      }
    } catch (err) {
      setError('Could not connect to the server. Please verify backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify Email OTP and Complete Registration
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const code = otpDigits.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
    const rawEmail = email.trim().toLowerCase();
    const cleanEmail = rawEmail.includes('@') ? rawEmail : `${rawEmail}@gmail.com`;

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          password: password,
          otp: code
        })
      });

      const data = await res.json();
      if (res.ok && (data.success || data.token)) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role || 'customer');
        localStorage.setItem('fullName', cleanName);
        localStorage.setItem('userPhone', cleanPhone);
        localStorage.setItem('userEmail', cleanEmail);

        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('freshcart-user-updated', {
          detail: {
            fullName: cleanName,
            phone: cleanPhone,
            email: cleanEmail
          }
        }));

        setStep('location');
      } else {
        setError(data.error || 'Invalid or expired verification code.');
      }
    } catch (err) {
      setError('Could not verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Confirm Delivery Location & Enter Store
  const handleConfirmLocationAccess = () => {
    const bastiLocation = {
      tag: 'Home',
      title: 'Gandhi Nagar',
      address: 'Gandhi Nagar, Company Bagh, Basti, Uttar Pradesh, 272001',
      streetAddress: 'Near Company Bagh, Gandhi Nagar, Basti, UP',
      flatNumber: 'Company Bagh',
      landmark: 'Gandhi Nagar',
      lat: 26.8028,
      lng: 82.7634,
      city: 'Basti',
      state: 'Uttar Pradesh',
      postalCode: '272001',
      isDeliverable: true,
      distanceKm: 0.5,
      etaMinutes: 10
    };

    setLocation(bastiLocation);
    localStorage.setItem('freshcart_selected_location', JSON.stringify(bastiLocation));
    sessionStorage.setItem('freshcart_location_confirmed', 'true');
    sessionStorage.removeItem('fresh_basti_map_opened');

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('freshcart-user-updated', {
      detail: {
        fullName: fullName.trim() || 'Valued Customer',
        phone: phone.slice(-10),
        email: email.trim().toLowerCase()
      }
    }));

    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-[var(--app-bg)] text-[var(--app-text-primary)] flex flex-col justify-center items-center font-sans transition-colors duration-200">
      
      {/* Mobile Screen Container */}
      <div className="w-full max-w-[420px] min-h-screen flex flex-col justify-between px-5 py-4 overflow-y-auto">

        {/* Top Header: fresh. logo on Left, Theme Pills on Right */}
        <div className="w-full flex items-center justify-between h-10 shrink-0 mb-3">
          {step !== 'welcome' && step !== 'location' ? (
            <button
              type="button"
              onClick={() => {
                if (step === 'otp') setStep('form');
                else setStep('welcome');
              }}
              className="w-8 h-8 -ml-1 rounded-full flex items-center justify-center text-[var(--app-text-primary)] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition cursor-pointer"
              aria-label="Back"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
          ) : (
            <Link to="/" className="text-2xl font-black lowercase tracking-tighter text-[var(--app-text-primary)] flex items-center">
              <span>fresh</span>
              <span className="text-[#635BFF] font-black text-2xl">.</span>
            </Link>
          )}

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#635BFF] text-white hover:bg-[#5248EE] active:scale-95 shadow-sm shadow-[#635BFF]/25 transition flex items-center gap-1"
            >
              <span>Log In</span>
            </Link>

            {/* Theme selector */}
            <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.08] p-1 rounded-full">
              <button
                type="button"
                onClick={() => setTheme('white')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                  theme === 'white' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                }`}
              >
                White
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                  theme === 'dark' ? 'bg-slate-900 shadow-xs text-white' : 'text-slate-400'
                }`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('yellow')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                  theme === 'yellow' ? 'bg-amber-400 shadow-xs text-slate-900' : 'text-slate-500'
                }`}
              >
                Yellow
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCREEN 01: WELCOME SCREEN                                                 */}
        {/* ========================================================================= */}
        {step === 'welcome' && (
          <div className="flex-1 flex flex-col justify-between py-2">
            {/* Top dark navy map preview card */}
            <div className="w-full h-[200px] sm:h-[220px] bg-[#0E1128] rounded-[28px] overflow-hidden relative border border-white/[0.08] shadow-lg shrink-0 select-none">
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#818CF8_1.2px,transparent_1.2px)] [background-size:16px_16px]" />

              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 210" fill="none">
                <path d="M 0 110 L 340 70" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
                <path d="M 70 0 L 140 210" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
                <path d="M 230 0 L 280 210" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
                
                <path 
                  d="M 50 165 C 100 170, 160 165, 205 105 C 235 65, 255 55, 282 48" 
                  stroke="#F59E0B" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeDasharray="6 6" 
                />
                
                <path 
                  d="M 70 82 C 120 150, 190 145, 235 90 C 255 68, 268 55, 282 48" 
                  stroke="#635BFF" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                />
              </svg>

              {/* Glowing waypoint circle */}
              <div className="absolute top-[82px] left-[70px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-white/20 animate-ping absolute" />
                <div className="w-4 h-4 rounded-full bg-white border-2 border-[#635BFF] shadow-[0_0_12px_#635BFF]" />
              </div>

              {/* Destination Map Pin */}
              <div className="absolute top-[32px] right-[44px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-[#635BFF]/15 border border-[#635BFF]/30 absolute animate-ping duration-1000" />
                <div className="w-9 h-9 rounded-full bg-[#635BFF]/25 border border-[#635BFF]/40 absolute animate-pulse" />
                
                <svg className="w-8 h-9 text-[#635BFF] drop-shadow-[0_4px_12px_rgba(99,91,255,0.6)] z-10" viewBox="0 0 24 28" fill="none">
                  <path 
                    d="M12 1C6.477 1 2 5.477 2 11C2 17.5 12 26 12 26C12 26 22 17.5 22 11C22 5.477 17.523 1 12 1Z" 
                    fill="#635BFF" 
                    stroke="rgba(255,255,255,0.4)" 
                    strokeWidth="1"
                  />
                  <circle cx="12" cy="11" r="3.5" fill="#FFFFFF" />
                </svg>
              </div>

              {/* Status Pill */}
              <div className="absolute bottom-3 left-3.5 bg-[#121634]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399] animate-pulse" />
                <span className="text-[10.5px] font-semibold text-slate-200 whitespace-nowrap tracking-wide">
                  Basti Hub to Doorstep
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className="my-auto py-4">
              <h1 className="text-[28px] sm:text-[32px] font-black tracking-tight text-[var(--app-text-primary)] leading-[1.15]">
                Send anything,<br />anywhere today.
              </h1>
              <p className="text-[13px] text-[var(--app-text-muted)] font-normal mt-2 leading-relaxed">
                Order fresh groceries and daily essentials in seconds. Delivered directly to your home in Basti in 10-15 minutes.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full h-12.5 px-5 rounded-full bg-[#635BFF] hover:bg-[#5248EE] active:scale-98 text-white text-sm font-bold shadow-lg shadow-[#635BFF]/30 transition flex items-center justify-between cursor-pointer"
              >
                <div className="w-5 flex items-center justify-center">
                  <Smartphone size={18} strokeWidth={2.2} />
                </div>
                <span className="flex-1 text-center font-bold">Create Account (Email & Phone)</span>
                <div className="w-5 flex items-center justify-center">
                  <ArrowRight size={18} strokeWidth={2.2} />
                </div>
              </button>

              <GoogleAuthButton label="Continue with Google" showArrow={true} />

              <div className="pt-2 text-center flex items-center justify-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Already have an account?</span>
                <Link
                  to="/login"
                  className="text-xs font-bold text-[#635BFF] hover:underline flex items-center gap-0.5"
                >
                  <span>Log In</span>
                  <ArrowRight size={13} strokeWidth={2.5} />
                </Link>
              </div>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 pt-1">
                By continuing, you agree to our{' '}
                <Link to="/terms" className="text-[#635BFF] font-semibold hover:underline">Terms</Link> and{' '}
                <Link to="/privacy" className="text-[#635BFF] font-semibold hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 02: UNIFIED REGISTRATION FORM (Phone + Email + Name + Password)     */}
        {/* ========================================================================= */}
        {(step === 'form' || step === 'phone') && (
          <div className="flex-1 flex flex-col justify-between py-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black tracking-tight text-[var(--app-text-primary)]">
                  Create Account
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#635BFF]/10 text-[#635BFF]">
                  Email OTP
                </span>
              </div>
              <p className="text-xs text-[var(--app-text-muted)] mb-4">
                Fill both your mobile number and email. Verification OTP will be sent to your email.
              </p>

              {/* Error Alert */}
              {error && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2 shadow-xs">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-3.5">
                {/* 1. Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Harsh Srivastava"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] transition"
                    />
                  </div>
                </div>

                {/* 2. Mobile Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center gap-1 text-slate-400 font-bold text-xs pointer-events-none">
                      <Smartphone size={15} />
                      <span className="text-slate-500 ml-0.5">+91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-16 pr-4 py-2.5 bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] transition"
                    />
                  </div>
                </div>

                {/* 3. Email Address (OTP sent here) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email Address
                    </label>
                    <span className="text-[10px] font-bold text-[#635BFF]">
                      ✉️ Receives OTP Code
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <Mail size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="yourname"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-24 py-2.5 bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] transition"
                    />
                    {!email.includes('@') && (
                      <span className="absolute right-3 px-2 py-0.5 bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold pointer-events-none select-none">
                        @gmail.com
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Create account password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !fullName.trim() || phone.length < 10 || !email.trim() || password.length < 4}
                    className="w-full h-12 rounded-full bg-[#635BFF] hover:bg-[#5248EE] active:scale-98 text-white text-sm font-bold shadow-md shadow-[#635BFF]/25 transition flex items-center justify-between px-5 cursor-pointer disabled:opacity-50"
                  >
                    <div className="w-5" />
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending OTP to Email...</span>
                      </div>
                    ) : (
                      <span>Send OTP to Email</span>
                    )}
                    <ArrowRight size={18} strokeWidth={2.2} />
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom info link */}
            <div className="pt-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <span>Already registered?</span>
                <Link to="/login" className="font-bold text-[#635BFF] hover:underline">
                  Sign in here
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 03: VERIFY EMAIL OTP                                               */}
        {/* ========================================================================= */}
        {step === 'otp' && (
          <div className="flex-1 flex flex-col justify-between py-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black tracking-tight text-[var(--app-text-primary)]">
                  Verify Email
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-[var(--app-text-muted)] mb-3">
                We've sent a 6-digit verification code to <strong className="text-[var(--app-text-primary)]">{email.includes('@') ? email : `${email}@gmail.com`}</strong>{' '}
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-[#635BFF] font-semibold underline ml-1 cursor-pointer"
                >
                  Change
                </button>
              </p>

              {/* Error feedback */}
              {error && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2 shadow-xs">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 6 Individual Code Boxes */}
              <div className="flex items-center justify-between gap-1.5 w-full mx-auto my-4">
                {otpDigits.map((digit, idx) => {
                  const isActive = activeOtpIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveOtpIndex(idx);
                        if (digitRefs.current[idx]) digitRefs.current[idx].focus();
                      }}
                      className={`h-12 w-11 sm:w-12 sm:h-13 rounded-2xl flex items-center justify-center text-lg font-black transition cursor-text ${
                        isActive
                          ? 'border-2 border-[#635BFF] ring-2 ring-[#635BFF]/20 bg-[var(--app-card)] text-[var(--app-text-primary)]'
                          : digit
                          ? 'border border-[#635BFF]/50 bg-[var(--app-card)] text-[var(--app-text-primary)]'
                          : 'border border-black/[0.1] dark:border-white/[0.12] bg-[var(--app-card)] text-[var(--app-text-primary)]'
                      }`}
                    >
                      <input
                        ref={(el) => (digitRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        onPaste={handleDigitPaste}
                        onFocus={() => setActiveOtpIndex(idx)}
                        className="w-full h-full text-center bg-transparent focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Resend Timer Text */}
              <div className="text-xs text-[var(--app-text-muted)] text-center my-2">
                {resendCountdown > 0 ? (
                  <span>Didn't receive email? Resend code in 0:{resendCountdown < 10 ? `0${resendCountdown}` : resendCountdown}</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[#635BFF] font-bold hover:underline cursor-pointer"
                  >
                    Resend verification code to {email.includes('@') ? email : `${email}@gmail.com`}
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Verify Button */}
            <div className="pt-4">
              <button
                type="button"
                disabled={isLoading || otpDigits.join('').length < 6}
                onClick={handleVerifyOtp}
                className="w-full h-12.5 rounded-full bg-[#635BFF] hover:bg-[#5248EE] active:scale-98 text-white text-sm font-bold shadow-md shadow-[#635BFF]/25 transition flex items-center justify-between px-5 cursor-pointer disabled:opacity-50"
              >
                <div className="w-5" />
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying Code & Creating Account...</span>
                  </div>
                ) : (
                  <span>Verify & Create Account</span>
                )}
                <ArrowRight size={18} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 04: LOCATION CONFIRMATION                                          */}
        {/* ========================================================================= */}
        {step === 'location' && (
          <div className="flex-1 flex flex-col justify-between py-2">
            <div>
              <div className="w-full h-44 sm:h-52 bg-[#0E1128] rounded-[28px] overflow-hidden relative border border-white/[0.08] mb-4 flex items-center justify-center shrink-0 shadow-lg">
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#818CF8_1px,transparent_1px)] [background-size:18px_18px]" />
                
                <div className="w-36 h-36 rounded-full bg-[#635BFF]/20 border-2 border-[#635BFF]/40 flex items-center justify-center animate-pulse">
                  <div className="w-20 h-20 rounded-full bg-[#635BFF]/30 flex items-center justify-center" />
                </div>

                <div className="absolute flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-[#635BFF] text-white flex items-center justify-center shadow-2xl border-2 border-white ring-4 ring-[#635BFF]/30">
                    <MapPin size={18} className="stroke-[2.5]" />
                  </div>
                  <div className="w-2 h-2 bg-[#635BFF] -mt-0.5 rounded-b-xs" />
                </div>

                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-[#121634]/90 backdrop-blur-md px-3.5 py-1 rounded-full shadow-md border border-white/10 flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#635BFF]" />
                  <span className="text-[10px] font-semibold text-slate-200">
                    Gandhi Nagar, Basti, UP
                  </span>
                </div>

                <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-[#1A1F3D] border border-white/10 shadow-md flex items-center justify-center text-[#635BFF]">
                  <Navigation size={13} />
                </div>
              </div>

              <div className="text-center px-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
                  <CheckCircle2 size={14} />
                  <span>Account Created Successfully!</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--app-text-primary)]">
                  Turn on location
                </h1>
                <p className="text-xs text-[var(--app-text-muted)] mt-1 leading-relaxed">
                  So we can deliver fresh groceries to your exact doorstep in Basti in 10-15 minutes.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmLocationAccess}
                className="w-full h-12.5 rounded-full bg-[#635BFF] hover:bg-[#5248EE] active:scale-98 text-white text-sm font-bold shadow-md shadow-[#635BFF]/25 transition flex items-center justify-between px-5 cursor-pointer"
              >
                <div className="w-5" />
                <span>Allow location & Start Shopping</span>
                <ArrowRight size={18} strokeWidth={2.2} />
              </button>

              <button
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                className="w-full py-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition text-center cursor-pointer"
              >
                Enter address manually
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Interactive Map Modal fallback */}
      <LocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => {
          setIsMapModalOpen(false);
          handleConfirmLocationAccess();
        }}
      />

    </div>
  );
};

export default Register;