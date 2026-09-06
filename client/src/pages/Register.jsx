import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, User, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { API_URL } from '../config';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userPhone', formData.phone);
        navigate('/login');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Could not connect to backend server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col items-center justify-center p-4">
      
      {/* Brand Logo */}
      <div className="mb-6 text-center">
        <Link to="/" className="inline-flex items-baseline tracking-tighter">
          <span className="text-4xl font-black text-black">blink</span>
          <span className="text-4xl font-black text-[#0C831F]">it</span>
          <span className="w-3 h-3 rounded-full bg-[#F7D02C] ml-0.5"></span>
        </Link>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">India's Last Minute App</p>
      </div>

      {/* Register Card */}
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-xl relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-gray-900">Create Account</h2>
          <span className="px-2.5 py-0.5 bg-emerald-50 text-[#0C831F] text-[10px] font-black rounded-full uppercase">
            ⚡ 10 Min Delivery
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-6">Sign up to enjoy instant 10-minute doorstep delivery and exclusive deals.</p>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0C831F]/30 focus:border-[#0C831F]"
              />
            </div>
          </div>

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
            <label className="block text-xs font-bold text-gray-700 mb-1">Choose Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="password"
                required
                placeholder="Create a strong password"
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#0C831F] hover:underline">
              Log in here
            </Link>
          </p>
        </div>

      </div>

    </div>
  );
};

export default Register;