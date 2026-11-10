import React from 'react';
import { Award, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const SkillPassportBadge = ({ passportId, trustScore = 95, compact = false }) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 bg-sage-50 text-sage-dark px-3 py-1.5 rounded-xl border border-sage-200 text-xs font-bold shadow-warm-sm">
        <Award className="w-4 h-4 text-sage" />
        <span>Verified Skill Passport</span>
        <span className="bg-sage text-white px-1.5 py-0.2 rounded-md text-[10px]">
          {trustScore}% Trust
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-saffron-200 rounded-2xl p-4 shadow-warm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-saffron text-white flex items-center justify-center font-bold">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-warmgray-900">Government ID & Skill Verified</h4>
            <span className="text-[10px] text-warmgray-500 font-mono">Passport ID: {passportId || 'SP-VERIFIED-2026'}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-warmgray-500 font-bold block">SilverTrust</span>
          <span className="font-heading text-base font-extrabold text-sage-dark">{trustScore}/100</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs font-semibold text-warmgray-700 pt-2 border-t border-saffron-100">
        <span className="flex items-center gap-1 text-sage-dark"><CheckCircle2 className="w-3.5 h-3.5" /> Background Verified</span>
        <span className="flex items-center gap-1 text-sage-dark"><CheckCircle2 className="w-3.5 h-3.5" /> 10+ Yrs Practical Master</span>
      </div>
    </div>
  );
};
