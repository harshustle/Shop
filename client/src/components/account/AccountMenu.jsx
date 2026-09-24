import React from 'react';
import { 
  Wallet, 
  Gift, 
  Award, 
  Package, 
  Heart, 
  MapPin, 
  Globe, 
  MessageSquare, 
  Mail, 
  Truck, 
  FileText, 
  RotateCcw, 
  Shield, 
  LogOut,
  ChevronRight
} from 'lucide-react';

/**
 * AccountMenu Component
 * Pixel-perfect implementation of the FreshCart quick-commerce profile menu
 */
const AccountMenu = ({
  activeTab,
  onSelectTab,
  onOpenModal,
  walletBalance = 0,
  currentLanguage = 'English',
  ordersCount = 0,
  wishlistCount = 0
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
      
      {/* SECTION 1: Core Commerce & User Assets */}
      <div className="p-2 space-y-1">
        
        {/* 1. My Wallet */}
        <button
          type="button"
          onClick={() => onSelectTab('wallet')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition group text-left ${
            activeTab === 'wallet' ? 'bg-emerald-50/80 text-emerald-900' : 'hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Wallet size={18} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold tracking-tight">My Wallet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-xs">
              ₹{walletBalance}
            </span>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
          </div>
        </button>

        {/* 2. Refer & Earn */}
        <button
          type="button"
          onClick={() => onSelectTab('refer')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition group text-left ${
            activeTab === 'refer' ? 'bg-purple-50/80 text-purple-900' : 'hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Gift size={18} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold tracking-tight">Refer & Earn</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-black text-xs">
              Earn ₹5
            </span>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
          </div>
        </button>

        {/* 3. Scratch Cards & Coupons */}
        <button
          type="button"
          onClick={() => onSelectTab('coupons')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition group text-left ${
            activeTab === 'coupons' ? 'bg-amber-50/80 text-amber-900' : 'hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Award size={18} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold tracking-tight">Scratch Cards & Coupons</span>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
        </button>

        {/* 4. My Orders */}
        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition group text-left ${
            activeTab === 'orders' ? 'bg-blue-50/80 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Package size={18} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold tracking-tight">My Orders</span>
          </div>
          <div className="flex items-center gap-2">
            {ordersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
                {ordersCount}
              </span>
            )}
            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
          </div>
        </button>

        {/* 5. My Wishlist */}
        <button
          type="button"
          onClick={() => onSelectTab('wishlist')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition group text-left ${
            activeTab === 'wishlist' ? 'bg-rose-50/80 text-rose-900' : 'hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Heart size={18} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold tracking-tight">My Wishlist</span>
          </div>
          <div className="flex items-center gap-2">
            {wishlistCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
                {wishlistCount}
              </span>
            )}
            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
          </div>
        </button>

        {/* 6. My Addresses */}
        <button
          type="button"
          onClick={() => onSelectTab('addresses')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition group text-left ${
            activeTab === 'addresses' ? 'bg-orange-50/80 text-orange-900' : 'hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <MapPin size={18} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold tracking-tight">My Addresses</span>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
        </button>

        {/* 7. Language / भाषा */}
        <button
          type="button"
          onClick={() => onOpenModal('language')}
          className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-slate-50 text-slate-800 transition group text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Globe size={18} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold tracking-tight">Language / भाषा</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-black text-xs">
              {currentLanguage}
            </span>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
          </div>
        </button>
      </div>

      {/* SECTION 2: Help, Policies & Legal */}
      <div className="p-2 space-y-1">
        
        {/* 8. Send Feedback / Report Issue */}
        <button
          type="button"
          onClick={() => onOpenModal('feedback')}
          className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-slate-50 text-slate-800 transition group text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <MessageSquare size={18} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold tracking-tight">Send Feedback / Report Issue</span>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
        </button>

        {/* 9. Contact Us */}
        <button
          type="button"
          onClick={() => onOpenModal('contact')}
          className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-slate-50 text-slate-800 transition group text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Mail size={18} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold tracking-tight">Contact Us</span>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
        </button>

        {/* 10. Shipping Policy */}
        <button
          type="button"
          onClick={() => onOpenModal('shipping')}
          className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-slate-50 text-slate-800 transition group text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Truck size={18} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold tracking-tight">Shipping Policy</span>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
        </button>

        {/* 11. Terms and Conditions */}
        <button
          type="button"
          onClick={() => onOpenModal('terms')}
          className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-slate-50 text-slate-800 transition group text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <FileText size={18} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold tracking-tight">Terms and Conditions</span>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
        </button>

        {/* 12. Cancellation & Refunds */}
        <button
          type="button"
          onClick={() => onOpenModal('refunds')}
          className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-slate-50 text-slate-800 transition group text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <RotateCcw size={18} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold tracking-tight">Cancellation & Refunds</span>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
        </button>

        {/* 13. Privacy Policy */}
        <button
          type="button"
          onClick={() => onOpenModal('privacy')}
          className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-slate-50 text-slate-800 transition group text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Shield size={18} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold tracking-tight">Privacy Policy</span>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
        </button>
      </div>

      {/* SECTION 3: Sign Out */}
      <div className="p-2">
        {/* 14. Logout */}
        <button
          type="button"
          onClick={() => onOpenModal('logout')}
          className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-rose-50/60 transition group text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <LogOut size={18} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold text-rose-600 tracking-tight">Logout</span>
          </div>
          <ChevronRight size={16} className="text-rose-200 group-hover:text-rose-400 transition" />
        </button>
      </div>

    </div>
  );
};

export default AccountMenu;
