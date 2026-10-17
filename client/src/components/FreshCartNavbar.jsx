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
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Brand */}
          <Link to="/" className="flex items-center shrink-0 group">
            <span className="text-xl sm:text-2xl font-black lowercase tracking-tighter text-[var(--app-text-primary)] hover:opacity-80 transition">
              fresh
            </span>
          </Link>

          {/* Location Button */}
          <button 
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] border border-black/[0.05] dark:border-white/[0.08] text-xs font-bold text-[var(--app-text-primary)] transition cursor-pointer shrink-0 max-w-[145px] sm:max-w-[210px]"
            title="Change Delivery Location"
          >
            <MapPin size={13} className="text-[#635BFF] dark:text-[#7C71FF] shrink-0" />
            <span className="truncate text-left text-xs font-bold">
              {selectedLocation?.title || 'Basti'}
            </span>
            <ChevronDown size={12} className="opacity-50 shrink-0" />
          </button>

          {/* Sleek Search Bar */}
          <div ref={searchRef} className="flex-1 max-w-sm relative hidden sm:block">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
                  placeholder="Search groceries..."
                  className="w-full pl-9 pr-8 py-2 bg-black/[0.03] dark:bg-white/[0.05] border-0 rounded-full text-xs font-semibold text-[var(--app-text-primary)] placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#635BFF] transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </form>

            {/* Live Autocomplete Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-[var(--app-card)] rounded-2xl shadow-xl border border-black/[0.06] dark:border-white/[0.1] p-2 z-50 overflow-hidden">
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {searchResults.map((prod) => (
                    <Link
                      key={prod._id}
                      to={`/product/${prod.slug || prod._id}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center justify-between p-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] rounded-xl transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm overflow-hidden shrink-0">
                          {prod.images && prod.images[0] ? (
                            <img src={prod.images[0].imageUrl} alt={prod.title} className="w-full h-full object-cover" />
                          ) : '🛒'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--app-text-primary)] leading-tight">{prod.title}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{prod.categoryName || 'Grocery'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-[#635BFF]">₹{prod.basePrice}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Controls: Theme Selector + Bag Button + User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Theme Selector */}
            <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.06] p-1 rounded-full border border-black/[0.04] dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setTheme('white')}
                className={`w-5 h-5 rounded-full bg-white border border-slate-200 transition ${
                  theme === 'white' ? 'ring-2 ring-[#635BFF] scale-105' : 'opacity-70 hover:opacity-100'
                }`}
                title="White Mode"
              />
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`w-5 h-5 rounded-full bg-slate-900 border border-slate-700 transition ${
                  theme === 'dark' ? 'ring-2 ring-[#635BFF] scale-105' : 'opacity-70 hover:opacity-100'
                }`}
                title="Dark Mode"
              />
              <button
                type="button"
                onClick={() => setTheme('yellow')}
                className={`w-5 h-5 rounded-full bg-amber-400 border border-amber-300 transition ${
                  theme === 'yellow' ? 'ring-2 ring-[#635BFF] scale-105' : 'opacity-70 hover:opacity-100'
                }`}
                title="Yellow Mode"
              />
            </div>

            {/* Bag Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#635BFF] hover:bg-[#5248EE] text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition"
            >
              <ShoppingBag size={14} />
              <span>Bag</span>
              <span className="min-w-4 h-4 px-1 rounded-full bg-white/25 flex items-center justify-center text-[10px] font-black">
                {getCartCount()}
              </span>
            </button>

            {/* User Dropdown / Auth */}
            {token ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] flex items-center justify-center text-xs font-bold text-[var(--app-text-primary)] transition"
                  title="My Account"
                >
                  <User size={15} />
                </button>
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--app-card)] rounded-2xl shadow-xl border border-black/[0.06] dark:border-white/[0.1] p-1.5 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-black/[0.04] dark:border-white/[0.06]">
                      <p className="font-bold text-xs text-[var(--app-text-primary)] truncate">{fullName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{userProfile.phone || 'Verified'}</p>
                    </div>
                    <Link
                      to="/orders"
                      onClick={() => setShowUserDropdown(false)}
                      className="block px-3 py-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-xs font-medium text-[var(--app-text-primary)] rounded-xl"
                    >
                      Orders
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 text-xs font-bold flex items-center gap-1.5 rounded-xl transition"
                    >
                      <LogOut size={13} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-full bg-[#635BFF] hover:bg-[#5248EE] active:scale-95 text-xs font-bold text-white shadow-xs shadow-[#635BFF]/25 transition flex items-center gap-1"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] active:scale-95 text-xs font-bold text-[var(--app-text-primary)] transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default FreshCartNavbar;
