import React, { useState } from 'react';
import { User, Save, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { API_URL } from '../../config';

const ProfileSettingsTab = ({ profileForm, setProfileForm, onProfileSaved }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setNotice({ type: '', text: '' });

    try {
      const res = await fetch(`${API_URL}/api/account/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          fullName: profileForm.fullName,
          email: profileForm.email
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNotice({ type: 'success', text: 'Profile updated successfully!' });
        const updatedName = data.user?.fullName || profileForm.fullName;
        const updatedEmail = data.user?.email || profileForm.email;
        localStorage.setItem('fullName', updatedName);
        if (updatedEmail) localStorage.setItem('userEmail', updatedEmail);
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('freshcart-user-updated', {
          detail: { fullName: updatedName, email: updatedEmail }
        }));
        if (onProfileSaved) onProfileSaved(data.user);
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (err) {
      setNotice({ type: 'error', text: 'Server connection error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <User size={18} />
          </span>
          <span>Profile Settings</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Manage your personal details and primary contact information.
        </p>
      </div>

      {/* Notice */}
      {notice.text && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
          notice.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
        }`}>
          {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleUpdate} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={profileForm.fullName}
            onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
            placeholder="Your Name"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
          <input
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">Registered Mobile Number</label>
            <span className="text-[10px] text-[#00B074] font-bold flex items-center gap-1">
              <ShieldCheck size={12} />
              <span>OTP Verified</span>
            </span>
          </div>
          <input
            type="tel"
            disabled
            value={profileForm.phone}
            className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-medium text-slate-400 cursor-not-allowed"
          />
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">
            Mobile number is permanently linked to your quick-commerce orders and OTP access.
          </span>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Save size={14} />
            <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>

    </div>
  );
};

export default ProfileSettingsTab;
