import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProvider, createConversation } from '../../api/client';
import { SkillPassportBadge } from '../../components/trust/SkillPassportBadge';
import { SkillPassportCard } from '../../components/provider/SkillPassportCard';
import { ServiceCard } from '../../components/marketplace/ServiceCard';
import { ProductCard } from '../../components/marketplace/ProductCard';
import { BookingModal } from '../../components/marketplace/BookingModal';
import { OrderModal } from '../../components/marketplace/OrderModal';
import { Star, MapPin, MessageSquare, ArrowLeft, Award, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const ProviderDetailPage = () => {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProvider(id);
        setProvider(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleMessageClick = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to message this provider', 'error');
      navigate('/login');
      return;
    }
    try {
      const res = await createConversation(provider.id);
      navigate(`/messages?conversation=${res.data.id}`);
    } catch {
      showToast('Could not start conversation', 'error');
    }
  };

  if (loading) return <div className="text-center py-20 font-bold text-saffron">Loading profile...</div>;
  if (!provider) return <div className="text-center py-20 font-bold">Provider not found.</div>;

  const availability = provider.availability || {};
  const activeDays = availability.days || availability.available_days || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link to="/providers" className="inline-flex items-center gap-1.5 text-xs font-bold text-warmgray-600 hover:text-saffron">
        <ArrowLeft className="w-4 h-4" /> Back to Providers
      </Link>

      {/* Header Profile Card */}
      <div className="card-surface p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-saffron-100 text-saffron-700 flex items-center justify-center font-bold text-3xl shadow-warm">
              {provider.display_name?.[0] || '👵🏽'}
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-warmgray-900">
                {provider.display_name}
              </h1>
              <div className="flex items-center gap-3 text-xs font-semibold text-warmgray-600 mt-1">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-warmgray-400" /> {provider.location}</span>
                <span>•</span>
                <span className="text-sage-dark font-bold">{provider.experience_years}+ Years Experience</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIsPassportOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Award className="w-4 h-4 text-amber-600" />
              View Skill Passport
            </button>
            <button
              onClick={handleMessageClick}
              className="btn-outline flex-1 sm:flex-none text-xs flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              Direct Message
            </button>
          </div>
        </div>

        <p className="text-sm text-warmgray-700 mt-6 leading-relaxed whitespace-pre-line border-t border-warmgray-100 pt-6">
          {provider.bio}
        </p>

        {/* Weekly Schedule / Work Hours Section */}
        {activeDays.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-cream-50 border border-warmgray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <span className="font-bold text-warmgray-800 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-saffron" /> Working Hours & Available Days
              </span>
              <p className="text-warmgray-600 font-medium">
                Active Days: <strong>{activeDays.join(', ')}</strong> • Hours: <strong>{availability.start_time || '09:00'} - {availability.end_time || '18:00'}</strong>
              </p>
            </div>
            <span className="badge-tag bg-sage-50 text-sage-dark font-bold shrink-0">
              ✓ Open for Bookings
            </span>
          </div>
        )}

        {/* Skill Passport Banner */}
        <div className="mt-6">
          <SkillPassportBadge passportId={provider.skill_passport_id} trustScore={provider.trust_score} />
        </div>
      </div>

      {/* Provider's Services */}
      {provider.services?.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-bold text-warmgray-900">Services Offered</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {provider.services.map((s) => (
              <ServiceCard key={s.id} service={s} onBook={(srv) => setSelectedService(srv)} />
            ))}
          </div>
        </section>
      )}

      {/* Provider's Handmade Products */}
      {provider.products?.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-bold text-warmgray-900">Handmade Products for Sale</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {provider.products.map((p) => (
              <ProductCard key={p.id} product={p} onOrder={(prod) => setSelectedProduct(prod)} />
            ))}
          </div>
        </section>
      )}

      {/* Skill Passport Modal */}
      {isPassportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPassportOpen(false)}
              className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white/80 text-warmgray-600 hover:bg-white shadow-warm"
            >
              <X className="w-5 h-5" />
            </button>
            <SkillPassportCard profile={provider} onClose={() => setIsPassportOpen(false)} />
          </div>
        </div>
      )}

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
