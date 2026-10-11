import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronDown,
  MapPin, 
  Loader2, 
  AlertCircle, 
  Navigation,
  Send,
  Delete,
  Smartphone,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';
import GoogleAuthButton from '../components/GoogleAuthButton';
import LocationPickerModal from '../components/LocationPickerModal';
import {
  isFirebaseConfigured,
  setupRecaptcha,
  sendFirebaseOtp,
  confirmFirebaseOtp
} from '../firebase';

// Reusable iOS-style Phone Keypad matching reference screens 03 and 04 (compact, non-scrollable)
const DialPad = ({ onDigitPress, onBackspace }) => {
  const keys = [
    { num: '1', sub: '' },
    { num: '2', sub: 'ABC' },
    { num: '3', sub: 'DEF' },
    { num: '4', sub: 'GHI' },
    { num: '5', sub: 'JKL' },
    { num: '6', sub: 'MNO' },
    { num: '7', sub: 'PQRS' },
    { num: '8', sub: 'TUV' },
    { num: '9', sub: 'WXYZ' },
    { num: '', sub: '' },
    { num: '0', sub: '' },
    { num: 'delete', sub: '' },
  ];

  return (
    <div className="w-full max-w-[340px] mx-auto grid grid-cols-3 gap-x-2 gap-y-1 pt-1 pb-0.5 select-none shrink-0">
      {keys.map((k, idx) => {
        if (!k.num) {
          return <div key={idx} className="h-9" />;
        }
        if (k.num === 'delete') {
          return (
            <button
              key={idx}
              type="button"
              onClick={onBackspace}
              className="h-9 rounded-xl flex items-center justify-center text-[var(--app-text-primary)] hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition cursor-pointer"
              aria-label="Backspace"
            >
              <Delete size={17} strokeWidth={1.8} />
            </button>
          );
        }
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onDigitPress(k.num)}
            className="h-9 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.12] active:scale-95 transition flex flex-col items-center justify-center cursor-pointer border border-black/[0.03] dark:border-white/[0.05]"
          >
            <span className="text-base font-semibold leading-none text-[var(--app-text-primary)]">
              {k.num}
            </span>
            {k.sub && (
              <span className="text-[7px] font-bold tracking-wider text-[var(--app-text-muted)] mt-0.5">
                {k.sub}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

const Register = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { setLocation } = useCart();

  // Multi-step screens: 'splash' | 'welcome' | 'phone' | 'otp' | 'name' | 'location'
  const [step, setStep] = useState('welcome');

  // Form state
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // 6-digit OTP code state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [activeOtpIndex, setActiveOtpIndex] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [devOtpCode, setDevOtpCode] = useState('');

  // Status & Feedback
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Firebase Phone Auth state (10,000 Free SMS / mo)
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isUsingFirebase, setIsUsingFirebase] = useState(false);
  const firebaseReady = isFirebaseConfigured();

  // Digit input refs for keyboard typing
  const digitRefs = useRef([]);

  // Lock body/html scroll on onboarding
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

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

  // Ensure strict sequential flow: cannot be on OTP or beyond without a 10-digit phone number
  useEffect(() => {
    const clean = phone.trim().replace(/\D/g, '');
    if ((step === 'otp' || step === 'name' || step === 'location') && clean.length < 10) {
      setStep('phone');
    }
  }, [step, phone]);

  // Dialpad handlers for Phone entry
  const handlePhoneDialPress = (digit) => {
    if (phone.length < 10) {
      setPhone((prev) => prev + digit);
    }
  };

  const handlePhoneBackspace = () => {
    setPhone((prev) => prev.slice(0, -1));
  };

  // Dialpad & Keyboard handlers for OTP entry
  const handleOtpDigitInput = (digit) => {
    const nextDigits = [...otpDigits];
    let targetIdx = activeOtpIndex;
    if (targetIdx >= 6) targetIdx = 5;

    nextDigits[targetIdx] = digit;
    setOtpDigits(nextDigits);

    const nextIdx = Math.min(targetIdx + 1, 5);
    setActiveOtpIndex(nextIdx);
    if (digitRefs.current[nextIdx]) {
      digitRefs.current[nextIdx].focus();
    }
  };

  const handleOtpBackspace = () => {
    const nextDigits = [...otpDigits];
    let targetIdx = activeOtpIndex;
    if (nextDigits[targetIdx] === '' && targetIdx > 0) {
      targetIdx -= 1;
    }
    nextDigits[targetIdx] = '';
    setOtpDigits(nextDigits);
    setActiveOtpIndex(targetIdx);
    if (digitRefs.current[targetIdx]) {
      digitRefs.current[targetIdx].focus();
    }
  };

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

  // STEP 1: Send OTP to Phone
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);

    // 1A. Primary: Instant Server Auto-OTP dispatch (Stores in Redis, instant auto-fill)
    try {
      const res = await fetch(`${API_URL}/api/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsUsingFirebase(false);
        setConfirmationResult(null);
        setResendCountdown(24);
        setStep('otp');
        setActiveOtpIndex(0);
        if (data.devOtp) {
          const otpStr = data.devOtp.toString();
          setDevOtpCode(otpStr);
          const chars = otpStr.split('').slice(0, 6);
          setOtpDigits(chars);
        }
        setTimeout(() => {
          if (digitRefs.current[0]) digitRefs.current[0].focus();
        }, 150);
        setIsLoading(false);
        return;
      } else {
        setError(data.error || 'Failed to send OTP code. Please retry.');
      }
    } catch (err) {
      console.warn('Server OTP dispatch notice:', err);
    }

    // 1B. Firebase Phone Auth fallback
    if (firebaseReady) {
      try {
        const verifier = setupRecaptcha('register-recaptcha-container');
        if (verifier) {
          const confirmRes = await sendFirebaseOtp(cleanPhone, verifier);
          setConfirmationResult(confirmRes);
          setIsUsingFirebase(true);
          setDevOtpCode('');
          setResendCountdown(24);
          setStep('otp');
          setActiveOtpIndex(0);
          setTimeout(() => {
            if (digitRefs.current[0]) digitRefs.current[0].focus();
          }, 150);
          setIsLoading(false);
          return;
        }
      } catch (fbErr) {
        console.warn('[Firebase Auth] Notice:', fbErr.message);
        setError(fbErr.message || 'Firebase phone verification failed');
      }
    }

    setIsLoading(false);
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const code = otpDigits.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
    setIsLoading(true);

    // 2A. Instant Server-side OTP Verification (Default & Reliable)
    if (!isUsingFirebase || devOtpCode || !confirmationResult) {
      try {
        const res = await fetch(`${API_URL}/api/auth/otp/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone, otp: code })
        });

        const data = await res.json();
        if (res.ok && (data.success || data.token)) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.role || 'customer');
          localStorage.setItem('userPhone', cleanPhone);

          if (data.user?.fullName && !data.user.fullName.startsWith('User ')) {
            const parts = data.user.fullName.split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
          }

          setStep('name');
          return;
        } else {
          setError(data.error || 'Invalid or expired verification code.');
          return;
        }
      } catch (err) {
        setError('Could not verify code. Please try again.');
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // 2B. Firebase Phone Auth Verification fallback
    if (isUsingFirebase && confirmationResult) {
      try {
        const fbResult = await confirmFirebaseOtp(confirmationResult, code);
        const res = await fetch(`${API_URL}/api/auth/firebase-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            idToken: fbResult.idToken
          })
        });

        const data = await res.json();
        if (res.ok && (data.success || data.token)) {
          localStorage.setItem('token', data.token || data.accessToken);
          localStorage.setItem('role', data.role || 'customer');
          localStorage.setItem('userPhone', cleanPhone);

          if (data.user?.fullName && !data.user.fullName.startsWith('User ')) {
            const parts = data.user.fullName.split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
          }

          setStep('name');
          return;
        } else {
          setError(data.error || 'Authentication with Firebase failed.');
          return;
        }
      } catch (fbVerifyErr) {
        setError(fbVerifyErr.message || 'Invalid or expired Firebase verification code.');
        return;
      } finally {
        setIsLoading(false);
      }
    }
  };

  // STEP 3: Save Name
  const handleSaveName = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const fName = firstName.trim();
    if (!fName || fName.length < 2) {
      setError('Please enter your first name.');
      return;
    }

    const combinedName = `${fName} ${lastName.trim()}`.trim();
    localStorage.setItem('fullName', combinedName);

    setIsLoading(true);
    const token = localStorage.getItem('token');

    if (token) {
      try {
        await fetch(`${API_URL}/api/account/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ fullName: combinedName })
        });
      } catch (err) {
        // continue even if profile endpoint is silent
      }
    }

    setIsLoading(false);
    setStep('location');
  };

  // STEP 4: Confirm Location & Enter Store
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
        fullName: `${firstName} ${lastName}`.trim() || 'Harsh',
        phone: phone.slice(-10)
      }
    }));

    navigate('/');
  };

  // Step List for bottom progress stepper
  const stepsList = [
    { id: 'splash', num: '01', label: 'Splash' },
    { id: 'welcome', num: '02', label: 'Welcome' },
    { id: 'phone', num: '03', label: 'Phone' },
    { id: 'otp', num: '04', label: 'Verify' },
    { id: 'name', num: '05', label: 'Name' },
    { id: 'location', num: '06', label: 'Location' },
  ];

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-[var(--app-bg)] text-[var(--app-text-primary)] flex flex-col justify-center items-center font-sans transition-colors duration-200 select-none touch-none overscroll-none">
      
      {/* Centered Mobile Screen Frame locked strictly to viewport with zero scrolling */}
      <div className="w-full max-w-[400px] h-full max-h-[100dvh] flex flex-col justify-between px-5 pt-3 pb-3 overflow-hidden overscroll-none">

        {/* Top Header: fresh. logo on Left, Theme Pills on Right */}
        <div className="w-full flex items-center justify-between h-9 shrink-0 mb-1">
          {step !== 'welcome' && step !== 'splash' && step !== 'location' ? (
            <button
              type="button"
              onClick={() => {
                if (step === 'otp') setStep('phone');
                else if (step === 'name') setStep('otp');
                else setStep('welcome');
              }}
              className="w-8 h-8 -ml-1 rounded-full flex items-center justify-center text-[var(--app-text-primary)] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition cursor-pointer"
              aria-label="Back"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
          ) : step === 'splash' ? (
            <button
              type="button"
              onClick={() => setStep('welcome')}
              className="text-xs font-bold text-white/80 hover:text-white"
            >
              Skip
            </button>
          ) : (
            <Link to="/" className="text-2xl font-black lowercase tracking-tighter text-[var(--app-text-primary)] flex items-center">
              <span>fresh</span>
              <span className="text-[#635BFF] font-black text-2xl">.</span>
            </Link>
          )}

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

        {/* ========================================================================= */}
        {/* SCREEN 01: SPLASH (Matching reference 01 Splash)                          */}
        {/* ========================================================================= */}
        {step === 'splash' && (
          <div 
            onClick={() => setStep('welcome')}
            className="flex-1 flex flex-col justify-between py-10 items-center text-center rounded-[28px] bg-[#635BFF] text-white shadow-xl cursor-pointer select-none overflow-hidden my-1"
          >
            <div />
            <div className="flex flex-col items-center">
              <div className="w-18 h-18 rounded-3xl bg-white text-[#635BFF] flex items-center justify-center shadow-2xl mb-4">
                <Send size={30} className="stroke-[2.5] rotate-[-20deg]" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">fresh.</h1>
              <p className="text-xs font-medium text-white/80 mt-1">Deliver Anywhere</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-white/80">Send, track and receive with ease.</p>
              <div className="w-24 h-1 bg-white/40 rounded-full mx-auto mt-3" />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 02: WELCOME (Matching reference 02 Welcome exactly)                */}
        {/* ========================================================================= */}
        {step === 'welcome' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden py-1">
            {/* Top dark navy map preview card matching reference */}
            <div className="w-full h-[190px] sm:h-[220px] bg-[#0E1128] rounded-[28px] overflow-hidden relative border border-white/[0.08] shadow-lg shrink-0 select-none">
              {/* Star grid / subtle dots pattern */}
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#818CF8_1.2px,transparent_1.2px)] [background-size:16px_16px]" />

              {/* Vector road curves matching reference */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 210" fill="none">
                {/* Subtle background street lines */}
                <path d="M 0 110 L 340 70" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
                <path d="M 70 0 L 140 210" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
                <path d="M 230 0 L 280 210" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
                
                {/* Yellow/Orange dashed route line */}
                <path 
                  d="M 50 165 C 100 170, 160 165, 205 105 C 235 65, 255 55, 282 48" 
                  stroke="#F59E0B" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeDasharray="6 6" 
                />
                
                {/* Purple solid route line */}
                <path 
                  d="M 70 82 C 120 150, 190 145, 235 90 C 255 68, 268 55, 282 48" 
                  stroke="#635BFF" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                />
              </svg>

              {/* Left glowing waypoint circle */}
              <div className="absolute top-[82px] left-[70px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-white/20 animate-ping absolute" />
                <div className="w-4 h-4 rounded-full bg-white border-2 border-[#635BFF] shadow-[0_0_12px_#635BFF]" />
              </div>

              {/* Right Destination Map Pin with Radar Rings */}
              <div className="absolute top-[32px] right-[44px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                {/* Concentric radar rings */}
                <div className="w-14 h-14 rounded-full bg-[#635BFF]/15 border border-[#635BFF]/30 absolute animate-ping duration-1000" />
                <div className="w-9 h-9 rounded-full bg-[#635BFF]/25 border border-[#635BFF]/40 absolute animate-pulse" />
                
                {/* Teardrop map pin with white circular inner hole matching reference */}
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

              {/* Bottom Left Status Pill: Basti Hub to Doorstep */}
              <div className="absolute bottom-3 left-3.5 bg-[#121634]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399] animate-pulse" />
                <span className="text-[10.5px] font-semibold text-slate-200 whitespace-nowrap tracking-wide">
                  Basti Hub to Doorstep
                </span>
              </div>
            </div>

            {/* Typography */}
            <div className="my-auto py-2 shrink-0">
              <h1 className="text-[28px] sm:text-[32px] font-black tracking-tight text-[var(--app-text-primary)] leading-[1.12]">
                Send anything,<br />anywhere today.
              </h1>
              <p className="text-[13px] text-[var(--app-text-muted)] font-normal mt-2 leading-relaxed">
                Order fresh groceries and daily essentials in seconds. Delivered directly to your home in Basti.
              </p>
            </div>

            {/* Bottom Actions with phone and google pill buttons */}
            <div className="space-y-2.5 pt-1 shrink-0">
              {/* 1. Continue with phone number */}
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full h-12.5 px-5 rounded-full bg-[#635BFF] hover:bg-[#5248EE] active:scale-98 text-white text-sm font-bold shadow-lg shadow-[#635BFF]/30 transition flex items-center justify-between cursor-pointer"
              >
                <div className="w-5 flex items-center justify-center">
                  <Smartphone size={18} strokeWidth={2.2} />
                </div>
                <span className="flex-1 text-center font-bold">Continue with phone number</span>
                <div className="w-5 flex items-center justify-center">
                  <ArrowRight size={18} strokeWidth={2.2} />
                </div>
              </button>

              {/* 2. Continue with Google */}
              <GoogleAuthButton label="Continue with Google" showArrow={true} />

              {/* Legal fine print with interactive Links and Age Verification (Requirements 1, 2, 6, 17) */}
              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 pt-0.5">
                By continuing, you confirm you are 18+ and agree to our{' '}
                <Link to="/terms" className="text-[#635BFF] font-semibold hover:underline">Terms</Link> and{' '}
                <Link to="/privacy" className="text-[#635BFF] font-semibold hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 03: PHONE NUMBER (Matching reference 03 Phone number)              */}
        {/* ========================================================================= */}
        {step === 'phone' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden py-1">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--app-text-primary)]">
                Enter your phone number
              </h1>
              <p className="text-xs text-[var(--app-text-muted)] mt-0.5 mb-4">
                We'll text you a code to confirm it's you.
              </p>

              {/* Error Alert */}
              {error && (
                <div className="mb-3 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-xs font-semibold text-rose-600 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Phone Input Row */}
              <div className="flex items-center gap-2">
                {/* Country Code Selector */}
                <div className="w-20 h-11 px-2.5 bg-[var(--app-card)] border border-black/[0.1] dark:border-white/[0.12] rounded-xl flex items-center justify-between text-xs font-semibold select-none shrink-0 text-[var(--app-text-primary)]">
                  <span className="flex items-center gap-1">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </span>
                  <ChevronDown size={12} className="text-slate-400" />
                </div>

                {/* Number Input Box with Active Purple Ring */}
                <div className="flex-1 relative">
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="803 456 7890"
                    autoFocus
                    className="w-full h-11 px-3.5 pr-8 bg-[var(--app-card)] border border-[#635BFF] ring-2 ring-[#635BFF]/20 rounded-xl text-base font-bold tracking-wider text-[var(--app-text-primary)] placeholder-slate-400 focus:outline-none transition"
                  />
                  {phone.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPhone('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Section: Continue Button directly above Dialpad */}
            <div className="shrink-0">
              <button
                type="button"
                disabled={isLoading || phone.length < 10}
                onClick={handleSendOtp}
                className="w-full h-12 rounded-full bg-[#635BFF] hover:bg-[#5248EE] active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-[#635BFF]/25 transition flex items-center justify-between px-5 cursor-pointer disabled:opacity-50 mb-1"
              >
                <div className="w-5" />
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <span>Continue</span>
                )}
                <ArrowRight size={18} strokeWidth={2.2} />
              </button>

              {/* iOS-Style Dialpad Keypad */}
              <DialPad 
                onDigitPress={handlePhoneDialPress} 
                onBackspace={handlePhoneBackspace} 
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 04: VERIFY CODE (Matching reference 04 Verify code)                */}
        {/* ========================================================================= */}
        {step === 'otp' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden py-1">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--app-text-primary)]">
                Enter the 6-digit code
              </h1>
              <p className="text-xs text-[var(--app-text-muted)] mt-0.5 mb-3">
                Sent to +91 {phone.slice(-10)}{' '}
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-[#635BFF] font-semibold underline ml-1 cursor-pointer"
                >
                  Change
                </button>
              </p>

              {/* Quick Auto-OTP Feedback Badge */}
              {devOtpCode && (
                <div className="mb-2.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Auto-Code: <strong className="font-mono tracking-wider text-sm">{devOtpCode}</strong></span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Auto-filled
                  </span>
                </div>
              )}

              {/* Error feedback */}
              {error && (
                <div className="mb-2.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-xs font-semibold text-rose-600 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 6 Individual Code Boxes matching Screen 04 */}
              <div className="flex items-center justify-between gap-1.5 w-full mx-auto mb-2">
                {otpDigits.map((digit, idx) => {
                  const isActive = activeOtpIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveOtpIndex(idx);
                        if (digitRefs.current[idx]) digitRefs.current[idx].focus();
                      }}
                      className={`h-11 w-10 sm:w-11 sm:h-12 rounded-xl flex items-center justify-center text-base font-bold transition cursor-text ${
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
              <div className="text-xs text-[var(--app-text-muted)]">
                {resendCountdown > 0 ? (
                  <span>Didn't get it? Resend in 0:{resendCountdown < 10 ? `0${resendCountdown}` : resendCountdown}</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[#635BFF] font-bold hover:underline cursor-pointer"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Section: Verify Button directly above Dialpad */}
            <div className="shrink-0">
              <button
                type="button"
                disabled={isLoading || otpDigits.join('').length < 6}
                onClick={handleVerifyOtp}
                className="w-full h-12 rounded-full bg-[#635BFF] hover:bg-[#5248EE] active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-[#635BFF]/25 transition flex items-center justify-between px-5 cursor-pointer disabled:opacity-50 mb-1"
              >
                <div className="w-5" />
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <span>Verify</span>
                )}
                <ArrowRight size={18} strokeWidth={2.2} />
              </button>

              {/* iOS-Style Dialpad Keypad */}
              <DialPad 
                onDigitPress={handleOtpDigitInput} 
                onBackspace={handleOtpBackspace} 
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 05: YOUR DETAILS (Matching reference 05 What's your name?)         */}
        {/* ========================================================================= */}
        {step === 'name' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden py-1">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--app-text-primary)]">
                What's your name?
              </h1>
              <p className="text-xs text-[var(--app-text-muted)] mt-0.5 mb-5">
                Riders and receivers will see this on your deliveries.
              </p>

              {/* Error feedback */}
              {error && (
                <div className="mb-3 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-xs font-semibold text-rose-600 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* First Name & Last Name Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    First name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Tega"
                    autoFocus
                    className="w-full h-11 px-3.5 rounded-xl bg-[var(--app-card)] border border-black/[0.1] dark:border-white/[0.12] text-sm font-semibold text-[var(--app-text-primary)] placeholder-slate-400 focus:outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    className="w-full h-11 px-3.5 rounded-xl bg-[var(--app-card)] border border-black/[0.1] dark:border-white/[0.12] text-sm font-semibold text-[var(--app-text-primary)] placeholder-slate-400 focus:outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 transition"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="pt-2 pb-1 shrink-0">
              <button
                type="button"
                disabled={isLoading || !firstName.trim()}
                onClick={handleSaveName}
                className="w-full h-12 rounded-full bg-[#635BFF] hover:bg-[#5248EE] active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-[#635BFF]/25 transition flex items-center justify-between px-5 cursor-pointer disabled:opacity-50"
              >
                <div className="w-5" />
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <span>Continue</span>
                )}
                <ArrowRight size={18} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 06: LOCATION ACCESS (Matching reference 06 Turn on location)       */}
        {/* ========================================================================= */}
        {step === 'location' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden py-1">
            <div>
              {/* Map Illustration with Radar Target & Pin matching Screen 06 */}
              <div className="w-full h-44 sm:h-52 max-h-[30vh] bg-[#0E1128] rounded-[28px] overflow-hidden relative border border-white/[0.08] mb-3 flex items-center justify-center shrink-0 shadow-lg">
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#818CF8_1px,transparent_1px)] [background-size:18px_18px]" />
                
                {/* Radial geofence circle */}
                <div className="w-36 h-36 rounded-full bg-[#635BFF]/20 border-2 border-[#635BFF]/40 flex items-center justify-center animate-pulse">
                  <div className="w-20 h-20 rounded-full bg-[#635BFF]/30 flex items-center justify-center" />
                </div>

                {/* Center Pin Marker */}
                <div className="absolute flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-[#635BFF] text-white flex items-center justify-center shadow-2xl border-2 border-white ring-4 ring-[#635BFF]/30">
                    <MapPin size={18} className="stroke-[2.5]" />
                  </div>
                  <div className="w-2 h-2 bg-[#635BFF] -mt-0.5 rounded-b-xs" />
                </div>

                {/* Top Location Address Pill */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-[#121634]/90 backdrop-blur-md px-3.5 py-1 rounded-full shadow-md border border-white/10 flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#635BFF]" />
                  <span className="text-[10px] font-semibold text-slate-200">
                    Gandhi Nagar, Basti, UP
                  </span>
                </div>

                {/* GPS Navigate Pill */}
                <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-[#1A1F3D] border border-white/10 shadow-md flex items-center justify-center text-[#635BFF]">
                  <Navigation size={13} />
                </div>
              </div>

              {/* Headline & Subtitle */}
              <div className="text-center px-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--app-text-primary)]">
                  Turn on location
                </h1>
                <p className="text-xs text-[var(--app-text-muted)] mt-1 leading-relaxed">
                  So we can set your pickup point and riders can find you without calling around.
                </p>
              </div>
            </div>

            {/* Bottom Buttons matching Screen 06 */}
            <div className="space-y-1.5 pt-1 pb-1 shrink-0">
              <button
                type="button"
                onClick={handleConfirmLocationAccess}
                className="w-full h-12 rounded-full bg-[#635BFF] hover:bg-[#5248EE] active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-[#635BFF]/25 transition flex items-center justify-between px-5 cursor-pointer"
              >
                <div className="w-5" />
                <span>Allow location access</span>
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

        {/* 6-Screen Reference Stepper with connecting line and numbered dots */}
        <div className="w-full pt-2 pb-0.5 shrink-0 select-none">
          <div className="relative flex items-center justify-between px-3">
            {/* Background connecting track */}
            <div className="absolute left-7 right-7 top-[7px] h-[1.5px] bg-slate-200 dark:bg-slate-700/70 -z-0" />

            {stepsList.map((s) => {
              const isActive = step === s.id;
              return (
                <div
                  key={s.id}
                  className="relative z-10 flex flex-col items-center pointer-events-none cursor-default select-none"
                >
                  {/* Dot */}
                  <div
                    className={`rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'w-3.5 h-3.5 bg-[#635BFF] ring-4 ring-[#635BFF]/25 shadow-sm'
                        : 'w-2.5 h-2.5 my-0.5 bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  {/* Number & Label */}
                  <span
                    className={`text-[9.5px] font-bold mt-1.5 transition-colors ${
                      isActive ? 'text-[#635BFF]' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {s.num}
                  </span>
                  <span
                    className={`text-[10px] transition-colors leading-tight ${
                      isActive ? 'text-[#635BFF] font-bold' : 'text-slate-400 dark:text-slate-500 font-medium'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Interactive Map Modal fallback */}
      <LocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => {
          setIsMapModalOpen(false);
          handleConfirmLocationAccess();
        }}
      />

      {/* Invisible container for Firebase reCAPTCHA */}
      <div id="register-recaptcha-container"></div>

    </div>
  );
};

export default Register;