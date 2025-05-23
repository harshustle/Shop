const express = require('express');
const router = express.Router();
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
router.delete('/:id', deleteOrder);

module.exports = router;
