import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, getProductReviews } from '../../api/client';
import { OrderModal } from '../../components/marketplace/OrderModal';
import { ReviewModal } from '../../components/marketplace/ReviewModal';
import { SkillPassportBadge } from '../../components/trust/SkillPassportBadge';
import { ShoppingBag, MapPin, ShieldCheck, ArrowLeft, Star, MessageSquarePlus, UserCheck } from 'lucide-react';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const loadData = async () => {
    try {
      const [prodRes, revRes] = await Promise.all([
        getProduct(id),
        getProductReviews(id).catch(() => ({ data: [] }))
      ]);
      setProduct(prodRes.data);
      setReviews(revRes.data || []);
    } catch (err) {
      console.error('Failed to load product or reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    const handleReload = () => loadData();
    window.addEventListener('sh-reload-data', handleReload);
    return () => window.removeEventListener('sh-reload-data', handleReload);
  }, [id]);

  if (loading) return <div className="text-center py-20 font-bold text-sage">Loading product details & reviews...</div>;
  if (!product) return <div className="text-center py-20 font-bold">Product not found.</div>;

  const avgRating = (product.review_count > 0 || reviews.length > 0)
    ? Number(product.rating || (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length)).toFixed(1)
    : '0.0';
  const reviewCount = product.review_count !== undefined ? product.review_count : reviews.length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link to="/products" className="inline-flex items-center gap-1.5 text-xs font-bold text-warmgray-600 hover:text-sage transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Handmade Marketplace
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 card-surface p-8">
        
        {/* Left Col: Product Image */}
        <div className="relative rounded-3xl overflow-hidden bg-cream-200 h-96 shadow-inner">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 bg-sage text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
            Handmade by Elder
          </div>
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-xl text-xs font-bold text-warmgray-800">
            Stock: {product.quantity} items available
          </div>
        </div>

        {/* Right Col: Product Info & Order Trigger */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="badge-tag bg-sage-50 text-sage-dark font-bold border border-sage-200">
                {product.category_name || 'Handmade Goods'}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/50">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{avgRating}</span>
                <span className="text-xs text-warmgray-500 font-normal">({reviewCount} reviews)</span>
              </span>
            </div>

            <h1 className="font-heading text-3xl font-bold text-warmgray-900 mt-3">
              {product.title}
            </h1>

            <Link to={`/providers/${product.provider}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-warmgray-600 mt-2 hover:text-sage transition-colors">
              <span>Made with love by <strong className="text-warmgray-800">{product.provider_name}</strong></span>
              <ShieldCheck className="w-4 h-4 text-sage" />
            </Link>

            <div className="mt-4 pt-4 border-t border-warmgray-100 flex items-baseline gap-2">
              <span className="font-heading text-4xl font-black text-warmgray-900">
                ₹{Math.round(product.price)}
              </span>
              <span className="text-xs text-warmgray-400 font-semibold uppercase">per item</span>
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="font-heading text-sm font-bold text-warmgray-900">Product Description</h3>
              <p className="text-xs text-warmgray-600 leading-relaxed">
                {product.description || 'Authentic, hygienic, and handcrafted item prepared with traditional family recipes and heritage care.'}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-warmgray-100">
            <button
              onClick={() => setIsOrderOpen(true)}
              className="w-full btn-secondary text-sm font-bold !py-3.5 flex items-center justify-center gap-2 shadow-warm-lg"
            >
              <ShoppingBag className="w-4 h-4" />
              Order This Handmade Item
            </button>
            <p className="text-[11px] text-center text-warmgray-500 font-medium">
              🛡️ Pay after receipt or delivery confirmation
            </p>
          </div>
        </div>

      </div>

      {/* Provider Credentials */}
      <div className="card-surface p-6">
        <h3 className="font-heading text-lg font-bold text-warmgray-900 mb-4">Artisan Verification & Trust</h3>
        <SkillPassportBadge trustScore={product.provider_rating ? Math.min(99, Math.round(product.provider_rating * 20)) : 95} />
      </div>

      {/* Product Customer Reviews Section */}
      <div className="card-surface p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warmgray-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-xl font-bold text-warmgray-900">Customer Reviews & Ratings</h3>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                ★ {avgRating} / 5.0
              </span>
            </div>
            <p className="text-xs text-warmgray-500 mt-0.5">
              Verified feedback from customers who bought this handmade product ({reviews.length} total reviews)
            </p>
          </div>

          <button
            onClick={() => setIsReviewOpen(true)}
            className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-2 shadow-warm self-start sm:self-auto"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Write a Review
          </button>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-10 bg-cream-50/50 rounded-2xl border border-dashed border-warmgray-200">
            <p className="text-sm font-medium text-warmgray-600">No customer reviews yet for this product.</p>
            <p className="text-xs text-warmgray-400 mt-1">Be the first to share your experience with {product.provider_name}!</p>
            <button
              onClick={() => setIsReviewOpen(true)}
              className="mt-3 btn-ghost text-xs font-bold text-saffron hover:underline"
            >
              + Add First Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="p-4 bg-cream-50/80 hover:bg-cream-50 rounded-2xl border border-warmgray-200/70 space-y-2 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-sage-100 text-sage-dark font-bold text-xs flex items-center justify-center">
                      {(r.customer_name || r.customer_username || 'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-warmgray-900 block leading-none">
                        {r.customer_name || r.customer_username}
                      </span>
                      <span className="text-[10px] text-warmgray-400 font-medium">Verified Buyer</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-warmgray-200'}`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-warmgray-700 leading-relaxed pt-1">
                  "{r.comment}"
                </p>

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

      <OrderModal
        product={product}
        isOpen={isOrderOpen}
        onClose={() => setIsOrderOpen(false)}
      />

      <ReviewModal
        product={product}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};

