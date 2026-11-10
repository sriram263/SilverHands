import React, { useState } from 'react';
import { MapPin, Sparkles, Check, Send, ChevronRight } from 'lucide-react';
import { respondOpportunity } from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { translateContent } from '../../i18n/contentTranslations';

export const OpportunityRadarCard = ({ opportunity, onResponded }) => {
  const { isAuthenticated, isProvider } = useAuth();
  const { showToast } = useNotifications();
  const { language, t } = useLanguage();
  const [responding, setResponding] = useState(false);
  const [showResponseInput, setShowResponseInput] = useState(false);
  const [message, setMessage] = useState('');
  const [hasResponded, setHasResponded] = useState(false);

  const handleRespond = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in as a provider to accept gigs', 'error');
      return;
    }
    setResponding(true);
    try {
      await respondOpportunity(opportunity.id, { message: message || 'I am interested and available!' });
      setHasResponded(true);
      setShowResponseInput(false);
      showToast('Gig response sent to customer!', 'success');
      onResponded?.();
    } catch {
      showToast('Failed to send response', 'error');
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="card-surface p-6 flex flex-col justify-between border-l-4 border-l-sage hover:border-l-saffron transition-all">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-tag bg-sage-50 text-sage-dark border border-sage-200 font-bold">
                {translateContent(opportunity.category || 'Local Gig', language)}
              </span>
              {opportunity.match_score && (
                <span className="badge-tag bg-saffron-50 text-saffron-dark font-bold border border-saffron-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-saffron" />
                  {opportunity.match_score}% AI Match
                </span>
              )}
            </div>
            <h3 className="font-heading text-lg font-bold text-warmgray-900 mt-2">
              {translateContent(opportunity.title, language)}
            </h3>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-warmgray-400 font-bold block uppercase">Budget</span>
            <span className="font-heading text-xl font-extrabold text-sage-dark">
              ₹{Math.round(opportunity.budget)}
            </span>
          </div>
        </div>

        <p className="text-xs text-warmgray-600 mt-2.5 line-clamp-2 leading-relaxed">
          {translateContent(opportunity.description, language)}
        </p>

        <div className="flex items-center gap-3 mt-4 text-xs font-semibold text-warmgray-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-warmgray-400" />
            {translateContent(opportunity.location_name || 'Chennai, TN', language)} ({opportunity.distance_km || 2.5} km)
          </span>
          <span>•</span>
          <span>By {opportunity.customer_name}</span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-warmgray-100">
        {hasResponded ? (
          <div className="flex items-center gap-2 text-xs font-bold text-sage-dark bg-sage-50 px-4 py-2.5 rounded-xl">
            <Check className="w-4 h-4 text-sage" />
            <span>Response Submitted!</span>
          </div>
        ) : showResponseInput ? (
          <div className="space-y-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add an optional greeting..."
              className="w-full px-3 py-2 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium focus:ring-2 focus:ring-sage"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResponseInput(false)}
                className="btn-ghost text-xs !px-3 !py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleRespond}
                disabled={responding}
                className="btn-primary text-xs !px-3.5 !py-1.5 flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                {responding ? 'Sending...' : 'Confirm Response'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResponseInput(true)}
            className="w-full btn-secondary text-xs !py-2.5 flex items-center justify-center gap-1.5 shadow-warm-sm"
          >
            <span>Respond & Accept Gig</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
