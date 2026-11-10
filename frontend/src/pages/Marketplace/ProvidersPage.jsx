import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProviders, getCategories } from '../../api/client';
import { ProviderCard } from '../../components/marketplace/ProviderCard';
import { ProviderFilterPanel } from '../../components/marketplace/ProviderFilterPanel';
import { Award, ShieldCheck, X } from 'lucide-react';

export const ProvidersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    skill: searchParams.get('skill') || searchParams.get('search') || searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    language: searchParams.get('language') || '',
    verified: searchParams.get('verified') || ''
  });

  // Keep filters in sync when URL search params change externally (e.g. AI Controller navigation)
  useEffect(() => {
    setFilters({
      skill: searchParams.get('skill') || searchParams.get('search') || searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      language: searchParams.get('language') || '',
      verified: searchParams.get('verified') || ''
    });
  }, [searchParams]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.skill) {
        params.skill = filters.skill;
        params.search = filters.skill;
      }
      if (filters.category) params.category = filters.category;
      if (filters.language) params.language = filters.language;
      if (filters.verified) params.verified = filters.verified;

      const [provRes, catRes] = await Promise.all([
        getProviders(params),
        getCategories()
      ]);
      setProviders(provRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const sp = new URLSearchParams();
    if (newFilters.skill) sp.set('skill', newFilters.skill);
    if (newFilters.category) sp.set('category', newFilters.category);
    if (newFilters.language) sp.set('language', newFilters.language);
    if (newFilters.verified) sp.set('verified', newFilters.verified);
    setSearchParams(sp, { replace: true });
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      skill: '',
      category: '',
      language: '',
      verified: ''
    };
    setFilters(emptyFilters);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const hasActiveFilters = Boolean(
    filters.skill || filters.category || filters.language || filters.verified
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title text-3xl sm:text-4xl">Verified Homemakers & Elder Artisans</h1>
        <p className="text-xs sm:text-sm text-warmgray-500 mt-1">
          Discover certified homemakers and elders in Chennai carrying decades of practical cultural mastery
        </p>
      </div>

      {/* Main Grid: Lekhs-Style Filter Sidebar + Providers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Filter Sidebar */}
        <div className="lg:col-span-1">
          <ProviderFilterPanel
            filters={filters}
            onChange={handleFilterChange}
            categories={categories}
            onReset={handleResetFilters}
          />
        </div>

        {/* Right Providers Grid */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-warmgray-600 bg-cream-100 px-4 py-2.5 rounded-2xl border border-warmgray-200">
            <span>Showing {providers.length} Verified Homemakers & Artisans</span>
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5">
                {filters.skill && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-warmgray-300 text-warmgray-800 text-[11px]">
                    Skill: "{filters.skill}"
                    <button onClick={() => handleFilterChange({ ...filters, skill: '' })} className="text-warmgray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.category && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-warmgray-300 text-warmgray-800 text-[11px]">
                    Category: {categories.find(c => c.slug === filters.category)?.name || filters.category}
                    <button onClick={() => handleFilterChange({ ...filters, category: '' })} className="text-warmgray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.language && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-warmgray-300 text-warmgray-800 text-[11px]">
                    Language: {filters.language}
                    <button onClick={() => handleFilterChange({ ...filters, language: '' })} className="text-warmgray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-warmgray-300 text-warmgray-800 text-[11px]">
                    Verified Only
                    <button onClick={() => handleFilterChange({ ...filters, verified: '' })} className="text-warmgray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-purple-600 hover:underline ml-1 font-bold"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-16 font-bold text-saffron">Loading verified profiles...</div>
          ) : providers.length === 0 ? (
            <div className="card-surface p-12 text-center border border-warmgray-200">
              <span className="text-4xl">👵🏽</span>
              <h3 className="font-heading font-bold text-lg text-warmgray-900 mt-2">No Artisans Found</h3>
              <p className="text-xs text-warmgray-500 mt-1">Try clearing your filters or choosing another craft.</p>
              <button onClick={handleResetFilters} className="btn-primary text-xs !py-2 !px-4 mt-4">
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
