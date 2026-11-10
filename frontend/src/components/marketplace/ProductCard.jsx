import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translateContent } from '../../i18n/contentTranslations';

export const ProductCard = ({ product, onOrder }) => {
  const { language, t } = useLanguage();

  return (
    <div className="card-surface flex flex-col h-full overflow-hidden group">
      <div className="relative h-48 overflow-hidden bg-cream-200">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=500&q=80'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=500&q=80'; }}
        />
        <div className="absolute top-3 left-3 bg-sage text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
          {translateContent('Handmade Goods', language)}
        </div>
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-xs font-bold text-warmgray-700">
          {product.quantity > 0 ? `${product.quantity} ${t('products.stock')}` : t('products.soldOut')}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/products/${product.id}`} className="block group-hover:text-saffron transition-colors">
            <h3 className="font-heading text-lg font-bold text-warmgray-900 line-clamp-1">
              {translateContent(product.title, language)}
            </h3>
          </Link>

          <div className="flex items-center justify-between mt-1">
            <Link to={`/providers/${product.provider}`} className="inline-flex items-center gap-1 text-xs font-semibold text-warmgray-600 hover:text-saffron">
              <span>{product.provider_name}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-sage" />
            </Link>
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
              product.review_count > 0 ? 'text-amber-600 bg-amber-50' : 'text-warmgray-500 bg-warmgray-100'
            }`}>
              <span>★</span>
              <span>{product.review_count > 0 ? Number(product.rating).toFixed(1) : '0.0'}</span>
              <span className="text-[10px] text-warmgray-400 font-normal">({product.review_count || 0})</span>
            </span>
          </div>

          <p className="text-xs text-warmgray-500 mt-2.5 line-clamp-2 leading-relaxed">
            {translateContent(product.description, language)}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-warmgray-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-warmgray-400 font-bold block uppercase">{t('products.price')}</span>
            <span className="font-heading text-xl font-bold text-warmgray-900">
              ₹{Math.round(product.price)}
            </span>
          </div>

          <button
            onClick={() => onOrder(product)}
            disabled={product.quantity <= 0}
            className="btn-secondary text-xs !px-4 !py-2 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {product.quantity > 0 ? t('products.buyNow') : t('products.soldOut')}
          </button>
        </div>
      </div>
    </div>
  );
};
