import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Clock, MapPin, ShieldAlert, CheckCircle2, ShieldCheck, Scale } from 'lucide-react';
import { createBooking, aiDetectScam, aiCheckFairPrice } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const BookingModal = ({ service, isOpen, onClose, onSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [preferredDate, setPreferredDate] = useState('Tomorrow');
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [location, setLocation] = useState(user?.address || 'Chennai, TN');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [scamAlert, setScamAlert] = useState(null);
  const [fairnessCheck, setFairnessCheck] = useState(null);

  useEffect(() => {
    if (isOpen && service) {
      aiCheckFairPrice({
        item_name: service.title,
        price: service.price,
        type: 'service',
        location: service.provider_location || 'Chennai'
      }).then((res) => {
        setFairnessCheck(res.data);
      }).catch(() => {});
    }
  }, [isOpen, service]);

  if (!isOpen || !service) return null;

  const handleMessageChange = async (e) => {
    const text = e.target.value;
    setMessage(text);
    if (text.length > 10) {
      try {
        const res = await aiDetectScam(text);
        if (res.data.is_scam || res.data.risk_level === 'HIGH' || res.data.risk_level === 'MEDIUM') {
          setScamAlert(res.data);
        } else {
          setScamAlert(null);
        }
      } catch {}
    } else {
      setScamAlert(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to book this service', 'info');
      onClose();
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      await createBooking({
        service: service.id,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        location,
        message,
      });
      showToast('Service booking requested successfully! View in your dashboard.', 'success');
      onSuccess?.();
      onClose();
      navigate('/bookings');
    } catch (err) {
      let errorMsg = 'Unable to complete service booking request. Please try again.';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (typeof err.response?.data === 'string') {
        errorMsg = err.response.data;
      }
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-warm-xl overflow-hidden border border-warmgray-200">
        
        <div className="bg-cream-100 p-6 border-b border-warmgray-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-saffron">Request Service Booking</span>
            <h3 className="font-heading text-xl font-bold text-warmgray-900">{service.title}</h3>
            <p className="text-xs font-medium text-warmgray-600 mt-0.5">With {service.provider_name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-warmgray-500 hover:bg-cream-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Fair & Authentic Price Intelligence Card */}
          {fairnessCheck && (
            <div className="p-3.5 bg-sage-50/80 border border-sage-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sage-dark flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-sage" />
                  {fairnessCheck.badge}
                </span>
                <span className="text-[10px] font-bold bg-white text-sage-dark px-2 py-0.5 rounded-full border border-sage/30">
                  {fairnessCheck.authenticity_rating}
                </span>
              </div>
              <p className="text-[11px] text-warmgray-600">
                Fair market benchmark: <strong>₹{fairnessCheck.fair_range?.min} – ₹{fairnessCheck.fair_range?.max}</strong>. You are getting authentic elder artisan service at an honest price.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-saffron" /> Preferred Date
              </label>
              <input
                type="text"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                placeholder="e.g. Tomorrow / Sunday"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-200 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-saffron" /> Preferred Time
              </label>
              <input
                type="text"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                placeholder="e.g. 10:00 AM / Evening"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-200 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-saffron" /> Service Location / Address
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Flat 3B, Adyar, Chennai"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-200 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">
              Special Instructions or Requirements
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={handleMessageChange}
              placeholder="Mention dietary preferences, measurements, or class details..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-200 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
            />
          </div>

          {/* Scam Warning Banner */}
          {scamAlert && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-800 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Safety Alert: Suspicious Content Detected</span>
                <span>{scamAlert.explanation || 'Avoid mentioning external cash advance or sharing bank credentials.'}</span>
              </div>
            </div>
          )}

          <div className="bg-saffron-50 p-3.5 rounded-2xl flex items-center justify-between border border-saffron-200">
            <div>
              <span className="text-xs font-semibold text-warmgray-600 block">Total Estimated Cost</span>
              <span className="text-xl font-black text-saffron-dark">₹{Math.round(service.price)}</span>
            </div>
            <span className="text-xs font-bold text-sage-dark bg-white px-2.5 py-1 rounded-full border border-sage/20">
              Pay after service
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary text-sm !px-6">
              {loading ? 'Submitting...' : 'Confirm Booking'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
