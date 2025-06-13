import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import CustomerForm from './pages/CustomerForm.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import Dashboard from './pages/Dashboard.jsx';
import UserOrders from './pages/UserOrders';

function App() {
  return (
    <Router>
      <div className="w-full max-w-7xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<CustomerForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/orders" element={<UserOrders />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
