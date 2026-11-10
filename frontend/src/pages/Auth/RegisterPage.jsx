import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Mic, ArrowRight } from 'lucide-react';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'CUSTOMER',
    address: 'Adyar, Chennai, TN',
    preferred_language: 'en',
    is_senior: false
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await register(formData);
    if (result.success) {
      showToast('Registration successful! Welcome to SilverHands.', 'success');
      navigate('/');
    } else {
      showToast(result.error || 'Registration failed', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto my-12 p-8 card-surface shadow-warm-xl border border-warmgray-200">
      <div className="text-center mb-6">
        <h2 className="page-title text-2xl font-bold">Join SilverHands</h2>
        <p className="text-xs text-warmgray-500 mt-1">Connect with verified homemakers & elders or offer your traditional skills</p>
        
        {/* Voice Assisted Onboarding CTA */}
        <Link
          to="/register-voice"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-saffron-50 border border-saffron-200 text-saffron-dark text-xs font-bold hover:bg-saffron-100"
        >
          <Mic className="w-4 h-4 text-saffron" />
          <span>Need help? Try Voice Guided Registration</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-xs font-bold text-warmgray-700 mb-1">I want to register as:</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'CUSTOMER' })}
              className={`p-3 rounded-xl border text-center font-bold text-xs ${
                formData.role === 'CUSTOMER'
                  ? 'border-saffron bg-saffron-50 text-saffron-dark'
                  : 'border-warmgray-200 bg-cream-50 text-warmgray-600'
              }`}
            >
              🛍️ Customer / Buyer
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'PROVIDER' })}
              className={`p-3 rounded-xl border text-center font-bold text-xs ${
                formData.role === 'PROVIDER'
                  ? 'border-sage bg-sage-50 text-sage-dark'
                  : 'border-warmgray-200 bg-cream-50 text-warmgray-600'
              }`}
            >
              👩🏽‍🍳 Homemaker / Elder Artisan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">First Name</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-warmgray-700 mb-1">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98401 00000"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-warmgray-700 mb-1">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Location / Area</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Mylapore, Chennai"
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Preferred Language</label>
            <select
              value={formData.preferred_language}
              onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
            >
              <option value="en">English (EN)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="ml">മലയാളം (Malayalam)</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full btn-primary !py-3 font-bold mt-4 flex items-center justify-center gap-2">
          <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center mt-6 text-xs text-warmgray-600">
        Already registered?{' '}
        <Link to="/login" className="font-bold text-saffron hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
};
