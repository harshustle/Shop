import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, MapPin } from 'lucide-react';

const FreshCartFooter = () => {
  const openCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent('fresh-open-cookie-settings'));
  };

  return (
    <footer className="mt-auto border-t border-black/[0.06] dark:border-white/[0.08] bg-[var(--app-card)]/90 py-6 transition-colors text-xs text-[var(--app-text-muted)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        
        {/* Top Row: Business Identity & Legal Navigation Links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
          
          {/* Brand Identity & Location */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-center md:text-left">
            <Link to="/" className="text-base font-black lowercase tracking-tighter text-[var(--app-text-primary)] flex items-center">
              <span>fresh</span>
              <span className="text-[#635BFF] font-black text-base">.</span>
            </Link>
            <span className="text-black/20 dark:text-white/20">•</span>
            <span className="font-semibold text-[var(--app-text-primary)]">Fresh Quick Commerce Pvt. Ltd.</span>
            <span className="text-black/20 dark:text-white/20">•</span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} className="text-[#635BFF]" />
              Basti, Uttar Pradesh, 272001
            </span>
          </div>

          {/* Legal Document Links */}
          <nav aria-label="Legal & Policy Links" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 font-medium text-[11px]">
            <Link to="/privacy" className="hover:text-[var(--app-text-primary)] hover:underline transition">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[var(--app-text-primary)] hover:underline transition">Terms of Service</Link>
            <Link to="/refunds" className="hover:text-[var(--app-text-primary)] hover:underline transition">Refund Policy</Link>
            <Link to="/cookies" className="hover:text-[var(--app-text-primary)] hover:underline transition">Cookie Policy</Link>
            <Link to="/compliance" className="hover:text-[var(--app-text-primary)] hover:underline transition flex items-center gap-1 text-[#635BFF] font-bold">
              <ShieldCheck size={12} />
              <span>Compliance</span>
            </Link>
            <button
              type="button"
              onClick={openCookiePreferences}
              className="hover:text-[var(--app-text-primary)] hover:underline transition cursor-pointer font-medium"
            >
              Cookie Settings
            </button>
          </nav>
        </div>

        {/* Bottom Row: Support Contact, Grievance, and Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <span className="inline-flex items-center gap-1.5">
              <Mail size={12} className="text-slate-400" />
              <span>Support: <a href="mailto:support@freshbasti.in" className="hover:underline text-[var(--app-text-primary)]">support@freshbasti.in</a></span>
            </span>
            <span className="text-black/20 dark:text-white/20 hidden sm:inline">•</span>
            <span>Grievance Officer: <a href="mailto:grievance@freshbasti.in" className="hover:underline text-[var(--app-text-primary)]">grievance@freshbasti.in</a></span>
          </div>

          <div className="text-[11px] text-slate-500 text-center sm:text-right">
            © {new Date().getFullYear()} fresh. All statutory rights reserved. WCAG AA & DPDP Act compliant.
          </div>
        </div>

      </div>
    </footer>
  );
};

export default FreshCartFooter;
