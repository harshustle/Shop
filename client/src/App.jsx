import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import CustomerForm from './pages/CustomerForm';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import UserOrders from './pages/UserOrders';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen bg-[#F4F6FB] text-slate-800">
          <Routes>
            <Route path="/" element={<CustomerForm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route path="/orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
