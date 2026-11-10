import React, { useState } from 'react';
import { X, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import { createReview } from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';

const QUICK_TAGS = [
  'Authentic Taste 🍲',
  'Neat Packaging 📦',
  'On-Time Delivery ⏰',
  'Intricate Craftsmanship ✨',
  'Patient & Kind Elder 👵',
  '100% Hygienic & Clean 🌿',
  'Great Value for Money 💰'
];

export const ReviewModal = ({ booking, order, service, product, isOpen, onClose, onSuccess }) => {
  const { showToast } = useNotifications();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const targetItem = booking || order || service || product;
  if (!isOpen || !targetItem) return null;

  const itemTitle = booking?.service_title || order?.product_title || service?.title || product?.title || 'Elder Service / Product';
  const providerName = booking?.provider_name || order?.provider_name || service?.provider_name || product?.provider_name || 'Artisan';
  const isProduct = Boolean(order || product || (!booking && !service && targetItem?.price));

  const handleAddTag = (tag) => {
    const cleanTag = tag.replace(/ [^\s]+$/, ''); // Strip emoji for cleaner sentence
    if (!comment) {
      setComment(tag + '. ');
    } else if (!comment.includes(cleanTag)) {
      setComment(prev => prev.trim() + ' ' + tag + '. ');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        rating,
        comment: comment.trim(),
      };

      if (booking) {
        payload.booking = booking.id;
        payload.service = booking.service;
        payload.provider = booking.provider;
      } else if (order) {
        payload.order = order.id;
        payload.product = order.product;
        payload.provider = order.provider;
      } else if (service) {
        payload.service = service.id;
        payload.provider = service.provider;
      } else if (product) {
        payload.product = product.id;
        payload.provider = product.provider;
      }

      await createReview(payload);
      showToast(`Thank you! Your ${rating}★ review for ${providerName} has been recorded.`, 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.error || err.response?.data?.detail || 'Failed to submit review. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-warm-xl overflow-hidden border border-warmgray-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cream-100 to-cream-200 p-6 border-b border-warmgray-200 flex items-center justify-between">
          <div>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${isProduct ? 'bg-sage-100 text-sage-dark' : 'bg-saffron-100 text-saffron-dark'}`}>
              {isProduct ? '🛍️ Product Feedback' : '✨ Service Feedback'}
            </span>
            <h3 className="font-heading text-lg font-bold text-warmgray-900 mt-1">{itemTitle}</h3>
            <p className="text-xs text-warmgray-600">Handcrafted by <strong className="text-warmgray-800">{providerName}</strong></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-warmgray-500 hover:bg-cream-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Star Rating Picker */}
          <div className="text-center bg-cream-50/60 p-4 rounded-2xl border border-warmgray-200/50">
            <label className="block text-xs font-bold text-warmgray-700 mb-2">
              {isProduct ? 'How would you rate this handmade product?' : 'How was your experience with the elder artisan?'}
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-3xl transition-transform hover:scale-125 focus:outline-none"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star className={`w-9 h-9 ${star <= rating ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'text-warmgray-200'}`} />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-warmgray-800 mt-2 block">
              {rating === 5 ? '🌟 Outstanding & Authentic!' : rating === 4 ? '👍 Very Good & Satisfying!' : rating === 3 ? '👌 Average Quality' : rating === 2 ? '👎 Below Expectations' : '⚠️ Poor Experience'}
            </span>
          </div>

          {/* Quick Compliment Pills */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-warmgray-500 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-saffron" /> Quick compliments (Click to add)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-cream-100 hover:bg-saffron-100 hover:text-saffron-dark text-warmgray-700 border border-warmgray-200/60 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Textarea */}
          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">
              Share your genuine feedback & appreciation
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isProduct ? "Describe the taste, aroma, fabric quality, or packaging..." : "Describe the artisan's care, punctuality, and teaching patience..."}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-200 bg-cream-50/50 text-sm font-medium focus:ring-2 focus:ring-saffron focus:bg-white transition-all outline-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
            <button
              type="submit"
              disabled={loading || !comment.trim()}
              className="btn-primary text-sm !px-6 flex items-center gap-2 shadow-warm disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Recording Review...' : `Submit ${rating}★ Review`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

