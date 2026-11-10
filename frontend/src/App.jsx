import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ScrollToTop } from './components/common/ScrollToTop';
import { VoiceInputModal } from './components/voice/VoiceInputModal';
import { FloatingVoiceBot } from './components/voice/FloatingVoiceBot';
import { VoiceActionOverlay } from './components/voice/VoiceActionOverlay';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { VoiceRegisterPage } from './pages/Auth/VoiceRegisterPage';
import { ServicesPage } from './pages/Marketplace/ServicesPage';
import { ServiceDetailPage } from './pages/Marketplace/ServiceDetailPage';
import { ProductsPage } from './pages/Marketplace/ProductsPage';
import { ProductDetailPage } from './pages/Marketplace/ProductDetailPage';
import { ProvidersPage } from './pages/Marketplace/ProvidersPage';
import { ProviderDetailPage } from './pages/Marketplace/ProviderDetailPage';
import { AIMatchPage } from './pages/AI/AIMatchPage';
import { AIAssistantPage } from './pages/AI/AIAssistantPage';
import { AIProfileWizard } from './pages/AI/AIProfileWizard';
import { ProviderDashboard } from './pages/Provider/ProviderDashboard';
import { SkillPassportPage } from './pages/Provider/SkillPassportPage';
import { OpportunityRadarPage } from './pages/Radar/OpportunityRadarPage';
import { BookingsPage } from './pages/Customer/BookingsPage';
import { OrdersPage } from './pages/Customer/OrdersPage';
import { MessagesPage } from './pages/Customer/MessagesPage';
import { ProfilePage } from './pages/Customer/ProfilePage';
import { AdminPortalPage } from './pages/Admin/AdminPortalPage';

export const App = () => {
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-ivory">
      <ScrollToTop />
      <div>
        <Navbar onOpenVoice={() => setIsVoiceOpen(true)} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register-voice" element={<VoiceRegisterPage />} />

            {/* 1. Traditional Services (Sriram style) */}
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:id" element={<ServiceDetailPage />} />
            <Route path="/providers" element={<ProvidersPage />} />
            <Route path="/providers/:id" element={<ProviderDetailPage />} />
            <Route path="/radar" element={<OpportunityRadarPage />} />

            {/* 2. Marketplace: Handmade Goods & Products (Lekhs style) */}
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />

            {/* 3. AI Features (Suji style) */}
            <Route path="/ai-match" element={<AIMatchPage />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            <Route
              path="/ai-wizard"
              element={
                <ProtectedRoute>
                  <AIProfileWizard />
                </ProtectedRoute>
              }
            />

            {/* 4. Provider Management (Dual Role Support) */}
            <Route
              path="/provider/dashboard"
              element={
                <ProtectedRoute requiredRole="PROVIDER">
                  <ProviderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/provider"
              element={
                <ProtectedRoute requiredRole="PROVIDER">
                  <ProviderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/provider-dashboard"
              element={
                <ProtectedRoute requiredRole="PROVIDER">
                  <ProviderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/skill-passport"
              element={
                <ProtectedRoute requiredRole="PROVIDER">
                  <SkillPassportPage />
                </ProtectedRoute>
              }
            />

            {/* 5. Customer Activity (Separate Bookings vs Orders) */}
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <BookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* 6. Dedicated Admin Control Panel */}
            <Route
              path="/admin-panel"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminPortalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminPortalPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>

      <Footer />

      {/* Global Voice Assistant Modal */}
      <VoiceInputModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />

      {/* Interactive Floating AI Voice Bot */}
      <VoiceActionOverlay />
      <FloatingVoiceBot />
    </div>
  );
};

export default App;
