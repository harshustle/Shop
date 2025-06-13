const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const { 
    createOrder, 
    getOrders, 
    updateOrderStatus, 
    deleteOrder 
} = require('../controllers/orderController');

// API Routes
router.post('/', createOrder);
router.get('/', getOrders);
router.patch('/:id', updateOrderStatus);
router.patch('/:orderId/status', auth, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.orderId,
            { status: req.body.status },
            { new: true }
        );
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
});
router.delete('/:id', deleteOrder);
router.get('/user/:phone', auth, async (req, res) => {
    try {
        const orders = await Order.find({ phoneNumber: req.params.phone })
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

module.exports = router;
