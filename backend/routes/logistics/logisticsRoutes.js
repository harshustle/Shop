const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const {
    dispatchOrder,
    updateTrackingStatus,
    getTrackingTimeline,
    getShippingLabel,
    requestRma,
    updateRmaStatus
} = require('../../controllers/logistics/logisticsController');

// 1-Click Fleet Dispatch: Assign rider & generate AWB
router.post('/dispatch', auth, dispatchOrder);

// Update live tracking status
router.post('/status', auth, updateTrackingStatus);

// Public Tracking timeline by AWB or Order Number
router.get('/track/:identifier', getTrackingTimeline);

// Printable HTML Shipping Slip for riders
router.get('/label/:orderId', getShippingLabel);

// Customer RMA Return Request
router.post('/rma/request', auth, requestRma);

// Admin / Hub Staff RMA status update
router.put('/rma/:orderId/status', auth, updateRmaStatus);

module.exports = router;
