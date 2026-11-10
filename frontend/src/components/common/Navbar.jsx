import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSeniorMode } from '../../context/SeniorModeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Sparkles, Mic, Eye, Globe, Bell, User, ShoppingBag, 
  Wand2, Compass, Menu, X, ShieldAlert, LogOut, LayoutDashboard, Utensils, Calendar, MessageSquare, Award
} from 'lucide-react';

export const Navbar = ({ onOpenVoice }) => {
  const { user, isAuthenticated, isCustomer, isProvider, isAdmin, logout } = useAuth();
  const { isSeniorMode, toggleSeniorMode } = useSeniorMode();
  const { language, changeLanguage, t } = useLanguage();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-warmgray-200 shadow-warm-sm">
      
      {/* 1. Main Top Navbar Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-saffron to-saffron-light flex items-center justify-center text-white text-2xl shadow-warm group-hover:scale-105 transition-transform">
                👵🏽
              </div>
              <div>
                <span className="font-heading text-xl sm:text-2xl font-black text-warmgray-900 tracking-tight flex items-center gap-1.5">
                  Silver<span className="text-saffron">Hands</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-sage-dark block tracking-wider uppercase -mt-1">
                  {t('brand.tagline')}
                </span>
              </div>
            </Link>
          </div>

          {/* Core Categories Links (Clean Center) */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              to="/services"
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                isActive('/services')
                  ? 'bg-saffron text-white shadow-warm'
                  : 'text-warmgray-700 hover:text-saffron hover:bg-cream-100'
              }`}
            >
              <span>🧹 {t('nav.services')}</span>
            </Link>

            <Link
              to="/products"
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                isActive('/products')
                  ? 'bg-sage text-white shadow-warm'
                  : 'text-warmgray-700 hover:text-sage-dark hover:bg-cream-100'
              }`}
            >
              <span>🛍️ {t('nav.products')}</span>
            </Link>

            <Link
              to="/providers"
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive('/providers')
                  ? 'bg-warmgray-900 text-white shadow-warm'
                  : 'text-warmgray-700 hover:text-warmgray-900 hover:bg-cream-100'
              }`}
            >
              {t('nav.providers')}
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            
            {/* Voice Assistant Button */}
            <button
              onClick={onOpenVoice}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-saffron-50 text-saffron-700 border border-saffron-200 hover:bg-saffron-100 font-bold text-xs shadow-warm-sm transition-all"
              title="Voice Assistant"
            >
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-saffron" />
              <span className="hidden sm:inline">{t('nav.voice')}</span>
            </button>

            {/* Senior / Accessibility Mode Toggle */}
            <button
              onClick={toggleSeniorMode}
              className={`flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${
                isSeniorMode
                  ? 'bg-warmgray-900 text-white shadow-warm'
                  : 'bg-cream-200 text-warmgray-700 hover:bg-cream-300'
              }`}
              title="Toggle Senior Mode"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">{t('nav.seniorMode')}</span>
            </button>

            {/* Language Switcher */}
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-cream-100 border border-warmgray-200 rounded-xl px-2 py-1.5 text-xs font-bold text-warmgray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-saffron"
            >
              <option value="en">English (EN)</option>
              <option value="ta">தமிழ் (TA)</option>
              <option value="hi">हिंदी (HI)</option>
              <option value="te">తెలుగు (TE)</option>
              <option value="kn">ಕನ್ನಡ (KN)</option>
              <option value="ml">മലയാളം (ML)</option>
            </select>

            {/* Auth Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl border border-warmgray-200 hover:bg-cream-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-saffron text-white flex items-center justify-center font-bold text-sm">
                    {user?.first_name ? user.first_name[0] : user?.username?.[0]?.toUpperCase()}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-warm-xl border border-warmgray-200 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-warmgray-100">
                      <p className="text-xs text-warmgray-500 font-semibold">{t('nav.signedInAs')}</p>
                      <p className="text-sm font-bold text-warmgray-900 truncate">
                        {user?.get_full_name || user?.username}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-saffron/10 text-saffron">
                        {user?.role}
                      </span>
                    </div>

                    <div className="py-1">
                      {isAdmin && (
                        <Link to="/admin-panel" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border-b border-red-100 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                          <span>{t('nav.admin')}</span>
                        </Link>
                      )}
                      {isProvider && (
                        <Link to="/provider/dashboard" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-bold text-warmgray-900 bg-cream-100 hover:bg-cream-200">
                          👩🏽‍🍳 {t('nav.dashboard')}
                        </Link>
                      )}
                      <Link to="/profile" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-medium text-warmgray-700 hover:bg-cream-100">
                        👤 {t('nav.profileStats')}
                      </Link>
                      {isProvider && (
                        <Link to="/skill-passport" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-medium text-warmgray-700 hover:bg-cream-100">
                          📜 {t('nav.skillPassport')}
                        </Link>
                      )}
                      <Link to="/bookings" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-medium text-warmgray-700 hover:bg-cream-100">
                        📅 {t('nav.myBookings')}
                      </Link>
                      <Link to="/orders" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-medium text-warmgray-700 hover:bg-cream-100">
                        📦 {t('nav.myOrders')}
                      </Link>
                      <Link to="/messages" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-medium text-warmgray-700 hover:bg-cream-100">
                        💬 {t('nav.messages')}
                      </Link>
                    </div>

                    <div className="border-t border-warmgray-100 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                          navigate('/');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {t('nav.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-xs !py-1.5 !px-3">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn-primary text-xs !py-1.5 !px-3">
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-warmgray-600 hover:bg-cream-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* 2. Secondary Sub-Navbar Row (Clean feature bar below main navbar) */}
      <div className="bg-cream-100/90 border-t border-warmgray-200/80 py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-2 text-xs">
          
          {/* Left Feature Pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            
            <Link
              to="/radar"
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                isActive('/radar')
                  ? 'bg-sage text-white shadow-warm-sm'
                  : 'bg-white text-sage-dark hover:bg-sage/10 border border-warmgray-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-sage shrink-0" />
              <span>{t('nav.radar')}</span>
            </Link>

            <Link
              to="/ai-match"
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                isActive('/ai-match')
                  ? 'bg-saffron text-white shadow-warm-sm'
                  : 'bg-white text-saffron-dark hover:bg-saffron/10 border border-warmgray-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-saffron shrink-0" />
              <span>{t('nav.aiMatch')}</span>
            </Link>

            <Link
              to="/ai-wizard"
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                isActive('/ai-wizard')
                  ? 'bg-purple-600 text-white shadow-warm-sm'
                  : 'bg-white text-purple-700 hover:bg-purple-50 border border-warmgray-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>{t('nav.aiWizard')}</span>
            </Link>

            {isProvider && (
              <Link
                to="/provider/dashboard"
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  isActive('/provider/dashboard')
                    ? 'bg-amber-600 text-white shadow-warm-sm'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>{t('nav.dashboard')}</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin-panel"
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  isActive('/admin-panel')
                    ? 'bg-red-600 text-white shadow-warm-sm'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>{t('nav.admin')}</span>
              </Link>
            )}
          </div>

          {/* Right Activity Pills (When Logged in) */}
          {isAuthenticated && (
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <Link
                to="/bookings"
                className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1 ${
                  isActive('/bookings') ? 'bg-warmgray-900 text-white' : 'text-warmgray-700 hover:bg-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{t('nav.myBookings')}</span>
              </Link>

              <Link
                to="/orders"
                className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1 ${
                  isActive('/orders') ? 'bg-warmgray-900 text-white' : 'text-warmgray-700 hover:bg-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t('nav.myOrders')}</span>
              </Link>

              <Link
                to="/profile"
                className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1 ${
                  isActive('/profile') ? 'bg-warmgray-900 text-white' : 'text-warmgray-700 hover:bg-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{t('nav.profileStats')}</span>
              </Link>
            </div>
          )}

        </div>
      </div>

    </header>
  );
};
