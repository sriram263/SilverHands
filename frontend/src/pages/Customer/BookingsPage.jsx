import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getBookings, updateBookingStatus, cancelBooking } from '../../api/client';
import { ReviewModal } from '../../components/marketplace/ReviewModal';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Calendar, Clock, Star, MapPin, XCircle, CheckCircle, ArrowRight, ShieldCheck, Inbox, Send } from 'lucide-react';

export const BookingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isProvider, isAdmin, isCustomer } = useAuth();
  const { showToast } = useNotifications();

  // Mode: 'incoming' (requests for my services) vs 'my_requests' (services I booked as customer)
  const initialMode = searchParams.get('view') || (isProvider ? 'incoming' : 'my_requests');
  const [activeMode, setActiveMode] = useState(initialMode);
  
  // Status filter category
  const initialTab = (searchParams.get('tab') || 'ALL').toUpperCase();
  const [statusFilter, setStatusFilter] = useState(initialTab);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewBooking, setReviewBooking] = useState(null);

  // Synchronize state with URL search params (e.g. from Voice / Controller commands)
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && (viewParam === 'incoming' || viewParam === 'my_requests')) {
      setActiveMode(viewParam);
    }
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setStatusFilter(tabParam.toUpperCase());
    }
  }, [searchParams]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await getBookings({ view: activeMode });
      setBookings(res.data || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [activeMode]);

  useEffect(() => {
    // Listen for custom AI dispatch reload events
    const handleReload = () => loadBookings();
    window.addEventListener('sh-reload-data', handleReload);
    return () => window.removeEventListener('sh-reload-data', handleReload);
  }, [activeMode]);

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    const sp = new URLSearchParams(searchParams);
    sp.set('view', mode);
    sp.set('tab', 'ALL');
    setStatusFilter('ALL');
    setSearchParams(sp, { replace: true });
  };

  const handleTabChange = (tab) => {
    setStatusFilter(tab);
    const sp = new URLSearchParams(searchParams);
    sp.set('tab', tab);
    setSearchParams(sp, { replace: true });
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateBookingStatus(id, status);
      showToast(`Booking marked as ${status.toLowerCase()}`, 'success');
      loadBookings();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update booking status', 'error');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking appointment?')) return;
    try {
      await cancelBooking(id);
      showToast('Booking cancelled successfully', 'success');
      loadBookings();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to cancel booking', 'error');
    }
  };

  // Filter Bookings by category / status
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true;

    if (activeMode === 'incoming') {
      // (all, pending, accepted, upcoming, completed, cancelled)
      if (statusFilter === 'PENDING') return b.status === 'PENDING';
      if (statusFilter === 'ACCEPTED') return b.status === 'CONFIRMED' || b.status === 'ACCEPTED';
      if (statusFilter === 'UPCOMING') return b.status === 'IN_PROGRESS';
      if (statusFilter === 'COMPLETED') return b.status === 'COMPLETED';
      if (statusFilter === 'CANCELLED') return b.status === 'CANCELLED';
    } else {
      // customer booked services (all, upcoming, completed, cancelled)
      if (statusFilter === 'UPCOMING') return b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS';
      if (statusFilter === 'COMPLETED') return b.status === 'COMPLETED';
      if (statusFilter === 'CANCELLED') return b.status === 'CANCELLED';
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Title */}
      <div>
        <h1 className="page-title text-3xl sm:text-4xl">Service Bookings & Appointments</h1>
        <p className="text-xs sm:text-sm text-warmgray-500 mt-1">
          Track incoming customer requests for your crafts and manage your own booked appointments.
        </p>
      </div>

      {/* Provider Top-Level Mode Selector (Hidden for pure Customers) */}
      {!isCustomer && (
        <div className="flex bg-cream-100 p-1.5 rounded-2xl border border-warmgray-200 w-full sm:w-auto self-start">
          <button
            onClick={() => handleModeChange('incoming')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMode === 'incoming'
                ? 'bg-saffron text-white shadow-warm'
                : 'text-warmgray-600 hover:text-warmgray-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Incoming Service Requests (As Provider)</span>
          </button>
          
          <button
            onClick={() => handleModeChange('my_requests')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMode === 'my_requests'
                ? 'bg-saffron text-white shadow-warm'
                : 'text-warmgray-600 hover:text-warmgray-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>My Booked Services (As Customer)</span>
          </button>
        </div>
      )}

      {/* Category Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-warmgray-200">
        
        <button
          onClick={() => handleTabChange('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            statusFilter === 'ALL' ? 'bg-warmgray-900 text-white' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          All ({bookings.length})
        </button>

        {activeMode === 'incoming' ? (
          // Provider specific categories: (pending, accepted, upcoming, completed, cancelled)
          <>
            <button
              onClick={() => handleTabChange('PENDING')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              Pending Approval
            </button>
            <button
              onClick={() => handleTabChange('ACCEPTED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'ACCEPTED' ? 'bg-blue-600 text-white' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => handleTabChange('UPCOMING')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'UPCOMING' ? 'bg-purple-600 text-white' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              Upcoming / In-Progress
            </button>
            <button
              onClick={() => handleTabChange('COMPLETED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'COMPLETED' ? 'bg-sage text-white' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => handleTabChange('CANCELLED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'CANCELLED' ? 'bg-red-600 text-white' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              Cancelled
            </button>
          </>
        ) : (
          // Customer booked categories: (upcoming, completed, cancelled)
          <>
            <button
              onClick={() => handleTabChange('UPCOMING')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'UPCOMING' ? 'bg-saffron text-white' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              Upcoming Appointments
            </button>
            <button
              onClick={() => handleTabChange('COMPLETED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'COMPLETED' ? 'bg-sage text-white' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => handleTabChange('CANCELLED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'CANCELLED' ? 'bg-red-600 text-white' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              Cancelled
            </button>
          </>
        )}

      </div>

      {/* Bookings Content */}
      {loading ? (
        <div className="text-center py-16 font-bold text-saffron">Loading service appointments...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="card-surface p-12 text-center text-xs text-warmgray-500 border border-warmgray-200">
          No bookings found in this category.
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {filteredBookings.map((b, index) => (
            <div
              key={b.id}
              data-booking-id={b.id}
              data-item-type="booking"
              data-item-title={b.service_title}
              data-item-status={b.status}
              data-item-index={index + 1}
              className="card-surface p-6 border-l-4 border-l-saffron space-y-4"
            >
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`badge-tag font-bold ${
                      b.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-200' :
                      b.status === 'COMPLETED' ? 'bg-sage-50 text-sage-dark border border-sage-200' :
                      b.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {b.status}
                    </span>
                    <span className="text-xs text-warmgray-500 font-medium">ID: #{b.id}</span>
                  </div>

                  <h3 className="font-heading text-lg font-bold text-warmgray-900">{b.service_title}</h3>
                  
                  <p className="text-xs text-warmgray-600">
                    {activeMode === 'incoming' ? (
                      <>Requested by Customer: <strong>{b.customer_name || b.customer_username}</strong></>
                    ) : (
                      <>Artisan Provider: <strong>{b.provider_name}</strong></>
                    )}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-warmgray-500 pt-1">
                    <span>📅 Date: <strong>{b.preferred_date || 'Flexible'}</strong></span>
                    <span>⏰ Time: <strong>{b.preferred_time || 'Morning'}</strong></span>
                    <span>📍 Location: <strong>{b.location || 'Chennai'}</strong></span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-warmgray-400 font-semibold block">Total Price</span>
                  <span className="font-heading text-2xl font-black text-saffron-dark">₹{Math.round(b.total_price)}</span>
                </div>
              </div>

              {b.message && (
                <p className="text-xs text-warmgray-700 bg-cream-50 p-3 rounded-xl italic border border-warmgray-100">
                  "{b.message}"
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-warmgray-100">
                
                {/* Provider Actions */}
                {activeMode === 'incoming' && (
                  <>
                    {b.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                      >
                        ✓ Accept Request
                      </button>
                    )}
                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'IN_PROGRESS')}
                        className="px-4 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700"
                      >
                        Start Service
                      </button>
                    )}
                    {b.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                        className="px-4 py-1.5 rounded-xl bg-sage text-white text-xs font-bold hover:bg-sage-dark"
                      >
                        ✓ Mark Completed
                      </button>
                    )}
                  </>
                )}

                {/* Customer Review Action */}
                {activeMode === 'my_requests' && b.status === 'COMPLETED' && (
                  <button
                    onClick={() => setReviewBooking(b)}
                    className="btn-outline text-xs !px-4 !py-1.5 flex items-center gap-1"
                  >
                    <Star className="w-3.5 h-3.5 fill-current text-saffron" />
                    Leave Review
                  </button>
                )}

                {/* Cancellation (available if not completed/cancelled) */}
                {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel Booking
                  </button>
                )}

              </div>

            </div>
          ))}
        </div>
      )}

      <ReviewModal
        booking={reviewBooking}
        isOpen={!!reviewBooking}
        onClose={() => setReviewBooking(null)}
        onSuccess={loadBookings}
      />

    </div>
  );
};
