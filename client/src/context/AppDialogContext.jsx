import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const AppDialogContext = createContext(null);

const normalizeOptions = (options, fallbackTitle) => (
  typeof options === 'string'
    ? { title: fallbackTitle, message: options }
    : { title: fallbackTitle, ...options }
);

export const AppDialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const [promptValue, setPromptValue] = useState('');
  const inputRef = useRef(null);

  const openDialog = useCallback((type, options) => new Promise((resolve) => {
    const normalized = normalizeOptions(options, type === 'confirm' ? 'Please confirm' : 'FreshCart');
    setPromptValue(normalized.defaultValue || '');
    setDialog({ ...normalized, type, resolve });
  }), []);

  const showAlert = useCallback((options) => openDialog('alert', options), [openDialog]);
  const showConfirm = useCallback((options) => openDialog('confirm', options), [openDialog]);
  const showPrompt = useCallback((options) => openDialog('prompt', options), [openDialog]);

  const closeDialog = useCallback((confirmed) => {
    if (!dialog) return;
    const result = dialog.type === 'prompt'
      ? (confirmed ? promptValue.trim() : null)
      : dialog.type === 'confirm'
        ? confirmed
        : true;
    dialog.resolve(result);
    setDialog(null);
  }, [dialog, promptValue]);

  useEffect(() => {
    if (!dialog) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (dialog.type === 'prompt') {
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeDialog(false);
      if (event.key === 'Enter' && dialog.type === 'prompt' && promptValue.trim()) {
        closeDialog(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dialog, promptValue, closeDialog]);

  const value = { showAlert, showConfirm, showPrompt };
  const isDanger = dialog?.tone === 'danger';
  const isSuccess = dialog?.tone === 'success';
  const DialogIcon = isDanger ? AlertTriangle : isSuccess ? CheckCircle2 : Info;

  return (
    <AppDialogContext.Provider value={value}>
      {children}
      {dialog && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#05070b]/70 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && dialog.type === 'alert') closeDialog(true);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-dialog-title"
            aria-describedby="app-dialog-message"
            className="w-full max-w-md border border-[#0a0d14] bg-white text-[#071126] shadow-[10px_10px_0_#ffd400]"
          >
            <div className="flex items-start gap-4 border-b border-[#d9dde5] p-5 sm:p-6">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center border border-[#0a0d14] ${isDanger ? 'bg-[#ff315f] text-white' : isSuccess ? 'bg-[#16a36a] text-white' : 'bg-[#ffd400] text-[#071126]'}`}>
                <DialogIcon size={21} strokeWidth={2.4} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="app-dialog-title" className="text-lg font-black tracking-[-0.02em] text-[#071126]">
                  {dialog.title}
                </h2>
                {dialog.message && (
                  <p id="app-dialog-message" className="mt-1.5 text-sm font-medium leading-6 text-[#526079]">
                    {dialog.message}
                  </p>
                )}
              </div>
              {dialog.type !== 'alert' && (
                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={() => closeDialog(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#cbd1dc] text-[#526079] transition hover:border-[#071126] hover:text-[#071126]"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {dialog.type === 'prompt' && (
              <div className="px-5 pt-5 sm:px-6">
                <label htmlFor="app-dialog-input" className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#526079]">
                  {dialog.inputLabel || 'Enter value'}
                </label>
                <input
                  ref={inputRef}
                  id="app-dialog-input"
                  value={promptValue}
                  onChange={(event) => setPromptValue(event.target.value)}
                  placeholder={dialog.placeholder || ''}
                  className="h-12 w-full border border-[#aeb6c4] bg-[#f7f7f4] px-4 text-sm font-bold text-[#071126] outline-none transition focus:border-[#071126] focus:ring-2 focus:ring-[#ffd400]"
                />
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 p-5 sm:flex-row sm:justify-end sm:p-6">
              {dialog.type !== 'alert' && (
                <button
                  type="button"
                  onClick={() => closeDialog(false)}
                  className="h-11 border border-[#aeb6c4] bg-white px-5 text-sm font-black text-[#071126] transition hover:border-[#071126]"
                >
                  {dialog.cancelLabel || 'Cancel'}
                </button>
              )}
              <button
                type="button"
                disabled={dialog.type === 'prompt' && !promptValue.trim()}
                onClick={() => closeDialog(true)}
                className={`h-11 border border-[#071126] px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${isDanger ? 'bg-[#ff315f] text-white hover:bg-[#e5214d]' : 'bg-[#ffd400] text-[#071126] hover:bg-[#f1c900]'}`}
              >
                {dialog.confirmLabel || (dialog.type === 'alert' ? 'Got it' : 'Confirm')}
              </button>
            </div>
          </section>
        </div>
      )}
    </AppDialogContext.Provider>
  );
};

export const useAppDialog = () => {
  const context = useContext(AppDialogContext);
  if (!context) throw new Error('useAppDialog must be used inside AppDialogProvider');
  return context;
};
