import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translateContent } from '../../i18n/contentTranslations';

export const ServiceCard = ({ service, onBook }) => {
  const { language, t } = useLanguage();

  return (
    <div className="card-surface flex flex-col h-full overflow-hidden group">
      <div className="relative h-48 overflow-hidden bg-cream-200">
        <img
          src={service.image_url || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80'}
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80'; }}
        />
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-warmgray-800 shadow-sm">
          {translateContent(service.category_name || 'Home Service', language)}
        </div>
        <div className={`absolute top-3 right-3 text-white px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm ${
          service.review_count > 0 ? 'bg-amber-500' : 'bg-warmgray-700/80'
        }`}>
          <Star className={`w-3 h-3 ${service.review_count > 0 ? 'fill-current' : 'text-warmgray-300'}`} />
          <span>{service.review_count > 0 ? Number(service.rating).toFixed(1) : '0.0'}</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/services/${service.id}`} className="block group-hover:text-saffron transition-colors">
            <h3 className="font-heading text-lg font-bold text-warmgray-900 line-clamp-1">
              {translateContent(service.title, language)}
            </h3>
          </Link>
          
          <div className="flex items-center justify-between mt-1">
            <Link to={`/providers/${service.provider}`} className="inline-flex items-center gap-1 text-xs font-semibold text-warmgray-600 hover:text-saffron">
              <span>{service.provider_name}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-sage" />
            </Link>
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
              service.review_count > 0 ? 'text-amber-600 bg-amber-50' : 'text-warmgray-500 bg-warmgray-100'
            }`}>
              <span>★</span>
              <span>{service.review_count > 0 ? Number(service.rating).toFixed(1) : '0.0'}</span>
              <span className="text-[10px] text-warmgray-400 font-normal">({service.review_count || 0})</span>
            </span>
          </div>

          <p className="text-xs text-warmgray-500 mt-2.5 line-clamp-2 leading-relaxed">
            {translateContent(service.description, language)}
          </p>

          <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-warmgray-400">
            <Clock className="w-3 h-3" />
            <span>{translateContent(service.duration, language)}</span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-warmgray-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-warmgray-400 font-bold block uppercase">{t('products.price')}</span>
            <span className="font-heading text-xl font-bold text-saffron-dark">
              ₹{Math.round(service.price)}
            </span>
            <span className="text-[11px] text-warmgray-500 font-medium ml-1">
              /{translateContent(service.pricing_unit || 'service', language)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/services/${service.id}`} className="btn-ghost text-xs !px-3 !py-2">
              Details
            </Link>
            <button
              onClick={() => onBook(service)}
              className="btn-primary text-xs !px-3.5 !py-2 shadow-sm"
            >
              {t('services.bookNow')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
