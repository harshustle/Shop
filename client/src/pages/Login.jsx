import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Phone, Lock, ArrowRight, Loader2, KeyRound, CheckCircle2, X, ShoppingBag, AlertCircle } from 'lucide-react';
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

  const [formData, setFormData] = useState({
    phone: '',
    password: ''
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
        const displayName = data.user?.fullName || (data.role === 'admin' ? 'Harsh Srivastava' : 'Customer');
        localStorage.setItem('fullName', displayName);
        if (data.user?.email) {
          localStorage.setItem('adminEmail', data.user.email);
          localStorage.setItem('userEmail', data.user.email);
        }
        if (data.role === 'admin') {
          localStorage.setItem('adminPhone', formData.phone);
        }
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('freshcart-user-updated', {
          detail: { fullName: displayName, email: data.user?.email, phone: formData.phone }
        }));

        // Seamless routing: SuperAdmin goes to /admin, customers go to storefront
        if (data.role === 'admin') {
          navigate('/admin');
        } else {
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
        const displayName = data.user?.fullName || (data.role === 'admin' ? 'Harsh Srivastava' : 'Customer');
        localStorage.setItem('fullName', displayName);
        if (data.user?.email) {
          localStorage.setItem('adminEmail', data.user.email);
          localStorage.setItem('userEmail', data.user.email);
        }
        if (data.role === 'admin') {
          localStorage.setItem('adminPhone', otpPhone);
        }
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('freshcart-user-updated', {
          detail: { fullName: displayName, email: data.user?.email, phone: otpPhone }
        }));

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
          Fresh Groceries & Daily Essentials
        </p>
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative">
        
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-900">
            Sign In
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your mobile number and password to access your account.
          </p>
        </div>

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
              Mobile Number
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="tel"
                required
                placeholder="Enter 10-digit mobile number"
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
                placeholder="Enter your password"
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
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-[#00B074] hover:underline">
              Create Account
            </Link>
          </p>
        </div>

      </div>

      {/* OTP Password Reset Modal */}
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
                <p className="text-[11px] text-slate-500">Verify your registered phone number</p>
              </div>
            </div>

            {otpError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold">
                {otpError}
              </div>
            )}

            {otpSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{otpSuccess}</span>
              </div>
            )}

            {/* STEP 1 */}
            {otpStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Registered Mobile Number</label>
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
                    <span>Send Verification Code</span>
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
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Set New Password *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074]"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpStep(1)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isOtpLoading}
                    className="flex-2 py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-xl font-black text-xs transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isOtpLoading ? (
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