import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { aiMatch } from '../../api/client';
import { BookingModal } from '../../components/marketplace/BookingModal';
import { OrderModal } from '../../components/marketplace/OrderModal';
import { Sparkles, Mic, Search, CheckCircle2, ArrowRight, Package, Wand2, Calendar, ShoppingBag, ShieldCheck } from 'lucide-react';

export const AIMatchPage = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [budget, setBudget] = useState('');
  const [language, setLanguage] = useState('');
  
  const [matchData, setMatchData] = useState({
    matches: [],
    matching_services: [],
    matching_products: [],
    detected_category: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Booking / Order modal state
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const sampleQueries = [
    'I need someone to cook authentic diabetic Chettinad lunch.',
    'Looking for tailor for saree blouse stitching with Aari embroidery.',
    'I want to order traditional sun-dried mango pickle.',
    'Need a retired teacher for Tamil & Math tutoring.',
    'Organic terrace garden setup and plant consultant.'
  ];

  const handleMatch = async (textToMatch) => {
    const q = textToMatch || query;
    if (!q.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await aiMatch({
        requirement_text: q,
        budget: budget ? parseFloat(budget) : null,
        language: language || null,
        lat: 13.0827,
        lng: 80.2707,
      });
      setMatchData({
        matches: res.data.matches || [],
        matching_services: res.data.matching_services || [],
        matching_products: res.data.matching_products || [],
        detected_category: res.data.detected_category || 'General'
      });
    } catch (err) {
      console.error('AI match error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam) {
      setQuery(qParam);
      handleMatch(qParam);
    }
  }, [searchParams]);

  const hasAnyMatch = 
    (matchData.matching_services && matchData.matching_services.length > 0) ||
    (matchData.matching_products && matchData.matching_products.length > 0) ||
    (matchData.matches && matchData.matches.length > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      <div className="text-center space-y-3">
        <span className="badge-tag bg-saffron text-white font-bold">
          <Sparkles className="w-3.5 h-3.5" /> AI Intent Matcher
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-warmgray-900">
          Strict Semantic Service & Product Matcher
        </h1>
        <p className="text-sm text-warmgray-600 max-w-xl mx-auto">
          Describe what you need in plain words. Our AI strictly searches active services, handcrafted products, and verified homemakers & homemakers & elder artisans.
        </p>
      </div>

      {/* Input Form */}
      <div className="card-surface p-6 sm:p-8 shadow-warm-xl border-2 border-saffron/30">
        <form onSubmit={(e) => { e.preventDefault(); handleMatch(); }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">
              What service, handcrafted product, or skill are you looking for?
            </label>
            <textarea
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. I want to order sun-dried mango pickle, or need an elder to cook authentic lunch in Chennai..."
              required
              className="w-full p-4 rounded-2xl border border-warmgray-300 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">Budget (₹ Max Optional)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">Preferred Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
              >
                <option value="">Any Language</option>
                <option value="English">English</option>
                <option value="Tamil">தமிழ் (Tamil)</option>
                <option value="Hindi">हिंदी (Hindi)</option>
                <option value="Telugu">తెలుగు (Telugu)</option>
                <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                <option value="Malayalam">മലയാളം (Malayalam)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary !py-3.5 text-base font-bold flex items-center justify-center gap-2 shadow-warm-lg"
          >
            <Sparkles className="w-5 h-5 text-white" />
            <span>{loading ? 'Analyzing with AI...' : 'Find Matching Services & Products'}</span>
          </button>
        </form>

        {/* Sample Prompt Chips */}
        <div className="mt-6 pt-4 border-t border-warmgray-100">
          <span className="text-xs font-bold text-warmgray-500 block mb-2">Try sample queries:</span>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(prompt);
                  handleMatch(prompt);
                }}
                className="text-xs text-left bg-cream-100 text-warmgray-800 hover:bg-saffron/10 hover:text-saffron px-3 py-1.5 rounded-xl border border-warmgray-200 transition-colors"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-saffron border-t-transparent animate-spin mx-auto"></div>
          <p className="font-bold text-warmgray-800 text-base">Searching matching services and products...</p>
          <p className="text-xs text-warmgray-500">Strictly filtering active catalog by category, skills, and verified keywords</p>
        </div>
      ) : searched && !hasAnyMatch ? (
        <div className="card-surface p-12 text-center max-w-md mx-auto my-8 border border-warmgray-200">
          <span className="text-4xl">🔎</span>
          <h3 className="font-heading font-bold text-lg text-warmgray-900 mt-2">No Matching Items Found</h3>
          <p className="text-xs text-warmgray-500 mt-1">
            No active services or products directly matched "{query}". Try searching for Cooking, Tailoring, Tutoring, Gardening, or Pickles.
          </p>
        </div>
      ) : hasAnyMatch && (
        <div className="space-y-10 animate-fade-in">
          
          {/* 1. MATCHING SERVICES SECTION */}
          {matchData.matching_services && matchData.matching_services.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-heading text-2xl font-bold text-warmgray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-saffron" />
                  <span>Matching Services ({matchData.matching_services.length})</span>
                </h2>
                <span className="text-xs font-bold text-saffron-dark bg-saffron-50 px-3 py-1 rounded-full border border-saffron-200">
                  Category: {matchData.detected_category}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchData.matching_services.map((s) => (
                  <div key={s.id} className="card-surface p-6 border-l-4 border-l-saffron space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="badge-tag bg-saffron-50 text-saffron-dark font-bold mb-1">{s.category_name}</span>
                        <h3 className="font-heading text-lg font-bold text-warmgray-900">{s.title}</h3>
                        <p className="text-xs text-warmgray-600">By {s.provider_name}</p>
                      </div>
                      <span className="font-heading text-2xl font-black text-saffron-dark">₹{Math.round(s.price)}</span>
                    </div>

                    <p className="text-xs text-warmgray-600 line-clamp-2">{s.description}</p>

                    <div className="flex justify-between items-center pt-3 border-t border-warmgray-100">
                      <span className="text-xs text-warmgray-500">⏳ {s.duration || '2 hours'}</span>
                      <div className="flex gap-2">
                        <Link to={`/services/${s.id}`} className="btn-ghost text-xs">Details</Link>
                        <button
                          onClick={() => setSelectedService(s)}
                          className="btn-primary text-xs !py-1.5 !px-4"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. MATCHING PRODUCTS SECTION */}
          {matchData.matching_products && matchData.matching_products.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-warmgray-200">
              <div className="flex justify-between items-center">
                <h2 className="font-heading text-2xl font-bold text-warmgray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-sage" />
                  <span>Matching Handmade Products ({matchData.matching_products.length})</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchData.matching_products.map((p) => (
                  <div key={p.id} className="card-surface p-6 border-l-4 border-l-sage space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="badge-tag bg-sage-50 text-sage-dark font-bold mb-1">{p.category_name}</span>
                        <h3 className="font-heading text-lg font-bold text-warmgray-900">{p.title}</h3>
                        <p className="text-xs text-warmgray-600">By {p.provider_name} • ({p.quantity} in stock)</p>
                      </div>
                      <span className="font-heading text-2xl font-black text-sage-dark">₹{Math.round(p.price)}</span>
                    </div>

                    <p className="text-xs text-warmgray-600 line-clamp-2">{p.description}</p>

                    <div className="flex justify-between items-center pt-3 border-t border-warmgray-100">
                      <span className="text-xs text-warmgray-500">🌿 Pure Homemade</span>
                      <div className="flex gap-2">
                        <Link to={`/products/${p.id}`} className="btn-ghost text-xs">Details</Link>
                        <button
                          onClick={() => setSelectedProduct(p)}
                          className="btn-secondary text-xs !py-1.5 !px-4"
                        >
                          Order Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. MATCHING PROVIDERS SECTION */}
          {matchData.matches && matchData.matches.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-warmgray-200">
              <h2 className="font-heading text-2xl font-bold text-warmgray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <span>Matching Verified Homemakers & Artisans ({matchData.matches.length})</span>
              </h2>

              <div className="space-y-4">
                {matchData.matches.map((item, idx) => (
                  <div key={idx} className="card-surface p-6 border-l-4 border-l-purple-600 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl">
                          {item.provider_name?.[0] || '👵🏽'}
                        </div>
                        <div>
                          <h3 className="font-heading text-lg font-bold text-warmgray-900">
                            {item.provider_name}
                          </h3>
                          <span className="text-xs text-warmgray-500">
                            {item.provider?.location || 'Chennai, TN'} • {item.provider?.experience_years || 15}+ yrs exp
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-purple-700 block">Match Score</span>
                        <span className="font-heading text-2xl font-black text-warmgray-900">{item.match_score}%</span>
                      </div>
                    </div>

                    <div className="bg-cream-100 p-4 rounded-2xl border border-warmgray-200">
                      <span className="text-xs font-bold text-warmgray-700 block mb-2">Why this artisan matches your query:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(item.reasons || []).map((reason, rIdx) => (
                          <div key={rIdx} className="flex items-center gap-1.5 text-xs text-warmgray-800 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Link to={`/providers/${item.provider_id || item.provider?.id}`} className="btn-outline text-xs !px-4 !py-2">
                        View Full Profile & Passports →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        service={selectedService}
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
      />

      {/* Order Modal */}
      <OrderModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

    </div>
  );
};
