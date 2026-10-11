import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import FloatingNavDock from './components/FloatingNavDock';

// Requirement: First page should open as signup (/register) if unauthenticated.
// After OTP signup/login, automatically opens Home (where Basti map opens immediately).
const InitialEntryRoute = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/register" replace />;
  }
  return <Home />;
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text-primary)] font-sans antialiased pb-20 transition-colors duration-200">
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

              {/* Floating Mobile Dock */}
              <FloatingNavDock />
            </div>
          </Router>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
