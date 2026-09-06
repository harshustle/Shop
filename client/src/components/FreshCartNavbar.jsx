import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  ShoppingCart, 
  User, 
  Heart, 
  MapPin, 
  ChevronDown, 
  ShieldCheck, 
  Package, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

const FreshCartNavbar = ({ onOpenCart }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, getCartCount, getCartTotal } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchRef = useRef(null);

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const fullName = localStorage.getItem('fullName') || 'My Account';
  const isAdmin = role === 'admin';

  // Live search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API_URL}/api/catalog/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.items || data.products || []);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        // silent search catch
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on outside click
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
    localStorage.removeItem('adminEmail');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      
      {/* Top Announcement Bar */}
      <div className="bg-[#00B074] text-white text-[11px] font-bold py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
              ⚡ 15-Min Delivery
            </span>
            <span className="hidden sm:inline">Guaranteed farm-fresh grocery delivered to your doorstep in Lucknow.</span>
          </div>
          <div className="flex items-center gap-4 text-emerald-100">
            <span>Use Code: <strong className="text-white underline">FRESH20</strong> for 20% Off</span>
            <Link to="/shop" className="hover:text-white hidden md:inline transition">Browse All</Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-11 h-11 rounded-2xl bg-[#00B074] group-hover:bg-[#009663] transition flex items-center justify-center text-white shadow-md shadow-[#00B074]/25">
              <ShoppingBag size={24} strokeWidth={2.4} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 tracking-tight block leading-none">
                FreshCart
              </span>
              <span className="text-[10px] font-extrabold text-[#00B074] tracking-widest uppercase mt-0.5 block">
                Organic & Grocery
              </span>
            </div>
          </Link>

          {/* Delivery Location Indicator (Blinkit / Kirana Style) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700">
            <MapPin size={15} className="text-[#00B074] shrink-0" />
            <div className="text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Deliver to</p>
              <p className="font-bold text-slate-900 leading-tight">Gomti Nagar, Lucknow</p>
            </div>
          </div>

          {/* Real-Time Search Bar */}
          <div ref={searchRef} className="flex-1 max-w-xl relative hidden md:block">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search size={17} className="absolute left-4 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
                  placeholder="Search 1,000+ groceries, atta, dairy, fruits, oil..."
                  className="w-full pl-11 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074] transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </form>

            {/* Live Autocomplete Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase px-3 py-1.5">Matching Products</p>
                <div className="divide-y divide-slate-50">
                  {searchResults.map((prod) => (
                    <Link
                      key={prod._id}
                      to={`/product/${prod.slug || prod._id}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-base">
                          {prod.images && prod.images[0] ? (
                            <img src={prod.images[0].imageUrl} alt={prod.title} className="w-full h-full object-cover rounded-xl" />
                          ) : '🛒'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{prod.title}</p>
                          <p className="text-[10px] text-slate-400">{prod.categoryName || 'Grocery'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-[#00B074]">₹{prod.basePrice}</span>
                    </Link>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-100 mt-1">
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full py-1.5 text-center text-xs font-bold text-[#00B074] hover:underline"
                  >
                    View all matching results →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden xl:flex items-center gap-5 text-xs font-bold text-slate-600">
            <Link to="/" className={`hover:text-[#00B074] transition ${location.pathname === '/' ? 'text-[#00B074]' : ''}`}>
              Home
            </Link>
            <Link to="/shop" className={`hover:text-[#00B074] transition ${location.pathname === '/shop' ? 'text-[#00B074]' : ''}`}>
              Shop Catalog
            </Link>
            <Link to="/orders" className="hover:text-[#00B074] transition">
              My Orders
            </Link>
            {isAdmin && (
              <Link to="/admin" className="px-2.5 py-1 bg-[#E8F8F0] text-[#00B074] rounded-full hover:bg-emerald-100 transition">
                ⚡ Super Admin
              </Link>
            )}
          </nav>

          {/* Right Action Icons: Account & Cart */}
          <div className="flex items-center gap-3">
            
            {/* Account Dropdown */}
            <div className="relative">
              {token ? (
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-2 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                >
                  <div className="w-9 h-9 rounded-2xl bg-[#E8F8F0] text-[#00B074] flex items-center justify-center font-black text-xs">
                    {fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-slate-900 hidden sm:inline">{fullName.split(' ')[0]}</span>
                  <ChevronDown size={14} className="text-slate-400 hidden sm:inline" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-2xl border border-slate-200 transition"
                >
                  <User size={15} />
                  <span>Sign In</span>
                </Link>
              )}

              {/* User Dropdown Menu */}
              {showUserDropdown && token && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-black text-slate-900">{fullName}</p>
                    <p className="text-[10px] text-slate-400">{role === 'admin' ? 'Super Admin' : 'Customer'}</p>
                  </div>
                  <Link
                    to="/account"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <User size={14} />
                    <span>My Profile & Addresses</span>
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Package size={14} />
                    <span>My Past Orders</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#00B074] hover:bg-emerald-50"
                    >
                      <ShieldCheck size={14} />
                      <span>Super Admin Panel</span>
                    </Link>
                  )}
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cart Button (with counter badge & total) */}
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl font-black text-xs transition shadow-md shadow-[#00B074]/25 active:scale-98"
            >
              <div className="relative">
                <ShoppingCart size={17} strokeWidth={2.4} />
                {getCartCount() > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] flex items-center justify-center font-black">
                    {getCartCount()}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">
                {getCartCount() > 0 ? `₹${getCartTotal().toFixed(0)}` : 'Cart'}
              </span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

          </div>

        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groceries & staples..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00B074]/30"
              />
            </div>
          </form>
        </div>

      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white p-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            Home
          </Link>
          <Link
            to="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            Shop Catalog
          </Link>
          <Link
            to="/orders"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            My Orders
          </Link>
          <Link
            to="/account"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            My Account & Addresses
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-xl text-xs font-bold text-[#00B074] bg-[#E8F8F0]"
            >
              Super Admin Panel
            </Link>
          )}
        </div>
      )}

    </header>
  );
};

export default FreshCartNavbar;
