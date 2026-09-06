import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Clock, 
  ShieldCheck, 
  RotateCcw, 
  Headphones, 
  Phone, 
  Mail, 
  MapPin, 
  Heart,
  ArrowRight
} from 'lucide-react';

const FreshCartFooter = () => {
  return (
    <footer className="bg-white border-t border-slate-100 text-slate-600 mt-16 font-sans">
      
      {/* 4 Feature Pillars */}
      <div className="border-b border-slate-100 bg-[#F8FDFB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F8F0] text-[#00B074] flex items-center justify-center shrink-0">
                <Clock size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">15-Min Delivery</h4>
                <p className="text-xs text-slate-500 mt-0.5">Lighting fast door dispatch</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">100% Genuine Quality</h4>
                <p className="text-xs text-slate-500 mt-0.5">Direct from certified mills</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <RotateCcw size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Easy Replacement</h4>
                <p className="text-xs text-slate-500 mt-0.5">No questions asked return</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Headphones size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">24/7 Operations Desk</h4>
                <p className="text-xs text-slate-500 mt-0.5">Dedicated phone hotline</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00B074] flex items-center justify-center text-white shadow-md shadow-[#00B074]/25">
                <ShoppingBag size={22} strokeWidth={2.4} />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">FreshCart</span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              FreshCart is your trusted neighborhood e-commerce platform delivering certified fresh fruits, organic vegetables, pure dairy, and kitchen staples right to your home in 15 minutes.
            </p>
            <div className="pt-2 text-xs space-y-1.5 font-medium text-slate-600">
              <p className="flex items-center gap-2">
                <Phone size={14} className="text-[#00B074]" />
                <span>Hotline: +91 9161955178</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail size={14} className="text-[#00B074]" />
                <span>support@freshcart.com</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin size={14} className="text-[#00B074]" />
                <span>Central Hub: Gomti Nagar, Lucknow, UP</span>
              </p>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">Categories</h5>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-500">
              <li><Link to="/shop?category=staples-and-grains" className="hover:text-[#00B074] transition">Staples & Atta</Link></li>
              <li><Link to="/shop?category=edible-oils" className="hover:text-[#00B074] transition">Oils & Pure Ghee</Link></li>
              <li><Link to="/shop?category=fresh-fruits" className="hover:text-[#00B074] transition">Fresh Fruits</Link></li>
              <li><Link to="/shop?category=organic-vegetables" className="hover:text-[#00B074] transition">Vegetables</Link></li>
              <li><Link to="/shop?category=dairy-breakfast" className="hover:text-[#00B074] transition">Milk & Dairy</Link></li>
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div>
            <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">Customer Care</h5>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-500">
              <li><Link to="/orders" className="hover:text-[#00B074] transition">Track Orders</Link></li>
              <li><Link to="/account" className="hover:text-[#00B074] transition">My Addresses</Link></li>
              <li><Link to="/shop" className="hover:text-[#00B074] transition">All Products</Link></li>
              <li><Link to="/login" className="hover:text-[#00B074] transition">Super Admin Login</Link></li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div>
            <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">Exclusive Offers</h5>
            <p className="text-xs text-slate-500 mb-3">Subscribe to receive weekly coupon codes & flash deals directly.</p>
            <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed to FreshCart Weekly Offers!'); }} className="space-y-2">
              <input
                type="email"
                required
                placeholder="Enter email address"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00B074]/30"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5"
              >
                <span>Get 20% Off Coupon</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Copyright & Payment Badges */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 FreshCart E-Commerce. All rights reserved.</p>
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
            <span className="px-2 py-0.5 bg-slate-100 rounded-md">UPI</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md">RuPay</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md">Visa</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md">MasterCard</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md">Cash on Delivery</span>
          </div>
        </div>

      </div>

    </footer>
  );
};

export default FreshCartFooter;
