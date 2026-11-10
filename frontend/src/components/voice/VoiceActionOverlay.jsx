import React from 'react';
import { useVoiceAgent } from '../../context/VoiceAgentContext';
import { Compass, CheckCircle2, XCircle, ShieldAlert, Sparkles, Navigation, Search, Filter, Eye } from 'lucide-react';

export const VoiceActionOverlay = () => {
  const { activeActionInfo, pendingAction, confirmPendingAction, cancelPendingAction } = useVoiceAgent();

  if (!activeActionInfo && !pendingAction) return null;

  return (
    <aside
      aria-label="Voice Co-Pilot Notifications"
      className="fixed top-20 right-4 sm:right-8 z-40 max-w-sm w-[90vw] animate-fade-in pointer-events-auto"
    >
      {/* 1. Active Autonomous Action Pill */}
      {activeActionInfo && (
        <div className="bg-white/95 backdrop-blur-md border-2 border-med-blue rounded-2xl p-3.5 shadow-med-lg flex items-center gap-3 text-med-text-primary text-xs font-semibold mb-2">
          <div className="w-8 h-8 rounded-xl bg-med-blue text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
            {activeActionInfo.type === 'NAVIGATE' && <Navigation className="w-4 h-4" />}
            {activeActionInfo.type === 'SEARCH' && <Search className="w-4 h-4" />}
            {activeActionInfo.type === 'FILTER' && <Filter className="w-4 h-4" />}
            {activeActionInfo.type === 'SENIOR_MODE' && <Eye className="w-4 h-4" />}
            {activeActionInfo.type === 'CONFIRM_REQUIRED' && <ShieldAlert className="w-4 h-4" />}
            {activeActionInfo.type === 'SUCCESS' && <CheckCircle2 className="w-4 h-4" />}
            {activeActionInfo.type === 'CANCELLED' && <XCircle className="w-4 h-4" />}
            {!['NAVIGATE', 'SEARCH', 'FILTER', 'SENIOR_MODE', 'CONFIRM_REQUIRED', 'SUCCESS', 'CANCELLED'].includes(activeActionInfo.type) && (
              <Sparkles className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-med-blue-dark">
                SilverVoice Co-Pilot
              </span>
            </div>
            <p className="text-xs text-med-text-heading font-bold mt-0.5">
              {activeActionInfo.description}
            </p>
          </div>
        </div>
      )}

      {/* 2. Guarded Action Confirmation Modal Card */}
      {pendingAction && (
        <div className="bg-white border-2 border-med-status-warning rounded-3xl p-5 shadow-2xl space-y-3 animate-slide-up">
          <div className="flex items-center gap-2.5 text-med-status-warning">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="text-xs font-black uppercase tracking-widest text-warmgray-900">
              Elder Guardrail Confirmation
            </span>
          </div>

          <p className="text-xs sm:text-sm text-med-text-primary font-bold leading-relaxed">
            {pendingAction.prompt}
          </p>

          <p className="text-[11px] text-med-text-secondary font-medium">
            💡 Say <strong className="text-med-blue-dark">"YES"</strong> / <strong className="text-med-blue-dark">"ஆமாம்"</strong> / <strong className="text-med-blue-dark">"हाँ"</strong> or click below:
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={confirmPendingAction}
              className="flex-1 btn-primary text-xs !py-2.5 !px-3 font-bold bg-med-status-success hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm
            </button>
            <button
              onClick={cancelPendingAction}
              className="flex-1 btn-outline text-xs !py-2.5 !px-3 font-bold border-warmgray-300 text-warmgray-700 hover:bg-warmgray-100"
            >
              <XCircle className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
