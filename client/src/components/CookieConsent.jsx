import React, { useState, useEffect } from 'react';
import { Cookie, Check, X, Sliders, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  
  // Granular preference state
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true & locked
    functional: true,
    analytics: false,
  });

  useEffect(() => {
    // Check if consent has already been given
    const savedConsent = localStorage.getItem('fresh_cookie_consent');
    if (!savedConsent) {
      // Small timeout so banner doesn't flash during initial page mount
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(savedConsent);
        setPreferences({
          necessary: true,
          functional: parsed.functional ?? true,
          analytics: parsed.analytics ?? false,
        });
      } catch (e) {
        // fallback
      }
    }
  }, []);

  // Listen to open cookie settings trigger from anywhere in the app
  useEffect(() => {
    const handleOpenSettings = () => {
      setIsVisible(true);
      setIsPreferencesOpen(true);
    };

    window.addEventListener('fresh-open-cookie-settings', handleOpenSettings);
    return () => {
      window.removeEventListener('fresh-open-cookie-settings', handleOpenSettings);
    };
  }, []);

  const savePreferences = (prefs) => {
    const consentPayload = {
      ...prefs,
      necessary: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('fresh_cookie_consent', JSON.stringify(consentPayload));
    setPreferences(consentPayload);
    setIsVisible(false);
    setIsPreferencesOpen(false);
  };

  const handleAcceptAll = () => {
    savePreferences({ functional: true, analytics: true });
  };

  const handleRejectNonEssential = () => {
    savePreferences({ functional: false, analytics: false });
  };

  const handleSaveCustom = () => {
    savePreferences(preferences);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* 1. Floating Banner at Bottom */}
      {!isPreferencesOpen && (
        <aside 
          aria-label="Cookie and Privacy Consent" 
          className="fixed bottom-3 sm:bottom-5 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="bg-[var(--app-card)] text-[var(--app-text-primary)] rounded-3xl p-5 shadow-2xl border border-black/[0.08] dark:border-white/[0.1] backdrop-blur-xl">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center shrink-0">
                <Cookie size={20} className="stroke-[2.2]" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-[var(--app-text-primary)] flex items-center gap-1.5">
                  <span>Cookie & Privacy Choices</span>
                </h2>
                <p className="text-xs text-[var(--app-text-muted)] mt-1 leading-relaxed">
                  We use essential storage to keep your cart, theme, and authentication active. Non-essential cookies help optimize delivery performance in Basti.{' '}
                  <Link to="/cookies" className="text-[#635BFF] font-semibold hover:underline">
                    Read Cookie Policy
                  </Link>.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 min-w-[100px] h-9 px-3.5 rounded-full bg-[#635BFF] hover:bg-[#5248EE] active:scale-95 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="flex-1 min-w-[100px] h-9 px-3.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 text-[var(--app-text-primary)] text-xs font-bold transition cursor-pointer"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={() => setIsPreferencesOpen(true)}
                className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 flex items-center justify-center text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] transition cursor-pointer"
                title="Customize Preferences"
                aria-label="Customize Cookie Preferences"
              >
                <Sliders size={15} />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Granular Preference Modal */}
      {isPreferencesOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="cookie-preferences-title"
            className="bg-[var(--app-card)] text-[var(--app-text-primary)] w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-black/[0.08] dark:border-white/[0.1] space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 id="cookie-preferences-title" className="text-base font-bold text-[var(--app-text-primary)]">
                    Cookie Preferences
                  </h3>
                  <p className="text-[11px] text-[var(--app-text-muted)]">Manage your consent for local storage and cookies</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreferencesOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--app-text-muted)] hover:bg-black/5 dark:hover:bg-white/10 transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cookie Categories */}
            <div className="space-y-3.5 text-xs">
              
              {/* Category 1: Strictly Necessary */}
              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-bold text-[var(--app-text-primary)] flex items-center gap-2">
                    <span>Strictly Necessary</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">Always Active</span>
                  </div>
                  <p className="text-[11px] text-[var(--app-text-muted)] leading-relaxed">
                    Required for cart persistence, OTP session security, CSRF protection, and selected theme. Cannot be disabled.
                  </p>
                </div>
                <div className="w-10 h-6 bg-[#635BFF] rounded-full flex items-center justify-end px-1 opacity-80 cursor-not-allowed shrink-0">
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </div>
              </div>

              {/* Category 2: Functional */}
              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-bold text-[var(--app-text-primary)]">
                    Functional & Local Preferences
                  </div>
                  <p className="text-[11px] text-[var(--app-text-muted)] leading-relaxed">
                    Remembers your Basti location tag and language selection across browser visits.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences(prev => ({ ...prev, functional: !prev.functional }))}
                  className={`w-10 h-6 rounded-full transition flex items-center px-1 shrink-0 cursor-pointer ${
                    preferences.functional ? 'bg-[#635BFF] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                  aria-pressed={preferences.functional}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Category 3: Analytics */}
              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-bold text-[var(--app-text-primary)]">
                    Performance & Diagnostics
                  </div>
                  <p className="text-[11px] text-[var(--app-text-muted)] leading-relaxed">
                    Helps us aggregate page load times and network latency to enhance quick delivery performance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                  className={`w-10 h-6 rounded-full transition flex items-center px-1 shrink-0 cursor-pointer ${
                    preferences.analytics ? 'bg-[#635BFF] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                  aria-pressed={preferences.analytics}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-4 py-2 rounded-full text-xs font-bold text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Reject All Non-Essential
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="px-5 py-2 rounded-full bg-[#635BFF] hover:bg-[#5248EE] text-white text-xs font-bold shadow-md shadow-[#635BFF]/25 transition"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;
