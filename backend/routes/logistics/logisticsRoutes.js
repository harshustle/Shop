const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const superAdminOnly = require('../../middleware/superAdminOnly');
const {
    dispatchOrder,
    updateTrackingStatus,
    getTrackingTimeline,
    getShippingLabel,
    requestRma,
    updateRmaStatus
} = require('../../controllers/logistics/logisticsController');

// 1-Click Fleet Dispatch: Assign rider & generate AWB
router.post('/dispatch', auth, superAdminOnly, dispatchOrder);

// Update live tracking status
router.post('/status', auth, superAdminOnly, updateTrackingStatus);

// Public Tracking timeline by AWB or Order Number
router.get('/track/:identifier', getTrackingTimeline);

// Printable HTML Shipping Slip for riders
router.get('/label/:orderId', auth, superAdminOnly, getShippingLabel);

// Customer RMA Return Request
router.post('/rma/request', auth, requestRma);

// Admin / Hub Staff RMA status update
router.put('/rma/:orderId/status', auth, superAdminOnly, updateRmaStatus);

module.exports = router;
