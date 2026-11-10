import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getServices, getCategories } from '../../api/client';
import { ServiceCard } from '../../components/marketplace/ServiceCard';
import { BookingModal } from '../../components/marketplace/BookingModal';
import { ServiceFilterPanel } from '../../components/marketplace/ServiceFilterPanel';
import { Sparkles, SlidersHorizontal, X } from 'lucide-react';

export const ServicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || searchParams.get('q') || '',
    min_price: searchParams.get('min_price') || searchParams.get('minPrice') || searchParams.get('min') || '',
    max_price: searchParams.get('max_price') || searchParams.get('maxPrice') || searchParams.get('max') || ''
  });

  // Keep filters in sync when URL search params change externally (e.g. AI Controller navigation)
  useEffect(() => {
    setFilters({
      category: searchParams.get('category') || '',
      search: searchParams.get('search') || searchParams.get('q') || '',
      min_price: searchParams.get('min_price') || searchParams.get('minPrice') || searchParams.get('min') || '',
      max_price: searchParams.get('max_price') || searchParams.get('maxPrice') || searchParams.get('max') || ''
    });
  }, [searchParams]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (filters.min_price) params.min_price = filters.min_price;
      if (filters.max_price) params.max_price = filters.max_price;

      const [srvRes, catRes] = await Promise.all([
        getServices(params),
        getCategories()
      ]);
      setServices(srvRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const sp = new URLSearchParams();
    if (newFilters.search) sp.set('search', newFilters.search);
    if (newFilters.category) sp.set('category', newFilters.category);
    if (newFilters.min_price) sp.set('min_price', newFilters.min_price);
    if (newFilters.max_price) sp.set('max_price', newFilters.max_price);
    setSearchParams(sp, { replace: true });
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      category: '',
      search: '',
      min_price: '',
      max_price: ''
    };
    setFilters(emptyFilters);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.category || filters.min_price || filters.max_price
  );

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="page-title text-3xl sm:text-4xl">Traditional Home Services</h1>
        <p className="text-xs sm:text-sm text-warmgray-500 mt-1">
          Book verified Indian homemakers, senior cooks, tailors, tutors, gardeners, and artisans
        </p>
      </div>

      {/* Main Grid: Lekhs-Style Filter Sidebar + Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Filter Sidebar */}
        <div className="lg:col-span-1">
          <ServiceFilterPanel
            filters={filters}
            onChange={handleFilterChange}
            categories={categories}
            onReset={handleResetFilters}
          />
        </div>

        {/* Right Services Grid */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-warmgray-600 bg-cream-100 px-4 py-2.5 rounded-2xl border border-warmgray-200">
            <span>Showing {services.length} Traditional Services</span>
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5">
                {filters.search && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-warmgray-300 text-warmgray-800 text-[11px]">
                    Keyword: "{filters.search}"
                    <button onClick={() => handleFilterChange({ ...filters, search: '' })} className="text-warmgray-400 hover:text-red-500">
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
                {(filters.min_price || filters.max_price) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-warmgray-300 text-warmgray-800 text-[11px]">
                    Price: ₹{filters.min_price || '0'} - ₹{filters.max_price || 'Any'}
                    <button onClick={() => handleFilterChange({ ...filters, min_price: '', max_price: '' })} className="text-warmgray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-saffron hover:underline ml-1 font-bold"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-16 font-bold text-saffron">Loading traditional services...</div>
          ) : services.length === 0 ? (
            <div className="card-surface p-12 text-center border border-warmgray-200">
              <span className="text-4xl">🔍</span>
              <h3 className="font-heading font-bold text-lg text-warmgray-900 mt-2">No Services Found</h3>
              <p className="text-xs text-warmgray-500 mt-1">Try resetting your filters or adjusting price range.</p>
              <button onClick={handleResetFilters} className="btn-primary text-xs !py-2 !px-4 mt-4">
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onBook={(s) => setSelectedService(s)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Booking Modal */}
      <BookingModal
        service={selectedService}
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
      />

    </div>
  );
};
