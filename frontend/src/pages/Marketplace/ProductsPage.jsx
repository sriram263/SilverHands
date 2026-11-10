import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../../api/client';
import { ProductCard } from '../../components/marketplace/ProductCard';
import { OrderModal } from '../../components/marketplace/OrderModal';
import { FilterPanel } from '../../components/marketplace/FilterPanel';
import { ShoppingBag, SlidersHorizontal, ArrowUpDown, X, Tag } from 'lucide-react';

export const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize filters directly from URL search parameters
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') || searchParams.get('minPrice') || searchParams.get('min') || '',
    max_price: searchParams.get('max_price') || searchParams.get('maxPrice') || searchParams.get('max') || '',
    ordering: searchParams.get('ordering') || '-created_at'
  });

  // Keep filters state synchronized when URL search params change externally (e.g. AI Voice Controller navigation)
  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      min_price: searchParams.get('min_price') || searchParams.get('minPrice') || searchParams.get('min') || '',
      max_price: searchParams.get('max_price') || searchParams.get('maxPrice') || searchParams.get('max') || '',
      ordering: searchParams.get('ordering') || '-created_at'
    });
  }, [searchParams]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const activeParams = {};
      if (filters.search) activeParams.search = filters.search;
      if (filters.category) activeParams.category = filters.category;
      if (filters.min_price) activeParams.min_price = filters.min_price;
      if (filters.max_price) activeParams.max_price = filters.max_price;
      if (filters.ordering) activeParams.ordering = filters.ordering;

      const [prdRes, catRes] = await Promise.all([
        getProducts(activeParams),
        getCategories()
      ]);
      setProducts(prdRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const sp = new URLSearchParams();
    if (newFilters.search) sp.set('search', newFilters.search);
    if (newFilters.category) sp.set('category', newFilters.category);
    if (newFilters.min_price) sp.set('min_price', newFilters.min_price);
    if (newFilters.max_price) sp.set('max_price', newFilters.max_price);
    if (newFilters.ordering && newFilters.ordering !== '-created_at') sp.set('ordering', newFilters.ordering);
    setSearchParams(sp, { replace: true });
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      search: '',
      category: '',
      min_price: '',
      max_price: '',
      ordering: '-created_at'
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="badge-tag bg-sage text-white font-bold mb-1">Handmade Marketplace</span>
          <h1 className="page-title text-3xl sm:text-4xl">Handmade Goods & Homemade Delicacies</h1>
          <p className="text-xs sm:text-sm text-warmgray-500 mt-1">
            Fresh homemade pickles, snacks, pure vermicompost, and eco crafts prepared with traditional care by homemakers and elders
          </p>
        </div>
      </div>

      {/* Main Content Layout with Lekhs-style Sidebar Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Filter Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-28">
            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
              categories={categories}
              onReset={handleResetFilters}
            />
          </div>
        </div>

        {/* Right Column: Product Grid */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-warmgray-600 bg-cream-100 px-4 py-2.5 rounded-2xl border border-warmgray-200">
            <span>Showing {products.length} Handmade Products</span>
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
            <div className="text-center py-16 font-bold text-sage">Loading marketplace products...</div>
          ) : products.length === 0 ? (
            <div className="card-surface p-12 text-center max-w-md mx-auto my-8">
              <span className="text-4xl">🛍️</span>
              <h3 className="font-heading font-bold text-lg text-warmgray-900 mt-2">No Products Match Your Filters</h3>
              <p className="text-xs text-warmgray-500 mt-1">Try adjusting keywords or price range to see more handmade items.</p>
              <button
                onClick={handleResetFilters}
                className="btn-outline text-xs mt-4"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onOrder={(prod) => setSelectedProduct(prod)}
                />
              ))}
            </div>
          )}

        </div>

      </div>

      <OrderModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
