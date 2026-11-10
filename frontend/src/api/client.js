import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sh_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('sh_refresh');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh });
          localStorage.setItem('sh_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem('sh_token');
          localStorage.removeItem('sh_refresh');
          localStorage.removeItem('sh_user');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// 1. Authentication & Profile
export const login = (data) => api.post('/auth/login/', data);
export const logout = (refresh) => Promise.resolve({ data: { message: 'Logged out' } });
export const register = (data) => api.post('/auth/register/', data);
export const getProfile = () => api.get('/auth/profile/');
export const updateProfile = (data) => api.patch('/auth/profile/', data);

// 2. Marketplace: Products & Goods (Lekhs style)
export const getProducts = (params) => api.get('/products/', { params });
export const getProduct = (id) => api.get(`/products/${id}/`);
export const createProduct = (data) => api.post('/products/', data);
export const getOrders = (params) => api.get('/orders/', { params });
export const createOrder = (data) => api.post('/orders/', data);
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/update-status/`, { status });
export const cancelOrder = (id) => api.post(`/orders/${id}/cancel/`);

// 3. Services: Traditional Services & Bookings (Sriram style)
export const getCategories = () => api.get('/categories/');
export const getServices = (params) => api.get('/services/', { params });
export const getService = (id, params) => api.get(`/services/${id}/`, { params });
export const createService = (data) => api.post('/services/', data);
export const updateService = (id, data) => api.patch(`/services/${id}/`, data);
export const getProviders = (params) => api.get('/providers/', { params });
export const getProvider = (id, params) => api.get(`/providers/${id}/`, { params });
export const getProviderMe = () => api.get('/providers/me/');
export const updateProviderMe = (data) => api.patch('/providers/me/', data);
export const getProviderReviews = (id) => api.get(`/providers/${id}/reviews/`);
export const getProductReviews = (id) => api.get(`/products/${id}/reviews/`);
export const getServiceReviews = (id) => api.get(`/services/${id}/reviews/`);
export const getReviews = (params) => api.get('/reviews/', { params });
export const getBookings = (params) => api.get('/bookings/', { params });
export const createBooking = (data) => api.post('/bookings/', data);
export const updateBookingStatus = (id, status) => api.patch(`/bookings/${id}/update-status/`, { status });
export const cancelBooking = (id) => api.post(`/bookings/${id}/cancel/`);

// 4. Opportunity Radar
export const getOpportunities = () => api.get('/opportunities/');
export const getRadarOpportunities = () => api.get('/radar/');
export const respondOpportunity = (id, data) => api.post(`/opportunities/${id}/respond/`, data);

// 5. Direct Messaging & Reviews
export const getConversations = () => api.get('/conversations/');
export const createConversation = (providerId) => api.post('/conversations/', { provider: providerId });
export const getConversation = (id) => api.get(`/conversations/${id}/`);
export const sendMessage = (convId, text) => api.post(`/conversations/${convId}/messages/`, { text });
export const createReview = (data) => api.post('/reviews/', data);

// 6. AI Intelligence Engine
export const aiMatch = (data) => api.post('/ai/match/', data);
export const aiProfileWizard = (text) => api.post('/ai/wizard/', { text });
export const aiConfirmService = (data) => api.post('/ai/confirm-service/', data);
export const aiGenerateProduct = (idea) => api.post('/ai/generate-product/', { idea });
export const aiConfirmProduct = (data) => api.post('/ai/confirm-product/', data);
export const aiGrowthAdvisor = (question, history = [], userDetails = {}) => 
  api.post('/ai/growth-advisor/', { question, history, user_details: userDetails });
export const aiCheckFairPrice = (data) => api.post('/ai/check-fair-price/', data);
export const aiGetRecommendations = () => api.get('/ai/recommendations/');
export const aiExtractSkills = (text) => api.post('/ai/extract-skills/', { text });
export const aiSuggestSkills = (text, current_skills) => api.post('/ai/suggest-skills/', { text, current_skills });
export const aiSuggestServices = (skills, category) => api.post('/ai/suggest-services/', { skills, category });
export const aiGenerateDescription = (data) => api.post('/ai/generate-description/', data);
export const aiSuggestPrice = (data) => api.post('/ai/suggest-price/', data);
export const aiBusinessAssistant = (question) => api.post('/ai/business-assistant/', { question });
export const aiDetectScam = (message) => api.post('/ai/detect-scam/', { message });
export const aiVoiceAssistant = (data) => api.post('/ai/voice-assistant/', data);
export const aiSiteController = (data) => api.post('/ai/site-controller/', data);
export const aiVoiceRegisterAnalyze = (data) => api.post('/ai/voice-registration/analyze/', data);
export const aiVoiceRegisterSubmit = (data) => api.post('/ai/voice-registration/submit/', data);

// 7. Safety & Notifications
export const getNotifications = () => api.get('/notifications/');
export const markNotificationRead = (id) => api.post(`/notifications/${id}/read/`);
export const createReport = (data) => api.post('/reports/', data);
export const getReports = () => api.get('/reports/');

// 8. Admin Control Panel
export const getAdminStats = () => api.get('/admin/stats/');
export const getAdminDataOverview = () => api.get('/admin/data-overview/');
export const getAdminUsers = () => api.get('/auth/admin/users/');
export const createAdminUser = (data) => api.post('/auth/admin/users/', data);
export const deleteAdminUser = (id) => api.delete(`/auth/admin/users/${id}/`);
export const toggleUserSuspend = (id) => api.post(`/auth/admin/users/${id}/toggle-suspend/`);
