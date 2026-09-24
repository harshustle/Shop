import React, { useState } from 'react';
import { Award, Sparkles, Copy, Check, Ticket, Clock, CheckCircle2 } from 'lucide-react';

const CouponsTab = () => {
  const [scratched, setScratched] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const availableCoupons = [
    {
      code: 'WELCOME50',
      title: 'Flat ₹50 OFF',
      desc: 'On your first order above ₹299. Valid for all new customers.',
      validTill: '30 Sep 2026',
      badge: 'New User',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      code: 'FRESH20',
      title: '20% OFF Fresh Produce',
      desc: 'Get 20% discount up to ₹100 on all farm-fresh fruits & vegetables.',
      validTill: '15 Oct 2026',
      badge: 'Bestseller',
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      code: 'FREEDEL',
      title: 'Free Express Delivery',
      desc: 'Unlimited free 10-minute delivery on all grocery carts above ₹99.',
      validTill: '31 Dec 2026',
      badge: 'Speed Pass',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      code: 'KIRANA10',
      title: '10% OFF Pantry Staples',
      desc: 'Save 10% on Atta, Rice, Pulses, Cooking Oils & Ghee.',
      validTill: '20 Oct 2026',
      badge: 'Monthly Saver',
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  ];

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Award size={18} />
          </span>
          <span>Scratch Cards & Coupons</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Scratch to win surprise store rewards or copy verified promo vouchers for checkout.
        </p>
      </div>

      {/* Interactive Scratch Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-orange-500/20">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-amber-100">
              <Sparkles size={13} />
              <span>Daily Scratch & Win</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              {scratched ? '🎉 Congratulations! You Won 25% OFF' : 'Scratch to reveal your surprise discount!'}
            </h3>
            <p className="text-xs text-amber-100/90 font-medium max-w-sm">
              {scratched 
                ? 'Use code SCRATCH25 at checkout for flat 25% off up to ₹150 on your order.' 
                : 'Tap the gold card below to unveil today\'s mystery reward.'}
            </p>
          </div>

          {/* Card interactive area */}
          <div className="shrink-0 w-full sm:w-auto">
            {!scratched ? (
              <button
                type="button"
                onClick={() => setScratched(true)}
                className="w-full sm:w-64 h-32 bg-white/15 backdrop-blur-lg border-2 border-dashed border-white/50 rounded-2xl flex flex-col items-center justify-center p-4 hover:bg-white/25 transition group cursor-pointer active:scale-95 shadow-lg"
              >
                <Award size={36} className="text-amber-200 group-hover:scale-110 transition animate-bounce" />
                <span className="text-xs font-black tracking-wider uppercase text-white mt-2">
                  Tap to Scratch & Reveal
                </span>
              </button>
            ) : (
              <div className="w-full sm:w-64 h-32 bg-white text-slate-800 rounded-2xl flex flex-col items-center justify-center p-4 shadow-xl border-2 border-amber-300 animate-in fade-in zoom-in-95">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Your Code</span>
                <span className="text-xl font-black tracking-wider text-slate-900 font-mono my-1">SCRATCH25</span>
                <button
                  type="button"
                  onClick={() => handleCopy('SCRATCH25')}
                  className="px-4 py-1.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-xl text-[11px] font-black flex items-center gap-1 transition"
                >
                  {copiedCode === 'SCRATCH25' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedCode === 'SCRATCH25' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Decorative circle */}
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Available Coupons Grid */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Ticket size={16} className="text-[#00B074]" />
          <span>Active Promo Coupons ({availableCoupons.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableCoupons.map((coupon) => (
            <div
              key={coupon.code}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-[#00B074]/30 hover:shadow-sm transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${coupon.color}`}>
                    {coupon.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock size={11} />
                    <span>Expires {coupon.validTill}</span>
                  </span>
                </div>
                
                <h4 className="text-sm font-black text-slate-900">{coupon.title}</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{coupon.desc}</p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="font-mono text-xs font-black text-slate-800 tracking-wider bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {coupon.code}
                </span>

                <button
                  type="button"
                  onClick={() => handleCopy(coupon.code)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-[#00B074] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  {copiedCode === coupon.code ? (
                    <>
                      <Check size={13} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Apply Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CouponsTab;
