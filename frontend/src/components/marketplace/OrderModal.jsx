import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus } from 'lucide-react';
import { createOrder } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const OrderModal = ({ product, isOpen, onClose, onSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const total = product.price * quantity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to place an order', 'info');
      onClose();
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      await createOrder({
        product: product.id,
        quantity,
        message,
      });
      showToast('Order placed successfully! View in your orders tab.', 'success');
      onSuccess?.();
      onClose();
      navigate('/orders');
    } catch (err) {
      let errorMsg = 'Unable to complete order. Please check stock and try again.';
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
      <div className="bg-white w-full max-w-md rounded-3xl shadow-warm-xl overflow-hidden border border-warmgray-200">
        <div className="bg-cream-100 p-6 border-b border-warmgray-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sage">Handmade Order</span>
            <h3 className="font-heading text-xl font-bold text-warmgray-900">{product.title}</h3>
            <p className="text-xs font-medium text-warmgray-600 mt-0.5">By {product.provider_name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-warmgray-500 hover:bg-cream-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-2">Select Quantity</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl border border-warmgray-300 flex items-center justify-center font-bold text-lg hover:bg-cream-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-heading text-xl font-bold w-12 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                className="w-10 h-10 rounded-xl border border-warmgray-300 flex items-center justify-center font-bold text-lg hover:bg-cream-100"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-xs text-warmgray-500 ml-2">({product.quantity} available)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Delivery Notes / Preferences</label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Mild spice level, delivery address details..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-200 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-sage"
            />
          </div>

          <div className="bg-sage-50 p-4 rounded-2xl flex items-center justify-between border border-sage-200">
            <div>
              <span className="text-xs font-semibold text-warmgray-600 block">Total Amount</span>
              <span className="text-2xl font-black text-sage-dark">₹{Math.round(total)}</span>
            </div>
            <span className="text-xs font-bold text-warmgray-700">₹{Math.round(product.price)} each</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
            {product.quantity <= 0 ? (
              <span className="badge-tag bg-red-100 text-red-700 font-bold text-xs py-2.5 px-4 border border-red-200">
                Item Sold Out
              </span>
            ) : (
              <button type="submit" disabled={loading} className="btn-secondary text-sm !px-6 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" />
                {loading ? 'Processing...' : 'Confirm Order'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
