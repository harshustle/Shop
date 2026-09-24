import React from 'react';
import { Mail, Phone, MessageCircle, MapPin, Clock, X, ExternalLink } from 'lucide-react';

const ContactUsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Contact FreshCart Support</h3>
              <p className="text-[11px] text-slate-500 font-medium">We are here to assist with every order</p>
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

        {/* Channels */}
        <div className="space-y-3">
          
          {/* WhatsApp */}
          <a
            href="https://api.whatsapp.com/send?phone=919161955178&text=Hi%20FreshCart%20Support,%20I%20need%20assistance%20with%20my%20order"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm">
                <MessageCircle size={20} />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block">WhatsApp Instant Support</span>
                <span className="text-[11px] text-slate-500 font-medium">Average response time: &lt; 2 minutes</span>
              </div>
            </div>
            <ExternalLink size={16} className="text-emerald-600 group-hover:translate-x-0.5 transition" />
          </a>

          {/* Toll Free Phone */}
          <a
            href="tel:18002667827"
            className="p-4 rounded-2xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Phone size={18} />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block">Toll-Free Customer Care</span>
                <span className="text-[11px] text-slate-500 font-medium">1800-FRESH-CART (1800-266-7827)</span>
              </div>
            </div>
            <ExternalLink size={16} className="text-blue-600 group-hover:translate-x-0.5 transition" />
          </a>

          {/* Email Support */}
          <a
            href="mailto:support@freshcart.in?subject=Customer%20Assistance%20Inquiry"
            className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-sm">
                <Mail size={18} />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block">Email Support Desk</span>
                <span className="text-[11px] text-slate-500 font-medium">support@freshcart.in</span>
              </div>
            </div>
            <ExternalLink size={16} className="text-slate-600 group-hover:translate-x-0.5 transition" />
          </a>

        </div>

        {/* Operating Hours & Address */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            <span className="font-bold text-slate-700">Support Hours: 6:00 AM – 11:00 PM (Everyday)</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-slate-400" />
            <span>Central Darkstore Hub, Sector 4, Ghaziabad, UP - 201014</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContactUsModal;
