import React from 'react';
import { Globe, Check, X } from 'lucide-react';

const LanguageModal = ({ isOpen, onClose, currentLanguage = 'English', onSelectLanguage }) => {
  if (!isOpen) return null;

  const languages = [
    { id: 'English', label: 'English', sub: 'Default language' },
    { id: 'हिन्दी', label: 'हिन्दी (Hindi)', sub: 'आसान खरीदारी अपनी भाषा में' },
    { id: 'Hinglish', label: 'Hinglish', sub: 'Groceries aur fresh sabziyan' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Choose Language / भाषा चुनें</h3>
              <p className="text-[11px] text-slate-500 font-medium">Select your preferred app language</p>
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

        {/* Options */}
        <div className="space-y-2.5">
          {languages.map((lang) => {
            const isSelected = currentLanguage === lang.id;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => {
                  onSelectLanguage(lang.id);
                  onClose();
                }}
                className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                  isSelected
                    ? 'border-[#00B074] bg-emerald-50/40 shadow-xs'
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div>
                  <span className={`text-sm font-black block ${isSelected ? 'text-[#00B074]' : 'text-slate-800'}`}>
                    {lang.label}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{lang.sub}</span>
                </div>

                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${
                  isSelected ? 'bg-[#00B074] border-[#00B074] text-white' : 'border-slate-300 bg-white'
                }`}>
                  {isSelected && <Check size={14} className="stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default LanguageModal;
