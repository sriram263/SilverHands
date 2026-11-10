import React from 'react';
import { ShieldCheck, Award, CheckCircle2, Star, Calendar, MapPin, Globe, Sparkles, Printer } from 'lucide-react';

export const SkillPassportCard = ({ profile, onClose }) => {
  if (!profile) return null;

  const passportId = profile.skill_passport_id || `SH-PASS-${(profile.id || 1).toString().padStart(4, '0')}-2026`;
  const name = profile.display_name || profile.user?.first_name || 'Verified Homemaker & Artisan';
  const skills = profile.skills || ['Traditional Home Cooking', 'South Indian Sweets', 'Custom Tailoring'];
  const languages = profile.languages || ['Tamil', 'English'];
  const experience = profile.experience_years || 15;
  const rating = profile.rating || 4.9;
  const completedJobs = profile.completed_jobs_count || 24;
  const trustScore = profile.trust_score || 98;
  const location = profile.location || 'Chennai, Tamil Nadu';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gradient-to-br from-cream-50 via-white to-amber-50/40 p-6 sm:p-8 rounded-3xl border-2 border-saffron/40 shadow-warm-xl space-y-6 relative overflow-hidden">
      
      {/* Background Decorative Seals */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-saffron/5 pointer-events-none blur-xl"></div>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warmgray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-med-blue-primary to-med-blue-dark text-white flex items-center justify-center font-bold text-xl shadow-warm">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-widest text-saffron-dark">SilverHands Verified</span>
              <ShieldCheck className="w-4 h-4 text-sage" />
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-black text-warmgray-900">
              Official Skill Passport
            </h2>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold text-warmgray-400 block uppercase">Passport Certificate ID</span>
          <span className="font-mono text-xs font-bold text-warmgray-800 bg-cream-100 px-2.5 py-1 rounded-lg border border-warmgray-200">
            {passportId}
          </span>
        </div>
      </div>

      {/* Main Profile Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-5 rounded-2xl border border-warmgray-200 shadow-warm-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-cream-200 border-2 border-saffron flex items-center justify-center text-2xl font-bold text-saffron-dark shrink-0">
            {name[0] || '👵🏽'}
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-warmgray-900">{name}</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-warmgray-600 mt-1 font-medium">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-saffron" /> {location}</span>
              <span>•</span>
              <span>⏳ {experience}+ Years Mastery</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-center sm:text-right shrink-0">
          <div className="bg-cream-50 p-2.5 rounded-xl border border-warmgray-200">
            <span className="text-[10px] font-bold text-warmgray-500 block">Trust Rating</span>
            <span className="font-heading text-lg font-black text-amber-600 flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-current" /> {rating}★
            </span>
          </div>
          <div className="bg-cream-50 p-2.5 rounded-xl border border-warmgray-200">
            <span className="text-[10px] font-bold text-warmgray-500 block">Engagements</span>
            <span className="font-heading text-lg font-black text-sage-dark">
              {completedJobs}+ Jobs
            </span>
          </div>
          <div className="bg-cream-50 p-2.5 rounded-xl border border-warmgray-200">
            <span className="text-[10px] font-bold text-warmgray-500 block">Trust Score</span>
            <span className="font-heading text-lg font-black text-saffron-dark">
              {trustScore}/100
            </span>
          </div>
        </div>
      </div>

      {/* Verified Skills Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-warmgray-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-saffron" />
          <span>Certified Practical Skills & Crafts</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-saffron/30 text-warmgray-800 text-xs font-semibold shadow-warm-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
              <span>{typeof skill === 'string' ? skill : skill.name || 'Craft Skill'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Languages & Verification Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-cream-50/70 p-4 rounded-2xl border border-warmgray-200">
        <div>
          <span className="font-bold text-warmgray-600 block mb-1">🗣️ Spoken Languages:</span>
          <p className="font-semibold text-warmgray-800">{languages.join(', ')}</p>
        </div>
        <div>
          <span className="font-bold text-warmgray-600 block mb-1">🛡️ Verification Status:</span>
          <span className="inline-flex items-center gap-1 text-sage-dark font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> Identity & Skill Certified by SilverHands
          </span>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[10px] text-warmgray-400">
          Official digital credential issued for community trust & fair livelihood.
        </span>
        <button
          onClick={handlePrint}
          className="btn-outline text-xs !px-4 !py-1.5 flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" />
          Print / Save PDF
        </button>
      </div>

    </div>
  );
};
