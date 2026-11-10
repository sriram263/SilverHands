import React from 'react';
import { Search, RotateCcw, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const ProviderFilterPanel = ({ filters, onChange, categories, onReset }) => {
  const { t } = useLanguage();

  return (
    <div className="card-surface p-6 space-y-5 border border-warmgray-200 shadow-warm">
      <div className="flex items-center justify-between pb-3 border-b border-warmgray-100">
        <h3 className="font-heading font-bold text-base text-warmgray-900 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-purple-600" />
          {t('filters.title')}
        </h3>
        <button
          onClick={onReset}
          className="text-xs font-bold text-warmgray-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t('filters.resetBtn')}
        </button>
      </div>

      {/* 1. Skill / Artisan Search */}
      <div>
        <label className="block text-xs font-bold text-warmgray-700 mb-1.5">{t('filters.searchLabel')}</label>
        <div className="relative">
          <Search className="w-4 h-4 text-warmgray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={filters.skill || ''}
            onChange={(e) => onChange({ ...filters, skill: e.target.value })}
            placeholder="Search..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* 2. Category Dropdown */}
      <div>
        <label className="block text-xs font-bold text-warmgray-700 mb-1.5">{t('filters.categoryLabel')}</label>
        <select
          value={filters.category || ''}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium focus:ring-2 focus:ring-purple-500"
        >
          <option value="">{t('categories.all')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* 3. Language Filter */}
      <div>
        <label className="block text-xs font-bold text-warmgray-700 mb-1.5">{t('filters.languageLabel')}</label>
        <select
          value={filters.language || ''}
          onChange={(e) => onChange({ ...filters, language: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Languages</option>
          <option value="English">English</option>
          <option value="Tamil">தமிழ் (Tamil)</option>
          <option value="Hindi">हिंदी (Hindi)</option>
          <option value="Telugu">తెలుగు (Telugu)</option>
          <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
          <option value="Malayalam">മലയാളം (Malayalam)</option>
        </select>
      </div>

      {/* 4. Verified Identity Toggle */}
      <div className="pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.verified === 'true'}
            onChange={(e) => onChange({ ...filters, verified: e.target.checked ? 'true' : '' })}
            className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
          />
          <span className="text-xs font-bold text-warmgray-800 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sage" />
            {t('providers.verifiedPassport')}
          </span>
        </label>
      </div>

    </div>
  );
};
