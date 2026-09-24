import React, { useState } from 'react';
import { Gift, Copy, Check, Share2, Users, Sparkles, CheckCircle2 } from 'lucide-react';

const ReferEarnTab = ({ referralCode = 'FRESHCART5', rewardAmount = 5 }) => {
  const [copied, setCopied] = useState(false);

  const shareText = `Hey! Order fresh groceries & daily kirana essentials on FreshCart in 10 minutes. Use my referral code *${referralCode}* to get ₹50 OFF on your first order! Download or shop now: ${window.location.origin}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FreshCart Referral Code',
          text: shareText,
          url: window.location.origin
        });
      } catch (err) {
        // Ignored or cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Gift size={18} />
          </span>
          <span>Refer & Earn</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Share FreshCart with friends and family to unlock unlimited wallet cash.
        </p>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-purple-600/20">
        <div className="relative z-10 max-w-lg space-y-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-purple-100">
            <Sparkles size={12} />
            <span>Referral Program</span>
          </span>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
            Invite friends, give ₹50, get <span className="text-amber-300">₹{rewardAmount} Cashback!</span>
          </h3>
          <p className="text-xs sm:text-sm text-purple-100/90 font-medium leading-relaxed">
            Your friends get ₹50 flat discount on their first order, and you get ₹{rewardAmount} instantly deposited into your FreshCart wallet when their order is delivered.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-8 -right-8 w-44 h-44 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-10 -right-10 text-white/10 pointer-events-none">
          <Gift size={180} />
        </div>
      </div>

      {/* Referral Code Box */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
        <span className="text-xs font-bold text-slate-700 block">Your Unique Referral Code</span>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full flex-1 flex items-center justify-between px-4 py-3 bg-white border border-dashed border-purple-300 rounded-2xl">
            <span className="font-mono text-base font-black tracking-wider text-purple-700">
              {referralCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-purple-600 transition flex items-center gap-1 text-xs font-bold"
              title="Copy Code"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-emerald-500" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex-1 sm:flex-initial px-5 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Share on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="p-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl text-xs font-bold transition shrink-0"
              title="More Share Options"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 3-Step Timeline */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-black text-slate-900 tracking-tight">How It Works</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-2">
            <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-black text-xs">
              1
            </div>
            <h4 className="text-xs font-bold text-slate-800">Send Referral Code</h4>
            <p className="text-[11px] text-slate-500 font-medium">Share your unique invite code with neighbors, friends and family.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-2">
            <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-black text-xs">
              2
            </div>
            <h4 className="text-xs font-bold text-slate-800">Friend Places Order</h4>
            <p className="text-[11px] text-slate-500 font-medium">They receive ₹50 off instantly at checkout on their first grocery order.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-2">
            <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-black text-xs">
              3
            </div>
            <h4 className="text-xs font-bold text-slate-800">You Get ₹{rewardAmount}</h4>
            <p className="text-[11px] text-slate-500 font-medium">As soon as their bag is delivered, ₹{rewardAmount} is credited to your wallet.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ReferEarnTab;
