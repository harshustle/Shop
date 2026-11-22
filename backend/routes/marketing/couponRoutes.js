const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const superAdminOnly = require('../../middleware/superAdminOnly');
const {
    applyCoupon,
    getActiveCoupons,
    getAdminCoupons,
    createCoupon,
    toggleCouponStatus,
    deleteCoupon
} = require('../../controllers/marketing/couponController');

// Public endpoints
router.post('/apply', applyCoupon);
router.get('/active', getActiveCoupons);

// Super Admin endpoints
router.get('/admin', auth, superAdminOnly, getAdminCoupons);
router.get('/admin/all', auth, superAdminOnly, getAdminCoupons);
router.post('/admin', auth, superAdminOnly, createCoupon);
router.patch('/admin/:id/toggle', auth, superAdminOnly, toggleCouponStatus);
router.delete('/admin/:id', auth, superAdminOnly, deleteCoupon);

module.exports = router;
