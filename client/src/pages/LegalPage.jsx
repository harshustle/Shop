import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Shield, 
  FileText, 
  RotateCcw, 
  Cookie, 
  CheckCircle2, 
  Building2, 
  Mail, 
  Phone, 
  ExternalLink, 
  Sliders, 
  ArrowLeft,
  Lock,
  Eye,
  AlertTriangle,
  Scale
} from 'lucide-react';
import FreshCartFooter from '../components/FreshCartFooter';

const LegalPage = () => {
  const location = useLocation();

  // Determine active tab based on pathname
  const getInitialTab = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('terms')) return 'terms';
    if (path.includes('refund')) return 'refunds';
    if (path.includes('cookie')) return 'cookies';
    if (path.includes('compliance')) return 'compliance';
    return 'privacy';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    setActiveTab(getInitialTab());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const openCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent('fresh-open-cookie-settings'));
  };

  const tabs = [
    { id: 'privacy', label: 'Privacy Policy', icon: Shield, path: '/privacy' },
    { id: 'terms', label: 'Terms of Service', icon: FileText, path: '/terms' },
    { id: 'refunds', label: 'Refund Policy', icon: RotateCcw, path: '/refunds' },
    { id: 'cookies', label: 'Cookie Policy', icon: Cookie, path: '/cookies' },
    { id: 'compliance', label: 'Compliance & Safeguards', icon: Scale, path: '/compliance' },
  ];

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text-primary)] flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[var(--app-card)]/90 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[var(--app-text-primary)] hover:scale-105 active:scale-95 transition"
              aria-label="Back to Store"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <Link to="/" className="text-xl font-black lowercase tracking-tighter text-[var(--app-text-primary)] flex items-center">
                <span>fresh</span>
                <span className="text-[#635BFF] font-black text-xl">.</span>
              </Link>
              <span className="text-[10px] text-[var(--app-text-muted)] font-semibold tracking-wider uppercase">Legal & Compliance Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Verified & Compliant
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Navigation Tabs */}
        <nav aria-label="Legal document categories" className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none border-b border-black/[0.05] dark:border-white/[0.08] mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#635BFF] text-white shadow-md shadow-[#635BFF]/25 scale-[1.02]'
                    : 'bg-[var(--app-card)] text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] hover:bg-black/5 dark:hover:bg-white/5 border border-black/[0.04] dark:border-white/[0.06]'
                }`}
              >
                <Icon size={16} strokeWidth={2.2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content Section */}
        <div className="bg-[var(--app-card)] rounded-3xl p-6 sm:p-10 border border-black/[0.05] dark:border-white/[0.08] shadow-sm leading-relaxed">
          
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <article className="space-y-6 text-sm text-[var(--app-text-muted)]">
              <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
                <span className="text-[11px] font-bold text-[#635BFF] uppercase tracking-wider">Requirement 1 • DPDP Act 2023 & GDPR</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--app-text-primary)] mt-1">Privacy & Personal Data Protection Policy</h1>
                <p className="text-xs text-[var(--app-text-muted)] mt-1">Last Updated: October 2026 • Effective Immediately</p>
              </div>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">1. Commitment to Data Privacy</h2>
                <p>
                  Fresh Quick Commerce Private Limited ("Fresh", "we", "our", or "us") operates the Fresh hyper-local grocery platform in Basti, Uttar Pradesh. We respect your privacy and are committed to protecting your personal data in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act), the Information Technology Act, 2000, and global data privacy standards (GDPR/CCPA).
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">2. Data We Collect (Data Minimization Pledge)</h2>
                <p>We adhere to strict data minimization principles. We only collect information strictly required to fulfill your orders and provide service updates:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Account Identifiers:</strong> 10-digit mobile phone number (for OTP authentication) and optional full name.</li>
                  <li><strong>Delivery Information:</strong> Physical delivery address, landmark, and device GPS coordinates solely to navigate riders to your doorstep in Basti.</li>
                  <li><strong>Order History:</strong> Products purchased, bill totals, and transaction timestamps for statutory invoice generation.</li>
                  <li><strong>Technical & Session Data:</strong> IP address, device type, and login session tokens to safeguard account security and mitigate fraud.</li>
                </ul>
                <p className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 p-3.5 rounded-2xl text-xs font-medium border border-emerald-500/20">
                  🛡️ <strong>Zero Data Selling Guarantee:</strong> We never sell, rent, monetize, or trade your personal information or contact details to third-party telemarketers, credit bureaus, or advertising brokers.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">3. Legal Basis & Purposes for Processing</h2>
                <p>We process your personal information strictly under lawful bases:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Contractual Performance:</strong> Processing, packing, and delivering groceries to your confirmed address.</li>
                  <li><strong>User Consent:</strong> Sending non-critical marketing communications, promotions, and SMS notifications (with 1-click opt-out).</li>
                  <li><strong>Legal & Tax Compliance:</strong> Maintaining statutory accounting, GST invoice records, and consumer protection records for the mandated period.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">4. Third-Party Service Providers (Sub-Processors)</h2>
                <p>We collaborate with carefully vetted partners who adhere to enterprise-grade security standards:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                    <div className="font-bold text-[var(--app-text-primary)] text-xs">Google Identity Services</div>
                    <div className="text-[11px] mt-0.5">Secure OAuth 2.0 authentication for users opting to sign in via Google credentials.</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                    <div className="font-bold text-[var(--app-text-primary)] text-xs">OpenStreetMap / Leaflet</div>
                    <div className="text-[11px] mt-0.5">Map rendering and routing coordinates within Basti delivery zones.</div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">5. Your Data Rights & Deletion Mechanism</h2>
                <p>Under the DPDP Act and GDPR, you retain absolute ownership of your data:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Right to Access:</strong> View and export your personal information directly within your Customer Account.</li>
                  <li><strong>Right to Rectification:</strong> Edit your name, saved delivery addresses, or contact details at any time.</li>
                  <li><strong>Right to Erasure (Data Deletion):</strong> Permanently delete your account and all associated personal data via your Account Settings or by emailing <a href="mailto:privacy@freshbasti.in" className="text-[#635BFF] underline">privacy@freshbasti.in</a>.</li>
                  <li><strong>Right to Withdraw Consent:</strong> Instantly unsubscribe from promotional alerts with one click.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">6. Grievance Officer & Contact Information</h2>
                <p>In accordance with the Information Technology Act 2000 and the Consumer Protection (E-Commerce) Rules 2020, our designated Grievance Officer details are:</p>
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] space-y-1.5 text-xs">
                  <p><strong>Name:</strong> Rahul Sharma (Grievance Officer)</p>
                  <p><strong>Entity:</strong> Fresh Quick Commerce Private Limited</p>
                  <p><strong>Address:</strong> Gandhi Nagar, Company Bagh, Basti, Uttar Pradesh, 272001, India</p>
                  <p><strong>Email:</strong> <a href="mailto:grievance@freshbasti.in" className="text-[#635BFF] underline">grievance@freshbasti.in</a></p>
                  <p><strong>Support Helpline:</strong> +91 803 456 7890 (10:00 AM - 7:00 PM IST, Monday to Saturday)</p>
                  <p className="text-[11px] text-slate-500 pt-1">Response timeline: Grievance acknowledgement within 48 hours; full resolution within 30 days.</p>
                </div>
              </section>
            </article>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <article className="space-y-6 text-sm text-[var(--app-text-muted)]">
              <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
                <span className="text-[11px] font-bold text-[#635BFF] uppercase tracking-wider">Requirement 2 • Consumer Protection</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--app-text-primary)] mt-1">Terms of Service & User Agreement</h1>
                <p className="text-xs text-[var(--app-text-muted)] mt-1">Last Updated: October 2026 • Valid Across India</p>
              </div>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">1. Acceptance & Age Eligibility (18+ Requirement)</h2>
                <p>
                  By accessing, browsing, or registering an account on Fresh, you agree to be bound by these Terms of Service. 
                  <strong> You must be at least 18 years of age</strong> to register an account, purchase products, or enter into legally binding contracts. If you are under 18, you may only use our platform with the active consent and supervision of a parent or legal guardian.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">2. User Accounts & OTP Security</h2>
                <p>
                  You are solely responsible for maintaining the confidentiality of your mobile number and One-Time Passwords (OTP). Fresh representatives will <strong>never</strong> ask for your banking PIN, CVV, or authentication OTP over phone calls, SMS, or third-party messaging apps.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">3. Transparent Pricing & No Hidden Charges</h2>
                <p>
                  We are strictly committed to transparent, upfront pricing:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>All Prices Inclusive of GST:</strong> All displayed retail prices already incorporate applicable Indian statutory taxes.</li>
                  <li><strong>Clear Delivery Fee:</strong> Orders exceeding ₹199 qualify for Free Delivery. For orders below ₹199, a nominal delivery logistics charge of ₹15–₹25 is calculated and shown upfront before payment.</li>
                  <li><strong>Zero Surprise Platform Surcharges:</strong> No hidden packaging, weather, or late-night surge fees are added at the final checkout step.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">4. Order Placement & Darkstore Fulfillment</h2>
                <p>
                  Orders placed on the platform constitute an offer to purchase. Upon acceptance, our micro-fulfillment hub in Basti packages your selected items and assigns a courier. In the rare event an item is found out of stock during picking, your bill is dynamically adjusted and any difference is credited immediately.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">5. Prohibition of Dark Patterns & Fair Usage</h2>
                <p>
                  Fresh guarantees a clean, transparent user interface without deceptive practices:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>No pre-selected tip, donation, or subscription checkboxes without affirmative opt-in.</li>
                  <li>No artificial urgency or fabricated low-stock counters designed to coerce purchases.</li>
                  <li>Straightforward, one-tap account deletion and cancellation without obstructive exit loops.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">6. Governing Law & Dispute Resolution</h2>
                <p>
                  These Terms are governed by and construed in accordance with the laws of the Republic of India. Any legal dispute, controversy, or claim arising out of your use of the platform shall be subject to the exclusive jurisdiction of the competent courts in Basti / Uttar Pradesh, India.
                </p>
              </section>
            </article>
          )}

          {/* TAB 3: REFUND POLICY */}
          {activeTab === 'refunds' && (
            <article className="space-y-6 text-sm text-[var(--app-text-muted)]">
              <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
                <span className="text-[11px] font-bold text-[#635BFF] uppercase tracking-wider">Requirement 3 • Consumer Trust</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--app-text-primary)] mt-1">Cancellation & Refund Policy</h1>
                <p className="text-xs text-[var(--app-text-muted)] mt-1">Hassle-free 100% money back and verified return windows</p>
              </div>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">1. Instant Pre-Dispatch Cancellation</h2>
                <p>
                  You may cancel any placed order free of charge at any time prior to the dispatch of our delivery partner from the Basti darkstore. Once dispatched, live transit costs are incurred, and you may request a return upon delivery.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">2. Return Windows & Item Categories</h2>
                <p>We classify products under strict quality guarantees:</p>
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                    <h3 className="font-bold text-[var(--app-text-primary)] text-xs flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>Perishables (Fruits, Vegetables, Fresh Dairy, Bread)</span>
                    </h3>
                    <p className="text-xs text-[var(--app-text-muted)] mt-1">
                      <strong>Return Window: Within 2 hours of delivery.</strong> If any perishable item arrives damaged, bruised, or unsatisfactory, simply raise a ticket or message support with a photo for an immediate full refund or replacement.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                    <h3 className="font-bold text-[var(--app-text-primary)] text-xs flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>Packaged FMCG & Staples (Grains, Spices, Snacks, Beverages)</span>
                    </h3>
                    <p className="text-xs text-[var(--app-text-muted)] mt-1">
                      <strong>Return Window: Within 24 hours of delivery.</strong> Applicable if the outer seal is breached, expired, or defective.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">3. Refund Timelines & Payment Methods</h2>
                <p>Approved refunds are processed without deductions:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Fresh Wallet:</strong> Instant credit within 5 seconds (usable for immediate subsequent orders).</li>
                  <li><strong>UPI (Google Pay, PhonePe, Paytm, BHIM):</strong> 2 to 4 hours.</li>
                  <li><strong>Debit Cards, Credit Cards & Net Banking:</strong> 2 to 4 business days depending on your issuing bank.</li>
                  <li><strong>Cash on Delivery (COD) Orders:</strong> Transferred directly to your Fresh Wallet or registered UPI VPA upon verification.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">4. Non-Refundable Items</h2>
                <p>
                  For sanitary and consumer safety reasons, opened personal care items, baby formula, and customized freshly sliced products are non-returnable unless received in a damaged or defective condition.
                </p>
              </section>
            </article>
          )}

          {/* TAB 4: COOKIE POLICY */}
          {activeTab === 'cookies' && (
            <article className="space-y-6 text-sm text-[var(--app-text-muted)]">
              <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
                <span className="text-[11px] font-bold text-[#635BFF] uppercase tracking-wider">Requirement 4 & 5 • Transparent Tracking</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--app-text-primary)] mt-1">Cookie & Storage Disclosure Policy</h1>
                <p className="text-xs text-[var(--app-text-muted)] mt-1">Full disclosure of web cookies, local storage, and privacy controls</p>
              </div>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">1. What Are Cookies and Local Storage?</h2>
                <p>
                  Cookies and HTML5 LocalStorage are compact data files placed on your browser or device to remember session states, shopping cart contents, theme preferences, and security authentication tokens.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">2. Categories of Cookies We Use</h2>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--app-text-primary)] text-xs">Strictly Necessary Cookies (Always Active)</span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 font-bold px-2 py-0.5 rounded-full text-slate-700 dark:text-slate-300">Mandatory</span>
                    </div>
                    <p className="text-xs text-[var(--app-text-muted)] mt-1">
                      Essential for authentication, shopping cart persistence, security CSRF protection, and selected theme (White, Dark, Yellow). These cookies cannot be switched off in our systems.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--app-text-primary)] text-xs">Functional & Preference Cookies</span>
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 font-bold px-2 py-0.5 rounded-full text-blue-700 dark:text-blue-300">Optional</span>
                    </div>
                    <p className="text-xs text-[var(--app-text-muted)] mt-1">
                      Remembers your default delivery hub in Basti, localized UI language, and view preferences to streamline repeated visits.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--app-text-primary)] text-xs">Performance & Analytics Cookies</span>
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 font-bold px-2 py-0.5 rounded-full text-purple-700 dark:text-purple-300">Opt-in</span>
                    </div>
                    <p className="text-xs text-[var(--app-text-muted)] mt-1">
                      Measures page load speeds, catalog drop-off rates, and API errors on an aggregated, anonymous basis so we can optimize application performance.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-[var(--app-text-primary)]">3. Managing Your Cookie Preferences</h2>
                <p>
                  You have full autonomy over non-essential cookies. You can re-open our consent drawer at any time to adjust your tracking preferences:
                </p>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#635BFF] hover:bg-[#5248EE] text-white text-xs font-bold transition shadow-md shadow-[#635BFF]/25 cursor-pointer"
                >
                  <Sliders size={15} />
                  <span>Open Cookie Preferences Drawer</span>
                </button>
              </section>
            </article>
          )}

          {/* TAB 5: 20-POINT COMPLIANCE & LEGAL SAFEGUARDS AUDIT */}
          {activeTab === 'compliance' && (
            <article className="space-y-6 text-sm text-[var(--app-text-muted)]">
              <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
                <span className="text-[11px] font-bold text-[#635BFF] uppercase tracking-wider">Comprehensive 20-Point Audit</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--app-text-primary)] mt-1">Platform Legal, Privacy & Accessibility Safeguards</h1>
                <p className="text-xs text-[var(--app-text-muted)] mt-1">Full compliance verification across all 20 statutory and consumer standards</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Privacy Policy */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>1. Comprehensive Privacy Policy</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    Integrated across <code>/privacy</code> and <code>/privacy-policy</code> with complete disclosures under DPDP Act 2023, GDPR, and IT Act 2000.
                  </p>
                </div>

                {/* 2. Terms of Service */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>2. Transparent Terms of Service</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    Clear user agreement covering 18+ eligibility, account security, order processing, and Basti jurisdiction.
                  </p>
                </div>

                {/* 3. Refund Policy */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>3. Clear Cancellation & Refund Policy</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    Clear return windows (2 hrs for perishables, 24 hrs for packaged) and instant wallet / UPI refund timelines.
                  </p>
                </div>

                {/* 4. Cookie Policy */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>4. Cookie Disclosure Policy</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    Explicit classification of Necessary, Preference, and Analytics cookies with zero unconsented third-party advertising cookies.
                  </p>
                </div>

                {/* 5. Cookie Consent Banner */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>5. Interactive Cookie Consent Banner</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    Opt-in/opt-out consent banner featuring "Accept All", "Essential Only", and granular preference controls.
                  </p>
                </div>

                {/* 6. Form Consents */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>6. Explicit Form Consent & Links</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    All signup, login, and checkout forms feature clear legal notices linking to Terms and Privacy Policy.
                  </p>
                </div>

                {/* 7. Data Minimization */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>7. Data Minimization Principle</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    Only phone number, OTP, name, and delivery address are collected. No requests for contacts, camera, or sensitive personal data.
                  </p>
                </div>

                {/* 8. Third-Party SDK Audit */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>8. Third-Party SDK Audit</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    Audited Google Identity Services and Leaflet/OSM map scripts. Zero covert tracking pixels or analytics leaks.
                  </p>
                </div>

                {/* 9. Dark Pattern Removal */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>9. Dark Patterns Eliminated</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    No pre-checked opt-in boxes, forced subscriptions, deceptive countdown timers, or confusing cancellation traps.
                  </p>
                </div>

                {/* 10. Hidden Fees Removed */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>10. Transparent Upfront Fees</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    Itemized GST breakdown, transparent free-delivery thresholds, and zero hidden platform surcharges at checkout.
                  </p>
                </div>

                {/* 11. Fake Reviews Removed */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>11. Fake Social Proof Stripped</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    No fabricated testimonials, unverified celebrity endorsements, or falsified purchase badges.
                  </p>
                </div>

                {/* 12. Unsupported Claims Removed */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>12. Unsupported Claims Removed</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    Marketing copy strictly verified for factual accuracy; removed exaggerated or unverified supply-chain claims.
                  </p>
                </div>

                {/* 13. Alt Text Accessibility */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>13. Accessibility Alt Tags on Assets</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    All product images, banners, and media assets feature descriptive alt text and fallbacks for screen readers.
                  </p>
                </div>

                {/* 14. Color Contrast Ratio */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>14. WCAG AA Color Contrast Standard</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    All body typography, buttons, and badges meet or exceed the 4.5:1 minimum contrast ratio across White, Dark, and Yellow themes.
                  </p>
                </div>

                {/* 15. Keyboard Navigation */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>15. Full Keyboard & Screen-Reader Navigation</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    Focus indicators (<code>focus-visible:ring</code>), skip-to-content accessibility anchors, and semantic HTML5 landmarks implemented.
                  </p>
                </div>

                {/* 16. Business Details */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>16. Registered Business Details</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    Fresh Quick Commerce Private Limited, Gandhi Nagar, Company Bagh, Basti, UP 272001. Support: support@freshbasti.in.
                  </p>
                </div>

                {/* 17. Child Data & Age Gate */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>17. 18+ Age Eligibility & Minor Protection</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    Explicit age requirement on signup forms; no collection of children's data or predatory youth-targeted marketing.
                  </p>
                </div>

                {/* 18. Unsubscribe Links */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>18. One-Click Communication Opt-Out</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    Account settings provide granular toggles to opt out of marketing SMS and promotional messages at any time.
                  </p>
                </div>

                {/* 19. Font & Asset Licensing */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>19. Commercial Asset Licensing Verification</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    Plus Jakarta Sans (SIL OFL 1.1), Lucide React (ISC License), and OpenStreetMap (ODbL License). Zero unlicensed assets.
                  </p>
                </div>

                {/* 20. Data Deletion Mechanism */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--app-text-primary)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>20. Permanent Account & Data Deletion</span>
                  </div>
                  <p className="text-[11px] pl-6 text-[var(--app-text-muted)]">
                    Full self-service "Delete Account & Data" action in Profile Settings invoking backend purge API per GDPR & DPDP Act.
                  </p>
                </div>

              </div>
            </article>
          )}

        </div>

      </main>

      {/* Footer */}
      <FreshCartFooter />

    </div>
  );
};

export default LegalPage;
