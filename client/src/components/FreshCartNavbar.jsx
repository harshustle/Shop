import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  ChevronDown, 
  LogOut, 
  X,
  User,
  ShoppingBag
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config';

const FreshCartNavbar = ({ onOpenCart }) => {
  const navigate = useNavigate();
  const { 
    getCartCount, 
    selectedLocation, 
    setIsLocationModalOpen 
  } = useCart();
  const { theme, setTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const searchRef = useRef(null);

  // User Profile
  const [userProfile, setUserProfile] = useState(() => ({
    token: localStorage.getItem('token') || '',
    fullName: localStorage.getItem('fullName') || 'Account',
    phone: localStorage.getItem('userPhone') || ''
  }));

  useEffect(() => {
    const syncUser = () => {
      setUserProfile({
        token: localStorage.getItem('token') || '',
        fullName: localStorage.getItem('fullName') || 'Account',
        phone: localStorage.getItem('userPhone') || ''
      });
    };

    window.addEventListener('storage', syncUser);
    window.addEventListener('freshcart-user-updated', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('freshcart-user-updated', syncUser);
    };
  }, []);

  const token = userProfile.token;
  const fullName = userProfile.fullName;

  // Live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/catalog/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.items || data.products || []);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        // silent search
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userEmail');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('freshcart-user-updated'));
    setShowUserDropdown(false);
    navigate('/register');
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--app-card)]/95 backdrop-blur-md border-b border-black/[0.04] dark:border-white/[0.06] transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-11 sm:h-12 gap-2 sm:gap-3">
          
          {/* Brand: strictly "fresh" (lowercase, bold, minimal, no logo icon) */}
          <Link to="/" className="flex items-center shrink-0 group">
            <span className="text-base sm:text-lg font-black lowercase tracking-tighter text-[var(--app-text-primary)] hover:opacity-80 transition">
              fresh
            </span>
          </Link>

          {/* Location Button (Basti) */}
          <button 
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] border border-black/[0.04] dark:border-white/[0.06] text-[10px] font-semibold text-[var(--app-text-primary)] transition cursor-pointer shrink-0 max-w-[130px] sm:max-w-[180px]"
            title="Change Delivery Location"
          >
            <MapPin size={11} className="text-[#635BFF] dark:text-[#7C71FF] shrink-0" />
            <span className="truncate text-left text-[10px]">
              {selectedLocation?.title || 'Basti'}
            </span>
            <ChevronDown size={10} className="opacity-50 shrink-0" />
          </button>

          {/* Sleek Search Bar */}
          <div ref={searchRef} className="flex-1 max-w-sm relative hidden sm:block">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
                  placeholder="Search groceries..."
                  className="w-full pl-8 pr-7 py-1 bg-black/[0.03] dark:bg-white/[0.05] border-0 rounded-full text-[10px] font-medium text-[var(--app-text-primary)] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#635BFF] transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </form>

            {/* Live Autocomplete Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-[var(--app-card)] rounded-xl shadow-xl border border-black/[0.06] dark:border-white/[0.1] p-1.5 z-50 overflow-hidden">
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {searchResults.map((prod) => (
                    <Link
                      key={prod._id}
                      to={`/product/${prod.slug || prod._id}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center justify-between p-1.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] rounded-lg transition"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs overflow-hidden">
                          {prod.images && prod.images[0] ? (
                            <img src={prod.images[0].imageUrl} alt={prod.title} className="w-full h-full object-cover" />
                          ) : '🛒'}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[var(--app-text-primary)] leading-tight">{prod.title}</p>
                          <p className="text-[9px] text-slate-400">{prod.categoryName || 'Grocery'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#635BFF]">₹{prod.basePrice}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Controls: Theme Pill + Bag Button */}
          <div className="flex items-center gap-1.5">
            {/* 3-Theme Selector */}
            <div className="flex items-center gap-0.5 bg-black/[0.03] dark:bg-white/[0.06] p-0.5 rounded-full border border-black/[0.04] dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setTheme('white')}
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold transition ${
                  theme === 'white' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ⚪
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold transition ${
                  theme === 'dark' ? 'bg-slate-900 shadow-xs text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚫
              </button>
              <button
                type="button"
                onClick={() => setTheme('yellow')}
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold transition ${
                  theme === 'yellow' ? 'bg-amber-400 shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                🟡
              </button>
            </div>

            {/* Bag Button: Shoe style rounded-full */}
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#635BFF] hover:bg-[#5248EE] text-white text-[10px] font-bold shadow-2xs active:scale-95 transition"
            >
              <ShoppingBag size={11} />
              <span>Bag</span>
              <span className="w-3.5 h-3.5 rounded-full bg-white/25 flex items-center justify-center text-[9px]">
                {getCartCount()}
              </span>
            </button>

            {/* User Dropdown / Auth */}
            {token ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="w-7 h-7 rounded-full bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] flex items-center justify-center text-[10px] font-bold text-[var(--app-text-primary)] transition"
                  title="My Account"
                >
                  <User size={12} />
                </button>
                {showUserDropdown && (
                  <div className="absolute right-0 mt-1.5 w-40 bg-[var(--app-card)] rounded-xl shadow-xl border border-black/[0.06] dark:border-white/[0.1] py-1 z-50 text-xs">
                    <div className="px-2.5 py-1.5 border-b border-black/[0.04] dark:border-white/[0.06]">
                      <p className="font-bold text-[10px] text-[var(--app-text-primary)] truncate">{fullName}</p>
                      <p className="text-[9px] text-slate-400 truncate">{userProfile.phone || 'Verified'}</p>
                    </div>
                    <Link
                      to="/orders"
                      onClick={() => setShowUserDropdown(false)}
                      className="block px-2.5 py-1 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-[10px] font-medium text-[var(--app-text-primary)]"
                    >
                      Orders
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-2.5 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 text-[10px] font-bold flex items-center gap-1"
                    >
                      <LogOut size={11} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/register"
                className="px-2.5 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.06] text-[10px] font-bold text-[var(--app-text-primary)] transition"
              >
                Sign In
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default FreshCartNavbar;
