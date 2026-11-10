import React from 'react';
import { Search, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const ServiceFilterPanel = ({ filters, onChange, categories, onReset }) => {
  const { t } = useLanguage();

  return (
    <div className="card-surface p-6 space-y-5 border border-warmgray-200 shadow-warm">
      <div className="flex items-center justify-between pb-3 border-b border-warmgray-100">
        <h3 className="font-heading font-bold text-base text-warmgray-900 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-saffron" />
          {t('filters.title')}
        </h3>
        <button
          onClick={onReset}
          className="text-xs font-bold text-warmgray-500 hover:text-saffron flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t('filters.resetBtn')}
        </button>
      </div>

      {/* 1. Keyword Search */}
      <div>
        <label className="block text-xs font-bold text-warmgray-700 mb-1.5">{t('filters.searchLabel')}</label>
        <div className="relative">
          <Search className="w-4 h-4 text-warmgray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium focus:ring-2 focus:ring-saffron"
          />
        </div>
      </div>

      {/* 2. Category Dropdown */}
      <div>
        <label className="block text-xs font-bold text-warmgray-700 mb-1.5">{t('filters.categoryLabel')}</label>
        <select
          value={filters.category || ''}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium focus:ring-2 focus:ring-saffron"
        >
          <option value="">{t('categories.all')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* 3. Price Range */}
      <div>
        <label className="block text-xs font-bold text-warmgray-700 mb-1.5">{t('filters.priceRange')}</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={filters.min_price || ''}
            onChange={(e) => onChange({ ...filters, min_price: e.target.value })}
            placeholder="Min ₹"
            className="w-full px-3 py-2 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium"
          />
          <input
            type="number"
            value={filters.max_price || ''}
            onChange={(e) => onChange({ ...filters, max_price: e.target.value })}
            placeholder="Max ₹"
            className="w-full px-3 py-2 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium"
          />
        </div>
      </div>

    </div>
  );
};
