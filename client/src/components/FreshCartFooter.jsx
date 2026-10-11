import React from 'react';
import { Link } from 'react-router-dom';

const FreshCartFooter = () => {
  return (
    <footer className="mt-auto border-t border-black/[0.05] dark:border-white/[0.08] bg-[var(--app-card)]/80 py-4 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[var(--app-text-muted)]">
        
        {/* Left: Brand name */}
        <div className="flex items-center gap-2">
          <span className="font-black lowercase tracking-tighter text-sm text-[var(--app-text-primary)]">
            fresh
          </span>
          <span className="text-black/20 dark:text-white/20">•</span>
          <span>Basti, Uttar Pradesh</span>
        </div>

        {/* Center: Minimal Links */}
        <div className="flex items-center gap-4 font-medium text-[11px]">
          <Link to="/" className="hover:text-[var(--app-text-primary)] transition">Home</Link>
          <Link to="/shop" className="hover:text-[var(--app-text-primary)] transition">Catalog</Link>
          <Link to="/orders" className="hover:text-[var(--app-text-primary)] transition">Orders</Link>
          <Link to="/register" className="hover:text-[var(--app-text-primary)] transition">Account</Link>
        </div>

        {/* Right: Copyright */}
        <div className="text-[10px] text-slate-400">
          © {new Date().getFullYear()} fresh. all rights reserved.
        </div>

      </div>
    </footer>
  );
};

export default FreshCartFooter;
