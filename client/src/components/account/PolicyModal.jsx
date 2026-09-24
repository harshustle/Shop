import React from 'react';
import { Truck, FileText, RotateCcw, Shield, X, CheckCircle2 } from 'lucide-react';

const policyData = {
  shipping: {
    icon: <Truck size={20} />,
    iconBg: 'bg-blue-50 text-blue-600',
    title: 'Shipping & Delivery Policy',
    subtitle: 'Lightning-fast 10 to 20 minute quick commerce delivery',
    sections: [
      {
        heading: '1. Express 10-Minute Fulfillment',
        body: 'FreshCart operates a hyper-local network of micro-fulfillment centers (Darkstores) situated within 3km of your doorstep. Orders are picked and packed in under 3 minutes and dispatched immediately via our express fleet.'
      },
      {
        heading: '2. Delivery Charges & Free Delivery Threshold',
        body: 'Orders above ₹199 qualify for completely Free Delivery. For orders below ₹199, a nominal delivery fee of ₹15 to ₹25 is applied to offset express courier logistics.'
      },
      {
        heading: '3. Temperature-Controlled Cold Chain',
        body: 'Dairy items, fresh poultry, ice creams, and tender greens travel in insulated thermal bags with frozen ice packs to preserve peak freshness until handed over.'
      },
      {
        heading: '4. Live GPS Tracking',
        body: 'You can watch your delivery partner move live on the interactive map from the darkstore directly to your building.'
      }
    ]
  },
  terms: {
    icon: <FileText size={20} />,
    iconBg: 'bg-slate-100 text-slate-700',
    title: 'Terms & Conditions',
    subtitle: 'Rules and guidelines for shopping on FreshCart',
    sections: [
      {
        heading: '1. User Account & Security',
        body: 'You are responsible for maintaining the confidentiality of your account credentials and mobile OTP. FreshCart never asks for your password or financial PIN.'
      },
      {
        heading: '2. Pricing & Product Availability',
        body: 'All listed prices include statutory Indian GST. In rare instances where an item runs out of stock right during packing, your bill is recalculated and the exact difference is refunded to your wallet in seconds.'
      },
      {
        heading: '3. Order Limits & Fair Usage',
        body: 'To prevent hoarding and wholesale diversion, certain promotional items carry quantity restrictions per customer per day.'
      },
      {
        heading: '4. Governing Jurisdiction',
        body: 'These terms are governed by the laws of India, under the legal jurisdiction of the courts in Uttar Pradesh / New Delhi.'
      }
    ]
  },
  refunds: {
    icon: <RotateCcw size={20} />,
    iconBg: 'bg-emerald-50 text-emerald-600',
    title: 'Cancellation & Refunds Policy',
    subtitle: 'Hassle-free 100% money back and instant cancellation',
    sections: [
      {
        heading: '1. Instant Pre-Dispatch Cancellation',
        body: 'You can cancel any order free of charge before the delivery partner is assigned and dispatched from the darkstore.'
      },
      {
        heading: '2. No-Questions-Asked Fresh Item Returns',
        body: 'If any fruit, vegetable, or packaged product arrives damaged, past expiry, or compromised, report it within 2 hours for a 100% replacement or refund.'
      },
      {
        heading: '3. Refund Timelines',
        body: '• FreshCart Wallet: Instant (within 5 seconds)\n• UPI (GPay, PhonePe, Paytm): 2 to 4 hours\n• Credit / Debit Cards & Net Banking: 2 to 4 business days.'
      },
      {
        heading: '4. Cash On Delivery Returns',
        body: 'For COD orders, refunds for missing or damaged items are immediately transferred to your FreshCart Wallet or registered UPI VPA.'
      }
    ]
  },
  privacy: {
    icon: <Shield size={20} />,
    iconBg: 'bg-indigo-50 text-indigo-600',
    title: 'Privacy & Data Protection Policy',
    subtitle: 'Bank-grade security and zero commercial data selling',
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'We collect your delivery address, mobile phone number, and optional email solely to execute orders and provide live delivery updates.'
      },
      {
        heading: '2. Zero Data Selling Pledge',
        body: 'We never sell, rent, or trade your personal information or contact details to third-party telemarketers or advertisers.'
      },
      {
        heading: '3. Secure 256-bit TLS Encryption',
        body: 'All communications between your device and our servers, including payment tokens and authentication sessions, are protected with enterprise-grade SSL/TLS.'
      },
      {
        heading: '4. Account & Data Deletion',
        body: 'You have full right to request data erasure or account termination at any time by contacting our support desk at privacy@freshcart.in.'
      }
    ]
  }
};

const PolicyModal = ({ isOpen, type = 'shipping', onClose }) => {
  if (!isOpen) return null;

  const data = policyData[type] || policyData.shipping;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl max-h-[85vh] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${data.iconBg}`}>
              {data.icon}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{data.title}</h3>
              <p className="text-[11px] text-slate-500 font-medium">{data.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-4 pr-1 text-xs text-slate-600 leading-relaxed scrollbar-thin">
          {data.sections.map((sec, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#00B074]" />
                <span>{sec.heading}</span>
              </h4>
              <p className="font-medium text-slate-600 pl-5 whitespace-pre-line">{sec.body}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-[#00B074] text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
};

export default PolicyModal;
