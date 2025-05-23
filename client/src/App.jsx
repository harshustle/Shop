import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import CustomerForm from './pages/CustomerForm.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/" element={<CustomerForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
