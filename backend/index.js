require('dotenv').config({ path: '.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// MongoDB connection initializer
const { connectDB } = require('./config/db');

// Route Handlers
const authRoutes = require('./routes/auth/authRoutes');
const orderRoutes = require('./routes/order/orderRoutes');
const catalogRoutes = require('./routes/catalog/catalogRoutes');
const cartRoutes = require('./routes/order/cartRoutes');
const checkoutRoutes = require('./routes/order/checkoutRoutes');
const inventoryRoutes = require('./routes/inventory/inventoryRoutes');
const adminRoutes = require('./routes/admin/adminRoutes');
const couponRoutes = require('./routes/marketing/couponRoutes');
const reviewRoutes = require('./routes/review/reviewRoutes');
const bannerRoutes = require('./routes/marketing/bannerRoutes');
const accountRoutes = require('./routes/account/accountRoutes');
const uploadRoutes = require('./routes/media/uploadRoutes');
const logisticsRoutes = require('./routes/logistics/logisticsRoutes');
const quickCommerceRoutes = require('./routes/order/quickCommerceRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS setup
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://shop-client-v1kw.onrender.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local upload assets if stored locally
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Single-Vendor Scalable E-Commerce Backend',
    database: 'MongoDB'
  });
});

// API Routes (Standard & v1 production aliases)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/products', catalogRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/qcommerce', quickCommerceRoutes);

// Aliases for v1 specifications
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/v1/logistics', logisticsRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/media', uploadRoutes);


// Static assets (client build if exists)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error Handling & 404 Middleware
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// 404 Not Found Catch-All (serves JSON for APIs and Tomato Sliced page for web)
app.use(notFoundHandler);

// Centralized Error Normalization Handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(`Shop Backend (100% MongoDB) running on port ${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/api/health`);
      console.log(`Catalog API:  http://localhost:${PORT}/api/catalog/search`);
      console.log(`===================================================`);
    });
  } catch (error) {
    console.error('Fatal startup error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;

