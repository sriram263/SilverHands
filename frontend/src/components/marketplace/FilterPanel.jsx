import React from 'react';
import { Search, Filter, RotateCcw, SlidersHorizontal } from 'lucide-react';

export const FilterPanel = ({ filters, onChange, categories, onReset }) => {
  return (
    <div className="card-surface p-6 space-y-5 border border-warmgray-200 shadow-warm">
      <div className="flex items-center justify-between pb-3 border-b border-warmgray-100">
        <h3 className="font-heading font-bold text-base text-warmgray-900 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-sage" />
          Filter Products
        </h3>
        <button
          onClick={onReset}
          className="text-xs font-bold text-warmgray-500 hover:text-saffron flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* 1. Keyword Search */}
      <div>
        <label className="block text-xs font-bold text-warmgray-700 mb-1.5">Search Items</label>
        <div className="relative">
          <Search className="w-4 h-4 text-warmgray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search pickles, murukku, bags..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium focus:ring-2 focus:ring-sage"
          />
        </div>
      </div>

      {/* 2. Category Dropdown */}
      <div>
        <label className="block text-xs font-bold text-warmgray-700 mb-1.5">Category</label>
        <select
          value={filters.category || ''}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium focus:ring-2 focus:ring-sage"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* 3. Price Range */}
      <div>
        <label className="block text-xs font-bold text-warmgray-700 mb-1.5">Price Range (₹)</label>
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

      {/* 4. Sort By */}
      <div>
        <label className="block text-xs font-bold text-warmgray-700 mb-1.5">Sort By</label>
        <select
          value={filters.ordering || '-created_at'}
          onChange={(e) => onChange({ ...filters, ordering: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium focus:ring-2 focus:ring-sage"
        >
          <option value="-created_at">Newest First</option>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
        </select>
      </div>

    </div>
  );
};
