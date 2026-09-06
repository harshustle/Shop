const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getProductReviews,
    createReview,
    getAdminReviews,
    toggleReviewApproval,
    updateReviewStatus,
    deleteReview
} = require('../controllers/reviewController');

const superAdminOnly = (req, res, next) => {
    if (req.isAdmin || req.role === 'admin') return next();
    return res.status(403).json({ error: 'Access denied: Super Admin privilege required' });
};

// Public: Get reviews for product
router.get('/product/:idOrSlug', getProductReviews);

// Customer: Submit review
router.post('/product/:idOrSlug', auth, createReview);

// Admin: Moderate reviews
router.get('/admin', auth, superAdminOnly, getAdminReviews);
router.get('/admin/all', auth, superAdminOnly, getAdminReviews);
router.patch('/admin/:id/status', auth, superAdminOnly, updateReviewStatus);
router.patch('/admin/:id/toggle', auth, superAdminOnly, toggleReviewApproval);
router.delete('/admin/:id', auth, superAdminOnly, deleteReview);

module.exports = router;
