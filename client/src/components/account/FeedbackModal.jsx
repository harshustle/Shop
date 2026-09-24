import React, { useState } from 'react';
import { MessageSquare, Star, Send, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_URL } from '../../config';

const FeedbackModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [category, setCategory] = useState('Order Experience');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorText, setErrorText] = useState('');

  const categories = [
    'Order Experience',
    'Delivery Speed',
    'Product Quality',
    'App Usability',
    'Payment / Wallet',
    'Other Issue'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 3) {
      setErrorText('Please write a brief comment describing your experience.');
      return;
    }

    setIsSubmitting(true);
    setErrorText('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/account/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category, rating, message: message.trim() })
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setMessage('');
          onClose();
        }, 2000);
      } else {
        const data = await res.json();
        setErrorText(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      setErrorText('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Send Feedback / Report Issue</h3>
              <p className="text-[11px] text-slate-500 font-medium">We read every message to make FreshCart better</p>
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

        {submitted ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="text-base font-black text-slate-900">Thank You For Your Feedback!</h4>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
              Our support and quality engineering team has logged your response.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {errorText && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{errorText}</span>
              </div>
            )}

            {/* Category Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">What is your feedback about?</label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      category === cat
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Overall Satisfaction</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition focus:outline-none"
                  >
                    <Star
                      size={24}
                      className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-600 ml-2">
                  {rating === 5 ? 'Excellent ⭐⭐⭐⭐⭐' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : 'Needs Improvement'}
                </span>
              </div>
            </div>

            {/* Message input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tell us more details</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your experience, suggest an item you want, or report a delivery bug..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-teal-500/30 focus:outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Send size={13} />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

export default FeedbackModal;
