import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getService, getServiceReviews, getProviderReviews } from '../../api/client';
import { BookingModal } from '../../components/marketplace/BookingModal';
import { ReviewModal } from '../../components/marketplace/ReviewModal';
import { SkillPassportBadge } from '../../components/trust/SkillPassportBadge';
import { Star, Clock, MapPin, ShieldCheck, ArrowLeft, MessageSquarePlus } from 'lucide-react';

export const ServiceDetailPage = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const loadServiceData = async () => {
    try {
      const [srvRes, revRes] = await Promise.all([
        getService(id),
        getServiceReviews(id).catch(() => ({ data: [] }))
      ]);
      setService(srvRes.data);
      setReviews(revRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServiceData();
  }, [id]);

  useEffect(() => {
    const handleReload = () => loadServiceData();
    window.addEventListener('sh-reload-data', handleReload);
    return () => window.removeEventListener('sh-reload-data', handleReload);
  }, [id]);

  if (loading) return <div className="text-center py-20 font-bold text-saffron">Loading service details & reviews...</div>;
  if (!service) return <div className="text-center py-20 font-bold">Service not found.</div>;

  const avgRating = service.review_count > 0 ? Number(service.rating).toFixed(1) : '0.0';
  const reviewCount = service.review_count !== undefined ? service.review_count : reviews.length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link to="/services" className="inline-flex items-center gap-1.5 text-xs font-bold text-warmgray-600 hover:text-saffron">
        <ArrowLeft className="w-4 h-4" /> Back to Services
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Service info & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-surface overflow-hidden">
            <img
              src={service.image_url || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'}
              alt={service.title}
              className="w-full h-80 object-cover"
            />
            <div className="p-8">
              <div className="flex items-center justify-between">
                <span className="badge-tag bg-saffron-50 text-saffron-dark font-bold border border-saffron-200">
                  {service.category_name}
                </span>
                <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 px-3 py-1 rounded-full text-sm">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{avgRating}★ ({reviewCount} reviews)</span>
                </div>
              </div>

              <h1 className="font-heading text-3xl font-bold text-warmgray-900 mt-4">{service.title}</h1>

              <div className="flex items-center gap-4 text-xs font-semibold text-warmgray-500 mt-3 pb-6 border-b border-warmgray-100">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-warmgray-400" /> {service.provider_location}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-warmgray-400" /> Duration: {service.duration}</span>
              </div>

              <div className="mt-6 space-y-3">
                <h3 className="font-heading text-lg font-bold text-warmgray-900">About This Service</h3>
                <p className="text-sm text-warmgray-700 leading-relaxed whitespace-pre-line">
                  {service.description}
                </p>
              </div>
            </div>
          </div>

          {/* Provider Skill Passport */}
          <div className="card-surface p-6">
            <h3 className="font-heading text-lg font-bold text-warmgray-900 mb-4">Elder Artisan Credentials</h3>
            <SkillPassportBadge trustScore={service.provider_trust_score} />
          </div>

          {/* Customer Reviews */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold text-warmgray-900">Verified Customer Reviews</h3>
                <p className="text-xs text-warmgray-500">Real feedback from clients who booked this service</p>
              </div>
              <button
                onClick={() => setIsReviewOpen(true)}
                className="btn-primary text-xs !py-2 !px-3.5 flex items-center gap-1.5 shadow-warm"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Write Review
              </button>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-warmgray-500 italic py-4">No reviews yet. Be the first to review after your booking!</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 bg-cream-50 rounded-2xl border border-warmgray-200/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-warmgray-900">{r.customer_name || r.customer_username}</span>
                      <span className="text-xs text-amber-500 font-bold">{'★'.repeat(r.rating)}</span>
                    </div>
                    <p className="text-xs text-warmgray-600 leading-relaxed">{r.comment}</p>
                    {r.created_at && (
                      <div className="text-[10px] text-warmgray-400 pt-1 text-right">
                        {new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Booking Card */}
        <div>
          <div className="sticky top-28 card-surface p-6 space-y-5 border-2 border-saffron-200">
            <div>
              <span className="text-xs font-semibold text-warmgray-500 block">Service Price</span>
              <span className="font-heading text-3xl font-black text-saffron-dark">₹{Math.round(service.price)}</span>
              <span className="text-xs text-warmgray-500 font-medium ml-1">/{service.pricing_unit || 'service'}</span>
            </div>

            <div className="p-4 bg-cream-100 rounded-2xl text-xs space-y-2 text-warmgray-700">
              <div className="flex justify-between font-semibold">
                <span>Provider:</span>
                <span className="text-warmgray-900 font-bold">{service.provider_name}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Location:</span>
                <span>{service.provider_location}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Estimated Time:</span>
                <span>{service.duration}</span>
              </div>
            </div>

            <button
              onClick={() => setIsBookingOpen(true)}
              className="w-full btn-primary !py-3.5 font-bold text-base shadow-warm-lg"
            >
              Request Booking Now
            </button>

            <Link
              to={`/providers/${service.provider}`}
              className="w-full btn-ghost text-xs text-center block"
            >
              View Full Provider Profile
            </Link>
          </div>
        </div>

      </div>

      <BookingModal
        service={service}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      <ReviewModal
        service={service}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onSuccess={() => loadServiceData()}
      />
    </div>
  );
};

