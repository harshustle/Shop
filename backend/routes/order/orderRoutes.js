const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const superAdminOnly = require('../../middleware/superAdminOnly');
const { 
    createOrder, 
    getOrders, 
    updateOrderStatus,
    fulfillOrder,
    trackOrder,
    getUserOrdersByPhone,
    deleteOrder 
} = require('../../controllers/order/orderController');

// Client & API Routes
router.post('/', createOrder);
router.get('/', auth, superAdminOnly, getOrders);
router.get('/user/:phone', getUserOrdersByPhone);
router.get('/track/:orderNumber', trackOrder);
router.patch('/:id/status', auth, superAdminOnly, updateOrderStatus);
router.patch('/:id', auth, superAdminOnly, updateOrderStatus);
router.patch('/:orderId/fulfill', auth, superAdminOnly, fulfillOrder);
router.delete('/:id', auth, superAdminOnly, deleteOrder);

module.exports = router;
