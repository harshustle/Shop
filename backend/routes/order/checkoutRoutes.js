const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const {
    acquireInventoryHold,
    createRazorpayOrder,
    verifyRazorpayPayment,
    handleRazorpayWebhook,
    validatePincodeAndCod,
    createCheckoutOrder,
    processCheckoutPayment
} = require('../../controllers/order/checkoutController');

// UC-4 & UC-6: 15-Minute Concurrency Inventory Reservation Hold
router.post('/reserve', acquireInventoryHold);

// Section 6.2: Create Razorpay Order with Canonical Price & Stock Lock
router.post('/razorpay/create-order', createRazorpayOrder);

// Section 6.3: Verify Razorpay Payment Signature & Finalize Order
router.post('/razorpay/verify', verifyRazorpayPayment);

// Section 6.4: Razorpay Webhook with Redis Deduplication Lock
router.post('/razorpay/webhook', handleRazorpayWebhook);

// Section 6.5: Pincode Serviceability & COD Risk Evaluation
router.get('/pincode/:pincode', validatePincodeAndCod);

// Standard Order Creation (COD & Mock Gateway)
router.post('/order', createCheckoutOrder);

// UC-5: Process Idempotent Payment
router.post('/pay', processCheckoutPayment);

module.exports = router;
