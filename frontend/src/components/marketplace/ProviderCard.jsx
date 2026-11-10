import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, ShieldCheck, Award } from 'lucide-react';
import { SkillPassportBadge } from '../trust/SkillPassportBadge';
import { useLanguage } from '../../context/LanguageContext';
import { translateContent } from '../../i18n/contentTranslations';

export const ProviderCard = ({ provider }) => {
  const { language, t } = useLanguage();

  return (
    <div className="card-surface p-6 flex flex-col justify-between h-full group hover:border-saffron/40">
      <div>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-saffron-100 text-saffron-700 flex items-center justify-center font-bold text-2xl shrink-0 shadow-warm-sm">
            {provider.display_name?.[0] || '👵🏽'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <Link to={`/providers/${provider.id}`} className="font-heading text-lg font-bold text-warmgray-900 group-hover:text-saffron truncate">
                {provider.display_name}
              </Link>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{provider.rating}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-warmgray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-warmgray-400" />
                {translateContent(provider.location, language)}
              </span>
              <span>•</span>
              <span className="font-bold text-sage-dark">{provider.experience_years}+ yrs exp</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-warmgray-600 mt-4 line-clamp-3 leading-relaxed">
          {translateContent(provider.bio, language)}
        </p>

        {/* Skill Tags */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {(provider.skills || []).slice(0, 3).map((skill, idx) => (
            <span key={idx} className="bg-cream-100 text-warmgray-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-warmgray-200">
              {translateContent(skill, language)}
            </span>
          ))}
        </div>

        {/* Verified Passport Status */}
        <div className="mt-4 pt-3 border-t border-warmgray-100">
          <SkillPassportBadge passportId={provider.skill_passport_id} trustScore={provider.trust_score} compact={true} />
        </div>
      </div>

      <div className="mt-5 pt-4 flex items-center justify-between">
        <span className="text-xs font-bold text-warmgray-600">
          {provider.services?.length || 0} {t('nav.services')}
        </span>
        <Link to={`/providers/${provider.id}`} className="btn-outline text-xs !px-4 !py-2">
          {t('providers.viewProfile')}
        </Link>
      </div>
    </div>
  );
};
