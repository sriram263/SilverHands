import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getCategories, getServices, getProducts, getOpportunities } from '../api/client';
import { ServiceCard } from '../components/marketplace/ServiceCard';
import { ProductCard } from '../components/marketplace/ProductCard';
import { BookingModal } from '../components/marketplace/BookingModal';
import { OrderModal } from '../components/marketplace/OrderModal';
import { OpportunityRadarCard } from '../components/radar/OpportunityRadarCard';
import { 
  Sparkles, Search, ArrowRight, ShieldCheck, Heart, 
  Award, Compass, ShoppingBag, Utensils, Scissors, BookOpen, Sprout 
} from 'lucide-react';

export const HomePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [radarOpps, setRadarOpps] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, srvRes, prdRes, oppRes] = await Promise.all([
          getCategories(),
          getServices(),
          getProducts(),
          getOpportunities()
        ]);
        setCategories(catRes.data || []);
        setFeaturedServices((srvRes.data || []).slice(0, 4));
        setFeaturedProducts((prdRes.data || []).slice(0, 4));
        setRadarOpps((oppRes.data || []).slice(0, 2));
      } catch (err) {
        console.error('Home data load error:', err);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="space-y-16 animate-fade-in">
      
      {/* 1. Hero Section */}
      <section className="relative rounded-3xl bg-gradient-to-br from-med-bg-light via-white to-med-blue-light/50 p-8 sm:p-14 border border-warmgray-200/80 shadow-warm overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-med-blue-primary/10 blur-3xl pointer-events-none"></div>
        
        <div className="max-w-3xl relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-saffron text-xs font-bold shadow-warm-sm border border-saffron-200">
            <Sparkles className="w-3.5 h-3.5 text-saffron" />
            <span>{t('hero.badge')}</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-warmgray-900 tracking-tight leading-[1.15]">
            {t('hero.title')}
          </h1>

          <p className="text-base sm:text-lg text-warmgray-600 leading-relaxed max-w-2xl font-medium">
            {t('hero.subtitle')}
          </p>

          {/* Search Bar with AI Quick Match */}
          <form onSubmit={handleSearchSubmit} className="pt-2 max-w-2xl">
            <div className="flex items-center bg-white rounded-2xl shadow-warm-lg p-2 border-2 border-warmgray-200 focus-within:border-saffron transition-all">
              <Search className="w-5 h-5 text-warmgray-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('hero.searchPlaceholder')}
                className="w-full px-3 py-2 bg-transparent text-sm sm:text-base font-medium focus:outline-none text-warmgray-800"
              />
              <button type="submit" className="btn-primary text-xs sm:text-sm !py-2.5 !px-5 shrink-0">
                {t('filters.searchLabel')}
              </button>
            </div>
          </form>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/ai-match" className="btn-primary text-xs sm:text-sm flex items-center gap-2 shadow-warm">
              <Sparkles className="w-4 h-4 text-white" />
              {t('hero.aiMatchBtn')}
            </Link>
            <Link to="/services" className="btn-outline text-xs sm:text-sm">
              {t('hero.browseServices')}
            </Link>
            <Link to="/products" className="btn-secondary text-xs sm:text-sm">
              {t('hero.browseProducts')}
            </Link>
            <Link to="/radar" className="btn-ghost text-xs sm:text-sm flex items-center gap-1 text-sage-dark font-bold">
              <Compass className="w-4 h-4 text-sage" />
              {t('nav.radar')}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Top Skill Categories */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="page-title text-2xl sm:text-3xl">{t('categories.all')}</h2>
            <p className="text-xs sm:text-sm text-warmgray-500">{t('hero.subtitle')}</p>
          </div>
          <Link to="/services" className="text-xs font-bold text-saffron hover:underline flex items-center gap-1">
            {t('hero.browseServices')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.slice(0, 5).map((cat) => (
            <Link
              key={cat.id}
              to={`/services?category=${cat.slug}`}
              className="card-surface p-5 text-center group hover:border-saffron hover:bg-cream-50/50 transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-cream-200 text-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                {cat.slug === 'cooking' ? '🍳' : cat.slug === 'tailoring' ? '🧵' : cat.slug === 'tutoring' ? '📚' : cat.slug === 'gardening' ? '🌱' : '🧶'}
              </div>
              <h3 className="font-heading font-bold text-sm text-warmgray-900 group-hover:text-saffron">
                {cat.name}
              </h3>
              <p className="text-[11px] text-warmgray-500 line-clamp-1 mt-1">{cat.description || 'Verified traditional service'}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Traditional Services */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="page-title text-2xl sm:text-3xl">{t('services.title')}</h2>
            <p className="text-xs sm:text-sm text-warmgray-500">{t('services.subtitle')}</p>
          </div>
          <Link to="/services" className="btn-ghost text-xs font-bold">
            {t('hero.browseServices')} →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onBook={(s) => setSelectedService(s)}
            />
          ))}
        </div>
      </section>

      {/* 4. Opportunity Radar Highlight */}
      <section className="bg-sage-50/70 border border-sage-200 rounded-3xl p-8 shadow-warm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <span className="badge-tag bg-sage text-white font-bold mb-2">Live Reverse Marketplace</span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-warmgray-900">
              {t('nav.radar')}
            </h2>
            <p className="text-xs sm:text-sm text-warmgray-600 mt-1">
              Customers posting direct home service and catering requests for local elders to claim.
            </p>
          </div>
          <Link to="/radar" className="btn-secondary text-xs sm:text-sm shrink-0">
            {t('nav.radar')} →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {radarOpps.map((opp) => (
            <OpportunityRadarCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      </section>

      {/* 5. Handmade Products Store */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="page-title text-2xl sm:text-3xl">{t('products.title')}</h2>
            <p className="text-xs sm:text-sm text-warmgray-500">{t('products.subtitle')}</p>
          </div>
          <Link to="/products" className="btn-ghost text-xs font-bold">
            {t('hero.browseProducts')} →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOrder={(p) => setSelectedProduct(p)}
            />
          ))}
        </div>
      </section>

      {/* Booking & Order Modals */}
      <BookingModal
        service={selectedService}
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
      />
      <OrderModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

    </div>
  );
};
