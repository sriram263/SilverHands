import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getBookings, getOrders, getProfile, getServices, getProducts, 
  getProviderMe, updateBookingStatus, updateOrderStatus 
} from '../../api/client';
import { CreateServiceModal } from './CreateServiceModal';
import { CreateProductModal } from './CreateProductModal';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Plus, ShoppingBag, Calendar, CheckCircle2, Clock, 
  Sparkles, Wand2, ArrowRight, Check, X, RefreshCw, UserCheck, Package, Award, Settings, User,
  ShieldCheck, Star, TrendingUp, Compass
} from 'lucide-react';

export const ProviderDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  
  const [profile, setProfile] = useState(null);
  const [providerMe, setProviderMe] = useState(null);
  const [incomingBookings, setIncomingBookings] = useState([]);
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [myPurchasesBookings, setMyPurchasesBookings] = useState([]);
  const [myPurchasesOrders, setMyPurchasesOrders] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profRes, meRes, inBkRes, inOrdRes, myBkRes, myOrdRes, srvRes, prdRes] = await Promise.all([
        getProfile().catch(() => ({ data: null })),
        getProviderMe().catch(() => ({ data: null })),
        getBookings({ view: 'incoming' }).catch(() => ({ data: [] })),
        getOrders({ view: 'incoming' }).catch(() => ({ data: [] })),
        getBookings({ view: 'my_requests' }).catch(() => ({ data: [] })),
        getOrders({ view: 'my_purchases' }).catch(() => ({ data: [] })),
        getServices({ provider: user.id }).catch(() => ({ data: [] })),
        getProducts({ provider: user.id }).catch(() => ({ data: [] }))
      ]);

      if (profRes?.data) setProfile(profRes.data);
      if (meRes?.data) setProviderMe(meRes.data);
      setIncomingBookings(inBkRes?.data || []);
      setIncomingOrders(inOrdRes?.data || []);
      setMyPurchasesBookings(myBkRes?.data || []);
      setMyPurchasesOrders(myOrdRes?.data || []);
      setMyServices(srvRes?.data || []);
      setMyProducts(prdRes?.data || []);
    } catch (err) {
      console.error('Error loading provider dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleUpdateBooking = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      showToast(`Booking marked as ${newStatus}`, 'success');
      loadData();
    } catch {
      showToast('Failed to update booking status', 'error');
    }
  };

  const handleUpdateOrder = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast(`Order marked as ${newStatus}`, 'success');
      loadData();
    } catch {
      showToast('Failed to update order status', 'error');
    }
  };

  const providerName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.username || 'Artisan');

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Hero Passport Banner (Suhail-Style Vibrant Gradient Banner) */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-saffron via-amber-600 to-amber-800 text-white p-6 sm:p-10 shadow-warm">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 -top-10 w-48 h-48 rounded-full bg-yellow-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold text-white border border-white/30 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Verified SilverHands Master Artisan</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">
              Good Day, {providerName}!
            </h1>
            <p className="text-white/90 text-sm sm:text-base max-w-2xl font-medium leading-relaxed">
              Your digital livelihood passport and craft operations hub are active in <strong>{providerMe?.location || 'Chennai, Tamil Nadu'}</strong>. Manage your incoming appointments, handmade store, and client deliveries with ease.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              to="/profile"
              className="px-6 py-3.5 bg-white text-saffron-dark font-extrabold text-sm rounded-2xl hover:bg-cream-100 transition-all shadow-warm flex items-center justify-center space-x-2 border border-white"
            >
              <Award className="w-5 h-5 text-saffron" />
              <span>View Skill Passport</span>
            </Link>
            <Link
              to="/profile"
              className="px-6 py-3.5 bg-black/20 hover:bg-black/30 backdrop-blur-md text-white font-bold text-sm rounded-2xl transition-all border border-white/30 flex items-center justify-center space-x-2"
            >
              <UserCheck className="w-5 h-5" />
              <span>Edit Profile & Timings</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Operations Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-warmgray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-warmgray-900 text-white shadow-warm'
              : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Overview & Tools</span>
        </button>

        <button
          onClick={() => setActiveTab('incoming_bookings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'incoming_bookings'
              ? 'bg-saffron text-white shadow-warm'
              : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Incoming Requests ({incomingBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('incoming_orders')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'incoming_orders'
              ? 'bg-sage text-white shadow-warm'
              : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Product Orders ({incomingOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('my_listings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'my_listings'
              ? 'bg-amber-600 text-white shadow-warm'
              : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catalog ({myServices.length + myProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('my_purchases')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'my_purchases'
              ? 'bg-blue-600 text-white shadow-warm'
              : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>My Purchases ({myPurchasesBookings.length + myPurchasesOrders.length})</span>
        </button>
      </div>

      {/* Tab 0: Overview & Fast Business Tools */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Quick Actions Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-warmgray-900 tracking-tight">Fast Business Tools</h2>
              <span className="text-xs font-bold text-saffron-dark uppercase tracking-wider">Quick Actions</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <button
                onClick={() => setIsCreateServiceOpen(true)}
                className="card-surface p-5 text-left border border-warmgray-200 hover:border-saffron hover:shadow-warm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-saffron-50 text-saffron flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-sm text-warmgray-900">+ Add Service Listing</h3>
                <p className="text-xs text-warmgray-500 mt-1">Offer home cooking, tailoring, or lessons</p>
              </button>

              <button
                onClick={() => setIsCreateProductOpen(true)}
                className="card-surface p-5 text-left border border-warmgray-200 hover:border-sage hover:shadow-warm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-sage-50 text-sage-dark flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-sm text-warmgray-900">+ Sell Handmade Item</h3>
                <p className="text-xs text-warmgray-500 mt-1">Sell homemade pickles, sweaters, compost</p>
              </button>

              <Link
                to="/profile"
                className="card-surface p-5 text-left border border-warmgray-200 hover:border-purple-500 hover:shadow-warm transition-all group block"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-sm text-warmgray-900">Working Hours Schedule</h3>
                <p className="text-xs text-warmgray-500 mt-1">Adjust your daily availability hours</p>
              </Link>

              <Link
                to="/ai-wizard"
                className="card-surface p-5 text-left border border-warmgray-200 hover:border-amber-500 hover:shadow-warm transition-all group block"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-sm text-warmgray-900">AI Livelihood Wizard</h3>
                <p className="text-xs text-warmgray-500 mt-1">Generate AI descriptions & fair pricing</p>
              </Link>
            </div>
          </section>

          {/* Performance Statistics Row */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-warmgray-900 tracking-tight">Performance Analytics</h2>
              <span className="text-xs font-bold text-sage-dark flex items-center gap-1 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" /> Live Growth Analytics
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card-surface p-5 border-l-4 border-l-saffron space-y-1">
                <span className="text-[11px] font-bold text-warmgray-500 uppercase">Incoming Bookings</span>
                <span className="font-heading text-2xl font-black text-warmgray-900">{incomingBookings.length}</span>
                <span className="text-[10px] text-warmgray-400">Active client requests</span>
              </div>

              <div className="card-surface p-5 border-l-4 border-l-sage space-y-1">
                <span className="text-[11px] font-bold text-warmgray-500 uppercase">Product Orders</span>
                <span className="font-heading text-2xl font-black text-warmgray-900">{incomingOrders.length}</span>
                <span className="text-[10px] text-warmgray-400">Goods to fulfill</span>
              </div>

              <div className="card-surface p-5 border-l-4 border-l-amber-600 space-y-1">
                <span className="text-[11px] font-bold text-warmgray-500 uppercase">Live Catalog</span>
                <span className="font-heading text-2xl font-black text-warmgray-900">{myServices.length + myProducts.length} Items</span>
                <span className="text-[10px] text-warmgray-400">{myServices.length} Services / {myProducts.length} Products</span>
              </div>

              <div className="card-surface p-5 border-l-4 border-l-yellow-500 space-y-1">
                <span className="text-[11px] font-bold text-warmgray-500 uppercase">Rating Score</span>
                <span className="font-heading text-2xl font-black text-warmgray-900 flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" /> {providerMe?.rating || 4.9}★
                </span>
                <span className="text-[10px] text-warmgray-400">Verified SilverTrust score</span>
              </div>
            </div>
          </section>

          {/* AI Insights & Opportunity Radar Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* AI Livelihood Opportunity Card */}
            <div className="card-surface p-6 sm:p-8 flex flex-col justify-between space-y-6 border border-warmgray-200 shadow-warm">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-saffron-50 text-saffron border border-saffron-200">
                    <Sparkles className="w-7 h-7 text-saffron" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-warmgray-900">AI Demand Intelligence</h3>
                    <span className="text-xs font-bold text-saffron-dark uppercase tracking-wider">High Local Demand (+35%)</span>
                  </div>
                </div>

                <div className="p-4 bg-cream-50 rounded-2xl border border-warmgray-200 space-y-3">
                  <p className="text-xs sm:text-sm text-warmgray-800 font-semibold leading-relaxed">
                    💡 Demand surge in Chennai for weekend South Indian catering and festival sweet preparation. Offering 4-guest meal packages could increase monthly bookings by 40%.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-warmgray-200">
                    <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-sage-50 text-sage-dark border border-sage-200">
                      High Local Demand (+35%)
                    </span>
                    <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-saffron-50 text-saffron-dark border border-saffron-200">
                      Est. Revenue ₹6,500/mo
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/ai-wizard"
                className="btn-primary text-xs !py-3 w-full flex items-center justify-center gap-2"
              >
                <span>Launch AI Skill & Product Wizard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Opportunity Radar Card */}
            <div className="card-surface p-6 sm:p-8 flex flex-col justify-between space-y-6 border border-warmgray-200 shadow-warm">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-sage-50 text-sage-dark border border-sage-200">
                    <Compass className="w-7 h-7 text-sage" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-warmgray-900">Opportunity Radar Gigs</h3>
                    <span className="text-xs font-bold text-sage-dark uppercase tracking-wider">Nearby Client Inquiries</span>
                  </div>
                </div>

                <div className="p-4 bg-cream-50 rounded-2xl border border-warmgray-200 space-y-3">
                  <p className="text-xs sm:text-sm text-warmgray-800 font-semibold leading-relaxed">
                    🧭 4 active urgent gigs matched your verified craft skills within 3 km in Chennai (Mylapore, Adyar, T. Nagar).
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-warmgray-200">
                    <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Chettinad Meal Catering (Adyar)
                    </span>
                    <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                      Urgent Blouse Aari Work (T. Nagar)
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/radar"
                className="btn-secondary text-xs !py-3 w-full flex items-center justify-center gap-2"
              >
                <span>Explore Opportunity Radar Gigs</span>
                <Compass className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* Tab 1: Incoming Service Bookings */}
      {activeTab === 'incoming_bookings' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-heading text-xl font-bold text-warmgray-900">
              Customer Appointments & Service Bookings
            </h2>
            <button onClick={loadData} className="btn-ghost text-xs flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {incomingBookings.length === 0 ? (
            <div className="card-surface p-10 text-center text-xs text-warmgray-500">
              No service booking requests at the moment. When customers request your services, they will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingBookings.map((b) => (
                <div key={b.id} className="card-surface p-6 border-l-4 border-l-saffron space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="badge-tag bg-amber-50 text-amber-800 font-bold border border-amber-200 mb-1">
                        {b.status}
                      </span>
                      <h3 className="font-heading text-lg font-bold text-warmgray-900">{b.service_title}</h3>
                      <p className="text-xs text-warmgray-600">Client: {b.customer_name || b.customer_username}</p>
                    </div>
                    <span className="font-heading text-xl font-black text-saffron-dark">₹{Math.round(b.total_price)}</span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-warmgray-500 border-t border-warmgray-100 pt-3">
                    <span>📅 {b.preferred_date}</span>
                    <span>⏰ {b.preferred_time}</span>
                    <span>📍 {b.location}</span>
                  </div>

                  {b.message && (
                    <p className="text-xs text-warmgray-700 bg-cream-50 p-2.5 rounded-xl italic">"{b.message}"</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-warmgray-100">
                    {b.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateBooking(b.id, 'CONFIRMED')}
                        className="btn-primary text-xs !py-1.5 !px-3"
                      >
                        ✓ Accept Request
                      </button>
                    )}
                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateBooking(b.id, 'IN_PROGRESS')}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700"
                      >
                        Start Service
                      </button>
                    )}
                    {b.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleUpdateBooking(b.id, 'COMPLETED')}
                        className="btn-secondary text-xs !py-1.5 !px-3"
                      >
                        ✓ Mark Completed
                      </button>
                    )}
                    {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateBooking(b.id, 'CANCELLED')}
                        className="btn-outline text-xs !py-1.5 !px-3 text-red-600 hover:bg-red-50"
                      >
                        Decline
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Incoming Product Orders */}
      {activeTab === 'incoming_orders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-heading text-xl font-bold text-warmgray-900">
              Customer Product Orders (Handmade Marketplace)
            </h2>
            <button onClick={loadData} className="btn-ghost text-xs flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {incomingOrders.length === 0 ? (
            <div className="card-surface p-10 text-center text-xs text-warmgray-500">
              No product orders received yet. Once customers order your handmade crafts or food items, they will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingOrders.map((o) => (
                <div key={o.id} className="card-surface p-6 border-l-4 border-l-sage space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="badge-tag bg-sage-50 text-sage-dark font-bold border border-sage-200 mb-1">
                        {o.status}
                      </span>
                      <h3 className="font-heading text-lg font-bold text-warmgray-900">{o.product_title}</h3>
                      <p className="text-xs text-warmgray-600">Buyer: {o.customer_name || o.customer_username} • Qty: {o.quantity}</p>
                    </div>
                    <span className="font-heading text-xl font-black text-sage-dark">₹{Math.round(o.total_price)}</span>
                  </div>

                  {o.message && (
                    <p className="text-xs text-warmgray-700 bg-cream-50 p-2.5 rounded-xl italic">"{o.message}"</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-warmgray-100">
                    {o.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateOrder(o.id, 'SHIPPED')}
                        className="btn-primary text-xs !py-1.5 !px-3"
                      >
                        Mark as Shipped
                      </button>
                    )}
                    {o.status === 'SHIPPED' && (
                      <button
                        onClick={() => handleUpdateOrder(o.id, 'DELIVERED')}
                        className="btn-secondary text-xs !py-1.5 !px-3"
                      >
                        ✓ Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: My Provided Services & Products */}
      {activeTab === 'my_listings' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-heading text-lg font-bold text-warmgray-900">
                My Services ({myServices.length})
              </h3>
              <button
                onClick={() => setIsCreateServiceOpen(true)}
                className="btn-primary text-xs !py-1.5 !px-3 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Service
              </button>
            </div>

            {myServices.length === 0 ? (
              <p className="text-xs text-warmgray-500 italic card-surface p-6 text-center">No services listed yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myServices.map((s) => (
                  <div key={s.id} className="card-surface p-4 space-y-2 border-l-4 border-l-saffron">
                    <span className="badge-tag bg-saffron-50 text-saffron-dark font-bold">{s.category_name}</span>
                    <h4 className="font-heading font-bold text-base text-warmgray-900">{s.title}</h4>
                    <p className="text-xs text-warmgray-600 line-clamp-2">{s.description}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-warmgray-100">
                      <span className="font-bold text-saffron-dark text-sm">₹{Math.round(s.price)}</span>
                      <span className="text-xs text-warmgray-500">⏳ {s.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-warmgray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-heading text-lg font-bold text-warmgray-900">
                My Handmade Products ({myProducts.length})
              </h3>
              <button
                onClick={() => setIsCreateProductOpen(true)}
                className="btn-secondary text-xs !py-1.5 !px-3 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Sell Product
              </button>
            </div>

            {myProducts.length === 0 ? (
              <p className="text-xs text-warmgray-500 italic card-surface p-6 text-center">No products listed yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myProducts.map((p) => (
                  <div key={p.id} className="card-surface p-4 space-y-2 border-l-4 border-l-sage">
                    <div className="flex justify-between items-start">
                      <span className="badge-tag bg-sage-50 text-sage-dark font-bold">{p.category_name}</span>
                      {p.quantity === 0 ? (
                        <span className="badge-tag bg-red-100 text-red-700 font-bold border border-red-200">
                          SOLD OUT
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-sage-dark bg-sage-50 px-2 py-0.5 rounded-full border border-sage-200">
                          {p.quantity} in stock
                        </span>
                      )}
                    </div>
                    <h4 className="font-heading font-bold text-base text-warmgray-900">{p.title}</h4>
                    <p className="text-xs text-warmgray-600 line-clamp-2">{p.description}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-warmgray-100">
                      <span className="font-bold text-sage-dark text-sm">₹{Math.round(p.price)}</span>
                      <span className="text-xs text-warmgray-500">🌿 Handmade</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: My Purchases as Customer */}
      {activeTab === 'my_purchases' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-bold text-warmgray-900">Services I Booked as Customer ({myPurchasesBookings.length})</h3>
            {myPurchasesBookings.length === 0 ? (
              <p className="text-xs text-warmgray-500 italic">No bookings placed yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myPurchasesBookings.map((b) => (
                  <div key={b.id} className="card-surface p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-warmgray-900">{b.service_title}</span>
                      <span className="badge-tag bg-saffron-50 text-saffron-dark">{b.status}</span>
                    </div>
                    <p className="text-xs text-warmgray-500">Provider: {b.provider_name} • ₹{Math.round(b.total_price)}</p>
                    <p className="text-xs text-warmgray-600">📅 {b.preferred_date} ({b.preferred_time})</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-warmgray-200">
            <h3 className="font-heading text-lg font-bold text-warmgray-900">Handmade Products I Ordered ({myPurchasesOrders.length})</h3>
            {myPurchasesOrders.length === 0 ? (
              <p className="text-xs text-warmgray-500 italic">No product purchases yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myPurchasesOrders.map((o) => (
                  <div key={o.id} className="card-surface p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-warmgray-900">{o.product_title}</span>
                      <span className="badge-tag bg-sage-50 text-sage-dark">{o.status}</span>
                    </div>
                    <p className="text-xs text-warmgray-500">Artisan: {o.provider_name} • Qty: {o.quantity} • ₹{Math.round(o.total_price)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Creation Modals */}
      <CreateServiceModal
        isOpen={isCreateServiceOpen}
        onClose={() => setIsCreateServiceOpen(false)}
        onCreated={loadData}
      />
      <CreateProductModal
        isOpen={isCreateProductOpen}
        onClose={() => setIsCreateProductOpen(false)}
        onCreated={loadData}
      />
    </div>
  );
};
