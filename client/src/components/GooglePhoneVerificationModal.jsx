import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, Phone, ShieldCheck } from 'lucide-react';
import { API_URL } from '../config';

const GooglePhoneVerificationModal = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const shouldOpen = () => {
      const pending = localStorage.getItem('freshcart_google_phone_pending') === 'true';
      const locationConfirmed = sessionStorage.getItem('freshcart_location_confirmed') === 'true';
      if (pending && locationConfirmed) setIsOpen(true);
    };

    const handleLocationUpdated = () => {
      if (localStorage.getItem('freshcart_google_phone_pending') === 'true') {
        setIsOpen(true);
      }
    };

    shouldOpen();
    window.addEventListener('freshcart-location-updated', handleLocationUpdated);
    window.addEventListener('storage', shouldOpen);
    return () => {
      window.removeEventListener('freshcart-location-updated', handleLocationUpdated);
      window.removeEventListener('storage', shouldOpen);
    };
  }, []);

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  const sendOtp = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Enter a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/google/phone/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ phone: cleanPhone })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not send OTP.');
      setStep('otp');
      setOtp('');
    } catch (err) {
      setError(err.message || 'Could not send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the complete 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/google/phone/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ phone: cleanPhone, otp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'OTP verification failed.');

      localStorage.setItem('userPhone', cleanPhone);
      localStorage.removeItem('freshcart_google_phone_pending');
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('freshcart-user-updated', {
        detail: {
          fullName: data.user?.fullName || localStorage.getItem('fullName'),
          email: data.user?.email || localStorage.getItem('userEmail'),
          phone: cleanPhone,
          avatar: data.user?.avatar || localStorage.getItem('userAvatar')
        }
      }));
      setIsOpen(false);
      if (localStorage.getItem('role') === 'admin') navigate('/admin');
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-white/20">
        <div className="w-12 h-12 rounded-2xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center mb-4">
          {step === 'phone' ? <Phone size={23} /> : <ShieldCheck size={23} />}
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          {step === 'phone' ? 'Verify your mobile number' : 'Enter mobile OTP'}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {step === 'phone'
            ? 'Your location is saved. Add a mobile number to finish Google account setup.'
            : `We sent a 6-digit OTP to +91 ${cleanPhone}.`}
        </p>

        {error && (
          <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-600 flex gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={sendOtp} className="mt-5 space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-sm font-bold text-slate-500">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                autoFocus
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-3 pl-14 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#635BFF]/30"
              />
            </div>
            <button disabled={isLoading} className="w-full rounded-full bg-[#635BFF] py-3.5 text-sm font-black text-white disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading && <Loader2 size={17} className="animate-spin" />}
              Send OTP to Mobile
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-5 space-y-4">
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit OTP"
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-center font-mono text-lg font-black tracking-[0.35em] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#635BFF]/30"
            />
            <button disabled={isLoading} className="w-full rounded-full bg-[#635BFF] py-3.5 text-sm font-black text-white disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
              Verify & Continue
            </button>
            <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="w-full text-xs font-bold text-[#635BFF]">
              Change mobile number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default GooglePhoneVerificationModal;
