import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Trash2, 
  BellRing, 
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react';
import { API_URL } from '../../config';

const ProfileSettingsTab = ({ profileForm, setProfileForm, onProfileSaved }) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  // Requirement 18: Communication Preferences
  const [commPrefs, setCommPrefs] = useState({
    marketingSms: false,
    marketingEmails: false,
    orderUpdates: true
  });
  const [isSavingComm, setIsSavingComm] = useState(false);
  const [commNotice, setCommNotice] = useState('');

  // Requirement 20: Account & Data Deletion
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Requirement 18: Save Communication Preferences
  const handleSaveCommPrefs = async () => {
    setIsSavingComm(true);
    setCommNotice('');
    try {
      const res = await fetch(`${API_URL}/api/account/communication-preferences`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(commPrefs)
      });
      if (res.ok) {
        setCommNotice('Communication preferences updated. Unsubscribe settings saved.');
        setTimeout(() => setCommNotice(''), 4000);
      }
    } catch (err) {
      setCommNotice('Could not update communication preferences.');
    } finally {
      setIsSavingComm(false);
    }
  };

  // Requirement 20: Permanent Account & Data Deletion (GDPR / DPDP)
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') return;
    setIsDeleting(true);

    try {
      const res = await fetch(`${API_URL}/api/account/delete-me`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (res.ok) {
        // Clear all persistent customer session tokens
        localStorage.clear();
        sessionStorage.clear();
        window.dispatchEvent(new Event('storage'));
        alert('Your account and all associated personal data have been permanently erased from Fresh servers.');
        navigate('/register');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete account. Please contact privacy@freshbasti.in');
      }
    } catch (err) {
      alert('Network error while processing data erasure.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Main Profile Settings Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center">
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

        {/* Profile Form */}
        <form onSubmit={handleUpdate} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
              placeholder="Your Name"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#635BFF]/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#635BFF]/30 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Registered Mobile Number</label>
              <span className="text-[10px] text-[#635BFF] font-bold flex items-center gap-1">
                <ShieldCheck size={12} />
                <span>OTP Verified</span>
              </span>
            </div>
            <input
              type="tel"
              disabled
              value={profileForm.phone}
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-medium text-slate-400 cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400 font-medium mt-1 block">
              Mobile number is securely tied to your order tracking and OTP login.
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#635BFF] hover:bg-[#5248EE] text-white rounded-full text-xs font-black transition flex items-center gap-2 shadow-md shadow-[#635BFF]/25 disabled:opacity-50 cursor-pointer"
            >
              <Save size={14} />
              <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Requirement 18: Notification & Marketing Preferences (Unsubscribe Mechanism) */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BellRing size={16} className="text-[#635BFF]" />
              <span>Communication & Marketing Preferences</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Control promotional alerts and unsubscribe at any time.</p>
          </div>
          {commNotice && (
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full">
              {commNotice}
            </span>
          )}
        </div>

        <div className="space-y-3 pt-2 text-xs">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 cursor-pointer">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Promotional SMS & WhatsApp</span>
              <span className="text-[11px] text-slate-500">Receive discount coupons and flash-deal alerts.</span>
            </div>
            <input 
              type="checkbox"
              checked={commPrefs.marketingSms}
              onChange={(e) => setCommPrefs({ ...commPrefs, marketingSms: e.target.checked })}
              className="w-4 h-4 text-[#635BFF] rounded-md focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 cursor-pointer">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Promotional Emails</span>
              <span className="text-[11px] text-slate-500">Weekly fresh product highlights and recipe ideas.</span>
            </div>
            <input 
              type="checkbox"
              checked={commPrefs.marketingEmails}
              onChange={(e) => setCommPrefs({ ...commPrefs, marketingEmails: e.target.checked })}
              className="w-4 h-4 text-[#635BFF] rounded-md focus:ring-0"
            />
          </label>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSaveCommPrefs}
              disabled={isSavingComm}
              className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-xs font-bold transition hover:opacity-90 cursor-pointer"
            >
              {isSavingComm ? 'Saving...' : 'Update Preferences'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Requirement 20: Permanent Account & Data Deletion (GDPR / DPDP Act) */}
      <div className="bg-rose-50/60 dark:bg-rose-950/20 p-6 sm:p-8 rounded-3xl border border-rose-100 dark:border-rose-900/30 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Delete Account & Personal Data (GDPR / DPDP Right to Erasure)
            </h3>
            <p className="text-xs text-rose-700/80 dark:text-rose-300/70 mt-1 leading-relaxed">
              Permanently delete your profile, saved addresses, wallet references, and personal data from our servers. This action is irreversible.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Delete My Account & Personal Data
          </button>
        </div>
      </div>

      {/* Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle size={18} />
                <span>Confirm Permanent Data Erasure</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This will permanently purge your phone number, addresses, and account credentials from Fresh servers in compliance with data privacy laws.
            </p>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Type <span className="font-mono text-rose-600 font-black">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold transition disabled:opacity-40 flex items-center gap-2"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                <span>Permanently Erase</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileSettingsTab;
