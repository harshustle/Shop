import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  ShoppingCart, 
  MapPin, 
  ChevronDown, 
  User as UserIcon, 
  LogOut, 
  Package, 
  ShieldCheck, 
  Sparkles, 
  X 
} from 'lucide-react';
import { useCart } from '../context/CartContext';

const SEARCH_PLACEHOLDERS = [
  'Search "Aashirvaad Whole Wheat Atta"',
  'Search "Fortune Mustard Oil"',
  'Search "Tata Tea Premium"',
  'Search "Basmati Rice"',
  'Search "Maggi Instant Noodles"'
];

const FreshCartQuickHeader = () => {
  const navigate = useNavigate();
  const { 
    itemCount, 
    grandTotal, 
    setIsCartOpen, 
    selectedLocation, 
    setSelectedLocation,
    searchQuery,
    setSearchQuery 
  } = useCart();

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Dynamic Avatar Initials Helper
  const getInitials = (name, phone) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (phone) return phone.slice(-2);
    return 'FC';
  };

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const phone = localStorage.getItem('userPhone');
    const fullName = localStorage.getItem('fullName');
    const email = localStorage.getItem('userEmail') || localStorage.getItem('adminEmail');
    if (token) return { phone, role, fullName, email };
    return null;
  });

  useEffect(() => {
    const syncUser = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const phone = localStorage.getItem('userPhone');
      const fullName = localStorage.getItem('fullName');
      const email = localStorage.getItem('userEmail') || localStorage.getItem('adminEmail');
      if (token) {
        setUser({ phone, role, fullName, email });
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', syncUser);
    window.addEventListener('freshcart-user-updated', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('freshcart-user-updated', syncUser);
    };
  }, []);

  // Rotating placeholder animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('fullName');
    localStorage.removeItem('role');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminPhone');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('freshcart-user-updated'));
    setUser(null);
    setIsUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-3 md:gap-6">
            
            {/* Left: Brand Logo & Delivery Location */}
            <div className="flex items-center gap-4 lg:gap-8 shrink-0">
              <Link to="/" className="flex items-center group">
                <div className="flex items-baseline tracking-tighter">
                  <span className="text-3xl font-black text-slate-900">Fresh</span>
                  <span className="text-3xl font-black text-[#00B074]">Cart</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00B074] ml-0.5 transform translate-y-1"></span>
                </div>
              </Link>

              {/* Delivery Speed & Location Picker */}
              <div 
                onClick={() => setIsLocationModalOpen(true)}
                className="hidden sm:flex flex-col cursor-pointer p-1.5 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot"></span>
                  <span className="tracking-tight uppercase text-emerald-700">Delivery in 8 minutes</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600 max-w-[200px] truncate">
                  <span className="font-semibold text-gray-900 shrink-0">{selectedLocation.tag} -</span>
                  <span className="truncate">{selectedLocation.address}</span>
                  <ChevronDown size={14} className="text-gray-400 shrink-0" />
                </div>
              </div>
            </div>

            {/* Middle: Universal Search Bar */}
            <div className="flex-1 max-w-2xl relative">
              <div className="relative flex items-center w-full">
                <div className="absolute left-3.5 text-gray-400">
                  <Search size={19} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
                  className="w-full pl-11 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C831F]/30 focus:border-[#0C831F] transition shadow-xs"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Auth & Cart Button */}
            <div className="flex items-center gap-3 shrink-0">
              {/* User Account */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs tracking-tight">
                      {getInitials(user.fullName, user.phone)}
                    </div>
                    <span className="hidden md:inline font-bold text-xs text-slate-800">
                      {user.fullName ? user.fullName.split(' ')[0] : user.phone}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Logged in as</p>
                        <p className="text-xs font-bold text-gray-900 truncate">{user.fullName || user.phone}</p>
                        {user.email && (
                          <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                        )}
                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase">
                          {user.role === 'admin' ? 'Super Admin' : 'Customer'}
                        </span>
                      </div>

                      <button
                        onClick={() => { setIsUserMenuOpen(false); navigate('/orders'); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Package size={16} className="text-gray-500" />
                        <span>My Orders</span>
                      </button>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => { setIsUserMenuOpen(false); navigate('/admin'); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition font-medium"
                        >
                          <ShieldCheck size={16} className="text-amber-600" />
                          <span>Admin Portal</span>
                        </button>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut size={16} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-sm font-bold text-gray-800 hover:text-black hover:bg-gray-100 rounded-xl transition"
                >
                  Login
                </button>
              )}

              {/* Emerald Green Cart Pill */}
              <button
                onClick={() => setIsCartOpen(true)}
                className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-sm active:scale-95 ${
                  itemCount > 0
                    ? 'bg-[#0C831F] text-white hover:bg-[#0A6E1A] shadow-emerald-600/20'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <ShoppingCart size={18} className={itemCount > 0 ? 'animate-bounce' : ''} />
                {itemCount > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                    <span className="w-1 h-1 rounded-full bg-white/60"></span>
                    <span>₹{grandTotal}</span>
                  </div>
                ) : (
                  <span>My Cart</span>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Location Picker Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MapPin className="text-[#0C831F]" size={22} />
                <h3 className="font-bold text-lg text-gray-900">Choose Delivery Address</h3>
              </div>
              <button 
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {[
                { tag: 'Home', address: 'Flat 402, Green Glen Layout, Bellandur, Bangalore - 560103' },
                { tag: 'Office', address: 'Prestige Tech Park, Marathahalli-Sarjapur ORR, Bangalore - 560103' },
                { tag: 'Other', address: '12th Main Road, Indiranagar, Bangalore - 560038' }
              ].map((loc, i) => (
                <div 
                  key={i}
                  onClick={() => {
                    setSelectedLocation(loc);
                    setIsLocationModalOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    selectedLocation.tag === loc.tag
                      ? 'border-[#0C831F] bg-emerald-50/50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-full ${
                    selectedLocation.tag === loc.tag ? 'bg-[#0C831F] text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <MapPin size={14} />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-gray-900">{loc.tag}</span>
                    <p className="text-xs text-gray-600 mt-0.5">{loc.address}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsLocationModalOpen(false)}
              className="mt-6 w-full py-3 bg-[#0C831F] text-white rounded-xl font-bold text-sm hover:bg-[#0A6E1A] transition"
            >
              Confirm Location
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FreshCartQuickHeader;
