import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, ArrowRight, ShieldCheck, Sparkles, Loader2, KeyRound, CheckCircle2, X } from 'lucide-react';
import { API_URL } from '../config';

const Login = () => {
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // OTP Password Reset Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpStep, setOtpStep] = useState(1); // 1 = Enter Phone, 2 = Enter OTP & New Password
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [isOtpLoading, setIsOtpLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userPhone', formData.phone);
        localStorage.setItem('role', data.role);
        localStorage.setItem('fullName', data.user?.fullName || (data.role === 'admin' ? 'Harsh Srivastava' : 'Customer'));

        if (data.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setError(data.error || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setError('Could not connect to backend server. Ensure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setFormData({
      phone: '9161955178',
      password: 'admin'
    });
  };

  // OTP Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');
    setIsOtpLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone })
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedOtp(data.otp);
        setOtpSuccess(data.message || 'OTP generated successfully!');
        setOtpStep(2);
      } else {
        setOtpError(data.error || 'Failed to send OTP. Verify your phone number.');
      }
    } catch (err) {
      setOtpError('Error communicating with server.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // OTP Step 2: Verify OTP & Reset Password
  const handleVerifyOtpAndReset = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');
    setIsOtpLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password-with-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: otpPhone,
          otp: otpCode,
          newPassword: newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setOtpSuccess('Password reset successfully! Logging you in...');
        localStorage.setItem('token', data.token);
        localStorage.setItem('userPhone', otpPhone);
        localStorage.setItem('role', data.role);
        localStorage.setItem('fullName', data.user?.fullName || (data.role === 'admin' ? 'Harsh Srivastava' : 'Customer'));

        setTimeout(() => {
          if (data.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 1200);
      } else {
        setOtpError(data.error || 'Invalid OTP or password requirement not met.');
      }
    } catch (err) {
      setOtpError('Error communicating with server.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col items-center justify-center p-4">
      
      {/* Brand Logo Header */}
      <div className="mb-6 text-center">
        <Link to="/" className="inline-flex items-baseline tracking-tighter">
          <span className="text-4xl font-black text-black">blink</span>
          <span className="text-4xl font-black text-[#0C831F]">it</span>
          <span className="w-3 h-3 rounded-full bg-[#F7D02C] ml-0.5"></span>
        </Link>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">India's Last Minute App</p>
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-xl relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-gray-900">Welcome Back</h2>
          <span className="px-2.5 py-0.5 bg-emerald-50 text-[#0C831F] text-[10px] font-black rounded-full uppercase">
            ⚡ 10 Min Delivery
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-6">Enter your mobile number and password to access your quick cart and order history.</p>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="tel"
                required
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0C831F]/30 focus:border-[#0C831F]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">Password</label>
              <button
                type="button"
                onClick={() => {
                  setOtpPhone(formData.phone || '');
                  setOtpStep(1);
                  setOtpError('');
                  setOtpSuccess('');
                  setShowOtpModal(true);
                }}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline"
              >
                Forgot Password? (Reset via OTP)
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0C831F]/30 focus:border-[#0C831F]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#0C831F] text-white rounded-2xl font-black text-sm hover:bg-[#0A6E1A] transition shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Logging In...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Admin Login Pill */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <button
            type="button"
            onClick={fillAdminCredentials}
            className="text-[11px] text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl font-bold transition inline-flex items-center gap-1.5"
          >
            <Sparkles size={13} className="text-amber-600" />
            <span>Fill Admin Credentials (9161955178)</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-[#0C831F] hover:underline">
              Register now
            </Link>
          </p>
        </div>

      </div>

      {/* OTP PASSWORD RESET MODAL (For SuperAdmin AND Normal Customers) */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <KeyRound size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">OTP Password Reset</h3>
                <p className="text-[11px] text-gray-400 font-medium">Valid for SuperAdmin & Customer accounts</p>
              </div>
            </div>

            {otpError && (
              <div className="my-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold">
                {otpError}
              </div>
            )}

            {otpSuccess && (
              <div className="my-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{otpSuccess}</span>
              </div>
            )}

            {/* STEP 1: Enter Mobile to Request OTP */}
            {otpStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Enter Registered Mobile Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setOtpPhone('9161955178')}
                    className="text-[11px] text-amber-700 font-bold hover:underline"
                  >
                    Use Admin Mobile (9161955178)
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isOtpLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isOtpLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <span>Send 6-Digit OTP</span>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Enter OTP & New Password */}
            {otpStep === 2 && (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-4 mt-4">
                {generatedOtp && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <p className="text-[11px] font-bold text-amber-800">Demo Verification OTP Code:</p>
                    <p className="text-xl font-mono font-black text-amber-900 tracking-widest mt-0.5">{generatedOtp}</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">Valid for 10 minutes</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Enter 6-Digit OTP *</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    placeholder="e.g. 123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full text-center tracking-widest font-mono text-lg font-bold py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Set New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (min 4 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setOtpStep(1)}
                    className="text-gray-500 font-bold hover:underline text-[11px]"
                  >
                    ← Change Mobile Number
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-amber-700 font-bold hover:underline text-[11px]"
                  >
                    Resend OTP
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isOtpLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isOtpLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Verifying & Updating...</span>
                    </>
                  ) : (
                    <span>Verify OTP & Save New Password</span>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Login;