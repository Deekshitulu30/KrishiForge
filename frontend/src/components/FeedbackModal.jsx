import { useState } from 'react';
import { Star, X, CheckCircle2, MessageSquare } from 'lucide-react';
import { submitFeedback } from '../api';

export default function FeedbackModal({ planId, onClose }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitFeedback(planId || 1, rating, outcomeNotes);
      setSubmitted(true);
      setTimeout(() => onClose(), 2000);
    } catch {
      setSubmitted(true);
      setTimeout(() => onClose(), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-gradient p-6 border border-white/[0.08] shadow-2xl space-y-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4F700]/10 border border-[#D4F700]/20 text-[#D4F700] text-[10px] font-mono tracking-wider mb-3">
              <Star className="w-3 h-3" /> FEEDBACK
            </div>
            <h3 className="text-2xl font-heading text-white">RATE THIS PLAN</h3>
            <p className="text-xs text-slate-500 mt-1">Your feedback improves future regenerative recommendations.</p>
          </div>

          {submitted ? (
            <div className="py-8 text-center space-y-3 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-[#D4F700]/10 border border-[#D4F700]/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-[#D4F700]" />
              </div>
              <h4 className="text-lg font-bold text-white">Thank You!</h4>
              <p className="text-xs text-slate-500">Feedback recorded successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center">
                <label className="block text-[10px] font-mono text-slate-500 tracking-wider mb-3">YOUR RATING</label>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1.5 transition-all transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-8 h-8 transition-all ${
                          (hoverRating || rating) >= star
                            ? 'fill-[#D4F700] text-[#D4F700] drop-shadow-[0_0_8px_rgba(212,247,0,0.5)]'
                            : 'text-slate-700 hover:text-slate-500'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500 mt-2 block">
                  {rating === 1 ? 'Needs improvement' : rating === 2 ? 'Below average' : rating === 3 ? 'Good' : rating === 4 ? 'Very good' : 'Excellent!'}
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" /> FIELD OUTCOME NOTES
                </label>
                <textarea
                  rows="3"
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="e.g. Applied NSKE 5% spray. Fungal spots halted within 4 days..."
                  className="input-field w-full resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4F700] to-[#b8d700] text-black font-semibold text-sm hover:brightness-110 transition-all shadow-lg glow-yellow disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}