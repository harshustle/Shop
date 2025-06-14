require('dotenv').config({ path: '.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // ✅ Import path module
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const { connectDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Debug logs
console.log('MongoDB URI:', process.env.MONGODB_URI);
console.log('Environment:', {
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV: process.env.NODE_ENV
});

// ✅ CORS setup
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://shop-client-v1kw.onrender.com'
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

// ✅ Serve static React files (assuming build is in client/dist)
app.use(express.static(path.join(__dirname, '../client/dist')));

// ✅ React routing fallback (this fixes the /login 404 issue)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ✅ Connect to MongoDB
connectDB();

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
