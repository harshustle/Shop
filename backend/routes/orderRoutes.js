const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
    createOrder, 
    getOrders, 
    updateOrderStatus,
    fulfillOrder,
    trackOrder,
    getUserOrdersByPhone,
    deleteOrder 
} = require('../controllers/orderController');

// Client & API Routes
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/user/:phone', getUserOrdersByPhone);
router.get('/track/:orderNumber', trackOrder);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id', updateOrderStatus);
router.patch('/:orderId/fulfill', auth, fulfillOrder);
router.delete('/:id', deleteOrder);

module.exports = router;
