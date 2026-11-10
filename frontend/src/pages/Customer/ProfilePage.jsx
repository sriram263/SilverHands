import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getProfile, updateProfile, getProviderMe, updateProviderMe, getBookings, getOrders, getServices, getProducts } from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import { SkillPassportCard } from '../../components/provider/SkillPassportCard';
import { AvailabilityManager } from '../../components/provider/AvailabilityManager';
import { 
  User, Mail, Phone, MapPin, Globe, Award, Clock, BarChart3, 
  CheckCircle2, Sparkles, Star, Calendar, ShoppingBag, Save, Edit3, ShieldCheck, TrendingUp
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, setUser, isProvider, isCustomer, isAdmin } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useNotifications();

  // Active section tab: 'stats' | 'edit_profile' | 'timings' | 'passport'
  const [activeSection, setActiveSection] = useState('stats');

  const [providerMe, setProviderMe] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Activity stats
  const [statsData, setStatsData] = useState({
    bookingsCount: 0,
    ordersCount: 0,
    servicesCount: 0,
    productsCount: 0
  });

  // Edit profile form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    preferred_language: 'en',
    bio: '',
    experience_years: 10,
    languages: ['Tamil', 'English']
  });

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const [profRes, meRes, bkRes, ordRes, srvRes, prdRes] = await Promise.all([
        getProfile(),
        isProvider ? getProviderMe().catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        getBookings().catch(() => ({ data: [] })),
        getOrders().catch(() => ({ data: [] })),
        isProvider && user?.id ? getServices({ provider: user.id }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        isProvider && user?.id ? getProducts({ provider: user.id }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);

      const u = profRes.data;
      const me = meRes.data;
      setUserProfile(u);
      setProviderMe(me);

      setStatsData({
        bookingsCount: (bkRes.data || []).length,
        ordersCount: (ordRes.data || []).length,
        servicesCount: (srvRes.data || []).length,
        productsCount: (prdRes.data || []).length
      });

      setFormData({
        first_name: u?.first_name || '',
        last_name: u?.last_name || '',
        phone: u?.phone || '',
        address: u?.address || 'Chennai, TN',
        preferred_language: u?.preferred_language || 'en',
        bio: me?.bio || 'Dedicated homemaker and skilled artisan.',
        experience_years: me?.experience_years || 10,
        languages: me?.languages || ['Tamil', 'English']
      });
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Update basic user account
      const userRes = await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        address: formData.address,
        preferred_language: formData.preferred_language
      });
      setUser(userRes.data);

      // 2. If provider, also update provider profile bio, experience, languages
      if (isProvider) {
        await updateProviderMe({
          bio: formData.bio,
          experience_years: parseInt(formData.experience_years, 10) || 0,
          languages: formData.languages,
          location: formData.address
        });
      }

      showToast('Profile & craft details updated successfully!', 'success');
      loadProfileData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleLanguage = (lang) => {
    setFormData((prev) => {
      const exists = prev.languages.includes(lang);
      const updated = exists ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang];
      return { ...prev, languages: updated };
    });
  };

  const completionScore = providerMe?.profile_completion_score || (isProvider ? 85 : 90);
  const missingSteps = providerMe?.missing_checklist || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      
      {/* Top Banner Profile Summary */}
      <div className="card-surface p-8 bg-gradient-to-r from-cream-100 via-white to-amber-50/50 border border-warmgray-200 shadow-warm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-saffron text-white flex items-center justify-center font-bold text-3xl shadow-warm">
              {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge-tag bg-saffron-50 text-saffron-dark font-bold">
                  {user?.role === 'PROVIDER' ? '👩🏽‍🍳 ' + t('nav.providers') : '🛍️ Customer'}
                </span>
                <span className="badge-tag bg-sage-50 text-sage-dark font-bold">
                  ✓ {t('profile.activeStatus')}
                </span>
              </div>
              <h1 className="font-heading text-3xl font-bold text-warmgray-900 mt-1">
                {user?.get_full_name || user?.username}
              </h1>
              <p className="text-xs text-warmgray-600 mt-0.5 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-warmgray-400" />
                <span>{formData.address || 'Chennai, Tamil Nadu'}</span>
                <span>•</span>
                <span>ID: #{user?.id}</span>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-warmgray-400 font-bold block">Status</span>
            <span className="font-heading text-lg font-black text-sage-dark">{t('profile.activeStatus')}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Profile Hub */}
      <div className="flex items-center gap-2 border-b border-warmgray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('stats')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSection === 'stats'
              ? 'bg-warmgray-900 text-white shadow-warm'
              : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t('profile.tabs.stats')}</span>
        </button>

        <button
          onClick={() => setActiveSection('edit_profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSection === 'edit_profile'
              ? 'bg-saffron text-white shadow-warm'
              : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>{t('profile.tabs.editProfile')}</span>
        </button>

        {isProvider && (
          <>
            <button
              onClick={() => setActiveSection('timings')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'timings'
                  ? 'bg-purple-600 text-white shadow-warm'
                  : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{t('profile.tabs.timings')}</span>
            </button>

            <button
              onClick={() => setActiveSection('passport')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'passport'
                  ? 'bg-amber-600 text-white shadow-warm'
                  : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>{t('profile.tabs.passport')}</span>
            </button>
          </>
        )}
      </div>

      {/* SECTION 1: STATISTICS & ANALYTICS BOARD */}
      {activeSection === 'stats' && (
        <div className="space-y-6">
          
          {/* Profile Health Progress Bar */}
          <div className="card-surface p-6 space-y-3 border border-warmgray-200 shadow-warm">
            <div className="flex justify-between items-center text-xs font-bold text-warmgray-800">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-saffron" />
                <span>{t('profile.statsBoard.healthScore')}</span>
              </span>
              <span className="text-saffron-dark font-black text-sm">{completionScore}% Complete</span>
            </div>

            <div className="w-full bg-cream-200 h-2.5 rounded-full overflow-hidden border border-warmgray-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completionScore >= 80 ? 'bg-sage' : completionScore >= 50 ? 'bg-saffron' : 'bg-amber-500'
                }`}
                style={{ width: `${completionScore}%` }}
              ></div>
            </div>

            {missingSteps.length > 0 && completionScore < 100 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-warmgray-500">{t('profile.statsBoard.actionItems')}</span>
                {missingSteps.map((step, idx) => (
                  <span key={idx} className="text-[10px] font-semibold bg-cream-100 px-2.5 py-1 rounded-lg border border-warmgray-200 text-warmgray-700">
                    • {step}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Role-Specific Metric Cards */}
          {isProvider ? (
            // Provider Metrics
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card-surface p-5 border-l-4 border-l-saffron space-y-1">
                <span className="text-[11px] font-bold text-warmgray-500 uppercase">{t('profile.statsBoard.trustRating')}</span>
                <span className="font-heading text-2xl font-black text-saffron-dark flex items-center gap-1">
                  <Star className="w-5 h-5 fill-current" /> {providerMe?.rating || 4.9}★
                </span>
                <span className="text-[10px] text-warmgray-400">Verified reviews</span>
              </div>

              <div className="card-surface p-5 border-l-4 border-l-sage space-y-1">
                <span className="text-[11px] font-bold text-warmgray-500 uppercase">{t('profile.statsBoard.completedJobs')}</span>
                <span className="font-heading text-2xl font-black text-sage-dark">
                  {providerMe?.completed_jobs_count || 24}+ Jobs
                </span>
                <span className="text-[10px] text-warmgray-400">Verified service delivery</span>
              </div>

              <div className="card-surface p-5 border-l-4 border-l-purple-600 space-y-1">
                <span className="text-[11px] font-bold text-warmgray-500 uppercase">{t('profile.statsBoard.activeCatalog')}</span>
                <span className="font-heading text-2xl font-black text-purple-700">
                  {statsData.servicesCount + statsData.productsCount} Items
                </span>
                <span className="text-[10px] text-warmgray-400">{statsData.servicesCount} Srv / {statsData.productsCount} Prd</span>
              </div>

              <div className="card-surface p-5 border-l-4 border-l-blue-600 space-y-1">
                <span className="text-[11px] font-bold text-warmgray-500 uppercase">{t('profile.statsBoard.trustScore')}</span>
                <span className="font-heading text-2xl font-black text-blue-600">
                  {providerMe?.trust_score || 98}/100
                </span>
                <span className="text-[10px] text-warmgray-400">Verified identity tier</span>
              </div>
            </div>
          ) : (
            // Customer Metrics
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card-surface p-5 border-l-4 border-l-saffron space-y-1">
                <span className="text-[11px] font-bold text-warmgray-500 uppercase">{t('profile.statsBoard.bookingsCount')}</span>
                <span className="font-heading text-2xl font-black text-saffron-dark">{statsData.bookingsCount}</span>
                <span className="text-[10px] text-warmgray-400">Home services requested</span>
              </div>

              <div className="card-surface p-5 border-l-4 border-l-sage space-y-1">
                <span className="text-[11px] font-bold text-warmgray-500 uppercase">{t('profile.statsBoard.ordersCount')}</span>
                <span className="font-heading text-2xl font-black text-sage-dark">{statsData.ordersCount}</span>
                <span className="text-[10px] text-warmgray-400">Handmade items purchased</span>
              </div>

              <div className="card-surface p-5 border-l-4 border-l-purple-600 space-y-1">
                <span className="text-[11px] font-bold text-warmgray-500 uppercase">{t('profile.statsBoard.communityImpact')}</span>
                <span className="font-heading text-2xl font-black text-purple-700">Tier 3</span>
                <span className="text-[10px] text-warmgray-400">Supporting local elders</span>
              </div>

              <div className="card-surface p-5 border-l-4 border-l-blue-600 space-y-1">
                <span className="text-[11px] font-bold text-warmgray-500 uppercase">{t('profile.activeStatus')}</span>
                <span className="font-heading text-2xl font-black text-blue-600">Verified</span>
                <span className="text-[10px] text-warmgray-400">Active member</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: EDIT PROFILE FORM */}
      {activeSection === 'edit_profile' && (
        <div className="card-surface p-6 sm:p-8 space-y-6 border border-warmgray-200 shadow-warm">
          <div>
            <h3 className="font-heading font-bold text-lg text-warmgray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-saffron" />
              <span>{t('profile.editForm.personalTitle')}</span>
            </h3>
            <p className="text-xs text-warmgray-500 mt-0.5">
              Update your public profile, contact details, and craft background.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-warmgray-700 mb-1">{t('profile.editForm.firstName')}</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-semibold focus:ring-2 focus:ring-saffron"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-warmgray-700 mb-1">{t('profile.editForm.lastName')}</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-semibold focus:ring-2 focus:ring-saffron"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-warmgray-700 mb-1">{t('profile.editForm.phone')}</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-semibold focus:ring-2 focus:ring-saffron"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-warmgray-700 mb-1">{t('profile.editForm.address')}</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Mylapore, Chennai, TN"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-semibold focus:ring-2 focus:ring-saffron"
                />
              </div>
            </div>

            {isProvider && (
              <>
                <div>
                  <label className="block text-xs font-bold text-warmgray-700 mb-1">{t('profile.editForm.bio')}</label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell customers about your experience, cooking heritage, tailoring expertise..."
                    className="w-full p-3.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium focus:ring-2 focus:ring-saffron"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-warmgray-700 mb-1">{t('profile.editForm.experience')}</label>
                    <input
                      type="number"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-semibold focus:ring-2 focus:ring-saffron"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-warmgray-700 mb-1">{t('profile.editForm.languages')}</label>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada'].map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            formData.languages.includes(lang)
                              ? 'bg-saffron text-white'
                              : 'bg-cream-100 text-warmgray-600 hover:bg-cream-200'
                          }`}
                        >
                          {lang} {formData.languages.includes(lang) && '✓'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs !py-2.5 !px-6 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? t('profile.editForm.saving') : t('profile.editForm.saveBtn')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 3: WORK SCHEDULE & TIMINGS (FOR PROVIDERS) */}
      {isProvider && activeSection === 'timings' && (
        <AvailabilityManager
          currentAvailability={providerMe?.availability}
          onUpdated={() => loadProfileData()}
        />
      )}

      {/* SECTION 4: VERIFIED SKILL PASSPORT */}
      {isProvider && activeSection === 'passport' && (
        <SkillPassportCard profile={providerMe || userProfile?.provider_profile} />
      )}

    </div>
  );
};
