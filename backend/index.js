require('dotenv').config({ path: '.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const { connectDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('MongoDB URI:', process.env.MONGODB_URI); // Add this debug log

// Add debug logging
console.log('Environment:', {
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV: process.env.NODE_ENV
});

// ✅ CORS setup using .env
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://shop-1-au9v.onrender.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// ✅ Middleware
app.use(express.json());

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// ✅ Basic pages
app.get('/orders', (req, res) => {
  res.send('Orders page');
});

app.get('/', (req, res) => {
  res.send('Welcome to the Order Management System');
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ✅ Connect to MongoDB
connectDB();

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
