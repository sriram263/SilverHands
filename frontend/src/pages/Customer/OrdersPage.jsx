import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getOrders, updateOrderStatus, cancelOrder } from '../../api/client';
import { ReviewModal } from '../../components/marketplace/ReviewModal';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ShoppingBag, XCircle, CheckCircle, Truck, Inbox, Send, Package, Star, MessageSquarePlus } from 'lucide-react';

export const OrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isProvider, isAdmin, isCustomer } = useAuth();
  const { showToast } = useNotifications();

  // Mode: 'incoming' (orders for my products) vs 'my_purchases' (products I ordered)
  const initialMode = searchParams.get('view') || (isProvider ? 'incoming' : 'my_purchases');
  const [activeMode, setActiveMode] = useState(initialMode);
  
  const initialTab = (searchParams.get('tab') || 'ALL').toUpperCase();
  const [statusFilter, setStatusFilter] = useState(initialTab);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState(null);

  // Sync state when URL params change
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && (viewParam === 'incoming' || viewParam === 'my_purchases')) {
      setActiveMode(viewParam);
    }
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setStatusFilter(tabParam.toUpperCase());
    }
  }, [searchParams]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await getOrders({ view: activeMode });
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [activeMode]);

  useEffect(() => {
    // Listen for custom AI dispatch reload events
    const handleReload = () => loadOrders();
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
      await updateOrderStatus(id, status);
      showToast(`Order marked as ${status.toLowerCase()}`, 'success');
      loadOrders();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update order', 'error');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order? The inventory will be returned to the artisan stock.')) return;
    try {
      const res = await cancelOrder(id);
      showToast(res.data.message || 'Order cancelled and stock restocked', 'success');
      loadOrders();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to cancel order', 'error');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;

    if (activeMode === 'incoming') {
      if (statusFilter === 'PENDING') return o.status === 'PENDING';
      if (statusFilter === 'SHIPPED') return o.status === 'SHIPPED';
      if (statusFilter === 'DELIVERED') return o.status === 'DELIVERED';
      if (statusFilter === 'CANCELLED') return o.status === 'CANCELLED';
    } else {
      if (statusFilter === 'ACTIVE') return o.status === 'PENDING' || o.status === 'PROCESSING' || o.status === 'SHIPPED';
      if (statusFilter === 'DELIVERED') return o.status === 'DELIVERED' || o.status === 'COMPLETED';
      if (statusFilter === 'CANCELLED') return o.status === 'CANCELLED';
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="page-title text-3xl sm:text-4xl">Handmade Marketplace Orders</h1>
        <p className="text-xs sm:text-sm text-warmgray-500 mt-1">
          Manage handmade product sales and your customer purchases in one place.
        </p>
      </div>

      {/* Provider Mode Selector */}
      {!isCustomer && (
        <div className="flex bg-cream-100 p-1.5 rounded-2xl border border-warmgray-200 w-full sm:w-auto self-start">
          <button
            onClick={() => handleModeChange('incoming')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMode === 'incoming'
                ? 'bg-sage text-white shadow-warm'
                : 'text-warmgray-600 hover:text-warmgray-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Incoming Orders (Products I Sell)</span>
          </button>
          
          <button
            onClick={() => handleModeChange('my_purchases')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMode === 'my_purchases'
                ? 'bg-sage text-white shadow-warm'
                : 'text-warmgray-600 hover:text-warmgray-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>My Placed Orders (Purchases)</span>
          </button>
        </div>
      )}

      {/* Status Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-warmgray-200">
        <button
          onClick={() => handleTabChange('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            statusFilter === 'ALL' ? 'bg-warmgray-900 text-white' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          All Orders ({orders.length})
        </button>

        {activeMode === 'incoming' ? (
          <>
            <button
              onClick={() => handleTabChange('PENDING')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              Pending Dispatch
            </button>
            <button
              onClick={() => handleTabChange('SHIPPED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'SHIPPED' ? 'bg-blue-600 text-white' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              Shipped / In Transit
            </button>
            <button
              onClick={() => handleTabChange('DELIVERED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'DELIVERED' ? 'bg-sage text-white' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              Delivered
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
          <>
            <button
              onClick={() => handleTabChange('ACTIVE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'ACTIVE' ? 'bg-sage text-white' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              Active / Processing
            </button>
            <button
              onClick={() => handleTabChange('DELIVERED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'DELIVERED' ? 'bg-sage-dark text-white' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              Delivered Orders
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

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-16 font-bold text-sage">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="card-surface p-12 text-center text-xs text-warmgray-500 border border-warmgray-200">
          No orders found in this category.
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {filteredOrders.map((o, index) => (
            <div
              key={o.id}
              data-order-id={o.id}
              data-item-type="order"
              data-item-title={o.product_title}
              data-item-status={o.status}
              data-item-index={index + 1}
              className="card-surface p-6 border-l-4 border-l-sage space-y-4"
            >
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`badge-tag font-bold ${
                      o.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-200' :
                      o.status === 'DELIVERED' ? 'bg-sage-50 text-sage-dark border border-sage-200' :
                      o.status === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {o.status}
                    </span>
                    <span className="text-xs text-warmgray-500 font-medium">Order #{o.id}</span>
                  </div>

                  <h3 className="font-heading text-lg font-bold text-warmgray-900">{o.product_title}</h3>
                  
                  <p className="text-xs text-warmgray-600">
                    {activeMode === 'incoming' ? (
                      <>Buyer: <strong>{o.customer_name || o.customer_username}</strong></>
                    ) : (
                      <>Artisan: <strong>{o.provider_name}</strong></>
                    )}
                    <span className="ml-2 font-bold">• Qty: {o.quantity} units</span>
                  </p>

                  <p className="text-xs text-warmgray-400">
                    Placed on: {new Date(o.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-warmgray-400 font-semibold block">Total Amount</span>
                  <span className="font-heading text-2xl font-black text-sage-dark">₹{Math.round(o.total_price)}</span>
                </div>
              </div>

              {o.message && (
                <p className="text-xs text-warmgray-700 bg-cream-50 p-3 rounded-xl italic border border-warmgray-100">
                  "{o.message}"
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-warmgray-100">
                {activeMode === 'incoming' && (
                  <>
                    {o.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(o.id, 'SHIPPED')}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Mark Shipped
                      </button>
                    )}
                    {o.status === 'SHIPPED' && (
                      <button
                        onClick={() => handleUpdateStatus(o.id, 'DELIVERED')}
                        className="px-4 py-1.5 rounded-xl bg-sage text-white text-xs font-bold hover:bg-sage-dark"
                      >
                        ✓ Mark Delivered
                      </button>
                    )}
                  </>
                )}

                {activeMode === 'my_purchases' && o.status !== 'CANCELLED' && (
                  <button
                    onClick={() => setReviewOrder(o)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    Rate & Review Product
                  </button>
                )}

                {o.status !== 'CANCELLED' && o.status !== 'DELIVERED' && o.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleCancel(o.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel Order & Restock
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      <ReviewModal
        order={reviewOrder}
        isOpen={Boolean(reviewOrder)}
        onClose={() => setReviewOrder(null)}
        onSuccess={() => {
          showToast('Product review recorded successfully!', 'success');
          loadOrders();
        }}
      />
    </div>
  );
};

