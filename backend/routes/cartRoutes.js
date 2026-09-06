const express = require('express');
const router = express.Router();
const {
    getCart,
    addItemToCart,
    updateCartItem,
    removeCartItem,
    clearCart
} = require('../controllers/cartController');

// Cart routes (works with session token in header x-session-token or JWT)
router.get('/', getCart);
router.post('/items', addItemToCart);
router.put('/items/:id', updateCartItem);
router.delete('/items/:id', removeCartItem);
router.delete('/', clearCart);

module.exports = router;
