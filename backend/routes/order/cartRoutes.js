const express = require('express');
const router = express.Router();
const TokenService = require('../../services/auth/tokenService');
const {
    getCart,
    syncCart,
    addItemToCart,
    updateCartItem,
    removeCartItem,
    clearCart
} = require('../../controllers/order/cartController');

// Optional authentication: extracts userId if Authorization header is provided
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
            if (token) {
                const { valid, payload } = TokenService.verifyAccessToken(token);
                if (valid && payload) {
                    req.userId = payload.userId || payload.sub;
                    req.role = payload.role;
                }
            }
        }
    } catch (err) {}
    next();
};

router.use(optionalAuth);

// Cart routes (Redis-powered with MongoDB persistence)
router.get('/', getCart);
router.post('/sync', syncCart);
router.post('/items', addItemToCart);
router.put('/items/:id', updateCartItem);
router.delete('/items/:id', removeCartItem);
router.delete('/', clearCart);

module.exports = router;
