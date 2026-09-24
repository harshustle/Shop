import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
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

function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-[#F4F6FB] text-slate-800 font-sans antialiased">
          <Routes>
            {/* Storefront Customer Routes */}
            <Route path="/" element={<Home />} />
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
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <CustomerAccount />
                </ProtectedRoute>
              }
            />
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

            {/* Sliced Tomato 404 Fallback for Undefined Routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  </ErrorBoundary>
);
}

export default App;
