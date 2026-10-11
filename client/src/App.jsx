import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import CustomerAccount from './pages/CustomerAccount';
import CustomerForm from './pages/CustomerForm';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import UserOrders from './pages/UserOrders';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import LegalPage from './pages/LegalPage';
import FloatingNavDock from './components/FloatingNavDock';
import CookieConsent from './components/CookieConsent';

// Requirement: First page should open as signup (/register) if unauthenticated.
// After OTP signup/login, automatically opens Home (where Basti map opens immediately).
const InitialEntryRoute = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/register" replace />;
  }
  return <Home />;
};

const AppContent = () => {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/register' || location.pathname === '/login';

  return (
    <div className={`bg-[var(--app-bg)] text-[var(--app-text-primary)] font-sans antialiased transition-colors duration-200 ${
      isAuthRoute 
        ? 'h-screen h-[100dvh] max-h-screen overflow-hidden p-0' 
        : 'min-h-screen pb-20'
    }`}>
      {/* Requirement 15: Accessibility Skip to Content Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#635BFF] focus:text-white focus:rounded-full focus:font-bold focus:shadow-xl focus:outline-none"
      >
        Skip to main content
      </a>

      <div id="main-content">
        <Routes>
          {/* Storefront Customer Routes */}
          <Route path="/" element={<InitialEntryRoute />} />
          <Route path="/home" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <CustomerAccount />
              </ProtectedRoute>
            }
          />
          <Route path="/orders" element={<UserOrders />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <CustomerAccount />
              </ProtectedRoute>
            }
          />

          {/* Live Order Tracking */}
          <Route path="/track-order" element={<UserOrders />} />
          <Route path="/track" element={<UserOrders />} />

          {/* Quick Grocery / Legacy Storefront */}
          <Route path="/legacy" element={<CustomerForm />} />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Requirements 1, 2, 3, 4, 16: Legal & Compliance Hub */}
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/privacy-policy" element={<LegalPage />} />
          <Route path="/terms" element={<LegalPage />} />
          <Route path="/terms-of-service" element={<LegalPage />} />
          <Route path="/refunds" element={<LegalPage />} />
          <Route path="/refund-policy" element={<LegalPage />} />
          <Route path="/cookies" element={<LegalPage />} />
          <Route path="/cookie-policy" element={<LegalPage />} />
          <Route path="/compliance" element={<LegalPage />} />

          {/* Super Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* Requirement 5: Compliant Cookie Consent Banner */}
      {!isAuthRoute && <CookieConsent />}

      {/* Floating Mobile Dock */}
      <FloatingNavDock />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CartProvider>
          <Router>
            <AppContent />
          </Router>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
