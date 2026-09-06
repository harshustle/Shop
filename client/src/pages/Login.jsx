import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Phone, Lock, ArrowRight, ShieldCheck, Sparkles, Loader2, KeyRound, CheckCircle2, X, ShoppingBag, UserCheck, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';

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

  const [activePortal, setActivePortal] = useState('admin'); // 'admin' | 'customer'
  const [formData, setFormData] = useState({
    phone: '9161955178',
    password: 'admin'
  });
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(location.state?.message || '');
  const [isLoading, setIsLoading] = useState(false);

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

  const handlePortalSwitch = (portal) => {
    setActivePortal(portal);
    setError('');
    if (portal === 'admin') {
      setFormData({
        phone: '9161955178',
        password: 'admin'
      });
    } else {
      setFormData({
        phone: '',
        password: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
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
        localStorage.setItem('fullName', data.user?.fullName || (data.role === 'admin' ? 'Admin User' : 'Customer'));
        if (data.user?.email) {
          localStorage.setItem('adminEmail', data.user.email);
        }

        if (data.role === 'admin') {
          navigate('/admin');
        } else {
          if (activePortal === 'admin') {
            setError('Notice: This account does not possess Super Admin privileges.');
            return;
          }
          navigate('/');
        }
      } else {
        setError(data.error || 'Login failed. Please verify your credentials.');
      }
    } catch (err) {
      setError('Could not connect to backend server. Please verify backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setActivePortal('admin');
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
        localStorage.setItem('fullName', data.user?.fullName || (data.role === 'admin' ? 'Admin User' : 'Customer'));

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
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-4">
      
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#00B074] flex items-center justify-center shadow-lg shadow-[#00B074]/20 text-white">
            <ShoppingBag size={24} strokeWidth={2.4} />
          </div>
          <span className="text-3xl font-black text-slate-900 tracking-tight">FreshCart</span>
        </div>
        <p className="text-xs font-semibold text-slate-500 mt-1.5 tracking-wide">
          Enterprise Grocery & Super Admin Platform
        </p>
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative">
        
        {/* Portal Switch Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => handlePortalSwitch('admin')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activePortal === 'admin'
                ? 'bg-white text-[#00B074] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck size={15} />
            <span>Super Admin</span>
          </button>
          <button
            type="button"
            onClick={() => handlePortalSwitch('customer')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activePortal === 'customer'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck size={15} />
            <span>Customer</span>
          </button>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-black text-slate-900">
            {activePortal === 'admin' ? 'Super Admin Portal' : 'Customer Sign In'}
          </h2>
          <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase ${
            activePortal === 'admin' 
              ? 'bg-[#E8F8F0] text-[#00B074]' 
              : 'bg-blue-50 text-blue-600'
          }`}>
            {activePortal === 'admin' ? 'Restricted Access' : 'Quick Order'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          {activePortal === 'admin' 
            ? 'Access complete real-time performance, inventory, orders, and sales metrics.'
            : 'Enter your phone number and password to manage your cart and past orders.'}
        </p>

        {infoMessage && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200/70 rounded-2xl text-xs text-amber-800 font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-amber-600" />
            <span>{infoMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-600 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {activePortal === 'admin' ? 'Admin Mobile / ID' : 'Mobile Number'}
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="tel"
                required
                placeholder="e.g. 9161955178"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => {
                  setOtpPhone(formData.phone || '');
                  setOtpStep(1);
                  setOtpError('');
                  setOtpSuccess('');
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
                type="password"
                required
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#00B074] text-white rounded-2xl font-black text-sm hover:bg-[#009663] transition shadow-lg shadow-[#00B074]/25 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-3"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Super Admin Fill */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={fillAdminCredentials}
            className="text-xs text-[#00B074] bg-[#E8F8F0] hover:bg-emerald-100 px-3.5 py-2 rounded-xl font-bold transition inline-flex items-center gap-1.5"
          >
            <Sparkles size={14} className="text-[#00B074]" />
            <span>Auto-fill Super Admin (9161955178 / admin)</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">
            Need a buyer account?{' '}
            <Link to="/register" className="font-bold text-[#00B074] hover:underline">
              Create Customer Account
            </Link>
          </p>
        </div>

      </div>

      {/* OTP Password Reset Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-[#E8F8F0] flex items-center justify-center text-[#00B074]">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">OTP Password Reset</h3>
                <p className="text-[11px] text-slate-400 font-medium">Valid for Super Admin & Customer accounts</p>
              </div>
            </div>

            {otpError && (
              <div className="my-3 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-600 font-bold">
                {otpError}
              </div>
            )}

            {otpSuccess && (
              <div className="my-3 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-[#00B074] font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-[#00B074]" />
                <span>{otpSuccess}</span>
              </div>
            )}

            {/* STEP 1 */}
            {otpStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Enter Registered Mobile Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setOtpPhone('9161955178')}
                    className="text-[11px] text-[#00B074] font-bold hover:underline"
                  >
                    Use Admin Mobile (9161955178)
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isOtpLoading}
                  className="w-full py-3 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl font-black text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
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

            {/* STEP 2 */}
            {otpStep === 2 && (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-4 mt-4">
                {generatedOtp && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                    <p className="text-[11px] font-bold text-emerald-800">Verification OTP Code:</p>
                    <p className="text-2xl font-mono font-black text-[#00B074] tracking-widest mt-0.5">{generatedOtp}</p>
                    <p className="text-[10px] text-emerald-700 mt-0.5">Valid for 10 minutes</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Enter 6-Digit OTP *</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    placeholder="e.g. 123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full text-center tracking-widest font-mono text-lg font-bold py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00B074]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Set New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (min 4 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00B074]/30"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setOtpStep(1)}
                    className="text-slate-500 font-bold hover:underline text-[11px]"
                  >
                    ← Change Mobile Number
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[#00B074] font-bold hover:underline text-[11px]"
                  >
                    Resend OTP
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isOtpLoading}
                  className="w-full py-3 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl font-black text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
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