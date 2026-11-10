import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Lock, User, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('demo_customer');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login({ username, password });
    if (result.success) {
      showToast(`Welcome back, ${result.user.first_name || result.user.username}!`, 'success');
      if (result.user.role === 'PROVIDER') {
        navigate('/provider/dashboard');
      } else if (result.user.role === 'ADMIN' || result.user.is_staff) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      showToast(result.error || 'Login failed', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 card-surface shadow-warm-xl border border-warmgray-200">
      <div className="text-center mb-6">
        <span className="text-4xl">👵🏽</span>
        <h2 className="page-title text-2xl font-bold mt-2">Sign in to SilverHands</h2>
        <p className="text-xs text-warmgray-500 mt-1">Empowering golden age artisans and customers</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-warmgray-700 mb-1">Username</label>
          <div className="relative">
            <User className="w-4 h-4 text-warmgray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-warmgray-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-warmgray-400 absolute left-3.5 top-3.5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full btn-primary !py-3 font-bold mt-2 flex items-center justify-center gap-2">
          <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Demo Credentials Quick-Click Box */}
      <div className="mt-8 p-4 bg-cream-100 rounded-2xl border border-warmgray-200 text-xs">
        <span className="font-bold text-warmgray-800 block mb-2">⚡ Quick Demo Logins:</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setUsername('demo_customer'); setPassword('demo1234'); }}
            className="p-2 rounded-xl bg-white border border-warmgray-200 text-left hover:border-saffron"
          >
            <span className="font-bold block text-warmgray-900">Customer</span>
            <span className="text-[10px] text-warmgray-500">demo_customer</span>
          </button>
          <button
            type="button"
            onClick={() => { setUsername('lakshmi'); setPassword('demo1234'); }}
            className="p-2 rounded-xl bg-white border border-warmgray-200 text-left hover:border-saffron"
          >
            <span className="font-bold block text-warmgray-900">Provider (Cook)</span>
            <span className="text-[10px] text-warmgray-500">lakshmi</span>
          </button>
          <button
            type="button"
            onClick={() => { setUsername('meena'); setPassword('demo1234'); }}
            className="p-2 rounded-xl bg-white border border-warmgray-200 text-left hover:border-saffron"
          >
            <span className="font-bold block text-warmgray-900">Provider (Tailor)</span>
            <span className="text-[10px] text-warmgray-500">meena</span>
          </button>
          <button
            type="button"
            onClick={() => { setUsername('admin'); setPassword('admin123'); }}
            className="p-2 rounded-xl bg-white border border-warmgray-200 text-left hover:border-saffron"
          >
            <span className="font-bold block text-red-600">Admin</span>
            <span className="text-[10px] text-warmgray-500">admin / admin123</span>
          </button>
        </div>
      </div>

      <div className="text-center mt-6 text-xs text-warmgray-600">
        Don't have an account?{' '}
        <Link to="/register" className="font-bold text-saffron hover:underline">
          Join SilverHands
        </Link>
      </div>
    </div>
  );
};
