require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const { connectDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.get('/orders', (req, res) => {
    res.send('Orders page');
});
app.get('/', (req, res) => {
    res.send('Welcome to the Order Management System');
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

connectDB();

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});