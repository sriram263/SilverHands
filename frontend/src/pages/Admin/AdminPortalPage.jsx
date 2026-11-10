import React, { useState, useEffect } from 'react';
import { 
  getAdminStats, getAdminDataOverview, getAdminUsers, 
  createAdminUser, deleteAdminUser, toggleUserSuspend 
} from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import { 
  ShieldAlert, Users, ShoppingBag, Calendar, AlertTriangle, 
  Plus, Trash2, Ban, CheckCircle2, X, RefreshCw 
} from 'lucide-react';

export const AdminPortalPage = () => {
  const { showToast } = useNotifications();
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [overview, setOverview] = useState({ bookings: [], orders: [], services: [], products: [], reports: [] });
  const [loading, setLoading] = useState(true);

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    password: 'password123',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'CUSTOMER',
    address: 'Chennai, TN'
  });
  const [creatingUser, setCreatingUser] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [stRes, usRes, ovRes] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getAdminDataOverview()
      ]);
      setStats(stRes.data);
      setUsers(usRes.data || []);
      setOverview(ovRes.data || {});
    } catch (err) {
      console.error(err);
      showToast('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      await createAdminUser(newUserData);
      showToast(`User '${newUserData.username}' created successfully!`, 'success');
      setIsAddUserOpen(false);
      setNewUserData({
        username: '',
        password: 'password123',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'CUSTOMER',
        address: 'Chennai, TN'
      });
      loadAllData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create user', 'error');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to permanently delete user '${username}'?`)) return;
    try {
      await deleteAdminUser(userId);
      showToast(`User '${username}' deleted successfully`, 'success');
      loadAllData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete user', 'error');
    }
  };

  const handleToggleSuspend = async (userId) => {
    try {
      const res = await toggleUserSuspend(userId);
      showToast(res.data.message || 'User status updated', 'success');
      loadAllData();
    } catch {
      showToast('Failed to update user status', 'error');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="badge-tag bg-red-100 text-red-700 font-bold flex items-center gap-1.5 w-fit mb-2">
            <ShieldAlert className="w-4 h-4" /> Dedicated Admin Control Panel
          </span>
          <h1 className="page-title text-3xl sm:text-4xl">Platform Administration & Moderation</h1>
          <p className="text-xs sm:text-sm text-warmgray-500">
            Manage users, monitor marketplace product orders, track service appointments, and enforce safety.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={loadAllData} className="btn-ghost text-xs flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="btn-primary text-xs sm:text-sm flex items-center gap-1.5 shadow-warm"
          >
            <Plus className="w-4 h-4" />
            Add New User
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-surface p-5 border-l-4 border-l-saffron">
          <span className="text-xs font-bold text-warmgray-500">Total Users</span>
          <span className="font-heading text-3xl font-black text-warmgray-900 block mt-1">{stats?.total_users || users.length}</span>
        </div>
        <div className="card-surface p-5 border-l-4 border-l-sage">
          <span className="text-xs font-bold text-warmgray-500">Service Bookings</span>
          <span className="font-heading text-3xl font-black text-sage-dark block mt-1">{overview.bookings?.length || 0}</span>
        </div>
        <div className="card-surface p-5 border-l-4 border-l-blue-500">
          <span className="text-xs font-bold text-warmgray-500">Marketplace Orders</span>
          <span className="font-heading text-3xl font-black text-blue-600 block mt-1">{overview.orders?.length || 0}</span>
        </div>
        <div className="card-surface p-5 border-l-4 border-l-red-500">
          <span className="text-xs font-bold text-warmgray-500">Safety Reports</span>
          <span className="font-heading text-3xl font-black text-red-600 block mt-1">{overview.reports?.length || 0}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-warmgray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users' ? 'bg-warmgray-900 text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          Users Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'bookings' ? 'bg-warmgray-900 text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          Service Bookings ({overview.bookings?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders' ? 'bg-warmgray-900 text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          Marketplace Orders ({overview.orders?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'services' ? 'bg-warmgray-900 text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          Services ({overview.services?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reports' ? 'bg-warmgray-900 text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          Safety Reports ({overview.reports?.length || 0})
        </button>
      </div>

      {/* Tab 1: User Management Table */}
      {activeTab === 'users' && (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-100 font-bold text-warmgray-700 uppercase tracking-wider">
              <tr>
                <th className="p-4">User Details</th>
                <th className="p-4">Role</th>
                <th className="p-4">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-cream-50">
                  <td className="p-4">
                    <span className="font-bold text-warmgray-900 block">{u.first_name} {u.last_name} ({u.username})</span>
                    <span className="text-[11px] text-warmgray-500">{u.email} • {u.phone || 'No phone'}</span>
                  </td>
                  <td className="p-4">
                    <span className={`badge-tag font-bold ${
                      u.role === 'ADMIN' ? 'bg-red-50 text-red-700 border border-red-200' :
                      u.role === 'PROVIDER' ? 'bg-sage-50 text-sage-dark border border-sage-200' :
                      'bg-cream-200 text-warmgray-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-warmgray-600">{u.address || 'Chennai'}</td>
                  <td className="p-4">
                    {u.is_suspended ? (
                      <span className="badge-tag bg-red-100 text-red-700 font-bold">Suspended</span>
                    ) : (
                      <span className="badge-tag bg-sage-50 text-sage-dark font-bold">Active</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleToggleSuspend(u.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                        u.is_suspended ? 'bg-sage text-white hover:bg-sage-dark' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      {u.is_suspended ? 'Reactivate' : 'Suspend'}
                    </button>
                    {u.username !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs inline-flex items-center gap-1"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Bookings Table */}
      {activeTab === 'bookings' && (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-100 font-bold text-warmgray-700 uppercase tracking-wider">
              <tr>
                <th className="p-4">Service</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Schedule</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgray-100">
              {overview.bookings?.map((b) => (
                <tr key={b.id} className="hover:bg-cream-50">
                  <td className="p-4 font-bold text-warmgray-900">{b.service_title}</td>
                  <td className="p-4">{b.customer_name || 'Customer'}</td>
                  <td className="p-4">{b.provider_name || 'Provider'}</td>
                  <td className="p-4 font-medium">{b.preferred_date} ({b.preferred_time})</td>
                  <td className="p-4 font-bold text-saffron-dark">₹{Math.round(b.total_price)}</td>
                  <td className="p-4"><span className="badge-tag bg-amber-50 text-amber-800 font-bold">{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Marketplace Orders Table */}
      {activeTab === 'orders' && (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-100 font-bold text-warmgray-700 uppercase tracking-wider">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Qty</th>
                <th className="p-4">Total Price</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgray-100">
              {overview.orders?.map((o) => (
                <tr key={o.id} className="hover:bg-cream-50">
                  <td className="p-4 font-bold text-warmgray-900">{o.product_title}</td>
                  <td className="p-4">{o.customer_name || 'Customer'}</td>
                  <td className="p-4">{o.provider_name || 'Provider'}</td>
                  <td className="p-4 font-bold">{o.quantity}</td>
                  <td className="p-4 font-bold text-sage-dark">₹{Math.round(o.total_price)}</td>
                  <td className="p-4"><span className="badge-tag bg-sage-50 text-sage-dark font-bold">{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Services */}
      {activeTab === 'services' && (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-100 font-bold text-warmgray-700 uppercase tracking-wider">
              <tr>
                <th className="p-4">Service Title</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgray-100">
              {overview.services?.map((s) => (
                <tr key={s.id} className="hover:bg-cream-50">
                  <td className="p-4 font-bold text-warmgray-900">{s.title}</td>
                  <td className="p-4 font-semibold">{s.provider_name}</td>
                  <td className="p-4">{s.category_name}</td>
                  <td className="p-4 font-bold text-saffron-dark">₹{Math.round(s.price)}</td>
                  <td className="p-4 text-warmgray-500">{s.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Safety Reports */}
      {activeTab === 'reports' && (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-100 font-bold text-warmgray-700 uppercase tracking-wider">
              <tr>
                <th className="p-4">Incident Category</th>
                <th className="p-4">Description</th>
                <th className="p-4">Reporter</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgray-100">
              {overview.reports?.map((r) => (
                <tr key={r.id} className="hover:bg-cream-50">
                  <td className="p-4 font-bold text-red-600">{r.category}</td>
                  <td className="p-4 max-w-md">{r.description}</td>
                  <td className="p-4 font-semibold">{r.reporter_name || 'User'}</td>
                  <td className="p-4"><span className="badge-tag bg-red-50 text-red-700 font-bold">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-warm-xl p-6 border border-warmgray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold text-warmgray-900">Add New Platform User</h3>
              <button onClick={() => setIsAddUserOpen(false)} className="p-1 rounded-xl text-warmgray-400 hover:bg-cream-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-warmgray-700 mb-1">User Role</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-warmgray-300 text-xs font-bold bg-cream-50"
                >
                  <option value="CUSTOMER">Customer / Buyer</option>
                  <option value="PROVIDER">Elder Provider / Artisan</option>
                  <option value="ADMIN">Platform Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-warmgray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newUserData.first_name}
                    onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-warmgray-300 text-xs bg-cream-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warmgray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newUserData.last_name}
                    onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-warmgray-300 text-xs bg-cream-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-warmgray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-warmgray-300 text-xs bg-cream-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-warmgray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-warmgray-300 text-xs bg-cream-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-warmgray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  placeholder="+91 98401 00000"
                  className="w-full px-3 py-2 rounded-xl border border-warmgray-300 text-xs bg-cream-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddUserOpen(false)} className="btn-ghost text-xs">Cancel</button>
                <button type="submit" disabled={creatingUser} className="btn-primary text-xs !px-5">
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
