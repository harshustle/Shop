import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';

const FloatingNavDock = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount, setIsCartOpen } = useCart();

  // Hide on auth screens
  if (location.pathname === '/register' || location.pathname === '/login') {
    return null;
  }

  const isHome = location.pathname === '/';
  const isShop = location.pathname === '/shop';
  const isWishlist = location.pathname === '/account' && location.search.includes('tab=wishlist');
  const isAccount = (location.pathname === '/account' && !isWishlist) || location.pathname === '/orders' || location.pathname === '/track-order';

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[92vw] pointer-events-auto">
      <nav 
        aria-label="Mobile Navigation"
        className="bg-[var(--app-card)]/95 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.1] shadow-[0_12px_36px_rgba(0,0,0,0.12)] rounded-full px-2.5 py-1.5 flex items-center gap-1.5 sm:gap-2 transition-all duration-300"
      >
        {/* 1. Home */}
        <button
          onClick={() => navigate('/')}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 active:scale-95 ${
            isHome 
              ? 'bg-[#635BFF]/15 text-[#635BFF] dark:text-[#A59FFF] shadow-xs' 
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
          title="Home"
        >
          <Home size={18} strokeWidth={isHome ? 2.5 : 2} />
        </button>

        {/* 2. Search / Shop Catalog */}
        <button
          onClick={() => navigate('/shop')}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 active:scale-95 ${
            isShop 
              ? 'bg-[#635BFF]/15 text-[#635BFF] dark:text-[#A59FFF] shadow-xs' 
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
          title="Explore Catalog"
        >
          <Search size={18} strokeWidth={isShop ? 2.5 : 2} />
        </button>

        {/* 3. Shopping Bag / Cart */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center justify-center w-10 h-10 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-300 active:scale-95"
          title="My Cart"
        >
          <ShoppingBag size={18} strokeWidth={2} />
          {itemCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[15px] h-3.5 px-0.5 rounded-full bg-[#EF4444] text-white text-[9px] font-black flex items-center justify-center shadow-xs">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </button>

        {/* 4. Wishlist */}
        <button
          onClick={() => navigate('/account?tab=wishlist')}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 active:scale-95 ${
            isWishlist 
              ? 'bg-[#635BFF]/15 text-[#635BFF] dark:text-[#A59FFF] shadow-xs' 
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
          title="Wishlist"
        >
          <Heart size={18} strokeWidth={isWishlist ? 2.5 : 2} className={isWishlist ? 'fill-[#635BFF]' : ''} />
        </button>

        {/* 5. User Account */}
        <button
          onClick={() => navigate('/account')}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 active:scale-95 ${
            isAccount 
              ? 'bg-[#635BFF]/15 text-[#635BFF] dark:text-[#A59FFF] shadow-xs' 
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
          title="My Account"
        >
          <User size={18} strokeWidth={isAccount ? 2.5 : 2} />
        </button>
      </nav>
    </div>
  );
};

export default FloatingNavDock;
