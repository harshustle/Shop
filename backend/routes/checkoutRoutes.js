const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    acquireInventoryHold,
    createCheckoutOrder,
    processCheckoutPayment
} = require('../controllers/checkoutController');

// UC-4 & UC-6: 15-Minute Concurrency Inventory Reservation Hold
router.post('/reserve', acquireInventoryHold);

// Create pending order with historical snapshot
router.post('/order', createCheckoutOrder);

// UC-5: Complete Secure Payment with Idempotency Key
router.post('/pay', processCheckoutPayment);

module.exports = router;
