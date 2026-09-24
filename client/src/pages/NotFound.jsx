import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NotFound = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/shop');
    }
  };

  const quickCategories = [
    { name: 'Fresh Vegetables', query: 'vegetables', icon: '🥦' },
    { name: 'Juicy Fruits', query: 'fruits', icon: '🍎' },
    { name: 'Dairy & Eggs', query: 'dairy', icon: '🥛' },
    { name: 'Snacks & Munchies', query: 'snacks', icon: '🍿' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-red-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Mini Brand Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <span className="text-xl">🛒</span>
          </div>
          <span className="text-xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
            Fresh<span className="text-emerald-400">Cart</span>
          </span>
        </Link>

        <Link
          to="/"
          className="text-xs font-semibold px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
        >
          <span>←</span> Back to Store
        </Link>
      </header>

      {/* Main Sliced Tomato 404 Stage */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 py-8 text-center flex-1 flex flex-col items-center justify-center">
        
        {/* Animated Tomato Illustration */}
        <div className="relative mb-6 select-none group">
          {/* Subtle Cutting Board / Shadow base */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-6 bg-black/40 rounded-full blur-md" />

          <svg
            className="w-48 h-48 sm:w-56 sm:h-56 filter drop-shadow-[0_20px_35px_rgba(239,68,68,0.35)] transition-transform duration-500 hover:scale-105"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top Half of Sliced Tomato (Floats Upwards) */}
            <g className="animate-[floatTop_3s_ease-in-out_infinite] origin-bottom">
              {/* Green Calyx / Stem */}
              <path d="M100 24 C100 12, 108 8, 114 6 C113 14, 107 20, 102 24 Z" fill="#059669" />
              <path d="M100 25 C88 15, 68 18, 62 25 C75 27, 88 28, 98 27 Z" fill="#10B981" />
              <path d="M100 25 C112 15, 132 18, 138 25 C125 27, 112 28, 102 27 Z" fill="#10B981" />
              <path d="M99 26 C90 32, 78 40, 72 49 C82 43, 93 36, 100 30 Z" fill="#047857" />
              <path d="M101 26 C110 32, 122 40, 128 49 C118 43, 107 36, 100 30 Z" fill="#047857" />

              {/* Upper Tomato Dome */}
              <path d="M28 92 C26 65, 52 32, 100 32 C148 32, 174 65, 172 92 Z" fill="url(#tomatoGradient)" />
              {/* Sliced Rim & Internal Flesh */}
              <ellipse cx="100" cy="92" rx="72" ry="16" fill="#DC2626" />
              <ellipse cx="100" cy="92" rx="66" ry="12" fill="#EF4444" />
              
              {/* Locule seed cavities */}
              <path d="M55 89 C55 83, 70 82, 80 87 C74 91, 60 92, 55 89 Z" fill="#991B1B" />
              <path d="M145 89 C145 83, 130 82, 120 87 C126 91, 140 92, 145 89 Z" fill="#991B1B" />
              <ellipse cx="100" cy="90" rx="14" ry="4" fill="#991B1B" />
              
              {/* Golden Yellow Seeds */}
              <ellipse cx="68" cy="87" rx="3.5" ry="2" fill="#FDE047" />
              <ellipse cx="132" cy="87" rx="3.5" ry="2" fill="#FDE047" />
              <ellipse cx="98" cy="89" rx="3" ry="1.8" fill="#FDE047" />
            </g>

            {/* Slicing Cut Guide Line */}
            <line
              x1="18"
              y1="99"
              x2="182"
              y2="99"
              stroke="#FDE047"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              strokeLinecap="round"
              className="opacity-75 animate-pulse"
            />

            {/* Dripping Juice Droplets */}
            <ellipse cx="78" cy="107" rx="2.5" ry="5" fill="#EF4444" className="animate-bounce" />
            <ellipse cx="122" cy="110" rx="3" ry="6" fill="#EF4444" className="animate-bounce" style={{ animationDelay: '0.2s' }} />

            {/* Bottom Half of Sliced Tomato (Floats Downwards) */}
            <g className="animate-[floatBottom_3s_ease-in-out_infinite] origin-top">
              {/* Slice Cut Face Rim */}
              <ellipse cx="100" cy="107" rx="72" ry="16" fill="#DC2626" />
              <ellipse cx="100" cy="107" rx="66" ry="12" fill="#EF4444" />

              {/* Internal Seed Cavities */}
              <path d="M55 109 C55 115, 70 116, 80 111 C74 107, 60 106, 55 109 Z" fill="#991B1B" />
              <path d="M145 109 C145 115, 130 116, 120 111 C126 107, 140 106, 145 109 Z" fill="#991B1B" />
              <ellipse cx="100" cy="108" rx="14" ry="4" fill="#991B1B" />

              {/* Lower Seeds */}
              <ellipse cx="68" cy="111" rx="3.5" ry="2" fill="#FDE047" />
              <ellipse cx="132" cy="111" rx="3.5" ry="2" fill="#FDE047" />
              <ellipse cx="101" cy="109" rx="3" ry="1.8" fill="#FDE047" />

              {/* Lower Tomato Outer Bowl */}
              <path d="M28 107 C28 145, 60 174, 100 174 C140 174, 172 145, 172 107 Z" fill="url(#tomatoGradient)" />
            </g>

            {/* Gradient Fill Definition */}
            <defs>
              <radialGradient id="tomatoGradient" cx="40%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="35%" stopColor="#EF4444" />
                <stop offset="80%" stopColor="#DC2626" />
                <stop offset="100%" stopColor="#991B1B" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* 404 Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>Error 404 &bull; Freshly Sliced</span>
        </div>

        {/* Headlines */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
          Oops! This Page Got Sliced Away.
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          Looks like someone chopped this page off our grocery counter or it's out of stock. Don't worry, the rest of FreshCart is ripe and fresh!
        </p>

        {/* Instant Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-md mb-8">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search farm-fresh apples, milk, bread..."
              className="w-full bg-white/10 border border-white/15 focus:border-emerald-500 focus:bg-white/15 text-white placeholder-slate-400 text-sm rounded-2xl py-3.5 pl-11 pr-24 outline-none transition-all shadow-inner"
            />
            <span className="absolute left-4 text-slate-400 text-base">🔍</span>
            <button
              type="submit"
              className="absolute right-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              Search
            </button>
          </div>
        </form>

        {/* Main CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-10">
          <Link
            to="/"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
          >
            <span>🏠</span>
            <span>Return to Home</span>
          </Link>
          <Link
            to="/shop"
            className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <span>🛍️</span>
            <span>Explore Store Catalog</span>
          </Link>
          <Link
            to="/track-order"
            className="px-5 py-3.5 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-slate-300 hover:text-white font-medium text-sm transition-all flex items-center gap-2"
          >
            <span>📦</span>
            <span>Track Order</span>
          </Link>
        </div>

        {/* Quick Pick Categories */}
        <div className="border-t border-white/10 pt-6 w-full max-w-lg">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">
            Popular Fresh Aisles
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {quickCategories.map((cat) => (
              <Link
                key={cat.query}
                to={`/shop?q=${cat.query}`}
                className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5"
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-500 border-t border-white/5">
        &copy; {new Date().getFullYear()} FreshCart Supermarket &bull; Ultra-Fresh Grocery Delivery in 10 Minutes.
      </footer>

      {/* Keyframe Float Animation Styles */}
      <style>{`
        @keyframes floatTop {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-3deg); }
        }
        @keyframes floatBottom {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(12px) rotate(3deg); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
