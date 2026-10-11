import React from 'react';
import { User, Edit3, ShieldCheck } from 'lucide-react';

const ProfileHeader = ({ user, onEditProfile, isEditing = false }) => {
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = user?.fullName || 'FreshCart Customer';
  const displayPhone = user?.phone || 'Mobile not registered';
  const displayEmail = user?.email || 'Verified Customer';

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#635BFF] to-[#7C6DF2] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#635BFF]/30 tracking-tight shrink-0">
          {getInitials(displayName)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              {displayName}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EFEBFF] text-[#635BFF] text-[10px] font-black">
              <ShieldCheck size={12} />
              <span>Verified</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {displayPhone} {displayEmail && `• ${displayEmail}`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onEditProfile}
        className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-2 shrink-0 ${
          isEditing 
            ? 'bg-[#635BFF] text-white shadow-lg shadow-[#635BFF]/25' 
            : 'bg-[#F4F4F8] hover:bg-[#EAEAF0] text-slate-700'
        }`}
      >
        <Edit3 size={14} />
        <span>{isEditing ? 'Viewing Profile' : 'Edit Profile'}</span>
      </button>
    </div>
  );
};

export default ProfileHeader;
