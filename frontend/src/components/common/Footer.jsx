import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Heart, ShieldCheck, Sparkles } from 'lucide-react';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-cream-100 border-t border-warmgray-200 mt-20 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-3xl">👵🏽</span>
              <span className="font-heading text-2xl font-black text-warmgray-900">
                Silver<span className="text-saffron">Hands</span>
              </span>
            </div>
            <p className="text-sm text-warmgray-600 max-w-md leading-relaxed mb-4">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-3 text-xs font-bold text-sage-dark">
              <ShieldCheck className="w-4 h-4 text-sage" />
              <span>Verified Skill Passports & Trust Protection</span>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-bold text-sm text-warmgray-900 uppercase tracking-wider mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-warmgray-600">
              <li><Link to="/services" className="hover:text-saffron">Traditional Services</Link></li>
              <li><Link to="/products" className="hover:text-saffron">Handmade Goods</Link></li>
              <li><Link to="/providers" className="hover:text-saffron">Verified Elders</Link></li>
              <li><Link to="/radar" className="hover:text-saffron">Opportunity Radar</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-sm text-warmgray-900 uppercase tracking-wider mb-4">
              AI Intelligence
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-warmgray-600">
              <li><Link to="/ai-match" className="hover:text-saffron flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-saffron" /> AI Matcher</Link></li>
              <li><Link to="/register-voice" className="hover:text-saffron">Voice Onboarding</Link></li>
              <li><Link to="/ai-assistant" className="hover:text-saffron">Business Advisor</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-warmgray-200/80 pt-6 text-center text-xs font-semibold text-warmgray-500">
          <p>{t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
};
